import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isDatabaseConfigured } from '@/lib/prisma';
import { getAdminBooking } from '@/lib/api/admin-bookings';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/bookings/[id] - Get a single booking
 */
export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const role = (session.user as { id: string; role?: string }).role;
    if (!role || !['staff', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 },
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const params = await Promise.resolve(context.params);
    const booking = await getAdminBooking(params.id);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 },
      );
    }

    // Also fetch waivers for this booking
    const waivers = await prisma.waiver.findMany({
      where: { bookingId: params.id },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...booking,
        waivers,
      },
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 },
    );
  }
}
