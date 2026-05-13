import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getAdminSettings } from "@/lib/api/admin-settings";
import { findOrCreateCustomerByEmail } from "@/lib/stripe-customer";
import { isStripeConfigured, stripe } from "@/lib/stripe";
import {
  errorResponse,
  getCorrelationId,
  logServerFailure,
  rateLimitedResponse,
} from "@/lib/security/api";

const requestSchema = z.object({
  usage: z.enum(["off_session", "on_session"]).optional(),
});

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);

  try {
    const rateLimit = rateLimitedResponse({
      request,
      routeKey: "payments_setup_intent",
      route: "/api/payments/setup-intent",
      correlationId,
      limit: 12,
      windowMs: 60_000,
    });
    if (rateLimit) return rateLimit;

    if (!isStripeConfigured()) {
      return errorResponse({
        status: 503,
        errorCode: "PAYMENT_PROVIDER_UNAVAILABLE",
        message: "Stripe is not configured.",
        retryable: true,
        correlationId,
      });
    }

    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return errorResponse({
        status: 401,
        errorCode: "AUTH_REQUIRED",
        message: "Authentication required",
        retryable: false,
        correlationId,
      });
    }

    const settings = await getAdminSettings();
    if (!settings.stripeCapabilityFlags.savedPaymentMethodsEnabled) {
      return errorResponse({
        status: 403,
        errorCode: "SAVED_PAYMENT_METHODS_DISABLED",
        message: "Saved payment methods are disabled by admin settings.",
        retryable: false,
        correlationId,
      });
    }

    const validation = requestSchema.safeParse(await request.json().catch(() => ({})));
    if (!validation.success) {
      return errorResponse({
        status: 400,
        errorCode: "PAYMENT_VALIDATION_ERROR",
        message: "Invalid setup intent payload.",
        retryable: false,
        correlationId,
      });
    }

    const customerId = await findOrCreateCustomerByEmail(
      session.user.email,
      session.user.name,
    );

    const setupIntent = await stripe.setupIntents.create(
      {
        customer: customerId,
        usage: validation.data.usage || "off_session",
        automatic_payment_methods: { enabled: true },
        metadata: {
          userId: session.user.id,
          source: "wallet",
        },
      },
      {
        idempotencyKey: `setup_intent:${session.user.id}:${new Date().toISOString().slice(0, 16)}`,
      },
    );

    return NextResponse.json({
      setupIntentId: setupIntent.id,
      clientSecret: setupIntent.client_secret,
      customerId,
    });
  } catch (error) {
    logServerFailure(
      "/api/payments/setup-intent",
      "PAYMENTS_SETUP_INTENT_FAILED",
      correlationId,
      error,
    );

    return errorResponse({
      status: 500,
      errorCode: "PAYMENTS_SETUP_INTENT_FAILED",
      message: "Failed to create setup intent.",
      retryable: true,
      correlationId,
    });
  }
}
