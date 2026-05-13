'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AlertCircle, CircleCheckBig, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function ClaimBookingContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { data: session, status } = useSession();

  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const claimBooking = async () => {
    if (!token) {
      setError('Missing claim token.');
      return;
    }

    setIsClaiming(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/auth/claim-booking/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const payload = (await response.json()) as {
        state?: string;
        bookingId?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to claim booking.');
      }

      setSuccess('Booking successfully linked to your account.');
      if (payload.bookingId) {
        window.setTimeout(() => {
          window.location.assign(`/dashboard/bookings/${payload.bookingId}`);
        }, 1000);
      }
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : 'Unable to claim booking.');
    } finally {
      setIsClaiming(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-12">
        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <CardTitle>Sign in to claim your booking</CardTitle>
            <CardDescription>
              Continue with your account to securely connect this reservation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(`/auth/claim-booking?token=${token}`)}`}>
                Sign In and Continue
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-12">
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Claim booking access</CardTitle>
          <CardDescription>
            Attach this reservation to your account to manage updates and booking history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {success ? (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700">
              <CircleCheckBig className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          ) : null}

          <Button onClick={() => void claimBooking()} disabled={isClaiming || !token} className="w-full">
            {isClaiming ? 'Claiming...' : 'Claim My Booking'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ClaimBookingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>}>
      <ClaimBookingContent />
    </Suspense>
  );
}
