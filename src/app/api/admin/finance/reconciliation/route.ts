import { NextRequest, NextResponse } from 'next/server';
import {
  appendFinanceAuditEvent,
  getDefaultFinanceRange,
  getFinanceReconciliation,
} from '@/lib/api/admin-finance';
import { requireFinanceAccess } from '@/lib/api/admin-finance-auth';

function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    const access = await requireFinanceAccess('read');
    if (access.response) return access.response;

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
    const access = await requireFinanceAccess('write');
    if (access.response) return access.response;
    const session = access.session;

    const body = (await request.json()) as { bucketDate?: string; note?: string };
    if (!body.bucketDate) {
      return NextResponse.json({ error: 'bucketDate is required' }, { status: 400 });
    }

    await appendFinanceAuditEvent({
      actorUserId: session.user.id,
      actorName: session.user.name ?? 'Admin',
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
