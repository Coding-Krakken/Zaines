import { auth } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    // Redirect to sign-in page if not authenticated
    return redirect('/auth/signin');
  }

  // If DB not configured, render a helpful message
  if (!isDatabaseConfigured()) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-4 text-muted-foreground">Database is not configured. Dashboard data is unavailable in this environment.</p>
      </div>
    );
  }

  // Fetch a few items for dashboard
  const [upcomingBookings, pets] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: session.user.id, status: { in: ['pending', 'confirmed'] } },
      orderBy: { checkInDate: 'asc' },
      take: 5,
      include: { suite: true, bookingPets: { include: { pet: true } } },
    }),
    prisma.pet.findMany({ where: { userId: session.user.id }, take: 6 }),
  ]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link href="/book" className="btn">Book a Stay</Link>
      </div>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-4">
          <h2 className="text-lg font-medium">Upcoming Bookings</h2>
          {upcomingBookings.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No upcoming bookings.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {upcomingBookings.map((b: { id: string; suite?: { name?: string } | null; checkInDate: Date; checkOutDate: Date; bookingNumber: string }) => (
                <li key={b.id} className="p-3 border rounded">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">{b.suite?.name || 'Suite'}</div>
                      <div className="text-sm text-muted-foreground">{new Date(b.checkInDate).toLocaleDateString()} → {new Date(b.checkOutDate).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{b.bookingNumber}</div>
                      <Link href={`/dashboard/bookings/${b.id}`} className="text-sm text-primary">View</Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-4">
          <h2 className="text-lg font-medium">My Pets</h2>
          {pets.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No pets added. Add a pet to speed up bookings.</p>
          ) : (
            <ul className="mt-3 grid grid-cols-2 gap-3">
              {pets.map((p: { id: string; name: string; breed?: string | null }) => (
                <li key={p.id} className="p-3 border rounded">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-muted-foreground">{p.breed || 'Unknown'}</div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4">
            <Link href="/dashboard/pets" className="text-sm text-primary">Manage Pets</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
