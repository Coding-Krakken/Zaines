import { beforeEach, describe, expect, it, vi } from 'vitest';

const { isDatabaseConfiguredMock, prismaMock } = vi.hoisted(() => ({
  isDatabaseConfiguredMock: vi.fn(() => true),
  prismaMock: {
    payment: {
      findMany: vi.fn<() => Promise<Array<Record<string, unknown>>>>(
        async () => [],
      ),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({
  isDatabaseConfigured: isDatabaseConfiguredMock,
  prisma: prismaMock,
}));

import { getFinanceRevenueRecognitionSummary } from '@/lib/api/admin-finance';

describe('getFinanceRevenueRecognitionSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isDatabaseConfiguredMock.mockReturnValue(true);
  });

  it('returns empty summary when database is unavailable', async () => {
    isDatabaseConfiguredMock.mockReturnValueOnce(false);

    const result = await getFinanceRevenueRecognitionSummary(
      new Date('2026-05-01T00:00:00.000Z'),
      new Date('2026-05-31T23:59:59.999Z'),
    );

    expect(result.totals.grossRevenue).toBe(0);
    expect(result.totals.transactionCount).toBe(0);
    expect(result.byRecognitionStatus).toEqual([]);
    expect(result.rows).toEqual([]);
  });

  it('aggregates totals and groups by recognition status', async () => {
    prismaMock.payment.findMany.mockResolvedValueOnce([
      {
        id: 'pay-1',
        bookingId: 'book-1',
        amount: 120,
        currency: 'usd',
        recognitionStatus: 'deferred',
        servicePeriodStart: new Date('2026-05-10T00:00:00.000Z'),
        servicePeriodEnd: new Date('2026-05-12T00:00:00.000Z'),
        deferredRevenueAmount: 120,
        recognizedRevenueAmount: 0,
        taxTreatment: 'booking_taxable',
        exclusionReason: null,
        createdAt: new Date('2026-05-01T10:00:00.000Z'),
        booking: {
          id: 'book-1',
          bookingNumber: 'PB-001',
        },
      },
      {
        id: 'pay-2',
        bookingId: 'book-2',
        amount: 90,
        currency: 'usd',
        recognitionStatus: 'reversed',
        servicePeriodStart: new Date('2026-05-15T00:00:00.000Z'),
        servicePeriodEnd: new Date('2026-05-16T00:00:00.000Z'),
        deferredRevenueAmount: 0,
        recognizedRevenueAmount: 0,
        taxTreatment: 'booking_taxable',
        exclusionReason: null,
        createdAt: new Date('2026-05-02T10:00:00.000Z'),
        booking: {
          id: 'book-2',
          bookingNumber: 'PB-002',
        },
      },
      {
        id: 'pay-3',
        bookingId: 'book-3',
        amount: 50,
        currency: 'usd',
        recognitionStatus: 'excluded',
        servicePeriodStart: null,
        servicePeriodEnd: null,
        deferredRevenueAmount: 0,
        recognizedRevenueAmount: 0,
        taxTreatment: null,
        exclusionReason: 'test_customer',
        createdAt: new Date('2026-05-03T10:00:00.000Z'),
        booking: {
          id: 'book-3',
          bookingNumber: 'PB-003',
        },
      },
      {
        id: 'pay-4',
        bookingId: 'book-4',
        amount: 200,
        currency: 'usd',
        recognitionStatus: 'fully_recognized',
        servicePeriodStart: new Date('2026-05-01T00:00:00.000Z'),
        servicePeriodEnd: new Date('2026-05-07T00:00:00.000Z'),
        deferredRevenueAmount: 0,
        recognizedRevenueAmount: 200,
        taxTreatment: 'booking_taxable',
        exclusionReason: null,
        createdAt: new Date('2026-05-04T10:00:00.000Z'),
        booking: {
          id: 'book-4',
          bookingNumber: 'PB-004',
        },
      },
    ]);

    const result = await getFinanceRevenueRecognitionSummary(
      new Date('2026-05-01T00:00:00.000Z'),
      new Date('2026-05-31T23:59:59.999Z'),
    );

    expect(result.totals.grossRevenue).toBe(460);
    expect(result.totals.deferredRevenue).toBe(120);
    expect(result.totals.recognizedRevenue).toBe(200);
    expect(result.totals.reversedRevenue).toBe(90);
    expect(result.totals.excludedRevenue).toBe(50);
    expect(result.totals.transactionCount).toBe(4);

    expect(result.byRecognitionStatus).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: 'deferred', count: 1, amount: 120 }),
        expect.objectContaining({ status: 'reversed', count: 1, amount: 90 }),
        expect.objectContaining({ status: 'excluded', count: 1, amount: 50 }),
        expect.objectContaining({ status: 'fully_recognized', count: 1, amount: 200 }),
      ]),
    );

    expect(result.rows).toHaveLength(4);
    expect(result.rows[0]).toEqual(
      expect.objectContaining({
        paymentId: 'pay-1',
        bookingNumber: 'PB-001',
        recognitionStatus: 'deferred',
      }),
    );
  });
});
