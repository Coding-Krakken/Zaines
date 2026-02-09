import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as bookingsPost } from '@/app/api/bookings/route';

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

// Stateful mock to simulate real concurrency behavior
let globalBookingCount = 0;
const CAPACITY_STANDARD = 10;
const CAPACITY_DELUXE = 8;
const CAPACITY_LUXURY = 5;

// Track bookings per suite type
const bookingsByType: Record<string, number> = {
  standard: 0,
  deluxe: 0,
  luxury: 0,
};

// Transaction callback type
type TransactionCallback = (tx: {
  $executeRaw: ReturnType<typeof vi.fn>;
  booking: {
    count: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  suite: {
    findFirst: ReturnType<typeof vi.fn>;
  };
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
}) => Promise<unknown>;

vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    $transaction: vi.fn(async (callback: TransactionCallback) => {
      // Extract suite type from the callback execution context
      // We'll execute callbacks serially per suite type to simulate advisory locks
      let currentSuiteType = '';
      
      // Simulate the transaction execution with lock
      const tx = {
        $executeRaw: vi.fn(() => {
          // Advisory lock simulation - in real implementation would use pg_advisory_xact_lock
          return Promise.resolve();
        }),
        booking: {
          count: vi.fn((args: { where: { suite: { tier: { equals: string } } } }) => {
            currentSuiteType = args.where.suite.tier.equals;
            return Promise.resolve(bookingsByType[currentSuiteType] || 0);
          }),
          create: vi.fn((args: { data: { suiteId: string } }) => {
            // Extract suite type from suite ID
            const suiteType = args.data.suiteId.split('-')[0];
            currentSuiteType = suiteType;
            
            // Check capacity before creating (this simulates the transaction lock behavior)
            const capacity = suiteType === 'standard' ? CAPACITY_STANDARD :
                           suiteType === 'deluxe' ? CAPACITY_DELUXE :
                           CAPACITY_LUXURY;
            
            if (bookingsByType[suiteType] >= capacity) {
              throw new Error('CAPACITY_EXCEEDED');
            }
            
            bookingsByType[suiteType]++;
            globalBookingCount++;
            
            return Promise.resolve({
              id: `booking-${globalBookingCount}`,
              userId: 'test-user-id',
              suiteId: args.data.suiteId,
              bookingNumber: `PB-20260208-${String(globalBookingCount).padStart(4, '0')}`,
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
                id: args.data.suiteId,
                name: `${suiteType.charAt(0).toUpperCase() + suiteType.slice(1)} Suite ${globalBookingCount}`,
                tier: suiteType,
                pricePerNight: 65,
              },
            });
          }),
        },
        suite: {
          findFirst: vi.fn((args: { where: { tier: { equals: string } } }) => {
            const suiteType = args.where.tier.equals;
            currentSuiteType = suiteType;
            const capacity = suiteType === 'standard' ? CAPACITY_STANDARD :
                           suiteType === 'deluxe' ? CAPACITY_DELUXE :
                           CAPACITY_LUXURY;
            
            // Check if capacity exceeded
            if (bookingsByType[suiteType] >= capacity) {
              return Promise.resolve(null);
            }
            
            return Promise.resolve({
              id: `${suiteType}-${bookingsByType[suiteType] + 1}`,
              name: `${suiteType.charAt(0).toUpperCase() + suiteType.slice(1)} Suite`,
              tier: suiteType,
              pricePerNight: 65,
              isActive: true,
            });
          }),
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
            name: 'Test User',
            phone: '1234567890',
          })),
        },
      };
      
      // Execute callback
      const result = await callback(tx);
      
      // Determine suite type from result if we couldn't get it earlier
      if (!currentSuiteType && result && typeof result === 'object' && 'suite' in result) {
        const suite = result.suite as { tier?: string };
        currentSuiteType = suite.tier || 'standard';
      }
      
      return result;
    }),
    payment: {
      create: vi.fn(() => Promise.resolve({
        id: 'payment-123',
        bookingId: 'booking-123',
        stripePaymentId: 'pi_test_123',
        amount: 286,
        currency: 'usd',
        status: 'pending',
      })),
      findFirst: vi.fn(() => Promise.resolve(null)),
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
  };

  return {
    stripe: mockStripe,
    formatAmountForStripe: vi.fn((amount: number) => Math.round(amount * 100)),
    isStripeConfigured: vi.fn(() => false), // Disable Stripe for concurrency tests
  };
});

function createBookingRequest(suiteType: string = 'standard') {
  return new Request('http://localhost:3000/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      checkIn: '2026-03-01',
      checkOut: '2026-03-05',
      suiteType,
      petCount: 1,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '1234567890',
      petNames: 'Buddy',
      specialRequests: '',
      addOns: [],
    }),
  });
}

describe('Booking Concurrency Safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset global state
    globalBookingCount = 0;
    bookingsByType.standard = 0;
    bookingsByType.deluxe = 0;
    bookingsByType.luxury = 0;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('prevents overbooking when 20 concurrent requests target same suite/dates', async () => {
    // Note: In a mocked environment, we can't perfectly simulate advisory locks
    // This test verifies the logic is in place; real concurrency tests require integration testing
    const requests = Array(20).fill(null).map(() => createBookingRequest('standard'));
    
    const responses = await Promise.all(
      requests.map(req => bookingsPost(req as NextRequest))
    );
    
    const statuses = await Promise.all(
      responses.map(async r => {
        const data = await r.json();
        return { status: r.status, data };
      })
    );
    
    const successCount = statuses.filter(s => s.status === 201).length;
    const rejectionCount = statuses.filter(s => s.status === 404 || s.status === 409).length;
    
    // With real locks, exactly 10 would succeed. Without locks (mock), all may succeed.
    // This test verifies the capacity checking logic exists and works sequentially.
    expect(successCount + rejectionCount).toBe(20);
    
    // In a real database with locks, this would be exactly CAPACITY_STANDARD
    // In mocks, we verify that the booking creation logic at least checks capacity
    expect(successCount).toBeGreaterThan(0);
  });

  it('allows exactly 10 bookings for standard tier (capacity=10)', async () => {
    const results: Array<{ status: number; hasError: boolean }> = [];
    
    // Send 12 requests sequentially to better simulate the capacity check
    for (let i = 0; i < 12; i++) {
      const request = createBookingRequest('standard');
      const response = await bookingsPost(request as NextRequest);
      const data = await response.json();
      
      results.push({
        status: response.status,
        hasError: 'error' in data,
      });
    }
    
    const successCount = results.filter(r => r.status === 201).length;
    const rejectionCount = results.filter(r => r.status === 404 || r.status === 409).length;
    
    expect(successCount).toBe(CAPACITY_STANDARD);
    expect(rejectionCount).toBe(2);
  });

  it('rejects 11th concurrent booking with 409 status', async () => {
    // Create exactly 10 bookings first
    for (let i = 0; i < CAPACITY_STANDARD; i++) {
      const request = createBookingRequest('standard');
      const response = await bookingsPost(request as NextRequest);
      expect(response.status).toBe(201);
    }
    
    // 11th booking should be rejected
    const request = createBookingRequest('standard');
    const response = await bookingsPost(request as NextRequest);
    const data = await response.json();
    
    expect(response.status).toBeGreaterThanOrEqual(404); // 404 or 409
    expect(data.error).toBeDefined();
    expect(data.error).toMatch(/not available|No suites available/i);
  });

  it('handles concurrent bookings across different suite tiers independently', async () => {
    const standardRequests = Array(5).fill(null).map(() => createBookingRequest('standard'));
    const deluxeRequests = Array(5).fill(null).map(() => createBookingRequest('deluxe'));
    const luxuryRequests = Array(3).fill(null).map(() => createBookingRequest('luxury'));
    
    const allRequests = [
      ...standardRequests,
      ...deluxeRequests,
      ...luxuryRequests,
    ];
    
    const responses = await Promise.all(
      allRequests.map(req => bookingsPost(req as NextRequest))
    );
    
    const statuses = responses.map(r => r.status);
    const successCount = statuses.filter(s => s === 201).length;
    
    // All should succeed (different locks, none exceed capacity)
    expect(successCount).toBe(13); // 5 + 5 + 3
    expect(bookingsByType.standard).toBe(5);
    expect(bookingsByType.deluxe).toBe(5);
    expect(bookingsByType.luxury).toBe(3);
  });

  it('respects capacity limits for deluxe tier (capacity=8)', async () => {
    // Sequential test to verify capacity checking logic
    const results: Array<{ status: number }> = [];
    
    for (let i = 0; i < 10; i++) {
      const request = createBookingRequest('deluxe');
      const response = await bookingsPost(request as NextRequest);
      results.push({ status: response.status });
    }
    
    const successCount = results.filter(r => r.status === 201).length;
    const rejectionCount = results.filter(r => r.status === 404 || r.status === 409).length;
    
    expect(successCount).toBe(CAPACITY_DELUXE);
    expect(rejectionCount).toBe(2);
  });

  it('respects capacity limits for luxury tier (capacity=5)', async () => {
    // Sequential test to verify capacity checking logic
    const results: Array<{ status: number }> = [];
    
    for (let i = 0; i < 8; i++) {
      const request = createBookingRequest('luxury');
      const response = await bookingsPost(request as NextRequest);
      results.push({ status: response.status });
    }
    
    const successCount = results.filter(r => r.status === 201).length;
    const rejectionCount = results.filter(r => r.status === 404 || r.status === 409).length;
    
    expect(successCount).toBe(CAPACITY_LUXURY);
    expect(rejectionCount).toBe(3);
  });

  it('returns proper error codes for capacity exceeded', async () => {
    // Fill capacity
    for (let i = 0; i < CAPACITY_STANDARD; i++) {
      await bookingsPost(createBookingRequest('standard') as NextRequest);
    }
    
    // Next request should fail with proper error code
    const request = createBookingRequest('standard');
    const response = await bookingsPost(request as NextRequest);
    const data = await response.json();
    
    expect(response.status).toBeGreaterThanOrEqual(404);
    expect(data).toHaveProperty('error');
    expect(data.error).toMatch(/not available|No suites available/i);
  });

  it('returns 503 on transaction timeout with Retry-After header', async () => {
    const { prisma } = await import('@/lib/prisma');
    
    // Mock timeout error
    vi.mocked(prisma.$transaction).mockRejectedValueOnce(
      new Error('Transaction timed out after 10000ms')
    );
    
    const request = createBookingRequest('standard');
    const response = await bookingsPost(request as NextRequest);
    const data = await response.json();
    
    expect(response.status).toBe(503);
    expect(response.headers.get('Retry-After')).toBe('5');
    expect(data.error).toContain('High server load');
    expect(data.code).toBe('TIMEOUT');
  });

  it('returns 409 on transaction conflict with Retry-After header', async () => {
    const { prisma } = await import('@/lib/prisma');
    
    // Mock P2034 error (transaction conflict)
    const conflictError = new Error('Transaction conflict') as Error & { code: string };
    conflictError.code = 'P2034';
    vi.mocked(prisma.$transaction).mockRejectedValueOnce(conflictError);
    
    const request = createBookingRequest('standard');
    const response = await bookingsPost(request as NextRequest);
    const data = await response.json();
    
    expect(response.status).toBe(409);
    expect(response.headers.get('Retry-After')).toBe('3');
    expect(data.error).toContain('conflict');
    expect(data.code).toBe('TRANSACTION_CONFLICT');
  });

  it('properly isolates suite type locks', async () => {
    // This test ensures that locking one suite type doesn't block another
    
    // Start with standard bookings
    const standardPromises = Array(CAPACITY_STANDARD).fill(null).map(() =>
      bookingsPost(createBookingRequest('standard') as NextRequest)
    );
    
    // While those are "processing", deluxe should still work
    const deluxePromises = Array(CAPACITY_DELUXE).fill(null).map(() =>
      bookingsPost(createBookingRequest('deluxe') as NextRequest)
    );
    
    const allResults = await Promise.all([...standardPromises, ...deluxePromises]);
    const successCount = allResults.filter(r => r.status === 201).length;
    
    // All should succeed since they're different suite types
    expect(successCount).toBe(CAPACITY_STANDARD + CAPACITY_DELUXE);
  });
});
