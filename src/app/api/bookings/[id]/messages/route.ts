import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import {
  errorResponse,
  getCorrelationId,
  logServerFailure,
  rateLimitedResponse,
} from "@/lib/security/api";
import { logSecurityEvent } from "@/lib/security/logging";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
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
        errorCode: "MESSAGES_UNAVAILABLE",
        message: "Messages are temporarily unavailable.",
        retryable: true,
        correlationId,
      });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") || undefined;
    const rawLimit = Number.parseInt(searchParams.get("limit") || "50", 10);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), 100)
      : 50;
    const rawSort = searchParams.get("sort");
    const sort: "asc" | "desc" = rawSort === "desc" ? "desc" : "asc";
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
    logServerFailure(
      "/api/bookings/[id]/messages",
      "MESSAGES_FETCH_FAILED",
      correlationId,
      error,
    );
    return errorResponse({
      status: 500,
      errorCode: "MESSAGES_FETCH_FAILED",
      message: "Failed to fetch messages.",
      retryable: true,
      correlationId,
    });
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
  const { id } = await params;
  const correlationId = getCorrelationId(request);
  try {
    const rateLimit = rateLimitedResponse({
      request,
      routeKey: "booking_message_create",
      route: "/api/bookings/[id]/messages",
      correlationId,
      limit: 20,
      windowMs: 60_000,
      subject: id,
    });
    if (rateLimit) return rateLimit;

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
        errorCode: "MESSAGE_CREATE_UNAVAILABLE",
        message: "Message creation is temporarily unavailable.",
        retryable: true,
        correlationId,
      });
    }

    const bookingId = id;
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return errorResponse({
        status: 400,
        errorCode: "MESSAGE_VALIDATION_ERROR",
        message: "Content is required.",
        retryable: false,
        correlationId,
      });
    }

    if (content.length > 5000) {
      return errorResponse({
        status: 400,
        errorCode: "MESSAGE_VALIDATION_ERROR",
        message: "Content must be <= 5000 characters.",
        retryable: false,
        correlationId,
      });
    }

    // Verify booking exists and user has access
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { userId: true },
    });

    if (!booking) {
      return errorResponse({
        status: 404,
        errorCode: "BOOKING_NOT_FOUND",
        message: "Booking not found.",
        retryable: false,
        correlationId,
      });
    }

    // Determine sender type and validate access
    const userRole = session.user.role;
    let senderType = "customer";
    if (userRole === "staff" || userRole === "admin") {
      senderType = "staff";
    } else if (booking.userId !== session.user.id) {
      // Customer can only message their own bookings
      return errorResponse({
        status: 403,
        errorCode: "BOOKING_ACCESS_DENIED",
        message: "You do not have access to this booking.",
        retryable: false,
        correlationId,
      });
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

    logSecurityEvent({
      route: "/api/bookings/[id]/messages",
      event: "MESSAGE_CREATED",
      correlationId,
      context: { bookingId },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    logServerFailure(
      "/api/bookings/[id]/messages",
      "MESSAGE_CREATE_FAILED",
      correlationId,
      error,
    );
    return errorResponse({
      status: 500,
      errorCode: "MESSAGE_CREATE_FAILED",
      message: "Failed to create message.",
      retryable: true,
      correlationId,
    });
  }
}
