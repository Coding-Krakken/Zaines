import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getAdminSettings } from "@/lib/api/admin-settings";
import {
  errorResponse,
  getCorrelationId,
  logServerFailure,
  rateLimitedResponse,
} from "@/lib/security/api";

type AvailabilityPrisma = {
  booking: {
    findMany: (args: {
      where: {
        status: { in: string[] };
        OR: Array<Record<string, unknown>>;
      };
      include: {
        suite: {
          select: {
            tier: boolean;
          };
        };
        bookingPets: {
          select: {
            id: boolean;
          };
        };
      };
    }) => Promise<Array<{ suite: { tier: string }; bookingPets: Array<{ id: string }> }>>;
  };
};

const availabilityPrisma = prisma as unknown as AvailabilityPrisma;

const availabilitySchema = z.object({
  checkIn: z.string(),
  checkOut: z.string(),
  suiteType: z.enum(["standard", "deluxe", "luxury"]).optional(),
});

// GET /api/availability - Check suite availability for dates
export async function GET(request: NextRequest) {
  const correlationId = getCorrelationId(request);

  try {
    const rateLimit = rateLimitedResponse({
      request,
      routeKey: "availability_get",
      route: "/api/availability",
      correlationId,
      limit: 60,
      windowMs: 60_000,
    });
    if (rateLimit) return rateLimit;

    // Check if database is configured
    if (!isDatabaseConfigured()) {
      return errorResponse({
        status: 503,
        errorCode: "AVAILABILITY_UNAVAILABLE",
        message: "Availability is temporarily unavailable. Please retry.",
        retryable: true,
        correlationId,
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const suiteType = searchParams.get("suiteType");

    if (!checkIn || !checkOut) {
      return errorResponse({
        status: 400,
        errorCode: "AVAILABILITY_VALIDATION_ERROR",
        message: "checkIn and checkOut dates are required.",
        retryable: false,
        correlationId,
      });
    }

    const validation = availabilitySchema.safeParse({
      checkIn,
      checkOut,
      ...(suiteType && { suiteType }),
    });

    if (!validation.success) {
      return errorResponse({
        status: 400,
        errorCode: "AVAILABILITY_VALIDATION_ERROR",
        message: "Invalid availability parameters.",
        retryable: false,
        correlationId,
        details: {
          fields: validation.error.issues
            .map((issue) => issue.path.join("."))
            .filter(Boolean),
        },
      });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Find all bookings that overlap with the requested dates
    const overlappingBookings = await availabilityPrisma.booking.findMany({
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
        bookingPets: {
          select: {
            id: true,
          },
        },
      },
    });

    // Count occupied pets by tier.
    const occupiedCounts = overlappingBookings.reduce(
      (acc: Record<string, number>, booking: { suite: { tier: string }; bookingPets: Array<{ id: string }> }) => {
        const tier = booking.suite.tier.toUpperCase();
        acc[tier] = (acc[tier] || 0) + booking.bookingPets.length;
        return acc;
      },
      {} as Record<string, number>,
    );

    const adminSettings = await getAdminSettings();
    const tierCapacityMap = adminSettings.serviceSettings.serviceTiers.reduce(
      (acc, tier) => {
        const normalizedName = tier.name.toLowerCase();
        const normalizedId = tier.id.toLowerCase();
        const capacity = typeof tier.capacity === "number" ? Math.max(1, Math.floor(tier.capacity)) : undefined;

        if (!capacity) {
          return acc;
        }

        if (normalizedName.includes("standard") || normalizedId.includes("standard")) {
          acc.STANDARD = capacity;
        } else if (normalizedName.includes("deluxe") || normalizedId.includes("deluxe")) {
          acc.DELUXE = capacity;
        } else if (normalizedName.includes("luxury") || normalizedId.includes("luxury")) {
          acc.LUXURY = capacity;
        }

        return acc;
      },
      {} as Partial<Record<"STANDARD" | "DELUXE" | "LUXURY", number>>,
    );

    // Fallback capacities if no admin-configured values exist yet.
    const capacity = {
      STANDARD: tierCapacityMap.STANDARD ?? 3,
      DELUXE: tierCapacityMap.DELUXE ?? 2,
      LUXURY: tierCapacityMap.LUXURY ?? 1,
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
    logServerFailure(
      "/api/availability",
      "AVAILABILITY_CHECK_FAILED",
      correlationId,
      error,
    );
    return errorResponse({
      status: 500,
      errorCode: "AVAILABILITY_CHECK_FAILED",
      message: "Failed to check availability. Please retry.",
      retryable: true,
      correlationId,
    });
  }
}
