import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getFinanceAuditEvents } from '@/lib/api/admin-finance';

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
