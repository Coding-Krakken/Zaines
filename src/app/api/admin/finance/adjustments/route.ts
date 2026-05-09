import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { appendFinanceAuditEvent } from '@/lib/api/admin-finance';
import { requireFinanceAccess } from '@/lib/api/admin-finance-auth';
import type { FinanceAdjustmentRequest } from '@/types/finance';

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireFinanceAccess('write');
    if (access.response) return access.response;
    const session = access.session;

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const body = (await request.json()) as FinanceAdjustmentRequest;
    if (!body.bookingId || !body.reason || !body.amount || body.amount === 0) {
      return NextResponse.json({ error: 'Invalid adjustment request' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: body.bookingId },
      include: {
        user: {
          select: { id: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const amount = roundCurrency(body.amount);

    const credit = await prisma.credit.create({
      data: {
        userId: booking.user.id,
        amount,
        balance: amount,
        type: 'refund',
        description: `Manual finance adjustment for booking ${booking.bookingNumber}: ${body.reason}`,
      },
    });

    await appendFinanceAuditEvent({
      bookingId: booking.id,
      actorUserId: session.user.id,
      actorName: session.user.name ?? 'Admin',
      eventType: 'MANUAL_ADJUSTMENT_APPLIED',
      note: body.reason,
      payload: {
        creditId: credit.id,
        amount,
        bookingNumber: booking.bookingNumber,
      },
    });

    return NextResponse.json({ success: true, data: credit });
  } catch (error) {
    console.error('Error applying adjustment:', error);
    return NextResponse.json({ error: 'Failed to apply adjustment' }, { status: 500 });
  }
}
