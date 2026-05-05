import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
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
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const type = searchParams.get("type") || undefined;
    const sort = (searchParams.get("sort") || "desc") as "asc" | "desc";
    const bookingId = id;

    // Verify booking exists and user has access
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { userId: true },
    });

    if (!booking || booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Booking not found or access denied" },
        { status: 404 }
      );
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
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings/[id]/activities
 * Create a new activity (admin/staff only)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const session = await auth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (session?.user as any)?.role;
    if (!session?.user?.id || userRole !== "staff") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const bookingId = id;
    const { petId, type, description, notes } = await request.json();

    if (!petId || !type) {
      return NextResponse.json(
        { error: "petId and type are required" },
        { status: 400 }
      );
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
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}
