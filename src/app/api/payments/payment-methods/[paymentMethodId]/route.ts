import { NextRequest, NextResponse } from "next/server";
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

interface RouteParams {
  params: Promise<{ paymentMethodId: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { paymentMethodId } = await params;
  const correlationId = getCorrelationId(request);

  try {
    const rateLimit = rateLimitedResponse({
      request,
      routeKey: "payments_methods_delete",
      route: "/api/payments/payment-methods/[paymentMethodId]",
      correlationId,
      limit: 20,
      windowMs: 60_000,
      subject: paymentMethodId,
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

    if (!paymentMethodId.startsWith("pm_")) {
      return errorResponse({
        status: 400,
        errorCode: "PAYMENT_VALIDATION_ERROR",
        message: "Invalid payment method ID.",
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

    const customerId = await findOrCreateCustomerByEmail(
      session.user.email,
      session.user.name,
    );

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    const paymentMethodCustomerId =
      typeof paymentMethod.customer === "string"
        ? paymentMethod.customer
        : paymentMethod.customer?.id || null;

    if (paymentMethodCustomerId !== customerId) {
      return errorResponse({
        status: 403,
        errorCode: "PAYMENT_METHOD_ACCESS_DENIED",
        message: "Payment method does not belong to this customer.",
        retryable: false,
        correlationId,
      });
    }

    await stripe.paymentMethods.detach(paymentMethodId);

    return NextResponse.json({
      detachedPaymentMethodId: paymentMethodId,
    });
  } catch (error) {
    logServerFailure(
      "/api/payments/payment-methods/[paymentMethodId]",
      "PAYMENTS_METHODS_DELETE_FAILED",
      correlationId,
      error,
    );

    return errorResponse({
      status: 500,
      errorCode: "PAYMENTS_METHODS_DELETE_FAILED",
      message: "Failed to remove payment method.",
      retryable: true,
      correlationId,
    });
  }
}
