import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import {
  errorResponse,
  getCorrelationId,
  logServerFailure,
  rateLimitedResponse,
} from "@/lib/security/api";
import { logSecurityEvent } from "@/lib/security/logging";

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);

  try {
    const rateLimit = rateLimitedResponse({
      request,
      routeKey: "dashboard_message_create",
      route: "/api/dashboard/messages",
      correlationId,
      limit: 20,
      windowMs: 60_000,
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

    const body = (await request.json().catch(() => null)) as {
      content?: string;
      bookingId?: string;
    } | null;

    const content = body?.content?.trim() ?? "";
    const bookingId = body?.bookingId?.trim() ?? "";

    if (!content) {
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

    let resolvedBookingId: string | null = null;
    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { id: true, userId: true },
      });

      if (!booking || booking.userId !== session.user.id) {
        return errorResponse({
          status: 403,
          errorCode: "BOOKING_ACCESS_DENIED",
          message: "You do not have access to this booking.",
          retryable: false,
          correlationId,
        });
      }

      resolvedBookingId = booking.id;
    }

    const message = await prisma.message.create({
      data: {
        bookingId: resolvedBookingId,
        userId: session.user.id,
        senderType: "customer",
        senderName: session.user.name || "Customer",
        content,
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
        booking: {
          select: {
            id: true,
            bookingNumber: true,
          },
        },
      },
    });

    logSecurityEvent({
      route: "/api/dashboard/messages",
      event: "DASHBOARD_MESSAGE_CREATED",
      correlationId,
      context: {
        bookingId: resolvedBookingId,
      },
    });

    return NextResponse.json(
      {
        id: message.id,
        content: message.content,
        senderType: message.senderType,
        senderName: message.senderName,
        sentAt: message.sentAt,
        isRead: message.isRead,
        booking: message.booking,
      },
      { status: 201 },
    );
  } catch (error) {
    logServerFailure(
      "/api/dashboard/messages",
      "DASHBOARD_MESSAGE_CREATE_FAILED",
      correlationId,
      error,
    );
    return errorResponse({
      status: 500,
      errorCode: "DASHBOARD_MESSAGE_CREATE_FAILED",
      message: "Failed to create message.",
      retryable: true,
      correlationId,
    });
  }
}
