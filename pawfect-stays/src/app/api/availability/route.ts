import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

const availabilitySchema = z.object({
  checkIn: z.string(),
  checkOut: z.string(),
  suiteType: z.enum(["standard", "deluxe", "luxury"]).optional(),
});

// GET /api/availability - Check suite availability for dates
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const suiteType = searchParams.get("suiteType");

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: "checkIn and checkOut dates are required" },
        { status: 400 }
      );
    }

    const validation = availabilitySchema.safeParse({
      checkIn,
      checkOut,
      ...(suiteType && { suiteType }),
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validation.error },
        { status: 400 }
      );
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Find all bookings that overlap with the requested dates
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        status: {
          in: ["confirmed", "checked_in"],
        },
        OR: [
          {
            // Booking starts during requested period
            checkInDate: {
              gte: checkInDate,
              lt: checkOutDate,
            },
          },
          {
            // Booking ends during requested period
            checkOutDate: {
              gt: checkInDate,
              lte: checkOutDate,
            },
          },
          {
            // Booking encompasses entire requested period
            AND: [
              {
                checkInDate: {
                  lte: checkInDate,
                },
              },
              {
                checkOutDate: {
                  gte: checkOutDate,
                },
              },
            ],
          },
        ],
      },
      include: {
        suite: {
          select: {
            tier: true,
          },
        },
      },
    });

    // Count occupied suites by tier
    const occupiedCounts = overlappingBookings.reduce(
      (acc: Record<string, number>, booking: { suite: { tier: string } }) => {
        const tier = booking.suite.tier.toUpperCase();
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Suite capacity (adjust these numbers based on your actual inventory)
    const capacity = {
      STANDARD: 10,
      DELUXE: 8,
      LUXURY: 5,
    };

    // Calculate available suites
    const availability = {
      standard: Math.max(0, capacity.STANDARD - (occupiedCounts.STANDARD || 0)),
      deluxe: Math.max(0, capacity.DELUXE - (occupiedCounts.DELUXE || 0)),
      luxury: Math.max(0, capacity.LUXURY - (occupiedCounts.LUXURY || 0)),
    };

    return NextResponse.json({
      checkIn,
      checkOut,
      availability,
      isAvailable: suiteType
        ? availability[suiteType as keyof typeof availability] > 0
        : Object.values(availability).some((count) => count > 0),
    });
  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
