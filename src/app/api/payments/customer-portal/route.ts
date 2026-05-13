import { NextRequest, NextResponse } from 'next/server';
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

function getBaseUrl(request: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  if (fromEnv && fromEnv.length > 0) return fromEnv;

  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  if (!host) {
    return 'http://localhost:3000';
  }

  return `${protocol}://${host}`;
}

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);

  try {
    const rateLimit = rateLimitedResponse({
      request,
      routeKey: 'payments_customer_portal',
      route: '/api/payments/customer-portal',
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

    const settings = await getAdminSettings();
    if (!settings.stripeCapabilityFlags.customerPortalEnabled) {
      return errorResponse({
        status: 403,
        errorCode: 'CUSTOMER_PORTAL_DISABLED',
        message: 'Customer portal is disabled by admin settings.',
        retryable: false,
        correlationId,
      });
    }

    const body = (await request.json().catch(() => ({}))) as {
      returnPath?: string;
    };

    const baseUrl = getBaseUrl(request);
    const returnPath = body.returnPath && body.returnPath.startsWith('/')
      ? body.returnPath
      : '/dashboard';

    const customerId = await findOrCreateCustomerByEmail(
      session.user.email,
      session.user.name,
    );

    const portalSession = await stripe.billingPortal.sessions.create(
      {
        customer: customerId,
        return_url: `${baseUrl}${returnPath}`,
      },
      {
        idempotencyKey: `portal:${session.user.id}:${new Date().toISOString().slice(0, 16)}`,
      },
    );

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error) {
    logServerFailure(
      '/api/payments/customer-portal',
      'PAYMENTS_CUSTOMER_PORTAL_FAILED',
      correlationId,
      error,
    );

    return errorResponse({
      status: 500,
      errorCode: 'PAYMENTS_CUSTOMER_PORTAL_FAILED',
      message: 'Failed to create customer portal session.',
      retryable: true,
      correlationId,
    });
  }
}
