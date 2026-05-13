import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { findOrCreateCustomerByEmail } from '@/lib/stripe-customer';
import { getAdminSettings } from '@/lib/api/admin-settings';
import {
  errorResponse,
  getCorrelationId,
  logServerFailure,
  rateLimitedResponse,
} from '@/lib/security/api';

const requestSchema = z.object({
  priceId: z.string().min(1),
  quantity: z.number().int().min(1).max(10).optional(),
  returnPath: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);

  try {
    const rateLimit = rateLimitedResponse({
      request,
      routeKey: 'payments_subscriptions_checkout',
      route: '/api/payments/subscriptions/checkout',
      correlationId,
      limit: 12,
      windowMs: 60_000,
    });
    if (rateLimit) return rateLimit;

    if (!isStripeConfigured()) {
      return errorResponse({
        status: 503,
        errorCode: 'PAYMENT_PROVIDER_UNAVAILABLE',
        message: 'Stripe is not configured.',
        retryable: true,
        correlationId,
      });
    }

    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return errorResponse({
        status: 401,
        errorCode: 'AUTH_REQUIRED',
        message: 'Authentication required',
        retryable: false,
        correlationId,
      });
    }

    const validation = requestSchema.safeParse(await request.json());
    if (!validation.success) {
      return errorResponse({
        status: 400,
        errorCode: 'PAYMENT_VALIDATION_ERROR',
        message: 'Invalid subscription checkout payload.',
        retryable: false,
        correlationId,
      });
    }

    const settings = await getAdminSettings();
    if (!settings.stripeCapabilityFlags.billingSubscriptionsEnabled) {
      return errorResponse({
        status: 403,
        errorCode: 'SUBSCRIPTIONS_DISABLED',
        message: 'Billing subscriptions are disabled by admin settings.',
        retryable: false,
        correlationId,
      });
    }

    const returnPath =
      validation.data.returnPath && validation.data.returnPath.startsWith('/')
        ? validation.data.returnPath
        : '/dashboard';

    const customerId = await findOrCreateCustomerByEmail(
      session.user.email,
      session.user.name,
    );

    const checkoutSession = await stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        customer: customerId,
        ui_mode: 'embedded',
        redirect_on_completion: 'never',
        line_items: [
          {
            price: validation.data.priceId,
            quantity: validation.data.quantity ?? 1,
          },
        ],
        metadata: {
          userId: session.user.id,
          checkoutType: 'subscription',
          returnPath,
        },
      },
      {
        idempotencyKey: `subscription:${session.user.id}:${validation.data.priceId}:${validation.data.quantity ?? 1}`,
      },
    );

    return NextResponse.json({
      sessionId: checkoutSession.id,
      clientSecret: checkoutSession.client_secret,
    });
  } catch (error) {
    logServerFailure(
      '/api/payments/subscriptions/checkout',
      'PAYMENTS_SUBSCRIPTION_CHECKOUT_FAILED',
      correlationId,
      error,
    );

    return errorResponse({
      status: 500,
      errorCode: 'PAYMENTS_SUBSCRIPTION_CHECKOUT_FAILED',
      message: 'Failed to initialize subscription checkout.',
      retryable: true,
      correlationId,
    });
  }
}
