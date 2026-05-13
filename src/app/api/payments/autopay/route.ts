import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getAdminSettings } from "@/lib/api/admin-settings";
import {
  errorResponse,
  getCorrelationId,
  logServerFailure,
  rateLimitedResponse,
} from "@/lib/security/api";

const consentSchema = z.object({
  enabled: z.boolean(),
  allowIncidentals: z.boolean(),
});

function consentKey(userId: string): string {
  return `payments.autopay_consent.${userId}`;
}

type ConsentPayload = {
  enabled: boolean;
  allowIncidentals: boolean;
  updatedAt: string;
};

function parseConsent(raw: string | null | undefined): ConsentPayload {
  if (!raw) {
    return {
      enabled: false,
      allowIncidentals: false,
      updatedAt: new Date(0).toISOString(),
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ConsentPayload>;
    return {
      enabled: !!parsed.enabled,
      allowIncidentals: !!parsed.allowIncidentals,
      updatedAt: parsed.updatedAt || new Date(0).toISOString(),
    };
  } catch {
    return {
      enabled: false,
      allowIncidentals: false,
      updatedAt: new Date(0).toISOString(),
    };
  }
}

export async function GET(request: NextRequest) {
  const correlationId = getCorrelationId(request);

  try {
    const rateLimit = rateLimitedResponse({
      request,
      routeKey: "payments_autopay_read",
      route: "/api/payments/autopay",
      correlationId,
      limit: 40,
      windowMs: 60_000,
    });
    if (rateLimit) return rateLimit;

    if (!isDatabaseConfigured()) {
      return errorResponse({
        status: 503,
        errorCode: "AUTOPAY_UNAVAILABLE",
        message: "Autopay settings are temporarily unavailable.",
        retryable: true,
        correlationId,
      });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse({
        status: 401,
        errorCode: "AUTH_REQUIRED",
        message: "Authentication required",
        retryable: false,
        correlationId,
      });
    }

    const settings = await getAdminSettings();
    if (!settings.stripeCapabilityFlags.autopayEnabled) {
      return errorResponse({
        status: 403,
        errorCode: "AUTOPAY_DISABLED",
        message: "Autopay is disabled by admin settings.",
        retryable: false,
        correlationId,
      });
    }

    const record = await prisma.settings.findUnique({
      where: { key: consentKey(session.user.id) },
      select: { value: true },
    });

    return NextResponse.json({
      consent: parseConsent(record?.value),
    });
  } catch (error) {
    logServerFailure(
      "/api/payments/autopay",
      "PAYMENTS_AUTOPAY_READ_FAILED",
      correlationId,
      error,
    );

    return errorResponse({
      status: 500,
      errorCode: "PAYMENTS_AUTOPAY_READ_FAILED",
      message: "Failed to load autopay consent.",
      retryable: true,
      correlationId,
    });
  }
}

export async function PUT(request: NextRequest) {
  const correlationId = getCorrelationId(request);

  try {
    const rateLimit = rateLimitedResponse({
      request,
      routeKey: "payments_autopay_write",
      route: "/api/payments/autopay",
      correlationId,
      limit: 20,
      windowMs: 60_000,
    });
    if (rateLimit) return rateLimit;

    if (!isDatabaseConfigured()) {
      return errorResponse({
        status: 503,
        errorCode: "AUTOPAY_UNAVAILABLE",
        message: "Autopay settings are temporarily unavailable.",
        retryable: true,
        correlationId,
      });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse({
        status: 401,
        errorCode: "AUTH_REQUIRED",
        message: "Authentication required",
        retryable: false,
        correlationId,
      });
    }

    const settings = await getAdminSettings();
    if (!settings.stripeCapabilityFlags.autopayEnabled) {
      return errorResponse({
        status: 403,
        errorCode: "AUTOPAY_DISABLED",
        message: "Autopay is disabled by admin settings.",
        retryable: false,
        correlationId,
      });
    }

    const validation = consentSchema.safeParse(await request.json());
    if (!validation.success) {
      return errorResponse({
        status: 400,
        errorCode: "AUTOPAY_VALIDATION_ERROR",
        message: "Invalid autopay consent payload.",
        retryable: false,
        correlationId,
      });
    }

    const consent: ConsentPayload = {
      enabled: validation.data.enabled,
      allowIncidentals: validation.data.allowIncidentals,
      updatedAt: new Date().toISOString(),
    };

    await prisma.settings.upsert({
      where: { key: consentKey(session.user.id) },
      update: { value: JSON.stringify(consent) },
      create: {
        key: consentKey(session.user.id),
        value: JSON.stringify(consent),
      },
    });

    return NextResponse.json({ consent });
  } catch (error) {
    logServerFailure(
      "/api/payments/autopay",
      "PAYMENTS_AUTOPAY_WRITE_FAILED",
      correlationId,
      error,
    );

    return errorResponse({
      status: 500,
      errorCode: "PAYMENTS_AUTOPAY_WRITE_FAILED",
      message: "Failed to save autopay consent.",
      retryable: true,
      correlationId,
    });
  }
}
