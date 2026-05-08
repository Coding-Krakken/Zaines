import { auth } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function statusBadgeVariant(
  status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
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

type BookingWithRelations = {
  id: string;
  bookingNumber: string;
  checkInDate: Date;
  checkOutDate: Date;
  status: string;
  user: { name: string | null; email: string | null } | null;
  suite: { name: string } | null;
  bookingPets: Array<{
    pet: { name: string; breed: string } | null;
  }>;
};

export default async function AdminDashboardPage() {
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
      <div>
        <h1 className="text-2xl font-semibold mb-4">Staff Dashboard</h1>
        <p className="text-muted-foreground">
          Database is not configured. Dashboard data is unavailable.
        </p>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const bookings: BookingWithRelations[] = await prisma.booking.findMany({
    where: {
      OR: [
        { checkInDate: { gte: today, lt: tomorrow } },
        { checkOutDate: { gte: today, lt: tomorrow } },
        { status: 'checked_in' },
      ],
    },
    include: {
      user: { select: { name: true, email: true } },
      suite: { select: { name: true } },
      bookingPets: { include: { pet: { select: { name: true, breed: true } } } },
    },
    orderBy: { checkInDate: 'asc' },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">
        Today&apos;s Bookings —{' '}
        {today.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      </h1>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No bookings today.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const petNames = booking.bookingPets
              .map((bp) => bp.pet?.name)
              .filter(Boolean)
              .join(', ');

            return (
              <Card key={booking.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {booking.bookingNumber}
                    </CardTitle>
                    <Badge variant={statusBadgeVariant(booking.status)}>
                      {booking.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Guest</div>
                      <div>{booking.user?.name ?? booking.user?.email ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Suite</div>
                      <div>{booking.suite?.name ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Pets</div>
                      <div>{petNames || '—'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Dates</div>
                      <div>
                        {new Date(booking.checkInDate).toLocaleDateString()} →{' '}
                        {new Date(booking.checkOutDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    {booking.status === 'confirmed' && (
                      <Link
                        href={`/admin/check-in/${booking.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Check In →
                      </Link>
                    )}
                    {booking.status === 'checked_in' && (
                      <>
                        <Link
                          href={`/admin/activities?bookingId=${booking.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Log Activity →
                        </Link>
                        <Link
                          href={`/admin/photos?bookingId=${booking.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Upload Photo →
                        </Link>
                        <Link
                          href={`/admin/check-out/${booking.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Check Out →
                        </Link>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
