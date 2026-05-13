import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role;
    if (!role || !["staff", "admin"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Booking id is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        bookingPets: {
          select: { petId: true },
        },
        user: {
          select: {
            id: true,
            pets: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.bookingPets.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Booking already has pet associations.",
        attachedCount: booking.bookingPets.length,
      });
    }

    const ownerPets = booking.user?.pets ?? [];
    if (ownerPets.length === 0) {
      return NextResponse.json(
        {
          error:
            "No pet profiles exist for this booking owner. Create a pet profile first, then retry.",
        },
        { status: 409 },
      );
    }

    const result = await prisma.bookingPet.createMany({
      data: ownerPets.map((pet) => ({
        bookingId: booking.id,
        petId: pet.id,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      message: "Attached owner pets to booking.",
      attachedCount: result.count,
      petNames: ownerPets.map((pet) => pet.name),
    });
  } catch (error) {
    console.error("Failed to repair booking pet associations", error);
    return NextResponse.json(
      { error: "Failed to repair booking pet associations" },
      { status: 500 },
    );
  }
}
