import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-states";
import { CancelBookingButton } from "./CancelBookingButton";
import BookingDetailClient from "./BookingDetailClient";

type Props = { params: Promise<{ id: string }> };

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
  const { id } = await params;
  const cookieStore = await cookies();
  const e2eCustomerBypassEnabled =
    process.env.PLAYWRIGHT_TEST === "1" &&
    cookieStore.get("e2e-customer")?.value === "1";

  if (e2eCustomerBypassEnabled) {
    const now = new Date();
    const checkout = new Date(now);
    checkout.setDate(checkout.getDate() + 2);

    return (
      <BookingDetailClient
        booking={{
          id: id,
          bookingNumber: "E2E-BOOK-001",
          checkInDate: now,
          checkOutDate: checkout,
          total: 199,
          status: "confirmed",
          suite: { name: "E2E Suite", tier: "Deluxe" },
          bookingPets: [{ id: "e2e-bp-1", pet: { name: "E2E Pet" } }],
          payments: [{ id: "e2e-pay-1", status: "succeeded", amount: 199 }],
        }}
        canCancel
        CancelButton={CancelBookingButton}
      />
    );
  }

  const session = await auth();
  if (!session?.user?.id) return redirect("/auth/signin");

  if (!isDatabaseConfigured()) {
    return (
      <DashboardEmptyState
        title="Booking unavailable"
        description="Database is not configured in this environment."
      />
    );
  }

  const booking = await bookingDetailPrisma.booking.findUnique({
    where: { id },
    include: {
      suite: true,
      bookingPets: { include: { pet: true } },
      payments: true,
    },
  });

  if (!booking || booking.userId !== session.user.id) {
    return (
      <DashboardEmptyState
        title="Booking unavailable"
        description="Booking not found or access denied."
      />
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
