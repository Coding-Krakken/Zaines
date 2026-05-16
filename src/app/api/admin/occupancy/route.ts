import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { ensureDefaultSuites } from '@/lib/booking/default-suites';

async function requireStaffSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const role = (session.user as { id: string; role?: string }).role;
  if (!role || !['staff', 'admin'].includes(role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { session };
}

export async function GET() {
  const authResult = await requireStaffSession();
  if (authResult.error) {
    return authResult.error;
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ suites: [], summary: { suites: 0, occupiedSuites: 0, occupiedPets: 0 } });
  }

  // Ensure default suites exist before querying (for data parity with availability API)
  await ensureDefaultSuites();

  const suites = await prisma.suite.findMany({
    where: { isActive: true },
    include: {
      bookings: {
        where: { status: 'checked_in' },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          bookingPets: {
            include: {
              pet: {
                select: { id: true, name: true, breed: true },
              },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const normalizedSuites = suites.map((suite) => {
    const occupiedPets = suite.bookings.reduce(
      (sum, booking) => sum + booking.bookingPets.length,
      0,
    );
    const occupancyPct = suite.capacity > 0 ? Math.min(100, Math.round((occupiedPets / suite.capacity) * 100)) : 0;

    return {
      id: suite.id,
      name: suite.name,
      tier: suite.tier,
      size: suite.size,
      capacity: suite.capacity,
      occupiedPets,
      occupancyPct,
      status: occupiedPets > 0 ? 'occupied' : 'available',
      bookings: suite.bookings.map((booking) => ({
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        guest: booking.user,
        pets: booking.bookingPets.map((bp) => bp.pet),
      })),
    };
  });

  const summary = {
    suites: normalizedSuites.length,
    occupiedSuites: normalizedSuites.filter((suite) => suite.occupiedPets > 0).length,
    occupiedPets: normalizedSuites.reduce((sum, suite) => sum + suite.occupiedPets, 0),
  };

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    suites: normalizedSuites,
    summary,
  });
}
