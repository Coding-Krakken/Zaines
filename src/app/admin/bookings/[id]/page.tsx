import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getAdminBooking } from '@/lib/api/admin-bookings';
import { isDatabaseConfigured } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'confirmed':
      return 'default';
    case 'checked_in':
      return 'secondary';
    case 'completed':
      return 'outline';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
}

function formatDate(dateValue: Date | string): string {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return DATE_FORMATTER.format(date);
}

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const role = (session.user as { id: string; role?: string }).role;
  if (!role || !['staff', 'admin'].includes(role)) {
    redirect('/dashboard');
  }

  if (!isDatabaseConfigured()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Booking Details</h1>
        <p className="text-muted-foreground">Database is not configured.</p>
      </div>
    );
  }

  const booking = await getAdminBooking(id);
  if (!booking) {
    notFound();
  }

  const petNames = booking.bookingPets
    .map((bookingPet) => bookingPet.pet?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Booking {booking.bookingNumber}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {formatDate(booking.checkInDate)} to {formatDate(booking.checkOutDate)}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/bookings">Back to Bookings</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Guest</p>
            <p className="font-medium">{booking.user?.name || 'Unknown'}</p>
            <p className="text-sm text-muted-foreground">{booking.user?.email || '—'}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Suite</p>
            <p className="font-medium">{booking.suite?.name || '—'}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
            <Badge variant={statusBadgeVariant(booking.status)}>
              {booking.status.replace('_', ' ')}
            </Badge>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
            <p className="font-semibold">${booking.total.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pets</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{petNames || 'No pets attached to this booking.'}</p>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        {booking.status === 'confirmed' && (
          <Button asChild>
            <Link href={`/admin/check-in/${booking.id}`}>Start Check-in</Link>
          </Button>
        )}

        {booking.status === 'checked_in' && (
          <Button asChild variant="outline">
            <Link href={`/admin/check-out/${booking.id}`}>Start Check-out</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
