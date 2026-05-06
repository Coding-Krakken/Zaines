import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

async function requireStaffSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const role = (session.user as { id: string; role?: string }).role;
  if (!role || !["staff", "admin"].includes(role)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session };
}

export async function GET(request: NextRequest) {
  const authResult = await requireStaffSession();
  if (authResult.error) {
    return authResult.error;
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ contacts: [] });
  }

  const bookingId = request.nextUrl.searchParams.get("bookingId")?.trim();

  if (bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            emergencyContacts: {
              orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
            },
          },
        },
        bookingPets: {
          include: {
            pet: {
              select: { id: true, name: true, breed: true },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "checked_in") {
      return NextResponse.json(
        {
          error: `Cannot retrieve active contacts for booking with status: ${booking.status}`,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      contacts: booking.user.emergencyContacts,
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        guest: {
          id: booking.user.id,
          name: booking.user.name,
          email: booking.user.email,
        },
        pets: booking.bookingPets.map((bp) => bp.pet),
      },
    });
  }

  const activeBookings = await prisma.booking.findMany({
    where: {
      status: "checked_in",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          emergencyContacts: {
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
          },
        },
      },
      bookingPets: {
        include: {
          pet: {
            select: { id: true, name: true, breed: true },
          },
        },
      },
    },
    orderBy: { checkInDate: "asc" },
  });

  const contacts = activeBookings.flatMap((booking) =>
    booking.user.emergencyContacts.map((contact) => ({
      ...contact,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      guest: {
        id: booking.user.id,
        name: booking.user.name,
        email: booking.user.email,
      },
      pets: booking.bookingPets.map((bp) => bp.pet),
    })),
  );

  return NextResponse.json({
    contacts,
    activeBookings: activeBookings.length,
  });
}
