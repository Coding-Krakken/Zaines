import { NextRequest, NextResponse } from 'next/server';
import { getDefaultFinanceRange, getFinanceTaxSummary } from '@/lib/api/admin-finance';
import { requireFinanceAccess } from '@/lib/api/admin-finance-auth';

function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: NextRequest) {
  try {
    const access = await requireFinanceAccess('read');
    if (access.response) return access.response;

    const { searchParams } = new URL(request.url);
    const defaults = getDefaultFinanceRange();
    const startDate = parseDate(searchParams.get('startDate')) ?? defaults.startDate;
    const endDate = parseDate(searchParams.get('endDate')) ?? defaults.endDate;
    const summary = await getFinanceTaxSummary(startDate, endDate);

    const lines = [
      ['period', 'taxableRevenue', 'taxCollected', 'refundedTax', 'netTaxLiability'].join(','),
      ...summary.rows.map((row) =>
        [
          row.period,
          row.taxableRevenue.toFixed(2),
          row.taxCollected.toFixed(2),
          row.refundedTax.toFixed(2),
          row.netTaxLiability.toFixed(2),
        ]
          .map((value) => escapeCsv(String(value)))
          .join(','),
      ),
    ];

    const csv = lines.join('\n');
    const now = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=finance-tax-summary-${now}.csv`,
      },
    });
  } catch (error) {
    console.error('Error exporting tax summary:', error);
    return NextResponse.json({ error: 'Failed to export tax summary' }, { status: 500 });
  }
}
