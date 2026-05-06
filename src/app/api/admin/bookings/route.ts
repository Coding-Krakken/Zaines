import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { id: string; role?: string }).role;
  if (!role || !["staff", "admin"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ bookings: [] });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        { checkInDate: { gte: today, lt: tomorrow } },
        { checkOutDate: { gte: today, lt: tomorrow } },
        { status: "checked_in" },
      ],
    },
    include: {
      user: { select: { name: true, email: true } },
      suite: { select: { name: true } },
      bookingPets: {
        include: { pet: { select: { name: true, breed: true } } },
      },
    },
    orderBy: { checkInDate: "asc" },
  });

  return NextResponse.json({ bookings });
}
