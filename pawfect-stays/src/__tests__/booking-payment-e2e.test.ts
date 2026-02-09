import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as bookingsPost } from '@/app/api/bookings/route';
import { POST as webhookPost } from '@/app/api/payments/webhook/route';

// Mock Next.js headers function
vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: vi.fn((key: string) => {
      if (key === 'stripe-signature') {
        return 'test-signature';
      }
      return null;
    }),
  })),
}));

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(() => Promise.resolve({ user: { id: 'test-user-id' } })),
}));

vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    booking: {
      count: vi.fn(() => Promise.resolve(0)),
      create: vi.fn(() => Promise.resolve({
        id: 'booking-123',
        userId: 'test-user-id',
        suiteId: 'suite-123',
        bookingNumber: 'PB-20260208-0001',
        checkInDate: new Date('2026-03-01'),
        checkOutDate: new Date('2026-03-05'),
        totalNights: 4,
        subtotal: 260,
        tax: 26,
        total: 286,
        status: 'pending',
        specialRequests: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
          phone: '1234567890',
        },
        suite: {
          id: 'suite-123',
          name: 'Standard Suite 1',
          tier: 'standard',
          pricePerNight: 65,
        },
      })),
      update: vi.fn((args) => Promise.resolve({
        id: args.where.id,
        status: args.data.status,
      })),
      findUnique: vi.fn(() => Promise.resolve(null)),
    },
    user: {
      findUnique: vi.fn(() => Promise.resolve({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        phone: '1234567890',
      })),
      upsert: vi.fn(() => Promise.resolve({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'John Doe',
        phone: '1234567890',
      })),
    },
    suite: {
      findFirst: vi.fn(() => Promise.resolve({
        id: 'suite-123',
        name: 'Standard Suite 1',
        tier: 'standard',
        pricePerNight: 65,
        isActive: true,
      })),
    },
    payment: {
      findFirst: vi.fn(() => Promise.resolve(null)),
      create: vi.fn(() => Promise.resolve({
        id: 'payment-123',
        bookingId: 'booking-123',
        stripePaymentId: 'pi_test_123',
        amount: 286,
        currency: 'usd',
        status: 'pending',
      })),
      updateMany: vi.fn(() => Promise.resolve({ count: 1 })),
    },
  };

  return {
    prisma: mockPrisma,
    isDatabaseConfigured: vi.fn(() => true),
  };
});

vi.mock('@/lib/stripe', () => {
  const mockStripe = {
    paymentIntents: {
      create: vi.fn(() => Promise.resolve({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret_456',
        amount: 28600,
        currency: 'usd',
        status: 'requires_payment_method',
      })),
    },
    webhooks: {
      constructEvent: vi.fn((body: string) => {
        // Return a mock event
        return JSON.parse(body);
      }),
    },
  };

  return {
    stripe: mockStripe,
    formatAmountForStripe: vi.fn((amount: number) => Math.round(amount * 100)),
    isStripeConfigured: vi.fn(() => true),
  };
});

describe('Booking → Payment E2E Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set required env vars
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
    process.env.DATABASE_URL = 'postgresql://test';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('POST /api/bookings returns clientSecret when Stripe is configured', async () => {
    const request = new Request('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkIn: '2026-03-01',
        checkOut: '2026-03-05',
        suiteType: 'standard',
        petCount: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        petNames: 'Buddy',
        specialRequests: '',
        addOns: [],
      }),
    });

    const response = await bookingsPost(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.booking).toBeDefined();
    expect(data.payment).toBeDefined();
    expect(data.payment?.clientSecret).toBe('pi_test_123_secret_456');
    expect(data.message).toContain('Please complete payment');
  });

  it('POST /api/bookings creates payment record with pending status', async () => {
    const { prisma } = await import('@/lib/prisma');
    
    const request = new Request('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkIn: '2026-03-01',
        checkOut: '2026-03-05',
        suiteType: 'standard',
        petCount: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        petNames: 'Buddy',
        specialRequests: '',
        addOns: [],
      }),
    });

    await bookingsPost(request as NextRequest);

    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'pending',
          stripePaymentId: 'pi_test_123',
        }),
      })
    );
  });

  it('POST /api/bookings handles Stripe failures gracefully', async () => {
    const { stripe } = await import('@/lib/stripe');
    
    // Mock Stripe to throw an error
    vi.mocked(stripe.paymentIntents.create).mockRejectedValueOnce(
      new Error('Stripe API error')
    );

    const request = new Request('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkIn: '2026-03-01',
        checkOut: '2026-03-05',
        suiteType: 'standard',
        petCount: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        petNames: 'Buddy',
        specialRequests: '',
        addOns: [],
      }),
    });

    const response = await bookingsPost(request as NextRequest);
    const data = await response.json();

    // Booking should still succeed even if payment intent creation fails
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.booking).toBeDefined();
    expect(data.payment).toBeUndefined(); // No payment object when Stripe fails
  });

  it('webhook payment_intent.succeeded updates booking to confirmed', async () => {
    const { prisma } = await import('@/lib/prisma');

    const webhookEvent = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_123',
          amount: 28600,
          currency: 'usd',
          status: 'succeeded',
          metadata: {
            bookingId: 'booking-123',
            bookingNumber: 'PB-20260208-0001',
            userId: 'test-user-id',
          },
        },
      },
    };

    const request = new Request('http://localhost:3000/api/payments/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test-signature',
      },
      body: JSON.stringify(webhookEvent),
    });

    const response = await webhookPost(request as NextRequest);

    expect(response.status).toBe(200);
    
    // Verify payment status updated to succeeded
    expect(prisma.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripePaymentId: 'pi_test_123' },
        data: expect.objectContaining({
          status: 'succeeded',
        }),
      })
    );

    // Verify booking status updated to confirmed
    expect(prisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'booking-123' },
        data: expect.objectContaining({
          status: 'confirmed',
        }),
      })
    );
  });

  it('webhook payment_intent.payment_failed updates booking to cancelled', async () => {
    const { prisma } = await import('@/lib/prisma');

    const webhookEvent = {
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_test_123',
          amount: 28600,
          currency: 'usd',
          status: 'failed',
          metadata: {
            bookingId: 'booking-123',
            bookingNumber: 'PB-20260208-0001',
            userId: 'test-user-id',
          },
        },
      },
    };

    const request = new Request('http://localhost:3000/api/payments/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test-signature',
      },
      body: JSON.stringify(webhookEvent),
    });

    const response = await webhookPost(request as NextRequest);

    expect(response.status).toBe(200);
    
    // Verify payment status updated to failed
    expect(prisma.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripePaymentId: 'pi_test_123' },
        data: expect.objectContaining({
          status: 'failed',
        }),
      })
    );

    // Verify booking status updated to cancelled
    expect(prisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'booking-123' },
        data: expect.objectContaining({
          status: 'cancelled',
        }),
      })
    );
  });

  it('POST /api/bookings does not create duplicate payment records (idempotent)', async () => {
    const { prisma } = await import('@/lib/prisma');
    
    // Mock existing payment
    vi.mocked(prisma.payment.findFirst).mockResolvedValueOnce({
      id: 'payment-123',
      bookingId: 'booking-123',
      stripePaymentId: 'pi_existing_123',
      status: 'pending',
    } as never);

    const request = new Request('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkIn: '2026-03-01',
        checkOut: '2026-03-05',
        suiteType: 'standard',
        petCount: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        petNames: 'Buddy',
        specialRequests: '',
        addOns: [],
      }),
    });

    await bookingsPost(request as NextRequest);

    // Should not create a new payment if one already exists
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });
});
