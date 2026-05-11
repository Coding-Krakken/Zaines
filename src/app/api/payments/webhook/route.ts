import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { sendPaymentNotification } from "@/lib/notifications";
import { errorResponse, getCorrelationId, logServerFailure } from "@/lib/security/api";
import { logSecurityEvent } from "@/lib/security/logging";

async function reserveWebhookEvent(event: Stripe.Event): Promise<boolean> {
  const existing = await prisma.stripeEvent.findUnique({
    where: { eventId: event.id },
    select: { processed: true },
  });

  if (existing?.processed) {
    return false;
  }

  if (!existing) {
    await prisma.stripeEvent.create({
      data: {
        eventId: event.id,
        eventType: event.type,
        payload: event as unknown as Prisma.InputJsonValue,
        processed: false,
      },
    });
  }

  return true;
}

async function markWebhookEventProcessed(event: Stripe.Event): Promise<void> {
  await prisma.stripeEvent.updateMany({
    where: { eventId: event.id },
    data: {
      eventType: event.type,
      payload: event as unknown as Prisma.InputJsonValue,
      processed: true,
      processedAt: new Date(),
    },
  });
}

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

    const shouldProcess = await reserveWebhookEvent(event);
    if (!shouldProcess) {
      logSecurityEvent({
        route: "/api/payments/webhook",
        event: "WEBHOOK_EVENT_REPLAY_SKIPPED",
        correlationId,
        context: { eventId: event.id, eventType: event.type },
      });
      return NextResponse.json({ received: true, deduplicated: true });
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
        await handlePaymentFailure(paymentIntent, event.id, correlationId);
        break;
      }

      case "payment_intent.canceled": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentCanceled(paymentIntent, event.id, correlationId);
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session, event.id, correlationId);
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

    await markWebhookEventProcessed(event);

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
  correlationId: string,
  fallbackBookingId?: string,
) {
  const bookingId = paymentIntent.metadata.bookingId || fallbackBookingId;

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
    const chargeData: Partial<{
      cardBrand: string;
      cardLastFour: string;
      stripeFeeAmount: number;
      stripeChargeId: string;
    }> = {};

    try {
      // Get the charge associated with this payment intent
      const listCharges = stripe.charges?.list;
      if (typeof listCharges !== "function") {
        throw new Error("Stripe charges.list is unavailable");
      }

      const charges = await listCharges({
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
          chargeData.stripeFeeAmount = charge.application_fee_amount / 100;
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
        recognitionStatus: "deferred",
        ...chargeData,
        webhookEventIds: eventId ? [eventId] : [],
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
    throw error;
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  eventId: string,
  correlationId: string,
) {
  if (session.payment_status !== "paid") {
    return;
  }

  const paymentIntentRef = session.payment_intent;
  if (!paymentIntentRef) {
    logServerFailure(
      "/api/payments/webhook",
      "CHECKOUT_SESSION_PAYMENT_INTENT_MISSING",
      correlationId,
      new Error(`No payment_intent found for checkout session ${session.id}`),
    );
    return;
  }

  try {
    const paymentIntent =
      typeof paymentIntentRef === "string"
        ? await stripe.paymentIntents.retrieve(paymentIntentRef)
        : paymentIntentRef;

    if (session.metadata?.bookingId) {
      await prisma.payment.updateMany({
        where: {
          bookingId: session.metadata.bookingId,
          status: {
            in: ["pending", "failed", "cancelled"],
          },
        },
        data: {
          stripePaymentId: paymentIntent.id,
        },
      });
    }

    await handlePaymentSuccess(
      paymentIntent,
      correlationId,
      session.metadata?.bookingId,
    );
  } catch (error) {
    logServerFailure(
      "/api/payments/webhook",
      "CHECKOUT_SESSION_COMPLETE_HANDLER_FAILED",
      correlationId,
      error,
    );
    throw error;
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
        recognitionStatus: "voided",
        deferredRevenueAmount: 0,
        recognizedRevenueAmount: 0,
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
    throw error;
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
        recognitionStatus: "voided",
        deferredRevenueAmount: 0,
        recognizedRevenueAmount: 0,
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
    throw error;
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
        recognitionStatus: "reversed",
        deferredRevenueAmount: 0,
        recognizedRevenueAmount: 0,
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
    throw error;
  }
}
