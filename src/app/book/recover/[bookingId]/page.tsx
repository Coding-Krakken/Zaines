import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import RecoverPaymentClient from "./RecoverPaymentClient";

type Props = {
  params: Promise<{ bookingId: string }>;
};

export default async function RecoverBookingPaymentPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return redirect("/auth/signin");
  }

  if (!isDatabaseConfigured()) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold">Payment Recovery</h1>
        <p className="mt-4 text-muted-foreground">Database not configured.</p>
      </div>
    );
  }

  const { bookingId } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payments: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!booking || booking.userId !== session.user.id) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold">Payment Recovery</h1>
        <p className="mt-4 text-muted-foreground">
          Booking not found or access denied.
        </p>
      </div>
    );
  }

  const alreadyPaid = booking.payments.some((payment) => payment.status === "succeeded");
  if (alreadyPaid) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold">Payment Recovery</h1>
        <p className="mt-4 text-muted-foreground">
          This booking already has a completed payment.
        </p>
      </div>
    );
  }

  return (
    <RecoverPaymentClient
      bookingId={booking.id}
      bookingNumber={booking.bookingNumber}
      total={booking.total}
    />
  );
}
