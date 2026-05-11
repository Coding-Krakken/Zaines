import { NextRequest, NextResponse } from 'next/server';
import {
  getDefaultFinanceRange,
  getFinanceRevenueRecognitionSummary,
} from '@/lib/api/admin-finance';
import { requireFinanceAccess } from '@/lib/api/admin-finance-auth';

function parseDate(value: string | null, boundary: 'start' | 'end'): Date | undefined {
  if (!value) return undefined;

  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const parsed = dateOnly
    ? new Date(`${value}T${boundary === 'start' ? '00:00:00.000' : '23:59:59.999'}Z`)
    : new Date(value);

  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    const access = await requireFinanceAccess('read');
    if (access.response) return access.response;

    const { searchParams } = new URL(request.url);
    const defaults = getDefaultFinanceRange();
    const startDate = parseDate(searchParams.get('startDate'), 'start') ?? defaults.startDate;
    const endDate = parseDate(searchParams.get('endDate'), 'end') ?? defaults.endDate;

    const data = await getFinanceRevenueRecognitionSummary(startDate, endDate);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching revenue recognition summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue recognition summary' },
      { status: 500 },
    );
  }
}
