import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getFinanceTransactions } from '@/lib/api/admin-finance';

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
    const data = await getFinanceTransactions({
      startDate: parseDate(searchParams.get('startDate')),
      endDate: parseDate(searchParams.get('endDate')),
      status: searchParams.get('status') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching finance transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch finance transactions' },
      { status: 500 },
    );
  }
}
