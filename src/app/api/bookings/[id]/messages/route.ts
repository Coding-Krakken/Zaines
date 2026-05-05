import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/bookings/[id]/messages
 * Fetch messages for a booking with pagination
 * Query params:
 *   - cursor: for pagination (last message ID)
 *   - limit: max results per request (default 50)
 *   - sort: 'asc' or 'desc' (default 'asc' for chronological)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const sort = (searchParams.get("sort") || "asc") as "asc" | "desc";
    const bookingId = params.id;

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

    // Mark messages as read (idempotent - only unread ones)
    await prisma.message.updateMany({
      where: {
        bookingId,
        userId: { not: session.user.id },
        isRead: false,
      },
      data: { isRead: true },
    });

    // Fetch messages with cursor-based pagination
    const messages = await prisma.message.findMany({
      where: { bookingId },
      select: {
        id: true,
        content: true,
        senderType: true,
        senderName: true,
        sentAt: true,
        isRead: true,
      },
      orderBy: { sentAt: sort },
      take: limit + 1,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
    });

    // Determine if there are more results
    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, -1) : messages;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return NextResponse.json({
      items,
      nextCursor,
      hasMore,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings/[id]/messages
 * Create a new message (customer or staff)
 * Expects JSON with:
 *   - content: message text
 *   - senderType: 'customer' | 'staff' (determined from session)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const bookingId = params.id;
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: "Content must be <= 5000 characters" },
        { status: 400 }
      );
    }

    // Verify booking exists and user has access
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { userId: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Determine sender type and validate access
    let senderType = "customer";
    if (session.user.role === "staff" || session.user.role === "admin") {
      senderType = "staff";
    } else if (booking.userId !== session.user.id) {
      // Customer can only message their own bookings
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Create message with server timestamp
    const message = await prisma.message.create({
      data: {
        bookingId,
        userId: session.user.id,
        senderType,
        senderName: session.user.name || "User",
        content: content.trim(),
        isRead: false,
        sentAt: new Date(),
      },
      select: {
        id: true,
        content: true,
        senderType: true,
        senderName: true,
        sentAt: true,
        isRead: true,
      },
    });

    console.log(`[MESSAGE] New message for booking ${bookingId}:`, message);

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}
