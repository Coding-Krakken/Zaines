import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import {
  errorResponse,
  getCorrelationId,
  logServerFailure,
} from "@/lib/security/api";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/bookings/[id]/notifications
 * Poll for new events (activities, photos, messages) since last check
 * Query params:
 *   - since: ISO timestamp of last poll (default: 30 seconds ago)
 *   - includeRead: whether to include read messages (default: false)
 *
 * Returns: { activities: [], photos: [], messages: [], timestamp }
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
        errorCode: "NOTIFICATIONS_UNAVAILABLE",
        message: "Notifications are temporarily unavailable.",
        retryable: true,
        correlationId,
      });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = id;

    // Parse since parameter - default to 30 seconds ago for SLA compliance
    let sinceDate: Date;
    const since = searchParams.get("since");
    if (since) {
      sinceDate = new Date(since);
      // Validate it's a valid date
      if (isNaN(sinceDate.getTime())) {
        return errorResponse({
          status: 400,
          errorCode: "NOTIFICATIONS_VALIDATION_ERROR",
          message: "Invalid since timestamp.",
          retryable: false,
          correlationId,
        });
      }
    } else {
      // Default: last 30 seconds (polling SLA)
      sinceDate = new Date(Date.now() - 30000);
    }

    const includeRead = searchParams.get("includeRead") === "true";

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

    // Fetch recent activities
    const activities = await prisma.activity.findMany({
      where: {
        bookingId,
        performedAt: { gte: sinceDate },
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
      orderBy: { performedAt: "asc" },
    });

    // Fetch recent photos
    const photos = await prisma.petPhoto.findMany({
      where: {
        bookingId,
        uploadedAt: { gte: sinceDate },
      },
      select: {
        id: true,
        imageUrl: true,
        caption: true,
        uploadedBy: true,
        uploadedAt: true,
        pet: {
          select: { id: true, name: true },
        },
      },
      orderBy: { uploadedAt: "asc" },
    });

    // Fetch recent messages (excluding old unread, unless requested)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messageWhere: any = {
      bookingId,
      sentAt: { gte: sinceDate },
    };
    if (!includeRead) {
      messageWhere.isRead = false;
    }

    const messages = await prisma.message.findMany({
      where: messageWhere,
      select: {
        id: true,
        content: true,
        senderType: true,
        senderName: true,
        sentAt: true,
        isRead: true,
      },
      orderBy: { sentAt: "asc" },
    });

    // Calculate metrics for reliability tracking
    const now = new Date();
    const eventCount = activities.length + photos.length + messages.length;
    const pollLatency = {
      activities: Math.max(
        ...activities.map(
          (a) => now.getTime() - new Date(a.performedAt).getTime(),
        ),
        0,
      ),
      photos: Math.max(
        ...photos.map((p) => now.getTime() - new Date(p.uploadedAt).getTime()),
        0,
      ),
      messages: Math.max(
        ...messages.map((m) => now.getTime() - new Date(m.sentAt).getTime()),
        0,
      ),
    };

    return NextResponse.json({
      events: {
        activities,
        photos,
        messages,
      },
      meta: {
        timestamp: now.toISOString(),
        sinceTimestamp: sinceDate.toISOString(),
        eventCount,
        pollLatencyMs: pollLatency,
      },
    });
  } catch (error) {
    logServerFailure(
      "/api/bookings/[id]/notifications",
      "NOTIFICATIONS_FETCH_FAILED",
      correlationId,
      error,
    );
    return errorResponse({
      status: 500,
      errorCode: "NOTIFICATIONS_FETCH_FAILED",
      message: "Failed to fetch notifications.",
      retryable: true,
      correlationId,
    });
  }
}
