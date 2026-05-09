export type FinanceTransactionStatus =
  | 'pending'
  | 'succeeded'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export interface FinanceOverviewResponse {
  range: {
    startDate: string;
    endDate: string;
  };
  totals: {
    grossRevenue: number;
    refunds: number;
    netRevenue: number;
    taxesCollected: number;
    outstandingPending: number;
    transactionCount: number;
  };
  byStatus: Array<{
    status: FinanceTransactionStatus;
    count: number;
    amount: number;
  }>;
}

export interface FinanceTransactionRow {
  id: string;
  bookingId: string;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  refundAmount: number;
  currency: string;
  status: FinanceTransactionStatus;
  paymentMethod: string;
  stripePaymentId: string | null;
  createdAt: string;
  paidAt: string | null;
  refundedAt: string | null;
}

export interface FinanceTransactionsResponse {
  range: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalTransactions: number;
    filteredTransactions: number;
    totalAmount: number;
    totalRefundAmount: number;
  };
  rows: FinanceTransactionRow[];
}
