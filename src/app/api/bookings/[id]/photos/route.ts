import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
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
      return NextResponse.json(
        { error: "Booking not found or access denied" },
        { status: 404 }
      );
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
    console.error("Error fetching photos:", error);
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    );
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
  try {
    const session = await auth();
    const userRole = session?.user?.role;
    if (!session?.user?.id || (userRole !== "staff" && userRole !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const bookingId = id;
    const { petId, imageUrl, caption } = await request.json();

    if (!petId || !imageUrl) {
      return NextResponse.json(
        { error: "petId and imageUrl are required" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "petId must belong to the booking" },
        { status: 400 }
      );
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
    console.log(`[NOTIFICATION] New photo created for booking ${bookingId}`);

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("Error creating photo:", error);
    return NextResponse.json(
      { error: "Failed to create photo" },
      { status: 500 }
    );
  }
}
