'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CheckOutPage() {
  const params = useParams<{ id?: string | string[] }>();
  const bookingIdParam = params?.id;
  const bookingId = Array.isArray(bookingIdParam)
    ? bookingIdParam[0] ?? ''
    : bookingIdParam ?? '';
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleCheckOut() {
    if (!bookingId) {
      setStatus('error');
      setErrorMessage('Booking ID is missing. Please return to bookings and try again.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/admin/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setStatus('error');
        setErrorMessage(data.error ?? 'Check-out failed');
        return;
      }

      setStatus('success');
      setTimeout(() => router.push('/admin'), 2000);
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please try again.');
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Confirm Check-Out</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Booking ID: <span className="font-mono text-foreground">{bookingId || '—'}</span>
          </p>

          {status === 'success' && (
            <div className="rounded-md bg-green-50 p-4 text-green-800 text-sm">
              ✅ Guest successfully checked out.{' '}
              <Link href="/admin" className="font-medium underline">
                Back to dashboard
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-md bg-red-50 p-4 text-red-800 text-sm">
              ❌ {errorMessage}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleCheckOut}
              disabled={status === 'loading' || status === 'success'}
            >
              {status === 'loading' ? 'Checking out…' : 'Confirm Check-Out'}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin">Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
