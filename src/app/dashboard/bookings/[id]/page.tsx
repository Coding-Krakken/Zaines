import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CancelBookingButton } from "./CancelBookingButton";
import BookingDetailClient from "./BookingDetailClient";

type Props = { params: { id: string } };

type BookingDetailPrisma = {
  booking: {
    findUnique: (args: {
      where: { id: string };
      include: {
        suite: boolean;
        bookingPets: { include: { pet: boolean } };
        payments: boolean;
      };
    }) => Promise<{
      id: string;
      userId: string;
      bookingNumber: string;
      checkInDate: Date;
      checkOutDate: Date;
      total: number;
      status: string;
      createdAt: Date;
      suite?: { name?: string; tier?: string } | null;
      bookingPets: Array<{ id: string; pet?: { name?: string } | null }>;
      payments: Array<{ id: string; status: string; amount: number }>;
    } | null>;
  };
};

const bookingDetailPrisma = prisma as unknown as BookingDetailPrisma;

export default async function BookingDetail({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) return redirect("/auth/signin");

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
    include: {
      suite: true,
      bookingPets: { include: { pet: true } },
      payments: true,
    },
  });

  if (!booking || booking.userId !== session.user.id) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold">Booking</h1>
        <p className="mt-4 text-muted-foreground">
          Booking not found or access denied.
        </p>
      </div>
    );
  }

  const canCancel =
    booking.status === "pending" || booking.status === "confirmed";

  return (
    <BookingDetailClient 
      booking={booking}
      canCancel={canCancel}
      CancelButton={CancelBookingButton}
    />
  );
}
