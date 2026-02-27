import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { sendPaymentNotification } from "@/lib/notifications";

// POST /api/payments/webhook - Handle Stripe webhook events
export async function POST(request: NextRequest) {
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
      console.error("Webhook signature verification failed:", errorMessage);
      return NextResponse.json(
        { error: `Webhook Error: ${errorMessage}` },
        { status: 400 },
      );
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(paymentIntent);
        break;
      }

      case "payment_intent.canceled": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentCanceled(paymentIntent);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(charge);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata.bookingId;

  if (!bookingId) {
    console.error("No bookingId in payment intent metadata");
    return;
  }

  try {
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
      console.error("Notification send error:", err);
    }
    console.log(`Payment succeeded for booking ${bookingId}`);
  } catch (error) {
    console.error("Error handling payment success:", error);
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata.bookingId;

  if (!bookingId) {
    console.error("No bookingId in payment intent metadata");
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
      console.error("Notification send error:", err);
    }
    console.log(`Payment failed for booking ${bookingId}`);
  } catch (error) {
    console.error("Error handling payment failure:", error);
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata.bookingId;

  if (!bookingId) {
    console.error("No bookingId in payment intent metadata");
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
    console.error("Error handling payment cancellation:", error);
  }
}

async function handleRefund(charge: Stripe.Charge) {
  try {
    const paymentIntentId =
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id;

    if (!paymentIntentId) {
      console.error("No payment intent ID in charge");
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
    console.error("Error handling refund:", error);
  }
}
