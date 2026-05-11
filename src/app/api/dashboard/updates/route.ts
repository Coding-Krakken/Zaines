import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import {
  errorResponse,
  getCorrelationId,
  logServerFailure,
} from "@/lib/security/api";
import { ASSOCIATION_AUDIT_PREFIX } from "@/lib/api/reassociation-audit";

const FINANCE_AUDIT_PREFIX = "[FINANCE_AUDIT]";

type TimelineMessage = {
  id: string;
  content: string;
  senderType: string;
  senderName: string;
  sentAt: Date;
  booking: {
    id: string;
    bookingNumber: string;
  } | null;
};

type TimelinePhoto = {
  id: string;
  imageUrl: string;
  caption: string | null;
  uploadedBy: string | null;
  uploadedAt: Date;
  booking: {
    id: string;
    bookingNumber: string;
  } | null;
  pet: {
    id: string;
    name: string;
  };
};

function isMissingPhotoUserIdError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2022") {
      const column = String(error.meta?.column ?? "");
      return column.includes("userId") || column.includes("pet_photos");
    }
  }

  if (error instanceof Error) {
    return /pet_photos.*userId|column.*userId/i.test(error.message);
  }

  return false;
}

async function fetchTimelinePhotosWithFallback(
  userId: string,
  limit: number,
): Promise<TimelinePhoto[]> {
  try {
    return await prisma.petPhoto.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        imageUrl: true,
        caption: true,
        uploadedBy: true,
        uploadedAt: true,
        booking: {
          select: {
            id: true,
            bookingNumber: true,
          },
        },
        pet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { uploadedAt: "desc" },
      take: limit,
    });
  } catch (error) {
    if (!isMissingPhotoUserIdError(error)) {
      throw error;
    }

    // Backward compatibility for environments where the migration adding
    // pet_photos.userId has not been applied yet.
    return await prisma.petPhoto.findMany({
      where: {
        booking: {
          userId,
        },
      },
      select: {
        id: true,
        imageUrl: true,
        caption: true,
        uploadedBy: true,
        uploadedAt: true,
        booking: {
          select: {
            id: true,
            bookingNumber: true,
          },
        },
        pet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { uploadedAt: "desc" },
      take: limit,
    });
  }
}

export async function GET(request: NextRequest) {
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
      return NextResponse.json({
        items: [],
        bookings: [],
        timestamp: new Date().toISOString(),
      });
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") ?? "all";
    const rawLimit = Number.parseInt(searchParams.get("limit") ?? "60", 10);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 10), 120)
      : 60;

    const includeMessages = mode === "all" || mode === "messages";
    const includePhotos = mode === "all" || mode === "photos";

    const [messages, photos, bookings] = await Promise.all([
      includeMessages
        ? prisma.message.findMany({
            where: {
              OR: [
                {
                  booking: {
                    userId: session.user.id,
                  },
                },
                {
                  bookingId: null,
                  userId: session.user.id,
                },
              ],
              NOT: [
                {
                  content: {
                    startsWith: FINANCE_AUDIT_PREFIX,
                  },
                },
                {
                  content: {
                    startsWith: ASSOCIATION_AUDIT_PREFIX,
                  },
                },
              ],
            },
            select: {
              id: true,
              content: true,
              senderType: true,
              senderName: true,
              sentAt: true,
              booking: {
                select: {
                  id: true,
                  bookingNumber: true,
                },
              },
            },
            orderBy: { sentAt: "desc" },
            take: limit,
          })
        : Promise.resolve([] as TimelineMessage[]),
      includePhotos
        ? fetchTimelinePhotosWithFallback(session.user.id, limit)
        : Promise.resolve([] as TimelinePhoto[]),
      prisma.booking.findMany({
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
          bookingNumber: true,
          checkInDate: true,
          status: true,
        },
        orderBy: {
          checkInDate: "desc",
        },
        take: 12,
      }),
    ]);

    const timelineItems = [
      ...messages.map((message) => ({
        id: `message-${message.id}`,
        entityId: message.id,
        type: "message" as const,
        occurredAt: message.sentAt,
        booking: message.booking,
        senderType: message.senderType,
        senderName: message.senderName,
        content: message.content,
      })),
      ...photos.map((photo) => ({
        id: `photo-${photo.id}`,
        entityId: photo.id,
        type: "photo" as const,
        occurredAt: photo.uploadedAt,
        booking: photo.booking,
        pet: photo.pet,
        imageUrl: photo.imageUrl,
        caption: photo.caption,
        uploadedBy: photo.uploadedBy,
      })),
    ]
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .slice(0, limit)
      .map((item) => ({
        ...item,
        occurredAt: item.occurredAt.toISOString(),
      }));

    return NextResponse.json({
      items: timelineItems,
      bookings,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logServerFailure(
      "/api/dashboard/updates",
      "DASHBOARD_UPDATES_FETCH_FAILED",
      correlationId,
      error,
    );
    return errorResponse({
      status: 500,
      errorCode: "DASHBOARD_UPDATES_FETCH_FAILED",
      message: "Failed to fetch updates.",
      retryable: true,
      correlationId,
    });
  }
}
