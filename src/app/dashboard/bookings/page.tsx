import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { getBookingStatusMeta } from "@/lib/dashboard-status";
import { CancelBookingButton } from "./[id]/CancelBookingButton";

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user?.id) return redirect("/auth/signin");

  if (!isDatabaseConfigured()) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">My Bookings</h1>
        <p className="mt-4 text-muted-foreground">Database not configured.</p>
      </div>
    );
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    orderBy: { checkInDate: "desc" },
    include: { suite: true, bookingPets: { include: { pet: true } } },
  });

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Reservations"
        title="My Bookings"
        description="Review upcoming stays, payment status, and next actions for each reservation."
        actions={(
          <Button asChild size="sm">
            <Link href="/book">New Booking</Link>
          </Button>
        )}
      />

      <div className="space-y-4">
        {bookings.length === 0 && (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            You have no bookings yet. Start a reservation to secure your preferred suite and dates.
          </div>
        )}
        {bookings.map(
          (b: {
            id: string;
            suite?: { name?: string } | null;
            checkInDate: Date;
            checkOutDate: Date;
            status: string;
            bookingPets: Array<{ pet?: { name?: string } | null }>;
            bookingNumber: string;
          }) => (
            <div key={b.id} className="flex flex-wrap justify-between gap-4 rounded-xl border bg-card p-4 shadow-sm">
              <div>
                <div className="font-medium">{b.suite?.name || "Suite"}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(b.checkInDate).toLocaleDateString()} →{" "}
                  {new Date(b.checkOutDate).toLocaleDateString()}
                </div>
                <div className="text-sm">
                  Pets:{" "}
                  {b.bookingPets
                    .map(
                      (bp: { pet?: { name?: string } | null }) => bp.pet?.name,
                    )
                    .filter(Boolean)
                    .join(", ")}
                </div>
                <div className="mt-2">
                  <Badge variant={getBookingStatusMeta(b.status).badgeVariant}>
                    {getBookingStatusMeta(b.status).label}
                  </Badge>
                </div>
              </div>
              <div className="text-right space-y-3">
                <div className="font-medium">{b.bookingNumber}</div>
                <Link
                  href={`/dashboard/bookings/${b.id}`}
                  className="text-sm text-primary"
                >
                  View details
                </Link>
                <div className="flex justify-end">
                  <CancelBookingButton
                    bookingId={b.id}
                    bookingStatus={b.status}
                    canCancel={
                      (b.status === "pending" || b.status === "confirmed") &&
                      new Date(b.checkInDate) > new Date()
                    }
                    compact
                  />
                </div>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
