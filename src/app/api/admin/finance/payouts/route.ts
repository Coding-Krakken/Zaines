import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireFinanceAccess } from '@/lib/api/admin-finance-auth';

export async function GET(request: NextRequest) {
  try {
    const access = await requireFinanceAccess('read');
    if (access.response) {
      return access.response;
    }

    // Fetch all payouts with their balance transactions
    const payouts = await prisma.stripePayout.findMany({
      include: {
        balanceTransactions: {
          select: {
            id: true,
            amount: true,
            stripeFee: true,
            net: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Enrich each payout with transaction counts and totals
    const enrichedPayouts = payouts.map((payout) => {
      const transactionCount = payout.balanceTransactions.length;
      const totalCharged = payout.balanceTransactions
        .filter((tx) => tx.type === 'charge')
        .reduce((sum, tx) => sum + tx.amount, 0);
      const totalFees = payout.balanceTransactions.reduce((sum, tx) => sum + tx.stripeFee, 0);
      const totalNet = payout.balanceTransactions.reduce((sum, tx) => sum + tx.net, 0);

      return {
        id: payout.id,
        stripePayoutId: payout.stripePayoutId,
        amount: payout.amount,
        currency: payout.currency,
        status: payout.status,
        arrivedAt: payout.arrivedAt,
        reconciledAt: payout.reconciledAt,
        reconciledByUserId: payout.reconciledByUserId,
        createdAt: payout.createdAt,
        transactionCount,
        totalCharged,
        totalFees,
        totalNet,
      };
    });

    // Calculate totals
    const totals = {
      totalPayouts: enrichedPayouts.length,
      totalAmount: enrichedPayouts.reduce((sum, p) => sum + p.amount, 0),
      reconciledCount: enrichedPayouts.filter((p) => p.reconciledAt !== null).length,
      pendingCount: enrichedPayouts.filter((p) => p.reconciledAt === null).length,
    };

    const response = {
      payouts: enrichedPayouts,
      totals,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
