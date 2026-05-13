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

export async function GET(request: NextRequest) {
  const correlationId = getCorrelationId(request);

  try {
    const rateLimit = rateLimitedResponse({
      request,
      routeKey: "payments_methods_list",
      route: "/api/payments/payment-methods",
      correlationId,
      limit: 25,
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

    const customerId = await findOrCreateCustomerByEmail(
      session.user.email,
      session.user.name,
    );

    const [methods, customer] = await Promise.all([
      stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
      }),
      stripe.customers.retrieve(customerId),
    ]);

    const defaultPaymentMethodId =
      !customer.deleted && typeof customer.invoice_settings.default_payment_method === "string"
        ? customer.invoice_settings.default_payment_method
        : null;

    return NextResponse.json({
      customerId,
      paymentMethods: methods.data.map((method) => ({
        id: method.id,
        brand: method.card?.brand || null,
        expMonth: method.card?.exp_month || null,
        expYear: method.card?.exp_year || null,
        last4: method.card?.last4 || null,
        isDefault: defaultPaymentMethodId === method.id,
      })),
    });
  } catch (error) {
    logServerFailure(
      "/api/payments/payment-methods",
      "PAYMENTS_METHODS_LIST_FAILED",
      correlationId,
      error,
    );

    return errorResponse({
      status: 500,
      errorCode: "PAYMENTS_METHODS_LIST_FAILED",
      message: "Failed to list payment methods.",
      retryable: true,
      correlationId,
    });
  }
}
