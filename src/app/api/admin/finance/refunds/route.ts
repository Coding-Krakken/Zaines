import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { stripe, isStripeConfigured, formatAmountForStripe } from '@/lib/stripe';
import { appendFinanceAuditEvent, getFinanceTransactions } from '@/lib/api/admin-finance';
import { requireFinanceAccess } from '@/lib/api/admin-finance-auth';
import type { FinanceRefundRequest } from '@/types/finance';

function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function GET(request: NextRequest) {
  try {
    const access = await requireFinanceAccess('read');
    if (access.response) return access.response;

    const { searchParams } = new URL(request.url);
    const data = await getFinanceTransactions({
      startDate: parseDate(searchParams.get('startDate')),
      endDate: parseDate(searchParams.get('endDate')),
      status: searchParams.get('status') ?? 'succeeded',
      search: searchParams.get('search') ?? undefined,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error loading refund queue:', error);
    return NextResponse.json({ error: 'Failed to load refund queue' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireFinanceAccess('write');
    if (access.response) return access.response;
    const session = access.session;

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const body = (await request.json()) as FinanceRefundRequest;
    if (!body.paymentId || !body.reason || !body.refundAmount || body.refundAmount <= 0) {
      return NextResponse.json({ error: 'Invalid refund request' }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: body.paymentId },
      include: {
        booking: {
          include: {
            user: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (!['succeeded', 'refunded'].includes(payment.status)) {
      return NextResponse.json({ error: 'Payment cannot be refunded from current status' }, { status: 409 });
    }

    const alreadyRefunded = payment.refundAmount ?? 0;
    const remainingRefundable = roundCurrency(payment.amount - alreadyRefunded);

    if (body.refundAmount > remainingRefundable) {
      return NextResponse.json(
        { error: `Refund exceeds remaining refundable amount (${remainingRefundable.toFixed(2)})` },
        { status: 409 },
      );
    }

    if (payment.stripePaymentId && isStripeConfigured()) {
      await stripe.refunds.create({
        payment_intent: payment.stripePaymentId,
        amount: formatAmountForStripe(body.refundAmount),
      });
    }

    const nextRefundAmount = roundCurrency(alreadyRefunded + body.refundAmount);

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        refundAmount: nextRefundAmount,
        refundedAt: new Date(),
        status: nextRefundAmount >= payment.amount ? 'refunded' : payment.status,
      },
    });

    await appendFinanceAuditEvent({
      bookingId: payment.bookingId,
      actorUserId: session.user.id,
      actorName: session.user.name ?? 'Admin',
      eventType: 'REFUND_APPLIED',
      note: body.reason,
      payload: {
        paymentId: payment.id,
        refundAmount: body.refundAmount,
        totalRefundedAmount: nextRefundAmount,
        remainingRefundable,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error applying refund:', error);
    return NextResponse.json({ error: 'Failed to apply refund' }, { status: 500 });
  }
}
