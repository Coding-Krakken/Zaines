import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import {
  errorResponse,
  getCorrelationId,
  logServerFailure,
  rateLimitedResponse,
} from "@/lib/security/api";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/bookings/[id]/activities
 * Fetch activities for a booking with pagination and filtering
 * Query params:
 *   - cursor: for pagination (last activity ID)
 *   - limit: max results per request (default 20)
 *   - type: filter by activity type (feeding, walk, play, etc.)
 *   - sort: 'asc' or 'desc' (default 'desc')
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const correlationId = getCorrelationId(request);
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse({
        status: 401,
        errorCode: "AUTH_REQUIRED",
        message: "Authentication is required.",
        retryable: false,
        correlationId,
      });
    }

    if (!isDatabaseConfigured()) {
      return errorResponse({
        status: 503,
        errorCode: "ACTIVITIES_UNAVAILABLE",
        message: "Activity feed is temporarily unavailable.",
        retryable: true,
        correlationId,
      });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") || undefined;
    const rawLimit = Number.parseInt(searchParams.get("limit") || "20", 10);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), 100)
      : 20;
    const type = searchParams.get("type") || undefined;
    const rawSort = searchParams.get("sort");
    const sort: "asc" | "desc" = rawSort === "asc" ? "asc" : "desc";
    const bookingId = id;

    // Verify booking exists and user has access
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { userId: true },
    });

    if (!booking || booking.userId !== session.user.id) {
      return errorResponse({
        status: 404,
        errorCode: "BOOKING_NOT_FOUND",
        message: "Booking not found.",
        retryable: false,
        correlationId,
      });
    }

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { bookingId };
    if (type) {
      where.type = type;
    }

    // Fetch activities with cursor-based pagination
    const activities = await prisma.activity.findMany({
      where,
      select: {
        id: true,
        type: true,
        description: true,
        performedBy: true,
        performedAt: true,
        notes: true,
        pet: {
          select: { id: true, name: true },
        },
      },
      orderBy: { performedAt: sort },
      take: limit + 1, // fetch one extra to know if there are more
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
    });

    // Determine if there are more results
    const hasMore = activities.length > limit;
    const items = hasMore ? activities.slice(0, -1) : activities;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return NextResponse.json({
      items,
      nextCursor,
      hasMore,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logServerFailure(
      "/api/bookings/[id]/activities",
      "ACTIVITIES_FETCH_FAILED",
      correlationId,
      error,
    );
    return errorResponse({
      status: 500,
      errorCode: "ACTIVITIES_FETCH_FAILED",
      message: "Failed to fetch activities.",
      retryable: true,
      correlationId,
    });
  }
}

/**
 * POST /api/bookings/[id]/activities
 * Create a new activity (admin/staff only)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const correlationId = getCorrelationId(request);
  try {
    const rateLimit = rateLimitedResponse({
      request,
      routeKey: "booking_activity_create",
      route: "/api/bookings/[id]/activities",
      correlationId,
      limit: 30,
      windowMs: 60_000,
      subject: id,
    });
    if (rateLimit) return rateLimit;

    const session = await auth();
    const userRole = session?.user?.role;
    if (!session?.user?.id || (userRole !== "staff" && userRole !== "admin")) {
      return errorResponse({
        status: 401,
        errorCode: "AUTH_REQUIRED",
        message: "Authentication is required.",
        retryable: false,
        correlationId,
      });
    }

    if (!isDatabaseConfigured()) {
      return errorResponse({
        status: 503,
        errorCode: "ACTIVITY_CREATE_UNAVAILABLE",
        message: "Activity creation is temporarily unavailable.",
        retryable: true,
        correlationId,
      });
    }

    const bookingId = id;
    const { petId, type, description, notes } = await request.json();

    if (!petId || !type) {
      return errorResponse({
        status: 400,
        errorCode: "ACTIVITY_VALIDATION_ERROR",
        message: "petId and type are required.",
        retryable: false,
        correlationId,
      });
    }

    const bookingPet = await prisma.bookingPet.findUnique({
      where: {
        bookingId_petId: {
          bookingId,
          petId,
        },
      },
      select: { bookingId: true },
    });

    if (!bookingPet) {
      return errorResponse({
        status: 400,
        errorCode: "ACTIVITY_PET_MISMATCH",
        message: "petId must belong to the booking.",
        retryable: false,
        correlationId,
      });
    }

    // Create activity with server timestamp (prevents client clock skew)
    const activity = await prisma.activity.create({
      data: {
        bookingId,
        petId,
        type,
        description,
        performedBy: session.user.name || "Staff",
        notes,
        performedAt: new Date(),
      },
      select: {
        id: true,
        type: true,
        description: true,
        performedBy: true,
        performedAt: true,
        notes: true,
        pet: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    logServerFailure(
      "/api/bookings/[id]/activities",
      "ACTIVITY_CREATE_FAILED",
      correlationId,
      error,
    );
    return errorResponse({
      status: 500,
      errorCode: "ACTIVITY_CREATE_FAILED",
      message: "Failed to create activity.",
      retryable: true,
      correlationId,
    });
  }
}
