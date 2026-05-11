import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { sendPaymentNotification } from "@/lib/notifications";
import { errorResponse, getCorrelationId, logServerFailure } from "@/lib/security/api";
import { logSecurityEvent } from "@/lib/security/logging";

// POST /api/payments/webhook - Handle Stripe webhook events
export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);

  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return errorResponse({
        status: 503,
        errorCode: "WEBHOOK_PROVIDER_UNAVAILABLE",
        message: "Webhook processing is temporarily unavailable.",
        retryable: true,
        correlationId,
      });
    }

    // Check if database is configured
    if (!isDatabaseConfigured()) {
      return errorResponse({
        status: 503,
        errorCode: "WEBHOOK_PERSISTENCE_UNAVAILABLE",
        message: "Webhook processing is temporarily unavailable.",
        retryable: true,
        correlationId,
      });
    }

    const webhookSecret =
      process.env.STRIPE_WEBHOOK_SECRET_SNAPSHOT ??
      process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return errorResponse({
        status: 503,
        errorCode: "WEBHOOK_SECRET_UNAVAILABLE",
        message: "Webhook processing is temporarily unavailable.",
        retryable: true,
        correlationId,
      });
    }

    const body = await request.text();
    const signature = (await headers()).get("stripe-signature");

    if (!signature) {
      return errorResponse({
        status: 400,
        errorCode: "WEBHOOK_SIGNATURE_MISSING",
        message: "Webhook signature is required.",
        retryable: false,
        correlationId,
      });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: unknown) {
      logServerFailure(
        "/api/payments/webhook",
        "WEBHOOK_SIGNATURE_VERIFICATION_FAILED",
        correlationId,
        err,
      );
      return errorResponse({
        status: 400,
        errorCode: "WEBHOOK_SIGNATURE_VERIFICATION_FAILED",
        message: "Webhook signature verification failed.",
        retryable: false,
        correlationId,
      });
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent, event.id, correlationId);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(paymentIntent, event.id, correlationId);
        break;
      }

      case "payment_intent.canceled": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentCanceled(paymentIntent, event.id, correlationId);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(charge, event.id, correlationId);
        break;
      }

      default:
        logSecurityEvent({
          route: "/api/payments/webhook",
          event: "WEBHOOK_EVENT_UNHANDLED",
          correlationId,
          context: { eventType: event.type },
        });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logServerFailure(
      "/api/payments/webhook",
      "WEBHOOK_HANDLER_FAILED",
      correlationId,
      error,
    );
    return errorResponse({
      status: 500,
      errorCode: "WEBHOOK_HANDLER_FAILED",
      message: "Webhook handler failed.",
      retryable: true,
      correlationId,
    });
  }
}

async function handlePaymentSuccess(
  paymentIntent: Stripe.PaymentIntent,
  eventId: string,
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

    // Fetch charge to get card and fee details
    let chargeData: Partial<{
      cardBrand: string;
      cardLastFour: string;
      stripeFee: number;
      stripeChargeId: string;
    }> = {};

    try {
      // Get the charge associated with this payment intent
      const charges = await stripe.charges.list({
        payment_intent: paymentIntent.id,
        limit: 1,
      });

      if (charges.data.length > 0) {
        const charge = charges.data[0];
        chargeData.stripeChargeId = charge.id;
        if (charge.payment_method_details?.card) {
          chargeData.cardBrand = charge.payment_method_details.card.brand ?? undefined;
          chargeData.cardLastFour = charge.payment_method_details.card.last4 ?? undefined;
        }
        if (charge.amount_captured && charge.application_fee_amount) {
          chargeData.stripeFee = charge.application_fee_amount / 100;
        }
      }
    } catch (err) {
      // Log error but don't fail the payment processing
      console.error('Failed to fetch charge details for payment intent:', err);
    }

    // Update payment record with enriched data
    await prisma.payment.updateMany({
      where: {
        stripePaymentId: paymentIntent.id,
      },
      data: {
        status: "succeeded",
        paidAt: new Date(),
        ...chargeData,
        webhookEventIds: eventId ? [eventId] : [],
      },
    });

    // Store event record
    if (eventId) {
      await prisma.stripeEvent.upsert({
        where: { eventId },
        create: {
          eventId,
          eventType: "payment_intent.succeeded",
          paymentId: existingPayment?.id || null,
          payload: paymentIntent as any,
          processed: true,
          processedAt: new Date(),
        },
        update: {
          processed: true,
          processedAt: new Date(),
        },
      });
    }

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
    logSecurityEvent({
      route: "/api/payments/webhook",
      event: "PAYMENT_SUCCEEDED",
      correlationId,
      context: { bookingId },
    });
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
  eventId: string,
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
        webhookEventIds: eventId ? [eventId] : [],
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
    logSecurityEvent({
      route: "/api/payments/webhook",
      event: "PAYMENT_FAILED",
      correlationId,
      context: { bookingId },
    });
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
  eventId: string,
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
        webhookEventIds: eventId ? [eventId] : [],
      },
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "cancelled",
      },
    });

    logSecurityEvent({
      route: "/api/payments/webhook",
      event: "PAYMENT_CANCELED",
      correlationId,
      context: { bookingId },
    });
  } catch (error) {
    logServerFailure(
      "/api/payments/webhook",
      "PAYMENT_CANCELED_HANDLER_FAILED",
      correlationId,
      error,
    );
  }
}

async function handleRefund(charge: Stripe.Charge, eventId: string, correlationId: string) {
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
        webhookEventIds: eventId ? [eventId] : [],
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

    logSecurityEvent({
      route: "/api/payments/webhook",
      event: "REFUND_PROCESSED",
      correlationId,
      context: { paymentIntentId },
    });
  } catch (error) {
    logServerFailure(
      "/api/payments/webhook",
      "REFUND_HANDLER_FAILED",
      correlationId,
      error,
    );
  }
}
