import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { sendPaymentNotification } from "@/lib/notifications";
import { getCorrelationId, logServerFailure } from "@/lib/api/issue26";

// POST /api/payments/webhook - Handle Stripe webhook events
export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);

  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error: "Payment processing is not available",
          message:
            "Stripe is not configured. Please set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET environment variables.",
        },
        { status: 400 },
      );
    }

    // Check if database is configured
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        {
          error: "Database is not available",
          message:
            "Database is not configured. Please set DATABASE_URL environment variable.",
        },
        { status: 400 },
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json(
        {
          error: "Webhook processing is not available",
          message:
            "Stripe webhook secret is not configured. Please set STRIPE_WEBHOOK_SECRET environment variable.",
        },
        { status: 400 },
      );
    }

    const body = await request.text();
    const signature = (await headers()).get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 },
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      logServerFailure(
        "/api/payments/webhook",
        "WEBHOOK_SIGNATURE_VERIFICATION_FAILED",
        correlationId,
        err,
      );
      return NextResponse.json(
        { error: `Webhook Error: ${errorMessage}` },
        { status: 400 },
      );
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent, correlationId);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(paymentIntent, correlationId);
        break;
      }

      case "payment_intent.canceled": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentCanceled(paymentIntent, correlationId);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(charge, correlationId);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logServerFailure(
      "/api/payments/webhook",
      "WEBHOOK_HANDLER_FAILED",
      correlationId,
      error,
    );
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

async function handlePaymentSuccess(
  paymentIntent: Stripe.PaymentIntent,
  correlationId: string,
) {
  const bookingId = paymentIntent.metadata.bookingId;

  if (!bookingId) {
    logServerFailure(
      "/api/payments/webhook",
      "PAYMENT_INTENT_BOOKING_ID_MISSING",
      correlationId,
      new Error("No bookingId in payment intent metadata"),
    );
    return;
  }

  try {
    const existingPayment = await prisma.payment.findFirst({
      where: {
        stripePaymentId: paymentIntent.id,
      },
    });

    if (existingPayment?.status === "succeeded") {
      return;
    }

    // Update payment record
    await prisma.payment.updateMany({
      where: {
        stripePaymentId: paymentIntent.id,
      },
      data: {
        status: "succeeded",
        paidAt: new Date(),
      },
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "confirmed",
      },
    });

    // Send confirmation email (or record to dev queue)
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { user: true },
      });
      await sendPaymentNotification(bookingId, "success", booking ?? undefined);
    } catch (err) {
      logServerFailure(
        "/api/payments/webhook",
        "PAYMENT_SUCCESS_NOTIFICATION_FAILED",
        correlationId,
        err,
      );
    }
    console.log(`Payment succeeded for booking ${bookingId}`);
  } catch (error) {
    logServerFailure(
      "/api/payments/webhook",
      "PAYMENT_SUCCESS_HANDLER_FAILED",
      correlationId,
      error,
    );
  }
}

async function handlePaymentFailure(
  paymentIntent: Stripe.PaymentIntent,
  correlationId: string,
) {
  const bookingId = paymentIntent.metadata.bookingId;

  if (!bookingId) {
    logServerFailure(
      "/api/payments/webhook",
      "PAYMENT_INTENT_BOOKING_ID_MISSING",
      correlationId,
      new Error("No bookingId in payment intent metadata"),
    );
    return;
  }

  try {
    // Update payment record
    await prisma.payment.updateMany({
      where: {
        stripePaymentId: paymentIntent.id,
      },
      data: {
        status: "failed",
      },
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "cancelled",
      },
    });

    // Send payment failure notification email (or record to dev queue)
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { user: true },
      });
      await sendPaymentNotification(bookingId, "failure", booking ?? undefined);
    } catch (err) {
      logServerFailure(
        "/api/payments/webhook",
        "PAYMENT_FAILURE_NOTIFICATION_FAILED",
        correlationId,
        err,
      );
    }
    console.log(`Payment failed for booking ${bookingId}`);
  } catch (error) {
    logServerFailure(
      "/api/payments/webhook",
      "PAYMENT_FAILURE_HANDLER_FAILED",
      correlationId,
      error,
    );
  }
}

async function handlePaymentCanceled(
  paymentIntent: Stripe.PaymentIntent,
  correlationId: string,
) {
  const bookingId = paymentIntent.metadata.bookingId;

  if (!bookingId) {
    logServerFailure(
      "/api/payments/webhook",
      "PAYMENT_INTENT_BOOKING_ID_MISSING",
      correlationId,
      new Error("No bookingId in payment intent metadata"),
    );
    return;
  }

  try {
    // Update payment record
    await prisma.payment.updateMany({
      where: {
        stripePaymentId: paymentIntent.id,
      },
      data: {
        status: "cancelled",
      },
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "cancelled",
      },
    });

    console.log(`Payment canceled for booking ${bookingId}`);
  } catch (error) {
    logServerFailure(
      "/api/payments/webhook",
      "PAYMENT_CANCELED_HANDLER_FAILED",
      correlationId,
      error,
    );
  }
}

async function handleRefund(charge: Stripe.Charge, correlationId: string) {
  try {
    const paymentIntentId =
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id;

    if (!paymentIntentId) {
      logServerFailure(
        "/api/payments/webhook",
        "REFUND_PAYMENT_INTENT_ID_MISSING",
        correlationId,
        new Error("No payment intent ID in charge"),
      );
      return;
    }

    // Update payment record
    await prisma.payment.updateMany({
      where: {
        stripePaymentId: paymentIntentId,
      },
      data: {
        status: "refunded",
      },
    });

    // Find and update booking
    const payment = await prisma.payment.findFirst({
      where: {
        stripePaymentId: paymentIntentId,
      },
    });

    if (payment) {
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: "cancelled",
        },
      });
    }

    console.log(`Refund processed for payment intent ${paymentIntentId}`);
  } catch (error) {
    logServerFailure(
      "/api/payments/webhook",
      "REFUND_HANDLER_FAILED",
      correlationId,
      error,
    );
  }
}
