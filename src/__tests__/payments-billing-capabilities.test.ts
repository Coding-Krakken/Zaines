import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

type SessionLike = {
  user: { id: string; email?: string | null; name?: string | null };
} | null;

const {
  authMock,
  getAdminSettingsMock,
  stripeMock,
  isStripeConfiguredMock,
} = vi.hoisted(() => ({
  authMock: vi.fn<() => Promise<SessionLike>>(async () => ({
    user: { id: 'user-001', email: 'owner@example.com', name: 'Owner' },
  })),
  getAdminSettingsMock: vi.fn(async () => ({
    stripeCapabilityFlags: {
      billingSubscriptionsEnabled: true,
      customerPortalEnabled: true,
      taxEnabled: false,
      disputesEnabled: false,
      radarReviewEnabled: false,
      connectEnabled: false,
      treasuryEnabled: false,
      issuingEnabled: false,
      financialConnectionsEnabled: false,
      identityEnabled: false,
      terminalEnabled: false,
    },
  })),
  stripeMock: {
    customers: {
      list: vi.fn(async () => ({ data: [{ id: 'cus_existing_001' }] })),
      create: vi.fn(async () => ({ id: 'cus_created_001' })),
    },
    billingPortal: {
      sessions: {
        create: vi.fn(async () => ({ url: 'https://billing.stripe.test/session_001' })),
      },
    },
    checkout: {
      sessions: {
        create: vi.fn(async () => ({
          id: 'cs_sub_001',
          client_secret: 'cs_sub_secret_001',
        })),
      },
    },
  },
  isStripeConfiguredMock: vi.fn(() => true),
}));

vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('@/lib/api/admin-settings', () => ({ getAdminSettings: getAdminSettingsMock }));
vi.mock('@/lib/stripe', () => ({
  stripe: stripeMock,
  isStripeConfigured: isStripeConfiguredMock,
}));

import { POST as createCustomerPortalSession } from '@/app/api/payments/customer-portal/route';
import { POST as createSubscriptionCheckoutSession } from '@/app/api/payments/subscriptions/checkout/route';

function buildPortalRequest(body: unknown) {
  return new NextRequest('http://localhost/api/payments/customer-portal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-correlation-id': 'portal-test-cid',
    },
    body: JSON.stringify(body),
  });
}

function buildSubscriptionRequest(body: unknown) {
  return new NextRequest('http://localhost/api/payments/subscriptions/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-correlation-id': 'sub-test-cid',
    },
    body: JSON.stringify(body),
  });
}

describe('payments billing capability routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-11T12:34:56.000Z'));
    authMock.mockResolvedValue({
      user: { id: 'user-001', email: 'owner@example.com', name: 'Owner' },
    });
    getAdminSettingsMock.mockResolvedValue({
      stripeCapabilityFlags: {
        billingSubscriptionsEnabled: true,
        customerPortalEnabled: true,
        taxEnabled: false,
        disputesEnabled: false,
        radarReviewEnabled: false,
        connectEnabled: false,
        treasuryEnabled: false,
        issuingEnabled: false,
        financialConnectionsEnabled: false,
        identityEnabled: false,
        terminalEnabled: false,
      },
    });
    isStripeConfiguredMock.mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('requires auth for customer portal session', async () => {
    authMock.mockResolvedValueOnce(null);

    const res = await createCustomerPortalSession(buildPortalRequest({ returnPath: '/dashboard' }));
    expect(res.status).toBe(401);
  });

  it('blocks customer portal when capability is disabled', async () => {
    getAdminSettingsMock.mockResolvedValueOnce({
      stripeCapabilityFlags: {
        billingSubscriptionsEnabled: true,
        customerPortalEnabled: false,
        taxEnabled: false,
        disputesEnabled: false,
        radarReviewEnabled: false,
        connectEnabled: false,
        treasuryEnabled: false,
        issuingEnabled: false,
        financialConnectionsEnabled: false,
        identityEnabled: false,
        terminalEnabled: false,
      },
    });

    const res = await createCustomerPortalSession(buildPortalRequest({ returnPath: '/dashboard' }));
    expect(res.status).toBe(403);
  });

  it('returns 500 for customer portal when settings lookup fails', async () => {
    getAdminSettingsMock.mockRejectedValueOnce(new Error('settings unavailable'));

    const res = await createCustomerPortalSession(buildPortalRequest({ returnPath: '/dashboard' }));
    expect(res.status).toBe(500);
    expect(stripeMock.billingPortal.sessions.create).not.toHaveBeenCalled();
  });

  it('creates customer portal session when enabled', async () => {
    const res = await createCustomerPortalSession(buildPortalRequest({ returnPath: '/dashboard/settings' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.url).toContain('billing.stripe.test');
    expect(stripeMock.billingPortal.sessions.create).toHaveBeenCalledTimes(1);
    expect(stripeMock.billingPortal.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        return_url: expect.stringContaining('/dashboard/settings'),
      }),
      expect.objectContaining({
        idempotencyKey: 'portal:user-001:2026-05-11T12:34',
      }),
    );
  });

  it('sanitizes unsafe customer portal return path to dashboard root', async () => {
    const res = await createCustomerPortalSession(
      buildPortalRequest({ returnPath: 'https://malicious.example/steal-session' }),
    );
    expect(res.status).toBe(200);

    expect(stripeMock.billingPortal.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        return_url: expect.stringContaining('/dashboard'),
      }),
      expect.any(Object),
    );
  });

  it('blocks subscription checkout when capability is disabled', async () => {
    getAdminSettingsMock.mockResolvedValueOnce({
      stripeCapabilityFlags: {
        billingSubscriptionsEnabled: false,
        customerPortalEnabled: true,
        taxEnabled: false,
        disputesEnabled: false,
        radarReviewEnabled: false,
        connectEnabled: false,
        treasuryEnabled: false,
        issuingEnabled: false,
        financialConnectionsEnabled: false,
        identityEnabled: false,
        terminalEnabled: false,
      },
    });

    const res = await createSubscriptionCheckoutSession(
      buildSubscriptionRequest({ priceId: 'price_123', quantity: 1 }),
    );

    expect(res.status).toBe(403);
  });

  it('returns 500 for subscription checkout when settings lookup fails', async () => {
    getAdminSettingsMock.mockRejectedValueOnce(new Error('settings unavailable'));

    const res = await createSubscriptionCheckoutSession(
      buildSubscriptionRequest({ priceId: 'price_123', quantity: 1 }),
    );

    expect(res.status).toBe(500);
    expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('creates subscription checkout session when enabled', async () => {
    const res = await createSubscriptionCheckoutSession(
      buildSubscriptionRequest({
        priceId: 'price_123',
        quantity: 2,
        returnPath: 'https://malicious.example/not-allowed',
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sessionId).toBe('cs_sub_001');
    expect(body.clientSecret).toBe('cs_sub_secret_001');
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledTimes(1);
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          returnPath: '/dashboard',
        }),
      }),
      expect.objectContaining({
        idempotencyKey: 'subscription:user-001:price_123:2',
      }),
    );
  });
});
