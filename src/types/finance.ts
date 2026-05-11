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
  stripeChargeId?: string | null;
  cardBrand?: string | null;
  cardLastFour?: string | null;
  stripeFee?: number | null;
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

export interface FinanceAuditEvent {
  id: string;
  bookingId: string | null;
  actorName: string;
  actorUserId: string;
  eventType: string;
  note: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface FinanceRefundRequest {
  paymentId: string;
  refundAmount: number;
  reason: string;
}

export interface FinanceAdjustmentRequest {
  bookingId: string;
  amount: number;
  reason: string;
}

export interface FinanceReconciliationBucket {
  date: string;
  succeededAmount: number;
  refundedAmount: number;
  netAmount: number;
  transactionCount: number;
  status: 'pending' | 'reconciled';
  reconciledAt: string | null;
}

export interface FinanceReconciliationResponse {
  range: {
    startDate: string;
    endDate: string;
  };
  totals: {
    succeededAmount: number;
    refundedAmount: number;
    netAmount: number;
    transactionCount: number;
  };
  buckets: FinanceReconciliationBucket[];
}

export interface FinanceTaxSummaryRow {
  period: string;
  taxableRevenue: number;
  taxCollected: number;
  refundedTax: number;
  netTaxLiability: number;
}

export interface FinanceTaxSummaryResponse {
  range: {
    startDate: string;
    endDate: string;
  };
  totals: {
    taxableRevenue: number;
    taxCollected: number;
    refundedTax: number;
    netTaxLiability: number;
  };
  rows: FinanceTaxSummaryRow[];
}

export type RevenueRecognitionStatus =
  | 'pending_payment'
  | 'deferred'
  | 'partially_recognized'
  | 'fully_recognized'
  | 'reversed'
  | 'voided'
  | 'excluded';

export interface FinanceRevenueRecognitionRow {
  paymentId: string;
  bookingId: string;
  bookingNumber: string;
  amount: number;
  currency: string;
  recognitionStatus: RevenueRecognitionStatus;
  servicePeriodStart: string | null;
  servicePeriodEnd: string | null;
  deferredRevenueAmount: number;
  recognizedRevenueAmount: number;
  taxTreatment: string | null;
  exclusionReason: string | null;
  createdAt: string;
}

export interface FinanceRevenueRecognitionSummaryResponse {
  range: {
    startDate: string;
    endDate: string;
  };
  totals: {
    grossRevenue: number;
    deferredRevenue: number;
    recognizedRevenue: number;
    reversedRevenue: number;
    excludedRevenue: number;
    transactionCount: number;
  };
  byRecognitionStatus: Array<{
    status: RevenueRecognitionStatus;
    count: number;
    amount: number;
  }>;
  rows: FinanceRevenueRecognitionRow[];
}

export type FinanceAlertSeverity = 'info' | 'warning' | 'critical';

export interface FinanceAlertItem {
  id: string;
  severity: FinanceAlertSeverity;
  title: string;
  description: string;
  metricValue?: number;
  actionHref: string;
  actionLabel: string;
}

export interface FinanceAlertsResponse {
  generatedAt: string;
  alerts: FinanceAlertItem[];
}

export interface FinanceExceptionItem {
  id: string;
  type: 'pending_settlement' | 'failed_payment' | 'refund_activity';
  bookingId: string;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  ageDays: number;
  reason: string;
  createdAt: string;
  actionHref: string;
}

export interface FinanceExceptionsResponse {
  generatedAt: string;
  totalExceptions: number;
  items: FinanceExceptionItem[];
}

export interface FinanceCashForecastDay {
  date: string;
  expectedCashIn: number;
  expectedRefunds: number;
  expectedNet: number;
  bookingCount: number;
}

export interface FinanceCashForecastResponse {
  generatedAt: string;
  range: {
    startDate: string;
    endDate: string;
  };
  totals: {
    expectedCashIn: number;
    expectedRefunds: number;
    expectedNet: number;
    bookingCount: number;
  };
  days: FinanceCashForecastDay[];
}
