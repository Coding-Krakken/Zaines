import { NextRequest, NextResponse } from 'next/server';
import { requireFinanceAccess } from '@/lib/api/admin-finance-auth';
import { getFinanceAlerts } from '@/lib/api/admin-finance';

export async function GET(_request: NextRequest) {
  try {
    const access = await requireFinanceAccess('read');
    if (access.response) return access.response;

    const data = await getFinanceAlerts();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching finance alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch finance alerts' }, { status: 500 });
  }
}
