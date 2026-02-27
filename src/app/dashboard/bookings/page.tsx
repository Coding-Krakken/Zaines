import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user?.id) return redirect("/auth/signin");

  if (!isDatabaseConfigured()) {
    return (
      <div className="container mx-auto p-6">
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
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Bookings</h1>
        <Link href="/book" className="btn">
          New Booking
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {bookings.length === 0 && (
          <p className="text-muted-foreground">You have no bookings.</p>
        )}
        {bookings.map(
          (b: {
            id: string;
            suite?: { name?: string } | null;
            checkInDate: Date;
            checkOutDate: Date;
            bookingPets: Array<{ pet?: { name?: string } | null }>;
            bookingNumber: string;
          }) => (
            <div key={b.id} className="p-4 border rounded flex justify-between">
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
              </div>
              <div className="text-right">
                <div className="font-medium">{b.bookingNumber}</div>
                <Link
                  href={`/dashboard/bookings/${b.id}`}
                  className="text-sm text-primary"
                >
                  View details
                </Link>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
