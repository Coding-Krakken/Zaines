import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { getCorrelationId, rateLimitedResponse } from "@/lib/security/api";
import { logSecurityEvent } from "@/lib/security/logging";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10).max(128),
  name: z.string().trim().min(2).max(80).optional(),
});

function publicError(params: {
  message: string;
  correlationId: string;
  code: string;
  retryable?: boolean;
}) {
  return {
    errorCode: params.code,
    message: params.message,
    retryable: Boolean(params.retryable),
    correlationId: params.correlationId,
  };
}

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  logSecurityEvent({
    route: "/api/auth/register",
    event: "AUTH_REGISTER_ATTEMPT",
    correlationId,
  });

  if (process.env.AUTH_ENABLE_PASSWORD_LOGIN === "false") {
    return NextResponse.json(
      publicError({
        code: "PASSWORD_AUTH_DISABLED",
        message: "Email and password sign-in is currently unavailable.",
        correlationId,
      }),
      { status: 403 },
    );
  }

  const limitResponse = rateLimitedResponse({
    request,
    routeKey: "auth_register",
    route: "/api/auth/register",
    correlationId,
    limit: 6,
    windowMs: 10 * 60_000,
  });
  if (limitResponse) {
    logSecurityEvent({
      route: "/api/auth/register",
      event: "AUTH_REGISTER_RATE_LIMITED",
      correlationId,
      level: "warn",
    });
    return limitResponse;
  }

  let parsedBody: z.infer<typeof registerSchema>;
  try {
    parsedBody = registerSchema.parse(await request.json());
  } catch {
    logSecurityEvent({
      route: "/api/auth/register",
      event: "AUTH_REGISTER_VALIDATION_FAILED",
      correlationId,
      level: "warn",
    });
    return NextResponse.json(
      publicError({
        code: "INVALID_REGISTRATION_INPUT",
        message: "Enter a valid name, email, and password.",
        correlationId,
      }),
      { status: 422 },
    );
  }

  const strengthIssue = validatePasswordStrength(parsedBody.password);
  if (strengthIssue) {
    logSecurityEvent({
      route: "/api/auth/register",
      event: "AUTH_REGISTER_WEAK_PASSWORD",
      correlationId,
      level: "warn",
    });
    return NextResponse.json(
      publicError({
        code: "WEAK_PASSWORD",
        message: strengthIssue,
        correlationId,
      }),
      { status: 422 },
    );
  }

  if (!isDatabaseConfigured()) {
    logSecurityEvent({
      route: "/api/auth/register",
      event: "AUTH_REGISTER_PERSISTENCE_UNAVAILABLE",
      correlationId,
      level: "warn",
    });
    return NextResponse.json(
      publicError({
        code: "AUTH_PERSISTENCE_UNAVAILABLE",
        message: "Account creation is temporarily unavailable. Please retry.",
        correlationId,
        retryable: true,
      }),
      { status: 503 },
    );
  }

  const email = parsedBody.email.trim().toLowerCase();
  const displayName = parsedBody.name?.trim() || email.split("@")[0] || "Customer";

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      logSecurityEvent({
        route: "/api/auth/register",
        event: "AUTH_REGISTER_EXISTS",
        correlationId,
        level: "warn",
      });
      return NextResponse.json(
        publicError({
          code: "ACCOUNT_ALREADY_EXISTS",
          message: "An account with that email already exists.",
          correlationId,
        }),
        { status: 409 },
      );
    }

    const passwordHash = hashPassword(parsedBody.password);

    const user = await prisma.user.create({
      data: {
        email,
        name: displayName,
        role: "customer",
      },
      select: { id: true, email: true, name: true },
    });

    const credentialStore = (
      prisma as unknown as {
        passwordCredential?: {
          create: (args: {
            data: {
              userId: string;
              passwordHash: string;
              passwordUpdatedAt: Date;
            };
          }) => Promise<unknown>;
        };
      }
    ).passwordCredential;

    if (!credentialStore) {
      return NextResponse.json(
        publicError({
          code: "AUTH_SCHEMA_NOT_READY",
          message: "Account setup is temporarily unavailable. Please retry.",
          correlationId,
          retryable: true,
        }),
        { status: 503 },
      );
    }

    await credentialStore.create({
      data: {
        userId: user.id,
        passwordHash,
        passwordUpdatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        state: "registered",
        user,
      },
      { status: 201 },
    );
  } catch {
    logSecurityEvent({
      route: "/api/auth/register",
      event: "AUTH_REGISTER_FAILED",
      correlationId,
      level: "error",
    });
    return NextResponse.json(
      publicError({
        code: "AUTH_REGISTRATION_FAILED",
        message: "Account creation is temporarily unavailable. Please retry.",
        correlationId,
        retryable: true,
      }),
      { status: 500 },
    );
  }
}
