import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getCorrelationId, rateLimitedResponse } from "@/lib/security/api";
import { sendBookingClaimNotification } from "@/lib/notifications";
import { logSecurityEvent } from "@/lib/security/logging";

const schema = z.object({
  bookingNumber: z.string().min(4).max(64),
  email: z.string().email(),
});

const CLAIM_TTL_MS = 48 * 60 * 60_000;

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  logSecurityEvent({
    route: "/api/auth/claim-booking/request",
    event: "AUTH_BOOKING_CLAIM_REQUEST_ATTEMPT",
    correlationId,
  });

  const rateLimited = rateLimitedResponse({
    request,
    routeKey: "auth_booking_claim_request",
    route: "/api/auth/claim-booking/request",
    correlationId,
    limit: 5,
    windowMs: 10 * 60_000,
  });
  if (rateLimited) return rateLimited;

  let parsed: z.infer<typeof schema>;
  try {
    parsed = schema.parse(await request.json());
  } catch {
    logSecurityEvent({
      route: "/api/auth/claim-booking/request",
      event: "AUTH_BOOKING_CLAIM_REQUEST_INVALID",
      correlationId,
      level: "warn",
    });
    return NextResponse.json(
      {
        errorCode: "INVALID_CLAIM_REQUEST",
        message: "Enter a valid booking number and email.",
        retryable: false,
        correlationId,
      },
      { status: 422 },
    );
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ state: "accepted" }, { status: 202 });
  }

  const email = parsed.email.trim().toLowerCase();
  const bookingNumber = parsed.bookingNumber.trim().toUpperCase();

  const booking = await prisma.booking.findFirst({
    where: {
      bookingNumber,
      user: {
        email,
      },
    },
    select: {
      id: true,
      bookingNumber: true,
      user: {
        select: { name: true },
      },
    },
  });

  if (!booking) {
    logSecurityEvent({
      route: "/api/auth/claim-booking/request",
      event: "AUTH_BOOKING_CLAIM_REQUEST_NO_MATCH",
      correlationId,
    });
    return NextResponse.json({ state: "accepted" }, { status: 202 });
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + CLAIM_TTL_MS);

  const claimStore = (
    prisma as unknown as {
      bookingClaimToken?: {
        deleteMany: (args: { where: { bookingId: string; claimedAt: null } }) => Promise<unknown>;
        create: (args: {
          data: {
            bookingId: string;
            email: string;
            token: string;
            expiresAt: Date;
          };
        }) => Promise<unknown>;
      };
    }
  ).bookingClaimToken;

  if (!claimStore) {
    return NextResponse.json({ state: "accepted" }, { status: 202 });
  }

  await claimStore.deleteMany({ where: { bookingId: booking.id, claimedAt: null } });
  await claimStore.create({
    data: {
      bookingId: booking.id,
      email,
      token,
      expiresAt,
    },
  });

  const appBaseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://zainesstayandplay.com";
  const claimUrl = `${appBaseUrl}/auth/claim-booking?token=${token}`;

  await sendBookingClaimNotification({
    email,
    claimUrl,
    bookingNumber: booking.bookingNumber,
    firstName: booking.user.name?.split(" ")[0] || null,
  });

  return NextResponse.json(
    {
      state: "accepted",
      ...(process.env.NODE_ENV !== "production" ? { claimUrl } : {}),
    },
    { status: 202 },
  );
}
