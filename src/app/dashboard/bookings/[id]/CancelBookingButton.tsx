'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setIsLoading(true);
    setError(null);
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'POST' });
    if (res.ok) {
      router.refresh();
    } else {
      const body = await res.json();
      setError(body.error || 'Failed to cancel');
      setIsLoading(false);
    }
  }

  return (
    <div className="mt-4">
      {error && <p className="text-sm text-destructive mb-2">{error}</p>}
      <Button variant="destructive" onClick={handleCancel} disabled={isLoading}>
        {isLoading ? 'Cancelling…' : 'Cancel Booking'}
      </Button>
    </div>
  );
}
