import { NextRequest, NextResponse } from 'next/server';
import { getFinanceAuditEvents } from '@/lib/api/admin-finance';
import { requireFinanceAccess } from '@/lib/api/admin-finance-auth';

export async function GET(request: NextRequest) {
  try {
    const access = await requireFinanceAccess('read');
    if (access.response) return access.response;

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId') ?? undefined;
    const limit = Number.parseInt(searchParams.get('limit') ?? '100', 10);

    const data = await getFinanceAuditEvents({
      bookingId,
      limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 300) : 100,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching finance audit events:', error);
    return NextResponse.json({ error: 'Failed to fetch finance audit events' }, { status: 500 });
  }
}
