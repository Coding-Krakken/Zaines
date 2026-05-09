'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import type { FinanceAuditEvent, FinanceTransactionsResponse } from '@/types/finance';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function FinanceRefundsPage() {
  const [search, setSearch] = useState('');
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const [amountById, setAmountById] = useState<Record<string, string>>({});
  const [data, setData] = useState<FinanceTransactionsResponse | null>(null);
  const [auditEvents, setAuditEvents] = useState<FinanceAuditEvent[]>([]);
  const [adjustBookingId, setAdjustBookingId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ status: 'succeeded' });
      if (search.trim()) {
        params.set('search', search.trim());
      }
      const res = await fetch(`/api/admin/finance/refunds?${params}`, { cache: 'no-store' });
      const payload = (await res.json()) as {
        success?: boolean;
        data?: FinanceTransactionsResponse;
        error?: string;
      };

      if (!res.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed loading refund queue');
      }

      setData(payload.data);

      const auditRes = await fetch('/api/admin/finance/audit?limit=50', { cache: 'no-store' });
      const auditPayload = (await auditRes.json()) as {
        success?: boolean;
        data?: FinanceAuditEvent[];
      };
      setAuditEvents(auditPayload.data ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed loading refund queue');
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const rows = useMemo(() => data?.rows ?? [], [data]);

  async function handleRefund(paymentId: string, paymentAmount: number) {
    const rawAmount = amountById[paymentId] ?? '';
    const refundAmount = Number.parseFloat(rawAmount);
    const reason = (reasonById[paymentId] ?? '').trim();

    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      setError('Refund amount must be greater than zero.');
      return;
    }

    if (refundAmount > paymentAmount) {
      setError('Refund amount cannot exceed payment amount.');
      return;
    }

    if (!reason) {
      setError('Refund reason is required.');
      return;
    }

    setSavingId(paymentId);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/admin/finance/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, refundAmount, reason }),
      });
      const payload = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(payload.error ?? 'Refund failed');
      }

      setMessage('Refund applied successfully.');
      setReasonById((current) => ({ ...current, [paymentId]: '' }));
      setAmountById((current) => ({ ...current, [paymentId]: '' }));
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Refund failed');
    } finally {
      setSavingId(null);
    }
  }

  async function handleAdjustment() {
    const amount = Number.parseFloat(adjustAmount);

    if (!adjustBookingId.trim()) {
      setError('Booking ID is required for manual adjustments.');
      return;
    }
    if (!Number.isFinite(amount) || amount === 0) {
      setError('Adjustment amount must be non-zero.');
      return;
    }
    if (!adjustReason.trim()) {
      setError('Adjustment reason is required.');
      return;
    }

    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/admin/finance/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: adjustBookingId.trim(),
          amount,
          reason: adjustReason.trim(),
        }),
      });
      const payload = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(payload.error ?? 'Adjustment failed');
      }

      setAdjustAmount('');
      setAdjustReason('');
      setMessage('Manual adjustment recorded successfully.');
      await loadData();
    } catch (adjustError) {
      setError(adjustError instanceof Error ? adjustError.message : 'Adjustment failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Refund Console</h1>
          <p className="text-sm text-muted-foreground">
            Process manual refunds and keep a finance audit trail for each action.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/finance">Back to Finance</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search Refund Queue</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Booking number, customer, or Stripe ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button onClick={() => void loadData()} disabled={loading}>Apply</Button>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      {!loading && data && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Eligible Transactions ({rows.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No refundable transactions found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Refund Amount</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <p className="font-medium">{row.bookingNumber}</p>
                            <p className="text-xs text-muted-foreground">{row.customerName}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant={row.status === 'succeeded' ? 'default' : 'outline'}>{row.status}</Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(row.amount)}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={amountById[row.id] ?? ''}
                              onChange={(e) =>
                                setAmountById((current) => ({ ...current, [row.id]: e.target.value }))
                              }
                              placeholder="0.00"
                              className="w-28"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Label htmlFor={`reason-${row.id}`} className="sr-only">
                                Refund reason
                              </Label>
                              <Input
                                id={`reason-${row.id}`}
                                value={reasonById[row.id] ?? ''}
                                onChange={(e) =>
                                  setReasonById((current) => ({ ...current, [row.id]: e.target.value }))
                                }
                                placeholder="Reason"
                                className="min-w-56"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              disabled={savingId === row.id}
                              onClick={() => void handleRefund(row.id, row.amount)}
                            >
                              {savingId === row.id ? 'Applying...' : 'Apply Refund'}
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

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Manual Adjustment</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-4">
              <Input
                placeholder="Booking ID"
                value={adjustBookingId}
                onChange={(e) => setAdjustBookingId(e.target.value)}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
              />
              <Input
                placeholder="Reason"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
              <Button onClick={() => void handleAdjustment()}>Apply Adjustment</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Finance Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              {auditEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No finance audit events yet.</p>
              ) : (
                <div className="space-y-2">
                  {auditEvents.map((event) => (
                    <div key={event.id} className="rounded border p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{event.eventType}</p>
                        <p className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Actor: {event.actorName} {event.bookingId ? `• Booking ${event.bookingId}` : ''}
                      </p>
                      <p className="mt-1">{event.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
