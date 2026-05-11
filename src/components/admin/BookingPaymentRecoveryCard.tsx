'use client';

import { useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SetupResponse = {
  paymentMode: 'payment_element' | 'embedded_checkout';
  clientSecret: string;
  reused: boolean;
  paymentId: string;
};

type SendLinkResponse = {
  success: boolean;
  recoveryUrl: string;
  notification: {
    sent: boolean;
    provider: string;
    detail?: unknown;
  };
  messageId: string;
};

export function BookingPaymentRecoveryCard({ bookingId }: { bookingId: string }) {
  const [flow, setFlow] = useState<'payment_element' | 'embedded_checkout'>(
    'payment_element',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [error, setError] = useState('');
  const [sendError, setSendError] = useState('');
  const [result, setResult] = useState<SetupResponse | null>(null);
  const [sendResult, setSendResult] = useState<SendLinkResponse | null>(null);

  const handleSetup = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/payments/setup-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          preferredFlow: flow,
        }),
      });

      const payload = (await res.json().catch(() => ({}))) as
        | SetupResponse
        | { error?: string; message?: string };

      if (!res.ok || !('clientSecret' in payload)) {
        throw new Error(
          ('error' in payload && payload.error) ||
            ('message' in payload && payload.message) ||
            'Failed to initialize payment setup',
        );
      }

      setResult(payload);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Failed to initialize payment setup');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendRecoveryLink = async () => {
    setIsSendingLink(true);
    setSendError('');

    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/payment-recovery-link`, {
        method: 'POST',
      });

      const payload = (await res.json().catch(() => ({}))) as
        | SendLinkResponse
        | { error?: string; message?: string };

      if (!res.ok || !('success' in payload) || !payload.success) {
        throw new Error(
          ('error' in payload && payload.error) ||
            ('message' in payload && payload.message) ||
            'Failed to send payment recovery link',
        );
      }

      setSendResult(payload);
    } catch (err) {
      setSendResult(null);
      setSendError(err instanceof Error ? err.message : 'Failed to send payment recovery link');
    } finally {
      setIsSendingLink(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Recovery</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Reinitialize a Stripe payment session for this booking when checkout has expired or failed.
        </p>

        <div className="grid gap-2 sm:max-w-xs">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Preferred Flow</p>
          <Select value={flow} onValueChange={(value) => setFlow(value as typeof flow)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="payment_element">Payment Element</SelectItem>
              <SelectItem value="embedded_checkout">Embedded Checkout</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => void handleSetup()} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting Up Payment...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Setup Payment Session
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={() => void handleSendRecoveryLink()}
          disabled={isSendingLink}
        >
          {isSendingLink ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Link...
            </>
          ) : (
            'Send Recovery Link To Customer'
          )}
        </Button>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {sendError ? <p className="text-sm text-destructive">{sendError}</p> : null}

        {result ? (
          <div className="rounded-md border p-3 text-sm">
            <p>
              <span className="font-medium">Mode:</span>{' '}
              {result.paymentMode.replace('_', ' ')}
            </p>
            <p>
              <span className="font-medium">Session:</span>{' '}
              {result.reused ? 'Reused existing session' : 'Created new session'}
            </p>
            <p className="text-muted-foreground">Payment ID: {result.paymentId}</p>
          </div>
        ) : null}

        {sendResult ? (
          <div className="rounded-md border p-3 text-sm">
            <p>
              <span className="font-medium">Delivery:</span>{' '}
              {sendResult.notification.sent
                ? `Sent via ${sendResult.notification.provider}`
                : `Queued via ${sendResult.notification.provider}`}
            </p>
            <p className="break-all text-muted-foreground">{sendResult.recoveryUrl}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
