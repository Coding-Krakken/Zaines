import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDefaultFinanceRange, getFinanceOverview } from '@/lib/api/admin-finance';

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

    const data = await getFinanceOverview(startDate, endDate);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching finance overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch finance overview' },
      { status: 500 },
    );
  }
}
