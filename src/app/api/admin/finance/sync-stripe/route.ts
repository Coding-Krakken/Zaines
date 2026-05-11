import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { requireFinanceAccess } from '@/lib/api/admin-finance-auth';

interface SyncReport {
  itemsSynced: number;
  chargesProcessed: number;
  refundsProcessed: number;
  payoutsProcessed: number;
  mismatches: Array<{
    type: string;
    details: string;
  }>;
  generatedAt: string;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireFinanceAccess('write');
    if (access.response) return access.response;

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    if (!isStripeConfigured()) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }

    const report: SyncReport = {
      itemsSynced: 0,
      chargesProcessed: 0,
      refundsProcessed: 0,
      payoutsProcessed: 0,
      mismatches: [],
      generatedAt: new Date().toISOString(),
    };

    // Sync charges from last 90 days
    const chargesStartDate = Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000);
    const charges = await stripe.charges.list({
      created: { gte: chargesStartDate },
      limit: 100,
    });

    for (const charge of charges.data) {
      report.chargesProcessed++;
      try {
        const paymentIntentId = typeof charge.payment_intent === 'string' 
          ? charge.payment_intent 
          : charge.payment_intent?.id;

        if (!paymentIntentId) continue;

        const payment = await prisma.payment.findFirst({
          where: { stripePaymentId: paymentIntentId },
        });

        if (!payment) {
          report.mismatches.push({
            type: 'charge_not_in_local',
            details: `Stripe charge ${charge.id} not found in local database`,
          });
          continue;
        }

        // Update payment with Stripe charge details
        const cardBrand = charge.payment_method_details?.card?.brand ?? null;
        const cardLastFour = charge.payment_method_details?.card?.last4 ?? null;
        const stripeFeeAmount = charge.application_fee_amount ? roundCurrency(charge.application_fee_amount / 100) : null;

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            stripeChargeId: charge.id,
            ...(cardBrand ? { cardBrand } : {}),
            ...(cardLastFour ? { cardLastFour } : {}),
            ...(stripeFeeAmount ? { stripeFeeAmount: stripeFeeAmount } : {}),
          },
        });

        report.itemsSynced++;
      } catch (err) {
        report.mismatches.push({
          type: 'charge_sync_error',
          details: `Error syncing charge ${charge.id}: ${err instanceof Error ? err.message : 'Unknown error'}`,
        });
      }
    }

    // Sync refunds
    const refunds = await stripe.refunds.list({
      created: { gte: chargesStartDate },
      limit: 100,
    });

    for (const refund of refunds.data) {
      report.refundsProcessed++;
      try {
        if (!refund.charge) continue;

        const charge = await stripe.charges.retrieve(refund.charge as string);
        const paymentIntentId = typeof charge.payment_intent === 'string' 
          ? charge.payment_intent 
          : charge.payment_intent?.id;

        if (!paymentIntentId) continue;

        const payment = await prisma.payment.findFirst({
          where: { stripePaymentId: paymentIntentId },
        });

        if (!payment) {
          report.mismatches.push({
            type: 'refund_not_in_local',
            details: `Stripe refund ${refund.id} not found in local database`,
          });
          continue;
        }

        // Verify refund amount matches local record
        const refundAmountFromStripe = roundCurrency(refund.amount / 100);
        const localRefundAmount = payment.refundAmount ?? 0;

        if (Math.abs(refundAmountFromStripe - localRefundAmount) > 0.01) {
          report.mismatches.push({
            type: 'refund_amount_mismatch',
            details: `Refund ${refund.id}: Stripe=${refundAmountFromStripe}, Local=${localRefundAmount}`,
          });
        }

        report.itemsSynced++;
      } catch (err) {
        report.mismatches.push({
          type: 'refund_sync_error',
          details: `Error syncing refund: ${err instanceof Error ? err.message : 'Unknown error'}`,
        });
      }
    }

    // Sync payouts
    const payouts = await stripe.payouts.list({
      created: { gte: chargesStartDate },
      limit: 100,
    });

    for (const payout of payouts.data) {
      report.payoutsProcessed++;
      try {
        const existingPayout = await prisma.stripePayout.findFirst({
          where: { stripePayoutId: payout.id },
        });

        if (!existingPayout) {
          await prisma.stripePayout.create({
            data: {
              stripePayoutId: payout.id,
              amount: roundCurrency(payout.amount / 100),
              currency: payout.currency,
              status: payout.status as string,
              failureCode: payout.failure_code ?? null,
              arrivedAt: payout.arrival_date ? new Date(payout.arrival_date * 1000) : null,
            },
          });
        } else {
          await prisma.stripePayout.update({
            where: { stripePayoutId: payout.id },
            data: {
              status: payout.status as string,
              arrivedAt: payout.arrival_date ? new Date(payout.arrival_date * 1000) : null,
            },
          });
        }

        report.itemsSynced++;
      } catch (err) {
        report.mismatches.push({
          type: 'payout_sync_error',
          details: `Error syncing payout: ${err instanceof Error ? err.message : 'Unknown error'}`,
        });
      }
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error('Error syncing Stripe data:', error);
    return NextResponse.json({ error: 'Failed to sync Stripe data' }, { status: 500 });
  }
}
