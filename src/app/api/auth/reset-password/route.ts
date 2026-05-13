import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { getCorrelationId, rateLimitedResponse } from "@/lib/security/api";
import { logSecurityEvent } from "@/lib/security/logging";

const resetSchema = z.object({
  email: z.string().email(),
  token: z.string().min(20).max(256),
  password: z.string().min(10).max(128),
});

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  logSecurityEvent({
    route: "/api/auth/reset-password",
    event: "AUTH_RESET_CONFIRM_ATTEMPT",
    correlationId,
  });

  const limitResponse = rateLimitedResponse({
    request,
    routeKey: "auth_reset_password",
    route: "/api/auth/reset-password",
    correlationId,
    limit: 8,
    windowMs: 10 * 60_000,
  });
  if (limitResponse) return limitResponse;

  let parsed: z.infer<typeof resetSchema>;
  try {
    parsed = resetSchema.parse(await request.json());
  } catch {
    logSecurityEvent({
      route: "/api/auth/reset-password",
      event: "AUTH_RESET_CONFIRM_INVALID_PAYLOAD",
      correlationId,
      level: "warn",
    });
    return NextResponse.json(
      {
        errorCode: "INVALID_RESET_REQUEST",
        message: "Invalid reset request.",
        retryable: false,
        correlationId,
      },
      { status: 422 },
    );
  }

  const strengthError = validatePasswordStrength(parsed.password);
  if (strengthError) {
    logSecurityEvent({
      route: "/api/auth/reset-password",
      event: "AUTH_RESET_CONFIRM_WEAK_PASSWORD",
      correlationId,
      level: "warn",
    });
    return NextResponse.json(
      {
        errorCode: "WEAK_PASSWORD",
        message: strengthError,
        retryable: false,
        correlationId,
      },
      { status: 422 },
    );
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        errorCode: "AUTH_PERSISTENCE_UNAVAILABLE",
        message: "Password reset is temporarily unavailable. Please retry.",
        retryable: true,
        correlationId,
      },
      { status: 503 },
    );
  }

  const email = parsed.email.trim().toLowerCase();
  const identifier = `password_reset:${email}`;

  const tokenRecord = await prisma.verificationToken.findFirst({
    where: {
      identifier,
      token: parsed.token,
    },
    orderBy: {
      expires: "desc",
    },
  });

  if (!tokenRecord || tokenRecord.expires.getTime() < Date.now()) {
    logSecurityEvent({
      route: "/api/auth/reset-password",
      event: "AUTH_RESET_CONFIRM_TOKEN_INVALID",
      correlationId,
      level: "warn",
    });
    return NextResponse.json(
      {
        errorCode: "RESET_TOKEN_INVALID",
        message: "This reset link is invalid or has expired.",
        retryable: false,
        correlationId,
      },
      { status: 422 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    logSecurityEvent({
      route: "/api/auth/reset-password",
      event: "AUTH_RESET_CONFIRM_USER_MISSING",
      correlationId,
      level: "warn",
    });
    return NextResponse.json(
      {
        errorCode: "RESET_TOKEN_INVALID",
        message: "This reset link is invalid or has expired.",
        retryable: false,
        correlationId,
      },
      { status: 422 },
    );
  }

  const credentialStore = (
    prisma as unknown as {
      passwordCredential?: {
        upsert: (args: {
          where: { userId: string };
          create: {
            userId: string;
            passwordHash: string;
            passwordUpdatedAt: Date;
            failedAttempts: number;
            lockedUntil: null;
          };
          update: {
            passwordHash: string;
            passwordUpdatedAt: Date;
            failedAttempts: number;
            lockedUntil: null;
          };
        }) => Promise<unknown>;
      };
    }
  ).passwordCredential;

  if (!credentialStore) {
    return NextResponse.json(
      {
        errorCode: "AUTH_SCHEMA_NOT_READY",
        message: "Password reset is temporarily unavailable. Please retry.",
        retryable: true,
        correlationId,
      },
      { status: 503 },
    );
  }

  const passwordHash = hashPassword(parsed.password);

  await credentialStore.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      passwordHash,
      passwordUpdatedAt: new Date(),
      failedAttempts: 0,
      lockedUntil: null,
    },
    update: {
      passwordHash,
      passwordUpdatedAt: new Date(),
      failedAttempts: 0,
      lockedUntil: null,
    },
  });

  await prisma.verificationToken.deleteMany({
    where: {
      identifier,
    },
  });

  return NextResponse.json(
    {
      state: "password_reset_complete",
      message: "Your password has been updated.",
    },
    { status: 200 },
  );
}
