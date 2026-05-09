'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import type {
  FinanceAlertsResponse,
  FinanceCashForecastResponse,
  FinanceExceptionsResponse,
  FinanceOverviewResponse,
  FinanceTransactionStatus,
  FinanceTransactionsResponse,
} from '@/types/finance';

type FetchState = {
  loading: boolean;
  error: string;
};

const STATUS_OPTIONS: Array<{ label: string; value: 'all' | FinanceTransactionStatus }> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Succeeded', value: 'succeeded' },
  { label: 'Failed', value: 'failed' },
  { label: 'Refunded', value: 'refunded' },
  { label: 'Cancelled', value: 'cancelled' },
];

function statusBadgeVariant(status: FinanceTransactionStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'succeeded':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'failed':
      return 'destructive';
    case 'refunded':
      return 'outline';
    case 'cancelled':
      return 'outline';
    default:
      return 'outline';
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function formatShortDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

function severityBadgeVariant(severity: 'info' | 'warning' | 'critical'): 'default' | 'secondary' | 'destructive' {
  switch (severity) {
    case 'critical':
      return 'destructive';
    case 'warning':
      return 'secondary';
    case 'info':
    default:
      return 'default';
  }
}

function defaultDateRange(): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  return {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
  };
}

export default function AdminFinancePage() {
  const defaults = useMemo(() => defaultDateRange(), []);
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | FinanceTransactionStatus>('all');

  const [overview, setOverview] = useState<FinanceOverviewResponse | null>(null);
  const [transactions, setTransactions] = useState<FinanceTransactionsResponse | null>(null);
  const [alerts, setAlerts] = useState<FinanceAlertsResponse | null>(null);
  const [exceptions, setExceptions] = useState<FinanceExceptionsResponse | null>(null);
  const [forecast, setForecast] = useState<FinanceCashForecastResponse | null>(null);
  const [state, setState] = useState<FetchState>({ loading: true, error: '' });

  async function loadData() {
    setState({ loading: true, error: '' });

    try {
      const params = new URLSearchParams({ startDate, endDate });
      const txParams = new URLSearchParams({
        startDate,
        endDate,
        ...(status !== 'all' ? { status } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      });

      const [overviewRes, txRes, alertsRes, exceptionsRes, forecastRes] = await Promise.all([
        fetch(`/api/admin/finance/overview?${params}`, { cache: 'no-store' }),
        fetch(`/api/admin/finance/transactions?${txParams}`, { cache: 'no-store' }),
        fetch('/api/admin/finance/alerts', { cache: 'no-store' }),
        fetch('/api/admin/finance/exceptions', { cache: 'no-store' }),
        fetch('/api/admin/finance/forecast?days=30', { cache: 'no-store' }),
      ]);

      const overviewJson = (await overviewRes.json()) as {
        success?: boolean;
        data?: FinanceOverviewResponse;
        error?: string;
      };
      const txJson = (await txRes.json()) as {
        success?: boolean;
        data?: FinanceTransactionsResponse;
        error?: string;
      };
      const alertsJson = (await alertsRes.json()) as {
        success?: boolean;
        data?: FinanceAlertsResponse;
        error?: string;
      };
      const exceptionsJson = (await exceptionsRes.json()) as {
        success?: boolean;
        data?: FinanceExceptionsResponse;
        error?: string;
      };
      const forecastJson = (await forecastRes.json()) as {
        success?: boolean;
        data?: FinanceCashForecastResponse;
        error?: string;
      };

      if (!overviewRes.ok || !overviewJson.data) {
        throw new Error(overviewJson.error ?? 'Failed loading finance overview');
      }

      if (!txRes.ok || !txJson.data) {
        throw new Error(txJson.error ?? 'Failed loading finance transactions');
      }

      if (!alertsRes.ok || !alertsJson.data) {
        throw new Error(alertsJson.error ?? 'Failed loading finance alerts');
      }

      if (!exceptionsRes.ok || !exceptionsJson.data) {
        throw new Error(exceptionsJson.error ?? 'Failed loading finance exceptions');
      }

      if (!forecastRes.ok || !forecastJson.data) {
        throw new Error(forecastJson.error ?? 'Failed loading finance forecast');
      }

      setOverview(overviewJson.data);
      setTransactions(txJson.data);
      setAlerts(alertsJson.data);
      setExceptions(exceptionsJson.data);
      setForecast(forecastJson.data);
      setState({ loading: false, error: '' });
    } catch (error) {
      setOverview(null);
      setTransactions(null);
      setAlerts(null);
      setExceptions(null);
      setForecast(null);
      setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed loading finance data',
      });
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const exportHref = useMemo(() => {
    const params = new URLSearchParams({
      startDate,
      endDate,
      ...(status !== 'all' ? { status } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
    });
    return `/api/admin/finance/export?${params}`;
  }, [endDate, search, startDate, status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Finance</h1>
          <p className="text-sm text-muted-foreground">
            View revenue, refunds, taxes, and transaction-level accounting activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={state.loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" asChild>
            <a href={exportHref}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Refund Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <Button size="sm" asChild>
              <Link href="/admin/finance/refunds">Open Refund Console</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Payout Reconciliation</CardTitle>
          </CardHeader>
          <CardContent>
            <Button size="sm" asChild>
              <Link href="/admin/finance/reconciliation">Open Reconciliation</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tax Liability</CardTitle>
          </CardHeader>
          <CardContent>
            <Button size="sm" asChild>
              <Link href="/admin/finance/taxes">Open Tax Summary</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Start Date</p>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">End Date</p>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Status</p>
            <Select value={status} onValueChange={(value) => setStatus(value as 'all' | FinanceTransactionStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 lg:col-span-2">
            <p className="text-xs text-muted-foreground">Search</p>
            <Input
              placeholder="Booking, customer, or Stripe ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="lg:col-span-5">
            <Button onClick={() => void loadData()} disabled={state.loading}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {state.loading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {state.error && <p className="text-sm text-red-700">{state.error}</p>}

      {!state.loading && !state.error && overview && transactions && alerts && exceptions && forecast && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Owner Command Center</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium">Actionable Alerts</p>
                  <p className="text-xs text-muted-foreground">{alerts.alerts.length} active</p>
                </div>
                {alerts.alerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active owner alerts right now.</p>
                ) : (
                  <div className="space-y-2">
                    {alerts.alerts.map((alert) => (
                      <div key={alert.id} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <Badge variant={severityBadgeVariant(alert.severity)}>{alert.severity}</Badge>
                            <p className="font-medium">{alert.title}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.description}</p>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={alert.actionHref}>{alert.actionLabel}</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">30-Day Expected Cash In</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-semibold">{formatCurrency(forecast.totals.expectedCashIn)}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Projected Refunds</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-semibold">{formatCurrency(forecast.totals.expectedRefunds)}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Expected Net Cash</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-semibold">{formatCurrency(forecast.totals.expectedNet)}</CardContent>
                </Card>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium">Exception Queue</p>
                  <p className="text-xs text-muted-foreground">{exceptions.totalExceptions} total</p>
                </div>
                {exceptions.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No exceptions in the queue.</p>
                ) : (
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Booking</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Age</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {exceptions.items.slice(0, 8).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="capitalize">{item.type.replaceAll('_', ' ')}</TableCell>
                            <TableCell>{item.bookingNumber}</TableCell>
                            <TableCell>
                              <p>{item.customerName}</p>
                              <p className="text-xs text-muted-foreground">{item.customerEmail}</p>
                            </TableCell>
                            <TableCell>{formatCurrency(item.amount)}</TableCell>
                            <TableCell>{item.ageDays}d</TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" asChild>
                                <Link href={item.actionHref}>Open</Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <div>
                <p className="mb-3 text-sm font-medium">7-Day Forecast Snapshot</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
                  {forecast.days.slice(0, 7).map((day) => (
                    <div key={day.date} className="rounded-md border p-2">
                      <p className="text-xs text-muted-foreground">{formatShortDate(day.date)}</p>
                      <p className="text-sm font-medium">{formatCurrency(day.expectedNet)}</p>
                      <p className="text-xs text-muted-foreground">{day.bookingCount} booking(s)</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Gross Revenue</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{formatCurrency(overview.totals.grossRevenue)}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Refunds</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{formatCurrency(overview.totals.refunds)}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Net Revenue</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{formatCurrency(overview.totals.netRevenue)}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tax Collected</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{formatCurrency(overview.totals.taxesCollected)}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pending Balance</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{formatCurrency(overview.totals.outstandingPending)}</CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transaction Status Mix</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {overview.byStatus.map((item) => (
                <div key={item.status} className="rounded-md border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.status}</p>
                  <p className="text-lg font-semibold">{item.count}</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(item.amount)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Transactions ({transactions.summary.filteredTransactions}/{transactions.summary.totalTransactions})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No transactions found for this filter set.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Refund</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.rows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <p className="font-medium">{row.bookingNumber}</p>
                            <p className="text-xs text-muted-foreground">{row.stripePaymentId ?? 'no processor id'}</p>
                          </TableCell>
                          <TableCell>
                            <p>{row.customerName}</p>
                            <p className="text-xs text-muted-foreground">{row.customerEmail}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadgeVariant(row.status)}>{row.status}</Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(row.amount)}</TableCell>
                          <TableCell>{formatCurrency(row.refundAmount)}</TableCell>
                          <TableCell className="capitalize">{row.paymentMethod.replace('_', ' ')}</TableCell>
                          <TableCell>{formatDate(row.createdAt)}</TableCell>
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
