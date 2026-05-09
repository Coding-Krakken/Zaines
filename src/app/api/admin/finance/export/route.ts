import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getFinanceTransactions } from '@/lib/api/admin-finance';

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role;
    if (!role || !['staff', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const payload = await getFinanceTransactions({
      startDate: parseDate(searchParams.get('startDate')),
      endDate: parseDate(searchParams.get('endDate')),
      status: searchParams.get('status') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    });

    const lines = [
      [
        'transactionId',
        'bookingNumber',
        'customerName',
        'customerEmail',
        'status',
        'amount',
        'refundAmount',
        'currency',
        'paymentMethod',
        'stripePaymentId',
        'createdAt',
        'paidAt',
        'refundedAt',
      ].join(','),
      ...payload.rows.map((row) =>
        [
          row.id,
          row.bookingNumber,
          row.customerName,
          row.customerEmail,
          row.status,
          row.amount.toFixed(2),
          row.refundAmount.toFixed(2),
          row.currency,
          row.paymentMethod,
          row.stripePaymentId ?? '',
          row.createdAt,
          row.paidAt ?? '',
          row.refundedAt ?? '',
        ]
          .map((value) => escapeCsv(String(value)))
          .join(','),
      ),
    ];

    const csv = lines.join('\n');
    const now = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=finance-transactions-${now}.csv`,
      },
    });
  } catch (error) {
    console.error('Error exporting finance transactions:', error);
    return NextResponse.json(
      { error: 'Failed to export finance transactions' },
      { status: 500 },
    );
  }
}
