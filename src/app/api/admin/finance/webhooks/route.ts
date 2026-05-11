import { NextResponse } from 'next/server';
import { requireFinanceAccess } from '@/lib/api/admin-finance-auth';
import { getFinanceWebhookHealth } from '@/lib/api/admin-finance';

export async function GET() {
  try {
    const access = await requireFinanceAccess('read');
    if (access.response) return access.response;

    const data = await getFinanceWebhookHealth();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching finance webhook health:', error);
    return NextResponse.json(
      { error: 'Failed to fetch finance webhook health' },
      { status: 500 },
    );
  }
}
