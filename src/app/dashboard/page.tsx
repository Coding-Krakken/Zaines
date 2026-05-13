import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { HealthTimeline } from "@/components/HealthTimeline";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardUnavailableState } from "@/components/dashboard/dashboard-states";
import { Button } from "@/components/ui/button";
import { getBookingStatusMeta } from "@/lib/dashboard-status";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function daysUntil(date: Date): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return Math.ceil((target - start) / (1000 * 60 * 60 * 24));
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    // Redirect to sign-in page if not authenticated
    return redirect("/auth/signin");
  }

  // If DB not configured, render a helpful message
  if (!isDatabaseConfigured()) {
    return (
      <DashboardUnavailableState
        title="Dashboard unavailable"
        description="Database is not configured. Dashboard data is unavailable in this environment."
      />
    );
  }

  const [
    upcomingBookings,
    recentBookings,
    pets,
    activeVaccinePets,
    accountWaivers,
    unreadStaffMessages,
  ] = await Promise.all([
    prisma.booking.findMany({
      where: {
        userId: session.user.id,
        status: { in: ["pending", "confirmed"] },
      },
      orderBy: { checkInDate: "asc" },
      take: 3,
      include: { suite: true, bookingPets: { include: { pet: true } } },
    }),
    prisma.booking.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { suite: true, bookingPets: { include: { pet: true } } },
    }),
    prisma.pet.findMany({ where: { userId: session.user.id }, take: 6 }),
    prisma.vaccine.findMany({
      where: {
        pet: { userId: session.user.id },
        expiryDate: { gt: new Date() },
      },
      select: { petId: true },
      distinct: ["petId"],
    }),
    prisma.accountWaiver.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      select: { type: true },
    }),
    prisma.message.count({
      where: {
        userId: session.user.id,
        senderType: "staff",
        isRead: false,
      },
    }),
  ]);

  const totalBookings = recentBookings.length;
  const activeStays = recentBookings.filter((b) =>
    ["pending", "confirmed", "checked_in"].includes(b.status),
  ).length;
  const completedStays = recentBookings.filter((b) => b.status === "completed").length;
  const lifetimeValue = recentBookings
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, booking) => sum + booking.total, 0);

  const nextStay = upcomingBookings[0];
  const daysToNextStay = nextStay ? daysUntil(nextStay.checkInDate) : null;
  const activeVaccinePetIds = new Set(activeVaccinePets.map((record) => record.petId));
  const hasAllActiveWaivers =
    new Set(accountWaivers.map((waiver) => waiver.type)).size >= 3;
  const petsWithActiveVaccine = pets.filter((pet) => activeVaccinePetIds.has(pet.id)).length;
  const petsWithProfileDetails = pets.filter(
    (pet) => Boolean(pet.microchipId) || Boolean(pet.healthNotes),
  ).length;

  const vaccineCoverage =
    pets.length === 0 ? 0 : petsWithActiveVaccine / pets.length;
  const detailsCoverage =
    pets.length === 0 ? 0 : petsWithProfileDetails / pets.length;

  // Readiness weights: 40% waivers, 40% vaccine coverage, 20% profile details.
  const profileReadiness = Math.round(
    ((hasAllActiveWaivers ? 1 : 0) * 0.4 + vaccineCoverage * 0.4 + detailsCoverage * 0.2) *
      100,
  );
  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Customer Dashboard"
        title={`Welcome back, ${firstName}.`}
        description="Track stays, monitor pet profile readiness, and manage your account in one place."
        className="luxury-shell grain-overlay border-border/50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white"
        actions={(
          <>
            <Button asChild variant="secondary" className="focus-ring">
              <Link href="/book">Book a Stay</Link>
            </Button>
            <Button asChild variant="outline" className="focus-ring border-white/40 bg-transparent text-white hover:bg-white/10">
              <Link href="/dashboard/bookings">View All Bookings</Link>
            </Button>
          </>
        )}
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="luxury-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Active Stays</p>
          <p className="mt-2 text-2xl font-semibold">{activeStays}</p>
          <p className="text-xs text-muted-foreground">Pending, confirmed, and checked-in bookings</p>
        </div>
        <div className="luxury-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Completed Stays</p>
          <p className="mt-2 text-2xl font-semibold">{completedStays}</p>
          <p className="text-xs text-muted-foreground">Your total completed reservations</p>
        </div>
        <div className="luxury-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Lifetime Spend</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(lifetimeValue)}</p>
          <p className="text-xs text-muted-foreground">Across non-cancelled bookings</p>
        </div>
        <div className="luxury-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Unread Messages</p>
          <p className="mt-2 text-2xl font-semibold">{unreadStaffMessages}</p>
          <p className="text-xs text-muted-foreground">New updates from the care team</p>
          <Link href="/dashboard/updates" className="mt-2 inline-block text-xs text-primary underline">
            Open updates hub
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-card/80 p-4 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-medium">Upcoming Stays</h2>
            <Link href="/dashboard/bookings" className="text-sm text-primary">
              See all
            </Link>
          </div>

          {!nextStay ? (
            <div className="mt-4 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No upcoming bookings. Reserve your next stay to lock in your preferred dates.
            </div>
          ) : (
            <>
              <div className="mt-4 rounded-md border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Next check-in</p>
                <p className="mt-1 text-xl font-semibold">
                  {new Date(nextStay.checkInDate).toLocaleDateString()} ({daysToNextStay === 0 ? "Today" : `${daysToNextStay} day${daysToNextStay === 1 ? "" : "s"}`})
                </p>
                <p className="text-sm text-muted-foreground">
                  {nextStay.bookingPets.length} pet{nextStay.bookingPets.length === 1 ? "" : "s"} in {nextStay.suite?.name || "assigned suite"}
                </p>
              </div>

              <ul className="mt-4 space-y-3">
                {upcomingBookings.map((booking) => (
                  <li key={booking.id} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{booking.suite?.name || "Suite"}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="min-w-0 sm:text-right">
                        <p className="break-all text-sm font-medium">{booking.bookingNumber}</p>
                        <p className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs ${getBookingStatusMeta(booking.status).toneClass}`}>
                          {getBookingStatusMeta(booking.status).label}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 break-words text-muted-foreground">
                        Pets: {booking.bookingPets.map((bp) => bp.pet?.name).filter(Boolean).join(", ") || "Not listed"}
                      </span>
                      <Link href={`/dashboard/bookings/${booking.id}`} className="text-primary">
                        View booking
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
            <h3 className="text-base font-medium">Quick Actions</h3>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <Button asChild variant="outline" size="sm" className="focus-ring">
                <Link href="/dashboard/pets/new">Add a Pet</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="focus-ring">
                <Link href="/dashboard/updates">Open Updates</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="focus-ring">
                <Link href="/dashboard/records">Manage Records</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="focus-ring">
                <Link href="/dashboard/settings">Update Account Settings</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
            <h3 className="text-base font-medium">Pet Profile Readiness</h3>
            <p className="mt-2 text-3xl font-semibold">{profileReadiness}%</p>
            <div className="mt-2 h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${Math.max(8, profileReadiness)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Readiness improves with active waivers, current vaccine records, and complete pet details.
            </p>
            <Link href="/dashboard/pets" className="mt-3 inline-block text-sm text-primary">
              Review pet profiles
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card/80 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-medium">Recent Booking Activity</h2>
          <span className="text-xs text-muted-foreground">Last {totalBookings} booking{totalBookings === 1 ? "" : "s"}</span>
        </div>

        {recentBookings.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No booking history yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recentBookings.map((booking) => (
              <li key={booking.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                <div className="min-w-0">
                  <p className="break-all font-medium">{booking.bookingNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()} in {booking.suite?.name || "Suite"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <span className="text-sm font-medium">{formatCurrency(booking.total)}</span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${getBookingStatusMeta(booking.status).toneClass}`}>
                    {getBookingStatusMeta(booking.status).label}
                  </span>
                  <Link href={`/dashboard/bookings/${booking.id}`} className="text-sm text-primary">
                    Details
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-medium">My Pets</h2>
            <Link href="/dashboard/pets" className="text-sm text-primary">
              Manage
            </Link>
          </div>

          {pets.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No pets added yet. Add your first pet profile to speed up booking checkout.
            </p>
          ) : (
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {pets.map((pet) => (
                <li key={pet.id} className="rounded-md border p-3">
                  <p className="font-medium">{pet.name}</p>
                  <p className="text-sm text-muted-foreground">{pet.breed}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {pet.age} years old, {pet.weight} lbs
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <HealthTimeline />
        </div>
      </section>
    </div>
  );
}
