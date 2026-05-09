import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import type {
  FinanceOverviewResponse,
  FinanceTransactionsResponse,
  FinanceTransactionStatus,
  FinanceTransactionRow,
} from '@/types/finance';

type FinanceFilters = {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  search?: string;
};

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
