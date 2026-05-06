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
 * GET /api/bookings/[id]/photos
 * Fetch photos for a booking with pagination and filtering
 * Query params:
 *   - cursor: for pagination (last photo ID)
 *   - limit: max results per request (default 20)
 *   - petId: filter by pet
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
        errorCode: "PHOTOS_UNAVAILABLE",
        message: "Photos are temporarily unavailable.",
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
    const petId = searchParams.get("petId") || undefined;
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
    const where: { bookingId: string; petId?: string } = { bookingId };
    if (petId) {
      where.petId = petId;
    }

    // Fetch photos with cursor-based pagination
    const photos = await prisma.petPhoto.findMany({
      where,
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
      orderBy: { uploadedAt: "desc" },
      take: limit + 1,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
    });

    // Determine if there are more results
    const hasMore = photos.length > limit;
    const items = hasMore ? photos.slice(0, -1) : photos;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return NextResponse.json({
      items,
      nextCursor,
      hasMore,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logServerFailure(
      "/api/bookings/[id]/photos",
      "PHOTOS_FETCH_FAILED",
      correlationId,
      error,
    );
    return errorResponse({
      status: 500,
      errorCode: "PHOTOS_FETCH_FAILED",
      message: "Failed to fetch photos.",
      retryable: true,
      correlationId,
    });
  }
}

/**
 * POST /api/bookings/[id]/photos
 * Upload a new photo (admin/staff only)
 * Expects multipart form data with:
 *   - petId: pet ID
 *   - imageUrl: URL to the image (assumes pre-uploaded)
 *   - caption: optional caption
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const correlationId = getCorrelationId(request);
  try {
    const rateLimit = rateLimitedResponse({
      request,
      routeKey: "booking_photo_create",
      route: "/api/bookings/[id]/photos",
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
        errorCode: "PHOTO_CREATE_UNAVAILABLE",
        message: "Photo creation is temporarily unavailable.",
        retryable: true,
        correlationId,
      });
    }

    const bookingId = id;
    const { petId, imageUrl, caption } = await request.json();

    if (!petId || !imageUrl) {
      return errorResponse({
        status: 400,
        errorCode: "PHOTO_VALIDATION_ERROR",
        message: "petId and imageUrl are required.",
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
        errorCode: "PHOTO_PET_MISMATCH",
        message: "petId must belong to the booking.",
        retryable: false,
        correlationId,
      });
    }

    // Create photo
    const photo = await prisma.petPhoto.create({
      data: {
        bookingId,
        petId,
        imageUrl,
        caption,
        uploadedBy: session.user.name || "Staff",
        uploadedAt: new Date(),
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
    });

    // Trigger notification (in real implementation, this would queue an event)
    // For now, just track that notification should be sent
    logSecurityEvent({
      route: "/api/bookings/[id]/photos",
      event: "PHOTO_CREATED",
      correlationId,
      context: { bookingId },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    logServerFailure(
      "/api/bookings/[id]/photos",
      "PHOTO_CREATE_FAILED",
      correlationId,
      error,
    );
    return errorResponse({
      status: 500,
      errorCode: "PHOTO_CREATE_FAILED",
      message: "Failed to create photo.",
      retryable: true,
      correlationId,
    });
  }
}
