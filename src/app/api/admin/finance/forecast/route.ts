import { NextRequest, NextResponse } from 'next/server';
import { requireFinanceAccess } from '@/lib/api/admin-finance-auth';
import { getFinanceCashForecast } from '@/lib/api/admin-finance';

export async function GET(request: NextRequest) {
  try {
    const access = await requireFinanceAccess('read');
    if (access.response) return access.response;

    const { searchParams } = new URL(request.url);
    const daysValue = Number.parseInt(searchParams.get('days') ?? '30', 10);
    const days = Number.isFinite(daysValue) ? Math.min(Math.max(daysValue, 1), 90) : 30;

    const data = await getFinanceCashForecast(days);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching finance forecast:', error);
    return NextResponse.json({ error: 'Failed to fetch finance forecast' }, { status: 500 });
  }
}
