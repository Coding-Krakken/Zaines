import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isDatabaseConfigured } from '@/lib/prisma';
import { checkSuiteAvailability } from '@/lib/api/admin-bookings';

/**
 * POST /api/admin/bookings/check-availability - Check if a suite is available for dates
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { id: string; role?: string }).role;
    if (!role || !['staff', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ available: false, message: 'Database not configured' }, { status: 503 });
    }

    const body = (await request.json()) as {
      suiteId: string;
      checkInDate: string;
      checkOutDate: string;
    };

    if (!body.suiteId || !body.checkInDate || !body.checkOutDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const checkIn = new Date(body.checkInDate);
    const checkOut = new Date(body.checkOutDate);

    if (checkOut <= checkIn) {
      return NextResponse.json(
        { available: false, message: 'Check-out date must be after check-in date' },
        { status: 400 },
      );
    }

    const available = await checkSuiteAvailability(body.suiteId, checkIn, checkOut);

    return NextResponse.json({
      available,
      message: available ? 'Suite is available' : 'Suite is not available for these dates',
    });
  } catch (error) {
    console.error('Availability check error:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 },
    );
  }
}
