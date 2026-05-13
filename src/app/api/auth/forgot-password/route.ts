import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getCorrelationId, rateLimitedResponse } from "@/lib/security/api";
import { sendPasswordResetNotification } from "@/lib/notifications";
import { logSecurityEvent } from "@/lib/security/logging";

const forgotSchema = z.object({
  email: z.string().email(),
});

const RESET_TOKEN_TTL_MS = 30 * 60_000;

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  logSecurityEvent({
    route: "/api/auth/forgot-password",
    event: "AUTH_RESET_REQUEST_ATTEMPT",
    correlationId,
  });

  const limitResponse = rateLimitedResponse({
    request,
    routeKey: "auth_forgot_password",
    route: "/api/auth/forgot-password",
    correlationId,
    limit: 5,
    windowMs: 10 * 60_000,
  });
  if (limitResponse) return limitResponse;

  let parsed: z.infer<typeof forgotSchema>;
  try {
    parsed = forgotSchema.parse(await request.json());
  } catch {
    logSecurityEvent({
      route: "/api/auth/forgot-password",
      event: "AUTH_RESET_REQUEST_INVALID",
      correlationId,
      level: "warn",
    });
    return NextResponse.json(
      {
        errorCode: "INVALID_EMAIL",
        message: "Enter a valid email address.",
        retryable: false,
        correlationId,
      },
      { status: 422 },
    );
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        state: "accepted",
        message: "If the account exists, password reset instructions will be sent.",
      },
      { status: 202 },
    );
  }

  const email = parsed.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });

  if (!user?.email) {
    logSecurityEvent({
      route: "/api/auth/forgot-password",
      event: "AUTH_RESET_REQUEST_NO_MATCH",
      correlationId,
    });
    return NextResponse.json(
      {
        state: "accepted",
        message: "If the account exists, password reset instructions will be sent.",
      },
      { status: 202 },
    );
  }

  const credentialStore = (
    prisma as unknown as {
      passwordCredential?: {
        findUnique: (args: { where: { userId: string } }) => Promise<{ userId: string } | null>;
      };
    }
  ).passwordCredential;

  if (!credentialStore) {
    return NextResponse.json(
      {
        state: "accepted",
        message: "If the account exists, password reset instructions will be sent.",
      },
      { status: 202 },
    );
  }

  const credential = await credentialStore.findUnique({ where: { userId: user.id } });
  if (!credential) {
    return NextResponse.json(
      {
        state: "accepted",
        message: "If the account exists, password reset instructions will be sent.",
      },
      { status: 202 },
    );
  }

  const identifier = `password_reset:${email}`;
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.verificationToken.deleteMany({
    where: {
      identifier,
    },
  });

  await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires,
    },
  });

  const appBaseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://zainesstayandplay.com";
  const resetUrl = `${appBaseUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  await sendPasswordResetNotification({
    email,
    resetUrl,
    firstName: user.name?.split(" ")[0] || null,
  });

  return NextResponse.json(
    {
      state: "accepted",
      message: "If the account exists, password reset instructions will be sent.",
      ...(process.env.NODE_ENV !== "production"
        ? {
            resetUrl,
          }
        : {}),
    },
    { status: 202 },
  );
}
