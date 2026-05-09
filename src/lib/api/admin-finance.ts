import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import type {
  FinanceAlertsResponse,
  FinanceAuditEvent,
  FinanceCashForecastResponse,
  FinanceExceptionsResponse,
  FinanceOverviewResponse,
  FinanceReconciliationResponse,
  FinanceTransactionsResponse,
  FinanceTransactionStatus,
  FinanceTransactionRow,
  FinanceTaxSummaryResponse,
} from '@/types/finance';

type FinanceFilters = {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  search?: string;
};

const FINANCE_AUDIT_PREFIX = '[FINANCE_AUDIT]';

const ALLOWED_STATUSES: FinanceTransactionStatus[] = [
  'pending',
  'succeeded',
  'failed',
  'refunded',
  'cancelled',
];

function normalizeStatus(value: string | undefined): FinanceTransactionStatus | undefined {
  if (!value) return undefined;
  return ALLOWED_STATUSES.includes(value as FinanceTransactionStatus)
    ? (value as FinanceTransactionStatus)
    : undefined;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function safeJsonParse(value: string): Record<string, unknown> | null {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getDefaultFinanceRange(): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  return { startDate, endDate };
}

export async function getFinanceOverview(
  startDate: Date,
  endDate: Date,
): Promise<FinanceOverviewResponse> {
  if (!isDatabaseConfigured()) {
    return {
      range: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      totals: {
        grossRevenue: 0,
        refunds: 0,
        netRevenue: 0,
        taxesCollected: 0,
        outstandingPending: 0,
        transactionCount: 0,
      },
      byStatus: [],
    };
  }

  const payments = await prisma.payment.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      booking: {
        select: {
          id: true,
          tax: true,
          bookingNumber: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  let grossRevenue = 0;
  let refunds = 0;
  let taxesCollected = 0;
  let outstandingPending = 0;

  const statusMap: Record<FinanceTransactionStatus, { count: number; amount: number }> = {
    pending: { count: 0, amount: 0 },
    succeeded: { count: 0, amount: 0 },
    failed: { count: 0, amount: 0 },
    refunded: { count: 0, amount: 0 },
    cancelled: { count: 0, amount: 0 },
  };

  for (const payment of payments) {
    const status = normalizeStatus(payment.status) ?? 'pending';
    statusMap[status].count += 1;
    statusMap[status].amount = roundCurrency(statusMap[status].amount + payment.amount);

    if (status === 'succeeded' || status === 'refunded') {
      grossRevenue = roundCurrency(grossRevenue + payment.amount);
      taxesCollected = roundCurrency(taxesCollected + (payment.booking?.tax ?? 0));
    }

    if (status === 'pending') {
      outstandingPending = roundCurrency(outstandingPending + payment.amount);
    }

    if (status === 'refunded') {
      refunds = roundCurrency(refunds + (payment.refundAmount ?? payment.amount));
    }
  }

  const netRevenue = roundCurrency(grossRevenue - refunds);

  return {
    range: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    totals: {
      grossRevenue,
      refunds,
      netRevenue,
      taxesCollected,
      outstandingPending,
      transactionCount: payments.length,
    },
    byStatus: ALLOWED_STATUSES.map((status) => ({
      status,
      count: statusMap[status].count,
      amount: statusMap[status].amount,
    })),
  };
}

function matchesSearch(row: FinanceTransactionRow, search: string): boolean {
  const term = search.toLowerCase();
  return (
    row.bookingNumber.toLowerCase().includes(term) ||
    row.customerName.toLowerCase().includes(term) ||
    row.customerEmail.toLowerCase().includes(term) ||
    (row.stripePaymentId ?? '').toLowerCase().includes(term)
  );
}

export async function getFinanceTransactions(
  filters: FinanceFilters,
): Promise<FinanceTransactionsResponse> {
  const defaultRange = getDefaultFinanceRange();
  const startDate = filters.startDate ?? defaultRange.startDate;
  const endDate = filters.endDate ?? defaultRange.endDate;

  if (!isDatabaseConfigured()) {
    return {
      range: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary: {
        totalTransactions: 0,
        filteredTransactions: 0,
        totalAmount: 0,
        totalRefundAmount: 0,
      },
      rows: [],
    };
  }

  const status = normalizeStatus(filters.status);

  const payments = await prisma.payment.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(status ? { status } : {}),
    },
    include: {
      booking: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 300,
  });

  const rows: FinanceTransactionRow[] = payments.map((payment) => ({
    id: payment.id,
    bookingId: payment.bookingId,
    bookingNumber: payment.booking.bookingNumber,
    customerName: payment.booking.user.name ?? 'Unknown',
    customerEmail: payment.booking.user.email ?? 'Unknown',
    amount: payment.amount,
    refundAmount: payment.refundAmount ?? 0,
    currency: payment.currency.toUpperCase(),
    status: normalizeStatus(payment.status) ?? 'pending',
    paymentMethod: payment.paymentMethod ?? 'unknown',
    stripePaymentId: payment.stripePaymentId,
    createdAt: payment.createdAt.toISOString(),
    paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
    refundedAt: payment.refundedAt ? payment.refundedAt.toISOString() : null,
  }));

  const filteredRows = filters.search
    ? rows.filter((row) => matchesSearch(row, filters.search as string))
    : rows;

  const totalAmount = filteredRows.reduce((sum, row) => sum + row.amount, 0);
  const totalRefundAmount = filteredRows.reduce((sum, row) => sum + row.refundAmount, 0);

  return {
    range: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    summary: {
      totalTransactions: rows.length,
      filteredTransactions: filteredRows.length,
      totalAmount: roundCurrency(totalAmount),
      totalRefundAmount: roundCurrency(totalRefundAmount),
    },
    rows: filteredRows,
  };
}

export async function appendFinanceAuditEvent(input: {
  bookingId?: string;
  actorUserId: string;
  actorName: string;
  eventType: string;
  note: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  if (!isDatabaseConfigured()) return;

  const payload = {
    eventType: input.eventType,
    note: input.note,
    payload: input.payload ?? {},
    timestamp: new Date().toISOString(),
  };

  await prisma.message.create({
    data: {
      bookingId: input.bookingId,
      userId: input.actorUserId,
      senderType: 'staff',
      senderName: input.actorName,
      content: `${FINANCE_AUDIT_PREFIX}${JSON.stringify(payload)}`,
      isRead: true,
    },
  });
}

export async function getFinanceAuditEvents(filters?: {
  bookingId?: string;
  limit?: number;
}): Promise<FinanceAuditEvent[]> {
  if (!isDatabaseConfigured()) return [];

  const rows = await prisma.message.findMany({
    where: {
      ...(filters?.bookingId ? { bookingId: filters.bookingId } : {}),
      content: {
        startsWith: FINANCE_AUDIT_PREFIX,
      },
    },
    orderBy: {
      sentAt: 'desc',
    },
    take: filters?.limit ?? 100,
  });

  const events: FinanceAuditEvent[] = [];

  for (const row of rows) {
    const json = safeJsonParse(row.content.slice(FINANCE_AUDIT_PREFIX.length));
    if (!json) continue;

    events.push({
      id: row.id,
      bookingId: row.bookingId,
      actorName: row.senderName,
      actorUserId: row.userId,
      eventType: String(json.eventType ?? 'UNKNOWN'),
      note: String(json.note ?? ''),
      payload: (json.payload as Record<string, unknown>) ?? {},
      createdAt: row.sentAt.toISOString(),
    });
  }

  return events;
}

export async function getFinanceReconciliation(
  startDate: Date,
  endDate: Date,
): Promise<FinanceReconciliationResponse> {
  if (!isDatabaseConfigured()) {
    return {
      range: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      totals: { succeededAmount: 0, refundedAmount: 0, netAmount: 0, transactionCount: 0 },
      buckets: [],
    };
  }

  const payments = await prisma.payment.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ['succeeded', 'refunded'],
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const bucketMap: Record<string, {
    succeededAmount: number;
    refundedAmount: number;
    netAmount: number;
    transactionCount: number;
    reconciledAt: string | null;
  }> = {};

  for (const payment of payments) {
    const sourceDate = payment.paidAt ?? payment.createdAt;
    const bucketDate = sourceDate.toISOString().slice(0, 10);

    if (!bucketMap[bucketDate]) {
      bucketMap[bucketDate] = {
        succeededAmount: 0,
        refundedAmount: 0,
        netAmount: 0,
        transactionCount: 0,
        reconciledAt: null,
      };
    }

    bucketMap[bucketDate].succeededAmount = roundCurrency(
      bucketMap[bucketDate].succeededAmount + payment.amount,
    );
    bucketMap[bucketDate].transactionCount += 1;

    const refundAmount = payment.refundAmount ?? 0;
    bucketMap[bucketDate].refundedAmount = roundCurrency(
      bucketMap[bucketDate].refundedAmount + refundAmount,
    );
    bucketMap[bucketDate].netAmount = roundCurrency(
      bucketMap[bucketDate].succeededAmount - bucketMap[bucketDate].refundedAmount,
    );
  }

  const auditEvents = await getFinanceAuditEvents({ limit: 200 });
  for (const event of auditEvents) {
    if (event.eventType !== 'PAYOUT_RECONCILED') continue;
    const bucketDate = String(event.payload.bucketDate ?? '');
    if (!bucketDate || !bucketMap[bucketDate]) continue;
    bucketMap[bucketDate].reconciledAt = event.createdAt;
  }

  const bucketDates = Object.keys(bucketMap).sort((a, b) => (a < b ? 1 : -1));
  const buckets = bucketDates.map((date) => ({
    date,
    succeededAmount: bucketMap[date].succeededAmount,
    refundedAmount: bucketMap[date].refundedAmount,
    netAmount: bucketMap[date].netAmount,
    transactionCount: bucketMap[date].transactionCount,
    status: (bucketMap[date].reconciledAt ? 'reconciled' : 'pending') as
      | 'pending'
      | 'reconciled',
    reconciledAt: bucketMap[date].reconciledAt,
  }));

  const totals = buckets.reduce(
    (acc, bucket) => {
      acc.succeededAmount = roundCurrency(acc.succeededAmount + bucket.succeededAmount);
      acc.refundedAmount = roundCurrency(acc.refundedAmount + bucket.refundedAmount);
      acc.netAmount = roundCurrency(acc.netAmount + bucket.netAmount);
      acc.transactionCount += bucket.transactionCount;
      return acc;
    },
    { succeededAmount: 0, refundedAmount: 0, netAmount: 0, transactionCount: 0 },
  );

  return {
    range: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
    totals,
    buckets,
  };
}

export async function getFinanceTaxSummary(
  startDate: Date,
  endDate: Date,
): Promise<FinanceTaxSummaryResponse> {
  if (!isDatabaseConfigured()) {
    return {
      range: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      totals: { taxableRevenue: 0, taxCollected: 0, refundedTax: 0, netTaxLiability: 0 },
      rows: [],
    };
  }

  const payments = await prisma.payment.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ['succeeded', 'refunded'],
      },
    },
    include: {
      booking: {
        select: {
          total: true,
          tax: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const monthMap: Record<string, {
    taxableRevenue: number;
    taxCollected: number;
    refundedTax: number;
    netTaxLiability: number;
  }> = {};

  for (const payment of payments) {
    const period = payment.createdAt.toISOString().slice(0, 7);
    if (!monthMap[period]) {
      monthMap[period] = {
        taxableRevenue: 0,
        taxCollected: 0,
        refundedTax: 0,
        netTaxLiability: 0,
      };
    }

    const bookingTotal = payment.booking.total > 0 ? payment.booking.total : payment.amount;
    const paymentTaxPortion = roundCurrency(
      bookingTotal > 0 ? (payment.amount / bookingTotal) * payment.booking.tax : payment.booking.tax,
    );
    const refundedTaxPortion = roundCurrency(
      payment.refundAmount && payment.amount > 0
        ? (payment.refundAmount / payment.amount) * paymentTaxPortion
        : 0,
    );

    monthMap[period].taxableRevenue = roundCurrency(monthMap[period].taxableRevenue + payment.amount);
    monthMap[period].taxCollected = roundCurrency(monthMap[period].taxCollected + paymentTaxPortion);
    monthMap[period].refundedTax = roundCurrency(monthMap[period].refundedTax + refundedTaxPortion);
    monthMap[period].netTaxLiability = roundCurrency(
      monthMap[period].taxCollected - monthMap[period].refundedTax,
    );
  }

  const rows = Object.keys(monthMap)
    .sort((a, b) => (a < b ? 1 : -1))
    .map((period) => ({
      period,
      taxableRevenue: monthMap[period].taxableRevenue,
      taxCollected: monthMap[period].taxCollected,
      refundedTax: monthMap[period].refundedTax,
      netTaxLiability: monthMap[period].netTaxLiability,
    }));

  const totals = rows.reduce(
    (acc, row) => {
      acc.taxableRevenue = roundCurrency(acc.taxableRevenue + row.taxableRevenue);
      acc.taxCollected = roundCurrency(acc.taxCollected + row.taxCollected);
      acc.refundedTax = roundCurrency(acc.refundedTax + row.refundedTax);
      acc.netTaxLiability = roundCurrency(acc.netTaxLiability + row.netTaxLiability);
      return acc;
    },
    { taxableRevenue: 0, taxCollected: 0, refundedTax: 0, netTaxLiability: 0 },
  );

  return {
    range: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
    totals,
    rows,
  };
}

export async function getFinanceAlerts(): Promise<FinanceAlertsResponse> {
  const now = new Date();

  if (!isDatabaseConfigured()) {
    return {
      generatedAt: now.toISOString(),
      alerts: [],
    };
  }

  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - 30);

  const [recentPayments, reconciliation] = await Promise.all([
    prisma.payment.findMany({
      where: {
        createdAt: {
          gte: windowStart,
        },
      },
      select: {
        id: true,
        status: true,
        amount: true,
        refundAmount: true,
        createdAt: true,
      },
    }),
    getFinanceReconciliation(windowStart, now),
  ]);

  const pendingAged = recentPayments.filter((payment) => {
    if (payment.status !== 'pending') return false;
    const ageMs = now.getTime() - payment.createdAt.getTime();
    return ageMs > 2 * 24 * 60 * 60 * 1000;
  });

  const failedPayments = recentPayments.filter((payment) => payment.status === 'failed');
  const refundedPayments = recentPayments.filter((payment) => payment.status === 'refunded');
  const succeededOrRefunded = recentPayments.filter((payment) =>
    ['succeeded', 'refunded'].includes(payment.status),
  );

  const refundRate =
    succeededOrRefunded.length > 0
      ? refundedPayments.length / succeededOrRefunded.length
      : 0;

  const unreconciledBuckets = reconciliation.buckets.filter((bucket) => bucket.status === 'pending');

  const alerts = [] as FinanceAlertsResponse['alerts'];

  if (pendingAged.length > 0) {
    alerts.push({
      id: 'pending-aged',
      severity: 'warning',
      title: 'Pending settlements require review',
      description: `${pendingAged.length} payment(s) are pending for more than 48 hours.`,
      metricValue: pendingAged.length,
      actionHref: '/admin/finance/refunds',
      actionLabel: 'Open exceptions',
    });
  }

  if (failedPayments.length > 0) {
    alerts.push({
      id: 'failed-payments',
      severity: failedPayments.length >= 3 ? 'critical' : 'warning',
      title: 'Failed payments detected',
      description: `${failedPayments.length} failed payment(s) were detected in the last 30 days.`,
      metricValue: failedPayments.length,
      actionHref: '/admin/finance?status=failed',
      actionLabel: 'Review failures',
    });
  }

  if (refundRate >= 0.2) {
    alerts.push({
      id: 'refund-rate-spike',
      severity: 'critical',
      title: 'Refund rate spike',
      description: `Refund rate is ${(refundRate * 100).toFixed(1)}% over the last 30 days.`,
      metricValue: roundCurrency(refundRate * 100),
      actionHref: '/admin/finance/refunds',
      actionLabel: 'Investigate refunds',
    });
  }

  if (unreconciledBuckets.length > 0) {
    alerts.push({
      id: 'unreconciled-buckets',
      severity: unreconciledBuckets.length >= 3 ? 'critical' : 'warning',
      title: 'Unreconciled payout buckets',
      description: `${unreconciledBuckets.length} daily payout bucket(s) still need reconciliation.`,
      metricValue: unreconciledBuckets.length,
      actionHref: '/admin/finance/reconciliation',
      actionLabel: 'Reconcile now',
    });
  }

  const currentDay = now.getDate();
  if (currentDay >= 20) {
    alerts.push({
      id: 'tax-deadline-window',
      severity: 'info',
      title: 'Tax filing window reminder',
      description: 'You are in the monthly filing window. Validate tax liability and export records.',
      actionHref: '/admin/finance/taxes',
      actionLabel: 'Review tax liability',
    });
  }

  return {
    generatedAt: now.toISOString(),
    alerts,
  };
}

export async function getFinanceExceptions(): Promise<FinanceExceptionsResponse> {
  const now = new Date();

  if (!isDatabaseConfigured()) {
    return {
      generatedAt: now.toISOString(),
      totalExceptions: 0,
      items: [],
    };
  }

  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - 45);

  const payments = await prisma.payment.findMany({
    where: {
      createdAt: {
        gte: windowStart,
      },
      status: {
        in: ['pending', 'failed', 'refunded'],
      },
    },
    include: {
      booking: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 200,
  });

  const items = payments
    .map((payment) => {
      const ageDays = Math.floor((now.getTime() - payment.createdAt.getTime()) / (24 * 60 * 60 * 1000));

      if (payment.status === 'pending' && ageDays >= 2) {
        return {
          id: payment.id,
          type: 'pending_settlement' as const,
          bookingId: payment.bookingId,
          bookingNumber: payment.booking.bookingNumber,
          customerName: payment.booking.user.name ?? 'Unknown',
          customerEmail: payment.booking.user.email ?? 'Unknown',
          amount: payment.amount,
          ageDays,
          reason: 'Settlement pending beyond 48 hours.',
          createdAt: payment.createdAt.toISOString(),
          actionHref: '/admin/finance/refunds',
        };
      }

      if (payment.status === 'failed') {
        return {
          id: payment.id,
          type: 'failed_payment' as const,
          bookingId: payment.bookingId,
          bookingNumber: payment.booking.bookingNumber,
          customerName: payment.booking.user.name ?? 'Unknown',
          customerEmail: payment.booking.user.email ?? 'Unknown',
          amount: payment.amount,
          ageDays,
          reason: 'Payment failed and needs follow-up.',
          createdAt: payment.createdAt.toISOString(),
          actionHref: '/admin/finance?status=failed',
        };
      }

      if (payment.status === 'refunded') {
        return {
          id: payment.id,
          type: 'refund_activity' as const,
          bookingId: payment.bookingId,
          bookingNumber: payment.booking.bookingNumber,
          customerName: payment.booking.user.name ?? 'Unknown',
          customerEmail: payment.booking.user.email ?? 'Unknown',
          amount: payment.refundAmount ?? payment.amount,
          ageDays,
          reason: 'Refund activity recorded, verify reason and notes.',
          createdAt: payment.createdAt.toISOString(),
          actionHref: '/admin/finance/refunds',
        };
      }

      return null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 100);

  return {
    generatedAt: now.toISOString(),
    totalExceptions: items.length,
    items,
  };
}

export async function getFinanceCashForecast(days = 30): Promise<FinanceCashForecastResponse> {
  const now = new Date();
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + Math.max(1, Math.min(days, 90)) - 1);
  endDate.setHours(23, 59, 59, 999);

  if (!isDatabaseConfigured()) {
    return {
      generatedAt: now.toISOString(),
      range: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      totals: {
        expectedCashIn: 0,
        expectedRefunds: 0,
        expectedNet: 0,
        bookingCount: 0,
      },
      days: [],
    };
  }

  const [upcomingBookings, recentPayments] = await Promise.all([
    prisma.booking.findMany({
      where: {
        checkInDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['pending', 'confirmed'],
        },
      },
      select: {
        id: true,
        checkInDate: true,
        total: true,
      },
      orderBy: {
        checkInDate: 'asc',
      },
    }),
    prisma.payment.findMany({
      where: {
        createdAt: {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        },
        status: {
          in: ['succeeded', 'refunded'],
        },
      },
      select: {
        status: true,
      },
    }),
  ]);

  const refundedCount = recentPayments.filter((p) => p.status === 'refunded').length;
  const succeededOrRefundedCount = recentPayments.length;
  const refundRate = succeededOrRefundedCount > 0 ? refundedCount / succeededOrRefundedCount : 0.05;

  const forecastMap: Record<string, {
    expectedCashIn: number;
    expectedRefunds: number;
    expectedNet: number;
    bookingCount: number;
  }> = {};

  for (let i = 0; i < days; i += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const key = date.toISOString().slice(0, 10);
    forecastMap[key] = {
      expectedCashIn: 0,
      expectedRefunds: 0,
      expectedNet: 0,
      bookingCount: 0,
    };
  }

  for (const booking of upcomingBookings) {
    const key = booking.checkInDate.toISOString().slice(0, 10);
    if (!forecastMap[key]) continue;

    forecastMap[key].expectedCashIn = roundCurrency(forecastMap[key].expectedCashIn + booking.total);
    forecastMap[key].bookingCount += 1;
  }

  for (const key of Object.keys(forecastMap)) {
    forecastMap[key].expectedRefunds = roundCurrency(forecastMap[key].expectedCashIn * refundRate);
    forecastMap[key].expectedNet = roundCurrency(
      forecastMap[key].expectedCashIn - forecastMap[key].expectedRefunds,
    );
  }

  const dayKeys = Object.keys(forecastMap).sort((a, b) => (a < b ? -1 : 1));
  const dayRows = dayKeys.map((date) => ({
    date,
    ...forecastMap[date],
  }));

  const totals = dayRows.reduce(
    (acc, row) => {
      acc.expectedCashIn = roundCurrency(acc.expectedCashIn + row.expectedCashIn);
      acc.expectedRefunds = roundCurrency(acc.expectedRefunds + row.expectedRefunds);
      acc.expectedNet = roundCurrency(acc.expectedNet + row.expectedNet);
      acc.bookingCount += row.bookingCount;
      return acc;
    },
    { expectedCashIn: 0, expectedRefunds: 0, expectedNet: 0, bookingCount: 0 },
  );

  return {
    generatedAt: now.toISOString(),
    range: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    totals,
    days: dayRows,
  };
}
