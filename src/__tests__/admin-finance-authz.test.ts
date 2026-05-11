import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

type SessionLike = { user: { id: string; role?: string; name?: string } } | null;

const {
  authMock,
  prismaMock,
  isDbConfiguredMock,
  getDefaultFinanceRangeMock,
  getFinanceOverviewMock,
  getFinanceRevenueRecognitionSummaryMock,
  getFinanceReconciliationMock,
  getFinanceTransactionsMock,
  getFinanceTaxSummaryMock,
  getFinanceWebhookHealthMock,
  getFinanceAuditEventsMock,
  getFinanceAlertsMock,
  getFinanceCashForecastMock,
  getFinanceExceptionsMock,
  appendFinanceAuditEventMock,
  stripeRefundCreateMock,
  isStripeConfiguredMock,
} = vi.hoisted(() => ({
  authMock: vi.fn<() => Promise<SessionLike>>(async () => null),
  prismaMock: {
    payment: {
      findUnique: vi.fn<() => Promise<Record<string, unknown> | null>>(async () => null),
      update: vi.fn(async () => ({ id: 'payment-1' })),
    },
    credit: {
      create: vi.fn(async () => ({ id: 'credit-1' })),
    },
    booking: {
      findUnique: vi.fn<() => Promise<Record<string, unknown> | null>>(async () => null),
    },
  },
  isDbConfiguredMock: vi.fn(() => true),
  getDefaultFinanceRangeMock: vi.fn(() => {
    const endDate = new Date('2026-05-08T23:59:59.999Z');
    const startDate = new Date('2026-04-08T00:00:00.000Z');
    return { startDate, endDate };
  }),
  getFinanceOverviewMock: vi.fn(async () => ({
    range: { startDate: new Date().toISOString(), endDate: new Date().toISOString() },
    totals: {
      grossRevenue: 1,
      refunds: 0,
      netRevenue: 1,
      taxesCollected: 0,
      outstandingPending: 0,
      transactionCount: 1,
    },
    byStatus: [],
  })),
  getFinanceRevenueRecognitionSummaryMock: vi.fn(async () => ({
    range: { startDate: new Date().toISOString(), endDate: new Date().toISOString() },
    totals: {
      grossRevenue: 100,
      deferredRevenue: 100,
      recognizedRevenue: 0,
      reversedRevenue: 0,
      excludedRevenue: 0,
      transactionCount: 1,
    },
    byRecognitionStatus: [
      {
        status: 'deferred',
        count: 1,
        amount: 100,
      },
    ],
    rows: [],
  })),
  getFinanceReconciliationMock: vi.fn(async () => ({
    range: { startDate: new Date().toISOString(), endDate: new Date().toISOString() },
    totals: {
      succeededAmount: 100,
      refundedAmount: 0,
      netAmount: 100,
      transactionCount: 1,
    },
    buckets: [
      {
        date: '2026-05-08',
        succeededAmount: 100,
        refundedAmount: 0,
        netAmount: 100,
        transactionCount: 1,
        status: 'pending',
        reconciledAt: null,
      },
    ],
  })),
  getFinanceTransactionsMock: vi.fn(async () => ({
    range: { startDate: new Date().toISOString(), endDate: new Date().toISOString() },
    summary: {
      totalTransactions: 1,
      filteredTransactions: 1,
      totalAmount: 100,
      totalRefundAmount: 0,
    },
    rows: [
      {
        id: 'payment-1',
        bookingId: 'booking-1',
        bookingNumber: 'PB-001',
        customerName: 'Alice',
        customerEmail: 'alice@example.com',
        amount: 100,
        refundAmount: 0,
        currency: 'USD',
        status: 'succeeded',
        paymentMethod: 'card',
        paymentMode: 'payment_element',
        stripeSourceType: 'payment_intent',
        stripePaymentId: 'pi_1',
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
        refundedAt: null,
      },
    ],
  })),
  getFinanceTaxSummaryMock: vi.fn(async () => ({
    range: { startDate: new Date().toISOString(), endDate: new Date().toISOString() },
    totals: {
      taxableRevenue: 100,
      taxCollected: 10,
      refundedTax: 0,
      netTaxLiability: 10,
    },
    rows: [
      {
        period: '2026-05',
        taxableRevenue: 100,
        taxCollected: 10,
        refundedTax: 0,
        netTaxLiability: 10,
      },
    ],
  })),
  getFinanceWebhookHealthMock: vi.fn(async () => ({
    generatedAt: new Date().toISOString(),
    summary: {
      pendingCount: 0,
      failedCount: 0,
      processedLastHour: 2,
      avgProcessingLagSeconds: 10,
      oldestPendingAgeSeconds: null,
    },
    recentEvents: [],
  })),
  getFinanceAuditEventsMock: vi.fn(async () => []),
  getFinanceAlertsMock: vi.fn(async () => ({
    generatedAt: new Date().toISOString(),
    alerts: [],
  })),
  getFinanceExceptionsMock: vi.fn(async () => ({
    generatedAt: new Date().toISOString(),
    totalExceptions: 0,
    items: [],
  })),
  getFinanceCashForecastMock: vi.fn(async () => ({
    generatedAt: new Date().toISOString(),
    range: { startDate: new Date().toISOString(), endDate: new Date().toISOString() },
    totals: {
      expectedCashIn: 100,
      expectedRefunds: 5,
      expectedNet: 95,
      bookingCount: 1,
    },
    days: [],
  })),
  appendFinanceAuditEventMock: vi.fn(async () => undefined),
  stripeRefundCreateMock: vi.fn(async () => ({ id: 're_1' })),
  isStripeConfiguredMock: vi.fn(() => false),
}));

vi.mock('@/lib/auth', () => ({ auth: authMock }));

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
  isDatabaseConfigured: isDbConfiguredMock,
}));

vi.mock('@/lib/api/admin-finance', () => ({
  getDefaultFinanceRange: getDefaultFinanceRangeMock,
  getFinanceOverview: getFinanceOverviewMock,
  getFinanceRevenueRecognitionSummary: getFinanceRevenueRecognitionSummaryMock,
  getFinanceReconciliation: getFinanceReconciliationMock,
  getFinanceTransactions: getFinanceTransactionsMock,
  getFinanceTaxSummary: getFinanceTaxSummaryMock,
  getFinanceWebhookHealth: getFinanceWebhookHealthMock,
  getFinanceAuditEvents: getFinanceAuditEventsMock,
  getFinanceAlerts: getFinanceAlertsMock,
  getFinanceExceptions: getFinanceExceptionsMock,
  getFinanceCashForecast: getFinanceCashForecastMock,
  appendFinanceAuditEvent: appendFinanceAuditEventMock,
}));

vi.mock('@/lib/stripe', () => ({
  stripe: {
    refunds: {
      create: stripeRefundCreateMock,
    },
  },
  isStripeConfigured: isStripeConfiguredMock,
  formatAmountForStripe: vi.fn((amount: number) => Math.round(amount * 100)),
}));

import { GET as getFinanceOverviewRoute } from '@/app/api/admin/finance/overview/route';
import { GET as getFinanceRevenueRecognitionRoute } from '@/app/api/admin/finance/revenue-recognition/route';
import { GET as getFinanceTransactionsRoute } from '@/app/api/admin/finance/transactions/route';
import { GET as getFinanceRefundsRoute, POST as postFinanceRefundRoute } from '@/app/api/admin/finance/refunds/route';
import { POST as postFinanceAdjustmentRoute } from '@/app/api/admin/finance/adjustments/route';
import { GET as getFinanceAuditRoute } from '@/app/api/admin/finance/audit/route';
import { GET as getFinanceReconciliationRoute, POST as postFinanceReconciliationRoute } from '@/app/api/admin/finance/reconciliation/route';
import { GET as getFinanceTaxesRoute } from '@/app/api/admin/finance/taxes/route';
import { GET as getFinanceTaxesExportRoute } from '@/app/api/admin/finance/taxes/export/route';
import { GET as getFinanceExportRoute } from '@/app/api/admin/finance/export/route';
import { GET as getFinanceWebhooksRoute } from '@/app/api/admin/finance/webhooks/route';
import { GET as getFinanceAlertsRoute } from '@/app/api/admin/finance/alerts/route';
import { GET as getFinanceExceptionsRoute } from '@/app/api/admin/finance/exceptions/route';
import { GET as getFinanceForecastRoute } from '@/app/api/admin/finance/forecast/route';

const staffSession = { user: { id: 'staff-1', role: 'staff', name: 'Staff User' } };
const adminSession = { user: { id: 'admin-1', role: 'admin', name: 'Admin User' } };
const customerSession = { user: { id: 'customer-1', role: 'customer', name: 'Customer User' } };

function makeJsonRequest(url: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('admin finance route authz', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isDbConfiguredMock.mockReturnValue(true);
    isStripeConfiguredMock.mockReturnValue(false);
    prismaMock.payment.findUnique.mockResolvedValue({
      id: 'payment-1',
      bookingId: 'booking-1',
      amount: 100,
      status: 'succeeded',
      refundAmount: 0,
      stripePaymentId: 'pi_1',
      booking: {
        user: { id: 'customer-1' },
      },
    });
    prismaMock.booking.findUnique.mockResolvedValue({
      id: 'booking-1',
      bookingNumber: 'PB-001',
      user: { id: 'customer-1' },
    });
  });

  it('blocks unauthenticated users from finance overview', async () => {
    authMock.mockResolvedValue(null);
    const res = await getFinanceOverviewRoute(new NextRequest('http://localhost/api/admin/finance/overview'));
    expect(res.status).toBe(401);
  });

  it('allows staff users to read finance overview', async () => {
    authMock.mockResolvedValue(staffSession);
    const res = await getFinanceOverviewRoute(new NextRequest('http://localhost/api/admin/finance/overview'));
    expect(res.status).toBe(200);
    expect(getFinanceOverviewMock).toHaveBeenCalledTimes(1);
  });

  it('allows staff users to read revenue recognition summary', async () => {
    authMock.mockResolvedValue(staffSession);
    const res = await getFinanceRevenueRecognitionRoute(
      new NextRequest('http://localhost/api/admin/finance/revenue-recognition'),
    );
    expect(res.status).toBe(200);
    expect(getFinanceRevenueRecognitionSummaryMock).toHaveBeenCalledTimes(1);
  });

  it('allows staff users to read finance transactions and refunds queue', async () => {
    authMock.mockResolvedValue(staffSession);
    const txRes = await getFinanceTransactionsRoute(new NextRequest('http://localhost/api/admin/finance/transactions'));
    const refundRes = await getFinanceRefundsRoute(new NextRequest('http://localhost/api/admin/finance/refunds'));
    expect(txRes.status).toBe(200);
    expect(refundRes.status).toBe(200);
  });

  it('allows staff users to read webhook health', async () => {
    authMock.mockResolvedValue(staffSession);
    const res = await getFinanceWebhooksRoute();
    expect(res.status).toBe(200);
    expect(getFinanceWebhookHealthMock).toHaveBeenCalledTimes(1);
  });

  it('blocks staff users from refund mutation', async () => {
    authMock.mockResolvedValue(staffSession);
    const res = await postFinanceRefundRoute(
      makeJsonRequest('http://localhost/api/admin/finance/refunds', {
        paymentId: 'payment-1',
        refundAmount: 10,
        reason: 'customer requested',
      }),
    );
    expect(res.status).toBe(403);
    expect(prismaMock.payment.update).not.toHaveBeenCalled();
  });

  it('allows admin users to apply refund mutation and writes audit event', async () => {
    authMock.mockResolvedValue(adminSession);
    const res = await postFinanceRefundRoute(
      makeJsonRequest('http://localhost/api/admin/finance/refunds', {
        paymentId: 'payment-1',
        refundAmount: 10,
        reason: 'customer requested',
      }),
    );
    expect(res.status).toBe(200);
    expect(prismaMock.payment.update).toHaveBeenCalledTimes(1);
    expect(appendFinanceAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'REFUND_APPLIED',
      }),
    );
  });

  it('blocks non-admin users from manual adjustment mutation', async () => {
    authMock.mockResolvedValue(customerSession);
    const res = await postFinanceAdjustmentRoute(
      makeJsonRequest('http://localhost/api/admin/finance/adjustments', {
        bookingId: 'booking-1',
        amount: 5,
        reason: 'manual adjustment',
      }),
    );
    expect(res.status).toBe(403);
  });

  it('allows admin users to create manual adjustment and writes audit event', async () => {
    authMock.mockResolvedValue(adminSession);
    const res = await postFinanceAdjustmentRoute(
      makeJsonRequest('http://localhost/api/admin/finance/adjustments', {
        bookingId: 'booking-1',
        amount: 5,
        reason: 'manual adjustment',
      }),
    );
    expect(res.status).toBe(200);
    expect(prismaMock.credit.create).toHaveBeenCalledTimes(1);
    expect(appendFinanceAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'MANUAL_ADJUSTMENT_APPLIED' }),
    );
  });

  it('allows staff users to read finance audit and taxes', async () => {
    authMock.mockResolvedValue(staffSession);
    const auditRes = await getFinanceAuditRoute(new NextRequest('http://localhost/api/admin/finance/audit'));
    const taxesRes = await getFinanceTaxesRoute(new NextRequest('http://localhost/api/admin/finance/taxes'));
    expect(auditRes.status).toBe(200);
    expect(taxesRes.status).toBe(200);
  });

  it('blocks staff users from reconciliation mutation', async () => {
    authMock.mockResolvedValue(staffSession);
    const res = await postFinanceReconciliationRoute(
      makeJsonRequest('http://localhost/api/admin/finance/reconciliation', {
        bucketDate: '2026-05-08',
      }),
    );
    expect(res.status).toBe(403);
  });

  it('allows admin users to mark reconciliation', async () => {
    authMock.mockResolvedValue(adminSession);
    const res = await postFinanceReconciliationRoute(
      makeJsonRequest('http://localhost/api/admin/finance/reconciliation', {
        bucketDate: '2026-05-08',
      }),
    );
    expect(res.status).toBe(200);
    expect(appendFinanceAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'PAYOUT_RECONCILED' }),
    );
  });

  it('allows staff users to read reconciliation and tax export CSV', async () => {
    authMock.mockResolvedValue(staffSession);
    const reconRes = await getFinanceReconciliationRoute(new NextRequest('http://localhost/api/admin/finance/reconciliation'));
    const exportRes = await getFinanceTaxesExportRoute(new NextRequest('http://localhost/api/admin/finance/taxes/export'));
    expect(reconRes.status).toBe(200);
    expect(exportRes.status).toBe(200);
  });

  it('allows staff users to read owner command center endpoints', async () => {
    authMock.mockResolvedValue(staffSession);
    const alertsRes = await getFinanceAlertsRoute(new NextRequest('http://localhost/api/admin/finance/alerts'));
    const exceptionsRes = await getFinanceExceptionsRoute(new NextRequest('http://localhost/api/admin/finance/exceptions'));
    const forecastRes = await getFinanceForecastRoute(new NextRequest('http://localhost/api/admin/finance/forecast?days=30'));

    expect(alertsRes.status).toBe(200);
    expect(exceptionsRes.status).toBe(200);
    expect(forecastRes.status).toBe(200);
  });

  it('includes payment flow metadata in finance transaction CSV export', async () => {
    authMock.mockResolvedValue(staffSession);

    const res = await getFinanceExportRoute(
      new NextRequest('http://localhost/api/admin/finance/export'),
    );

    expect(res.status).toBe(200);
    const csv = await res.text();
    expect(csv).toContain('paymentMode');
    expect(csv).toContain('stripeSourceType');
    expect(csv).toContain('payment_element');
    expect(csv).toContain('payment_intent');
  });
});
