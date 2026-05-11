import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

type SessionLike = { user: { id: string } } | null;
type ExistingPaymentRecord = {
  id: string;
  status: string;
  stripePaymentId: string | null;
};

const { authMock, prismaMock, stripeMock } = vi.hoisted(() => ({
  authMock: vi.fn<() => Promise<SessionLike>>(async () => ({ user: { id: 'user-001' } })),
  prismaMock: {
    booking: {
      findUnique: vi.fn(async () => ({
        id: 'booking-001',
        userId: 'user-001',
        bookingNumber: 'PB-SETUP-0001',
        total: 225,
        checkInDate: new Date('2026-08-01'),
        checkOutDate: new Date('2026-08-04'),
        status: 'pending',
        user: { email: 'owner@example.com' },
      })),
    },
    payment: {
      findFirst: vi.fn(async () => null as ExistingPaymentRecord | null),
      create: vi.fn(async () => ({ id: 'payment-001' })),
      update: vi.fn(async () => ({ id: 'payment-001' })),
    },
  },
  stripeMock: {
    paymentIntents: {
      create: vi.fn(async () => ({ id: 'pi_setup_001', client_secret: 'secret_pi_setup_001' })),
      retrieve: vi.fn(async () => ({ id: 'pi_setup_001', client_secret: 'secret_pi_setup_001' })),
    },
    checkout: {
      sessions: {
        create: vi.fn(async () => ({ id: 'cs_setup_001', client_secret: 'secret_cs_setup_001' })),
        retrieve: vi.fn(async () => ({ id: 'cs_setup_001', client_secret: 'secret_cs_setup_001' })),
      },
    },
  },
}));

vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
  isDatabaseConfigured: vi.fn(() => true),
}));
vi.mock('@/lib/stripe', () => ({
  stripe: stripeMock,
  formatAmountForStripe: (amount: number) => Math.round(amount * 100),
  isStripeConfigured: vi.fn(() => true),
}));

import { POST as setupBookingPayment } from '@/app/api/payments/setup-booking/route';

function buildRequest(body: unknown) {
  return new NextRequest('http://localhost/api/payments/setup-booking', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-correlation-id': 'setup-booking-test',
    },
    body: JSON.stringify(body),
  });
}

describe('payments setup-booking route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: 'user-001' } });
  });

  it('requires auth', async () => {
    authMock.mockResolvedValueOnce(null);

    const res = await setupBookingPayment(buildRequest({ bookingId: 'booking-001' }));
    expect(res.status).toBe(401);
  });

  it('reuses existing checkout session client secret', async () => {
    prismaMock.payment.findFirst.mockResolvedValueOnce({
      id: 'payment-001',
      status: 'pending',
      stripePaymentId: 'cs_setup_001',
    });

    const res = await setupBookingPayment(buildRequest({ bookingId: 'booking-001' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.clientSecret).toBe('secret_cs_setup_001');
    expect(body.paymentMode).toBe('embedded_checkout');
    expect(body.reused).toBe(true);
  });

  it('creates payment intent and record for payment element flow', async () => {
    const res = await setupBookingPayment(
      buildRequest({ bookingId: 'booking-001', preferredFlow: 'payment_element' }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.clientSecret).toBe('secret_pi_setup_001');
    expect(body.paymentMode).toBe('payment_element');
    expect(body.reused).toBe(false);
    expect(prismaMock.payment.create).toHaveBeenCalled();
  });
});
