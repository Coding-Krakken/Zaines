import { NextRequest, NextResponse } from 'next/server';
import { requireFinanceAccess } from '@/lib/api/admin-finance-auth';
import { prisma } from '@/lib/prisma';
import {
  getStripeChargeUrl,
  getStripeCheckoutSessionUrl,
  getStripePaymentIntentUrl,
  getStripePayoutUrl,
  getStripeBalanceTransactionUrl,
} from '@/lib/stripe-links';

/**
 * GET /api/admin/finance/transaction-detail/[paymentId]
 * 
 * Fetch comprehensive transaction details for a specific payment.
 * Includes: payment data, booking info, customer info, Stripe events timeline,
 * related transactions, payout information, and direct Stripe dashboard links.
 * 
 * Enterprise-grade detail view for finance admin investigation.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    // Require finance read access
    const access = await requireFinanceAccess('read');
    if (access.response) {
      return access.response;
    }

    const { paymentId } = await params;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID required' },
        { status: 400 }
      );
    }

    // Fetch payment with all related data
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                phone: true,
              },
            },
            suite: {
              select: {
                id: true,
                name: true,
              },
            },
            waivers: {
              select: {
                id: true,
                type: true,
                signedAt: true,
              },
            },
          },
        },
        stripeEvent: {
          select: {
            id: true,
            eventId: true,
            eventType: true,
            processed: true,
            processedAt: true,
            createdAt: true,
          },
        },
        stripeBalances: {
          include: {
            payout: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Fetch all Stripe events related to this payment's Stripe IDs
    const stripeEventIds = payment.webhookEventIds || [];
    const relatedEvents = await prisma.stripeEvent.findMany({
      where: {
        OR: [
          { eventId: { in: stripeEventIds } },
          { paymentId: payment.id },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        eventId: true,
        eventType: true,
        processed: true,
        processedAt: true,
        createdAt: true,
      },
    });

    // Fetch related payments from same booking
    const relatedPayments = payment.bookingId
      ? await prisma.payment.findMany({
          where: {
            bookingId: payment.bookingId,
            id: { not: payment.id },
          },
          select: {
            id: true,
            amount: true,
            status: true,
            isDeposit: true,
            paidAt: true,
            refundedAt: true,
            refundAmount: true,
            stripePaymentId: true,
            stripeChargeId: true,
          },
          orderBy: {
            paidAt: 'desc',
          },
        })
      : [];

    // Fetch other payments from same customer
    const customerPayments = payment.booking?.user?.id
      ? await prisma.payment.findMany({
          where: {
            booking: {
              userId: payment.booking.user.id,
            },
            id: { not: payment.id },
            bookingId: { not: payment.bookingId },
          },
          select: {
            id: true,
            amount: true,
            status: true,
            paidAt: true,
            bookingId: true,
            booking: {
              select: {
                id: true,
                suite: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            paidAt: 'desc',
          },
          take: 5, // Limit to recent 5
        })
      : [];

    // Build Stripe dashboard links
    const stripeLinks: Record<string, string> = {};

    if (payment.stripeChargeId) {
      try {
        stripeLinks.charge = getStripeChargeUrl(payment.stripeChargeId);
      } catch {
        console.warn('Invalid charge ID:', payment.stripeChargeId);
      }
    }

    if (payment.stripePaymentId) {
      try {
        if (payment.stripePaymentId.startsWith('pi_')) {
          stripeLinks.paymentIntent = getStripePaymentIntentUrl(
            payment.stripePaymentId,
          );
        } else if (payment.stripePaymentId.startsWith('cs_')) {
          stripeLinks.checkoutSession = getStripeCheckoutSessionUrl(
            payment.stripePaymentId,
          );
        }
      } catch {
        console.warn('Invalid stripe payment object ID:', payment.stripePaymentId);
      }
    }

    if (payment.stripeBalanceTransactionId) {
      try {
        stripeLinks.balanceTransaction = getStripeBalanceTransactionUrl(
          payment.stripeBalanceTransactionId
        );
      } catch {
        console.warn('Invalid balance transaction ID:', payment.stripeBalanceTransactionId);
      }
    }

    if (payment.booking?.user?.id) {
      // No stripeCustomerId on User; omit customer Stripe link
    }

    // Add payout link if payment is matched to a payout
    const matchedPayout = payment.stripeBalances?.find((b) => b.payout);
    if (matchedPayout?.payout?.stripePayoutId) {
      try {
        stripeLinks.payout = getStripePayoutUrl(matchedPayout.payout.stripePayoutId);
      } catch {
        console.warn('Invalid payout ID:', matchedPayout.payout.stripePayoutId);
      }
    }

    // Assemble comprehensive response
    const response = {
      payment: {
        id: payment.id,
        stripePaymentId: payment.stripePaymentId,
        stripeChargeId: payment.stripeChargeId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        cardBrand: payment.cardBrand,
        cardLastFour: payment.cardLastFour,
        stripeFeeAmount: payment.stripeFeeAmount,
        isDeposit: payment.isDeposit,
        paidAt: payment.paidAt,
        refundedAt: payment.refundedAt,
        refundAmount: payment.refundAmount,
        reconciliationStatus: payment.reconciliationStatus,
        reconciliationNote: payment.reconciliationNote,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
      booking: payment.booking
        ? {
            id: payment.booking.id,
            status: payment.booking.status,
            checkInDate: payment.booking.checkInDate,
            checkOutDate: payment.booking.checkOutDate,
            total: payment.booking.total,
            suite: payment.booking.suite,
            waivers: payment.booking.waivers,
          }
        : null,
      customer: payment.booking?.user || null,
      stripeEvents: relatedEvents,
      stripeBalances: payment.stripeBalances || [],
      payout: matchedPayout?.payout || null,
      relatedPayments,
      customerPayments,
      stripeLinks,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching transaction detail:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
