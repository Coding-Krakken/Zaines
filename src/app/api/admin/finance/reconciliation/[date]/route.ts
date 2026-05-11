import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireFinanceAccess } from '@/lib/api/admin-finance-auth';

/**
 * GET /api/admin/finance/reconciliation/[date]
 * 
 * Fetch all payments for a specific date for reconciliation detail view.
 * Returns payments with booking and Stripe details for payout matching.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const access = await requireFinanceAccess('read');
    if (!access.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date } = params;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Parse date boundaries (UTC)
    const startDate = new Date(`${date}T00:00:00.000Z`);
    const endDate = new Date(`${date}T23:59:59.999Z`);

    // Fetch all payments for this date
    const payments = await prisma.payment.findMany({
      where: {
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            customer: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        stripeBalances: {
          include: {
            payout: {
              select: {
                id: true,
                stripePayoutId: true,
                amount: true,
                status: true,
                arrivedAt: true,
              },
            },
          },
        },
      },
      orderBy: {
        paidAt: 'asc',
      },
    });

    // Enrich payment data
    const enrichedPayments = payments.map((payment) => {
      const customerName = payment.booking?.customer
        ? `${payment.booking.customer.firstName ?? ''} ${payment.booking.customer.lastName ?? ''}`.trim()
        : 'Unknown';
      
      const payout = payment.stripeBalances?.[0]?.payout;

      return {
        id: payment.id,
        stripePaymentId: payment.stripePaymentId,
        stripeChargeId: payment.stripeChargeId,
        amount: payment.amount,
        status: payment.status,
        cardBrand: payment.cardBrand,
        cardLastFour: payment.cardLastFour,
        stripeFeeAmount: payment.stripeFeeAmount,
        refundAmount: payment.refundAmount,
        paidAt: payment.paidAt,
        bookingNumber: payment.booking?.bookingNumber ?? 'N/A',
        customerName,
        customerEmail: payment.booking?.customer?.email ?? 'N/A',
        payout: payout
          ? {
              id: payout.id,
              stripePayoutId: payout.stripePayoutId,
              amount: payout.amount,
              status: payout.status,
              arrivedAt: payout.arrivedAt,
            }
          : null,
      };
    });

    // Calculate totals for this date
    const totals = {
      count: enrichedPayments.length,
      totalAmount: enrichedPayments.reduce((sum, p) => sum + p.amount, 0),
      totalFees: enrichedPayments.reduce((sum, p) => sum + (p.stripeFeeAmount ?? 0), 0),
      totalRefunded: enrichedPayments.reduce((sum, p) => sum + (p.refundAmount ?? 0), 0),
      matchedToPayoutCount: enrichedPayments.filter((p) => p.payout !== null).length,
    };

    const response = {
      date,
      payments: enrichedPayments,
      totals,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error fetching reconciliation detail:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
