import { NextRequest, NextResponse } from 'next/server';
import { getFinanceTransactions } from '@/lib/api/admin-finance';
import { requireFinanceAccess } from '@/lib/api/admin-finance-auth';

function parseDate(value: string | null, boundary: 'start' | 'end'): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  if (boundary === 'start') {
    parsed.setHours(0, 0, 0, 0);
  } else {
    parsed.setHours(23, 59, 59, 999);
  }
  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    const access = await requireFinanceAccess('read');
    if (access.response) return access.response;

    const { searchParams } = new URL(request.url);
    const data = await getFinanceTransactions({
      startDate: parseDate(searchParams.get('startDate'), 'start'),
      endDate: parseDate(searchParams.get('endDate'), 'end'),
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
