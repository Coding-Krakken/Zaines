import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';

const CANCELLABLE = new Set(['pending', 'confirmed']);

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  const { id } = await params;
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  if (booking.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!CANCELLABLE.has(booking.status)) {
    return NextResponse.json(
      { error: `Cannot cancel booking with status: ${booking.status}` },
      { status: 409 }
    );
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: 'cancelled' },
  });
  return NextResponse.json({ booking: updated });
}
