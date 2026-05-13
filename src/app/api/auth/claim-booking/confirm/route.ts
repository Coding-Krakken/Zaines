import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getCorrelationId, rateLimitedResponse } from "@/lib/security/api";
import { logSecurityEvent } from "@/lib/security/logging";

const schema = z.object({
  token: z.string().min(30).max(256),
});

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  logSecurityEvent({
    route: "/api/auth/claim-booking/confirm",
    event: "AUTH_BOOKING_CLAIM_CONFIRM_ATTEMPT",
    correlationId,
  });

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const rateLimited = rateLimitedResponse({
    request,
    routeKey: "auth_booking_claim_confirm",
    route: "/api/auth/claim-booking/confirm",
    correlationId,
    limit: 10,
    windowMs: 60_000,
  });
  if (rateLimited) return rateLimited;

  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    logSecurityEvent({
      route: "/api/auth/claim-booking/confirm",
      event: "AUTH_BOOKING_CLAIM_CONFIRM_UNAUTHENTICATED",
      correlationId,
      level: "warn",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsed: z.infer<typeof schema>;
  try {
    parsed = schema.parse(await request.json());
  } catch {
    logSecurityEvent({
      route: "/api/auth/claim-booking/confirm",
      event: "AUTH_BOOKING_CLAIM_CONFIRM_INVALID",
      correlationId,
      level: "warn",
    });
    return NextResponse.json({ error: "Invalid token" }, { status: 422 });
  }

  const tokenStore = (
    prisma as unknown as {
      bookingClaimToken?: {
        findUnique: (args: {
          where: { token: string };
          select: {
            id: true;
            bookingId: true;
            email: true;
            expiresAt: true;
            claimedAt: true;
          };
        }) => Promise<{
          id: string;
          bookingId: string;
          email: string;
          expiresAt: Date;
          claimedAt: Date | null;
        } | null>;
        update: (args: {
          where: { id: string };
          data: { claimedAt: Date; claimedByUserId: string };
        }) => Promise<unknown>;
      };
    }
  ).bookingClaimToken;

  if (!tokenStore) {
    return NextResponse.json({ error: "Claim flow unavailable" }, { status: 503 });
  }

  const tokenRecord = await tokenStore.findUnique({
    where: { token: parsed.token },
    select: {
      id: true,
      bookingId: true,
      email: true,
      expiresAt: true,
      claimedAt: true,
    },
  });

  if (!tokenRecord || tokenRecord.claimedAt || tokenRecord.expiresAt.getTime() < Date.now()) {
    logSecurityEvent({
      route: "/api/auth/claim-booking/confirm",
      event: "AUTH_BOOKING_CLAIM_CONFIRM_TOKEN_INVALID",
      correlationId,
      level: "warn",
    });
    return NextResponse.json({ error: "Claim token invalid or expired" }, { status: 422 });
  }

  if (tokenRecord.email.toLowerCase() !== session.user.email.toLowerCase()) {
    logSecurityEvent({
      route: "/api/auth/claim-booking/confirm",
      event: "AUTH_BOOKING_CLAIM_CONFIRM_EMAIL_MISMATCH",
      correlationId,
      level: "warn",
    });
    return NextResponse.json({ error: "Claim token email does not match your account" }, { status: 403 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: tokenRecord.bookingId },
    select: {
      id: true,
      userId: true,
      bookingNumber: true,
      bookingPets: {
        select: {
          petId: true,
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.userId !== session.user.id) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { userId: session.user.id },
    });

    const petIds = booking.bookingPets.map((entry) => entry.petId);
    if (petIds.length > 0) {
      await prisma.pet.updateMany({
        where: {
          id: { in: petIds },
          userId: booking.userId,
        },
        data: {
          userId: session.user.id,
        },
      });
    }
  }

  await tokenStore.update({
    where: { id: tokenRecord.id },
    data: {
      claimedAt: new Date(),
      claimedByUserId: session.user.id,
    },
  });

  return NextResponse.json({
    state: "claimed",
    bookingId: booking.id,
    bookingNumber: booking.bookingNumber,
  });
}
