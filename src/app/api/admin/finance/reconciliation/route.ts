import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  appendFinanceAuditEvent,
  getDefaultFinanceRange,
  getFinanceReconciliation,
} from '@/lib/api/admin-finance';

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
    const defaults = getDefaultFinanceRange();
    const startDate = parseDate(searchParams.get('startDate')) ?? defaults.startDate;
    const endDate = parseDate(searchParams.get('endDate')) ?? defaults.endDate;

    const data = await getFinanceReconciliation(startDate, endDate);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching reconciliation data:', error);
    return NextResponse.json({ error: 'Failed to fetch reconciliation data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { role?: string; name?: string }).role;
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as { bucketDate?: string; note?: string };
    if (!body.bucketDate) {
      return NextResponse.json({ error: 'bucketDate is required' }, { status: 400 });
    }

    await appendFinanceAuditEvent({
      actorUserId: session.user.id,
      actorName: (session.user as { name?: string }).name ?? 'Admin',
      eventType: 'PAYOUT_RECONCILED',
      note: body.note ?? 'Marked as reconciled in admin finance workspace.',
      payload: {
        bucketDate: body.bucketDate,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking reconciliation:', error);
    return NextResponse.json({ error: 'Failed to mark reconciliation' }, { status: 500 });
  }
}
