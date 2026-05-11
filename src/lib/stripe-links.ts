/**
 * Stripe Dashboard Deep Linking Utilities
 * 
 * Generates direct URLs to specific Stripe dashboard resources.
 * Enterprise-grade admin features require deep linking to charges, payouts, 
 * customers, refunds, and other Stripe objects for audit and investigation.
 */

/**
 * Base Stripe dashboard URL
 * In production, this should match your Stripe account mode (live/test)
 */
const STRIPE_DASHBOARD_BASE = 'https://dashboard.stripe.com';

/**
 * Determines if a Stripe ID is for test mode
 * Test mode IDs contain '_test_' in their prefix
 */
function isTestMode(stripeId: string): boolean {
  return stripeId.includes('_test_');
}

/**
 * Gets the appropriate dashboard base URL based on the Stripe ID
 */
function getDashboardBase(stripeId: string): string {
  return isTestMode(stripeId) 
    ? `${STRIPE_DASHBOARD_BASE}/test` 
    : STRIPE_DASHBOARD_BASE;
}

/**
 * Generate URL to a specific Stripe charge
 * @param chargeId - Stripe charge ID (ch_xxx)
 * @returns Direct URL to charge detail page
 * @example getStripeChargeUrl('ch_1ABC123') → 'https://dashboard.stripe.com/payments/ch_1ABC123'
 */
export function getStripeChargeUrl(chargeId: string): string {
  if (!chargeId || !chargeId.startsWith('ch_')) {
    throw new Error(`Invalid charge ID: ${chargeId}`);
  }
  const base = getDashboardBase(chargeId);
  return `${base}/payments/${chargeId}`;
}

/**
 * Generate URL to a specific Stripe PaymentIntent
 * @param paymentIntentId - Stripe PaymentIntent ID (pi_xxx)
 * @returns Direct URL to payment intent detail page
 * @example getStripePaymentIntentUrl('pi_1ABC123') → 'https://dashboard.stripe.com/payments/pi_1ABC123'
 */
export function getStripePaymentIntentUrl(paymentIntentId: string): string {
  if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
    throw new Error(`Invalid payment intent ID: ${paymentIntentId}`);
  }
  const base = getDashboardBase(paymentIntentId);
  return `${base}/payments/${paymentIntentId}`;
}

/**
 * Generate URL to a specific Stripe Checkout Session
 * @param sessionId - Stripe checkout session ID (cs_xxx)
 * @returns Direct URL to checkout session detail page
 */
export function getStripeCheckoutSessionUrl(sessionId: string): string {
  if (!sessionId || !sessionId.startsWith('cs_')) {
    throw new Error(`Invalid checkout session ID: ${sessionId}`);
  }
  const base = getDashboardBase(sessionId);
  return `${base}/checkout/sessions/${sessionId}`;
}

/**
 * Generate URL to a specific Stripe refund
 * @param refundId - Stripe refund ID (re_xxx)
 * @returns Direct URL to refund detail page
 * @example getStripeRefundUrl('re_1ABC123') → 'https://dashboard.stripe.com/refunds/re_1ABC123'
 */
export function getStripeRefundUrl(refundId: string): string {
  if (!refundId || !refundId.startsWith('re_')) {
    throw new Error(`Invalid refund ID: ${refundId}`);
  }
  const base = getDashboardBase(refundId);
  return `${base}/refunds/${refundId}`;
}

/**
 * Generate URL to a specific Stripe payout
 * @param payoutId - Stripe payout ID (po_xxx)
 * @returns Direct URL to payout detail page
 * @example getStripePayoutUrl('po_1ABC123') → 'https://dashboard.stripe.com/payouts/po_1ABC123'
 */
export function getStripePayoutUrl(payoutId: string): string {
  if (!payoutId || !payoutId.startsWith('po_')) {
    throw new Error(`Invalid payout ID: ${payoutId}`);
  }
  const base = getDashboardBase(payoutId);
  return `${base}/payouts/${payoutId}`;
}

/**
 * Generate URL to a specific Stripe customer
 * @param customerId - Stripe customer ID (cus_xxx)
 * @returns Direct URL to customer detail page
 * @example getStripeCustomerUrl('cus_ABC123') → 'https://dashboard.stripe.com/customers/cus_ABC123'
 */
export function getStripeCustomerUrl(customerId: string): string {
  if (!customerId || !customerId.startsWith('cus_')) {
    throw new Error(`Invalid customer ID: ${customerId}`);
  }
  const base = getDashboardBase(customerId);
  return `${base}/customers/${customerId}`;
}

/**
 * Generate URL to a specific Stripe invoice
 * @param invoiceId - Stripe invoice ID (in_xxx)
 * @returns Direct URL to invoice detail page
 * @example getStripeInvoiceUrl('in_1ABC123') → 'https://dashboard.stripe.com/invoices/in_1ABC123'
 */
export function getStripeInvoiceUrl(invoiceId: string): string {
  if (!invoiceId || !invoiceId.startsWith('in_')) {
    throw new Error(`Invalid invoice ID: ${invoiceId}`);
  }
  const base = getDashboardBase(invoiceId);
  return `${base}/invoices/${invoiceId}`;
}

/**
 * Generate URL to a specific Stripe balance transaction
 * @param balanceTransactionId - Stripe balance transaction ID (txn_xxx)
 * @returns Direct URL to balance transaction detail page
 * @example getStripeBalanceTransactionUrl('txn_1ABC123') → 'https://dashboard.stripe.com/balance/txn_1ABC123'
 */
export function getStripeBalanceTransactionUrl(balanceTransactionId: string): string {
  if (!balanceTransactionId || !balanceTransactionId.startsWith('txn_')) {
    throw new Error(`Invalid balance transaction ID: ${balanceTransactionId}`);
  }
  const base = getDashboardBase(balanceTransactionId);
  return `${base}/balance/txn_${balanceTransactionId}`;
}

/**
 * Generate URL to Stripe payments list filtered by date range
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @param testMode - Whether to link to test mode dashboard
 * @returns URL to filtered payments list
 */
export function getStripePaymentsListUrl(
  startDate?: string, 
  endDate?: string,
  testMode = false
): string {
  const base = testMode ? `${STRIPE_DASHBOARD_BASE}/test` : STRIPE_DASHBOARD_BASE;
  const params: string[] = [];
  
  if (startDate && endDate) {
    params.push(`created[gte]=${startDate}`);
    params.push(`created[lte]=${endDate}`);
  }
  
  const queryString = params.length > 0 ? `?${params.join('&')}` : '';
  return `${base}/payments${queryString}`;
}

/**
 * Generate URL to Stripe payouts list filtered by date range
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @param testMode - Whether to link to test mode dashboard
 * @returns URL to filtered payouts list
 */
export function getStripePayoutsListUrl(
  startDate?: string, 
  endDate?: string,
  testMode = false
): string {
  const base = testMode ? `${STRIPE_DASHBOARD_BASE}/test` : STRIPE_DASHBOARD_BASE;
  const params: string[] = [];
  
  if (startDate && endDate) {
    params.push(`arrival_date[gte]=${startDate}`);
    params.push(`arrival_date[lte]=${endDate}`);
  }
  
  const queryString = params.length > 0 ? `?${params.join('&')}` : '';
  return `${base}/payouts${queryString}`;
}

/**
 * Generate URL to Stripe Sigma query builder
 * @param testMode - Whether to link to test mode dashboard
 * @returns URL to Sigma queries page
 */
export function getStripeSigmaUrl(testMode = false): string {
  const base = testMode ? `${STRIPE_DASHBOARD_BASE}/test` : STRIPE_DASHBOARD_BASE;
  return `${base}/sigma/queries`;
}

/**
 * Generate URL to Stripe billing subscriptions dashboard
 */
export function getStripeBillingSubscriptionsUrl(testMode = false): string {
  const base = testMode ? `${STRIPE_DASHBOARD_BASE}/test` : STRIPE_DASHBOARD_BASE;
  return `${base}/subscriptions`;
}

/**
 * Generate URL to Stripe customer portal configuration
 */
export function getStripeCustomerPortalConfigUrl(testMode = false): string {
  const base = testMode ? `${STRIPE_DASHBOARD_BASE}/test` : STRIPE_DASHBOARD_BASE;
  return `${base}/settings/billing/portal`;
}

/**
 * Generate URL to a specific Stripe Sigma query
 * @param queryId - Sigma query ID
 * @param testMode - Whether to link to test mode dashboard
 * @returns URL to specific Sigma query
 */
export function getStripeSigmaQueryUrl(queryId: string, testMode = false): string {
  const base = testMode ? `${STRIPE_DASHBOARD_BASE}/test` : STRIPE_DASHBOARD_BASE;
  return `${base}/sigma/queries/${queryId}`;
}

/**
 * Generate URL to Stripe reconciliation reports (requires Sigma)
 * @param reportType - Type of reconciliation report
 * @param testMode - Whether to link to test mode dashboard
 * @returns URL to reconciliation report template
 */
export function getStripeReconciliationReportUrl(
  reportType: 'payout' | 'balance' | 'ending_balance',
  testMode = false
): string {
  const base = testMode ? `${STRIPE_DASHBOARD_BASE}/test` : STRIPE_DASHBOARD_BASE;
  const reportTemplates = {
    payout: 'payout_reconciliation.itemized.5',
    balance: 'balance_change_from_activity.itemized.3',
    ending_balance: 'ending_balance_reconciliation.itemized.4'
  };
  
  return `${base}/sigma/queries?template=${reportTemplates[reportType]}`;
}
