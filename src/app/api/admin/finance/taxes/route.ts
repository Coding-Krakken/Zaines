import { NextRequest, NextResponse } from 'next/server';
import { getDefaultFinanceRange, getFinanceTaxSummary } from '@/lib/api/admin-finance';
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

    const data = await getFinanceTaxSummary(startDate, endDate);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching tax summary:', error);
    return NextResponse.json({ error: 'Failed to fetch tax summary' }, { status: 500 });
  }
}
