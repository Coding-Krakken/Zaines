'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ExternalLink } from 'lucide-react';
import type { FinanceReconciliationResponse } from '@/types/finance';
import { getStripeReconciliationReportUrl } from '@/lib/stripe-links';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function defaultDateRange(): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  return {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
  };
}

export default function FinanceReconciliationPage() {
  const defaults = useMemo(() => defaultDateRange(), []);
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [noteByDate, setNoteByDate] = useState<Record<string, string>>({});
  const [data, setData] = useState<FinanceReconciliationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingDate, setSavingDate] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const res = await fetch(`/api/admin/finance/reconciliation?${params}`, { cache: 'no-store' });
      const payload = (await res.json()) as {
        success?: boolean;
        data?: FinanceReconciliationResponse;
        error?: string;
      };

      if (!res.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed loading reconciliation data');
      }

      setData(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed loading reconciliation data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function markReconciled(bucketDate: string) {
    setSavingDate(bucketDate);
    setError('');
    try {
      const res = await fetch('/api/admin/finance/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucketDate,
          note: noteByDate[bucketDate] ?? '',
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? 'Failed to mark reconciliation');
      }
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to mark reconciliation');
    } finally {
      setSavingDate(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Payout Reconciliation</h1>
          <p className="text-sm text-muted-foreground">
            Reconcile daily payout buckets and record immutable audit events.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a
              href={getStripeReconciliationReportUrl('payout')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              Stripe Sigma Report
            </a>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/finance">Back to Finance</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Range</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <Button onClick={() => void loadData()} disabled={loading}>Apply</Button>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}

      {!loading && data && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Succeeded</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{formatCurrency(data.totals.succeededAmount)}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Refunded</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{formatCurrency(data.totals.refundedAmount)}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Net</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{formatCurrency(data.totals.netAmount)}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Transactions</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{data.totals.transactionCount}</CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Daily Buckets</CardTitle>
              <CardDescription>
                Mark each day as reconciled after matching with Stripe payouts. Use the Sigma report above for detailed payout matching.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.buckets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No buckets found for this range.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Succeeded</TableHead>
                        <TableHead>Refunded</TableHead>
                        <TableHead>Net</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.buckets.map((bucket) => (
                        <TableRow key={bucket.date}>
                          <TableCell>{bucket.date}</TableCell>
                          <TableCell>{formatCurrency(bucket.succeededAmount)}</TableCell>
                          <TableCell>{formatCurrency(bucket.refundedAmount)}</TableCell>
                          <TableCell>{formatCurrency(bucket.netAmount)}</TableCell>
                          <TableCell>
                            <Badge variant={bucket.status === 'reconciled' ? 'default' : 'secondary'}>
                              {bucket.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={noteByDate[bucket.date] ?? ''}
                              onChange={(e) =>
                                setNoteByDate((current) => ({ ...current, [bucket.date]: e.target.value }))
                              }
                              placeholder="Optional note"
                              className="min-w-48"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={bucket.status === 'reconciled' ? 'outline' : 'default'}
                              disabled={savingDate === bucket.date || bucket.status === 'reconciled'}
                              onClick={() => void markReconciled(bucket.date)}
                            >
                              {bucket.status === 'reconciled' ? 'Reconciled' : 'Mark Reconciled'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
