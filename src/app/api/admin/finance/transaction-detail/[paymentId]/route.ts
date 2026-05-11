import { NextRequest, NextResponse } from 'next/server';
import { requireFinanceAccess } from '@/lib/api/admin-finance-auth';
import { prisma } from '@/lib/prisma';
import {
  getStripeChargeUrl,
  getStripePaymentIntentUrl,
  getStripeRefundUrl,
  getStripePayoutUrl,
  getStripeCustomerUrl,
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
  { params }: { params: { paymentId: string } }
) {
  try {
    // Require finance read access
    const access = await requireFinanceAccess('read');
    if (!access.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentId } = params;

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
            customer: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                stripeCustomerId: true,
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
                status: true,
                signedAt: true,
                participantName: true,
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
    const customerPayments = payment.booking?.customer?.id
      ? await prisma.payment.findMany({
          where: {
            booking: {
              customerId: payment.booking.customer.id,
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
      } catch (e) {
        console.warn('Invalid charge ID:', payment.stripeChargeId);
      }
    }

    if (payment.stripePaymentId) {
      try {
        stripeLinks.paymentIntent = getStripePaymentIntentUrl(payment.stripePaymentId);
      } catch (e) {
        console.warn('Invalid payment intent ID:', payment.stripePaymentId);
      }
    }

    if (payment.stripeBalanceTransactionId) {
      try {
        stripeLinks.balanceTransaction = getStripeBalanceTransactionUrl(
          payment.stripeBalanceTransactionId
        );
      } catch (e) {
        console.warn('Invalid balance transaction ID:', payment.stripeBalanceTransactionId);
      }
    }

    if (payment.booking?.customer?.stripeCustomerId) {
      try {
        stripeLinks.customer = getStripeCustomerUrl(
          payment.booking.customer.stripeCustomerId
        );
      } catch (e) {
        console.warn('Invalid customer ID:', payment.booking.customer.stripeCustomerId);
      }
    }

    // Add payout link if payment is matched to a payout
    const matchedPayout = payment.stripeBalances?.find((b) => b.payout);
    if (matchedPayout?.payout?.stripePayoutId) {
      try {
        stripeLinks.payout = getStripePayoutUrl(matchedPayout.payout.stripePayoutId);
      } catch (e) {
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
            startTime: payment.booking.startTime,
            endTime: payment.booking.endTime,
            totalAmount: payment.booking.totalAmount,
            depositAmount: payment.booking.depositAmount,
            suite: payment.booking.suite,
            waivers: payment.booking.waivers,
          }
        : null,
      customer: payment.booking?.customer || null,
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
