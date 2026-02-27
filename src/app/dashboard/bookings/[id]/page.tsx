import { auth } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { redirect } from 'next/navigation';

type Props = { params: { id: string } };

type BookingDetailPrisma = {
  booking: {
    findUnique: (args: {
      where: { id: string };
      include: { suite: boolean; bookingPets: { include: { pet: boolean } }; payments: boolean };
    }) => Promise<{
      userId: string;
      bookingNumber: string;
      checkInDate: Date;
      checkOutDate: Date;
      total: number;
      status: string;
      suite?: { name?: string; tier?: string } | null;
      bookingPets: Array<{ id: string; pet?: { name?: string } | null }>;
      payments: Array<{ id: string; status: string; amount: number }>;
    } | null>;
  };
};

const bookingDetailPrisma = prisma as unknown as BookingDetailPrisma;

export default async function BookingDetail({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) return redirect('/auth/signin');

  if (!isDatabaseConfigured()) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold">Booking</h1>
        <p className="mt-4 text-muted-foreground">Database not configured.</p>
      </div>
    );
  }

  const booking = await bookingDetailPrisma.booking.findUnique({
    where: { id: params.id },
    include: { suite: true, bookingPets: { include: { pet: true } }, payments: true },
  });

  if (!booking || booking.userId !== session.user.id) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold">Booking</h1>
        <p className="mt-4 text-muted-foreground">Booking not found or access denied.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold">Booking {booking.bookingNumber}</h1>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border rounded">
          <h2 className="font-medium">Suite</h2>
          <p className="text-sm">{booking.suite?.name} ({booking.suite?.tier})</p>
          <h3 className="mt-3 font-medium">Dates</h3>
          <p className="text-sm">{new Date(booking.checkInDate).toLocaleString()} → {new Date(booking.checkOutDate).toLocaleString()}</p>
          <h3 className="mt-3 font-medium">Pets</h3>
          <ul className="text-sm list-disc pl-5">
            {booking.bookingPets.map((bp: { id: string; pet?: { name?: string } | null }) => (
              <li key={bp.id}>{bp.pet?.name || 'Pet'}</li>
            ))}
          </ul>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-medium">Payment</h2>
          <p className="text-sm">Total: ${booking.total}</p>
          <p className="text-sm">Status: {booking.status}</p>
          <h3 className="mt-3 font-medium">Payments</h3>
          <ul className="text-sm list-disc pl-5">
            {booking.payments.map((pay: { id: string; status: string; amount: number }) => (
              <li key={pay.id}>{pay.status} — ${pay.amount}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
