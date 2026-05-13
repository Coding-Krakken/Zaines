import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { requireFinanceAccess } from "@/lib/api/admin-finance-auth";
import { type FinanceAutopayConsentSummaryResponse } from "@/types/finance";
import {
  errorResponse,
  getCorrelationId,
  logServerFailure,
  rateLimitedResponse,
} from "@/lib/security/api";

type SettingsRecord = {
  key: string;
  value: string;
  updatedAt: Date;
};

type UserRecord = {
  id: string;
  name: string | null;
  email: string | null;
};

type AutopayConsentPayload = {
  enabled?: unknown;
  allowIncidentals?: unknown;
};

function parseConsent(value: string): { enabled: boolean; allowIncidentals: boolean } {
  try {
    const parsed = JSON.parse(value) as AutopayConsentPayload;
    return {
      enabled: parsed.enabled === true,
      allowIncidentals: parsed.allowIncidentals === true,
    };
  } catch {
    return {
      enabled: false,
      allowIncidentals: false,
    };
  }
}

function extractUserId(key: string): string {
  const prefix = "payments.autopay_consent.";
  return key.startsWith(prefix) ? key.slice(prefix.length) : key;
}

export async function GET(request: NextRequest) {
  const correlationId = getCorrelationId(request);

  try {
    const rateLimit = rateLimitedResponse({
      request,
      routeKey: "admin_finance_autopay_consents",
      route: "/api/admin/finance/autopay-consents",
      correlationId,
      limit: 60,
      windowMs: 60_000,
    });
    if (rateLimit) return rateLimit;

    const access = await requireFinanceAccess("read");
    if (access.response) return access.response;

    if (!isDatabaseConfigured()) {
      return errorResponse({
        status: 503,
        errorCode: "PAYMENT_PERSISTENCE_UNAVAILABLE",
        message: "Database unavailable",
        retryable: true,
        correlationId,
      });
    }

    const settingsClient = prisma.settings as unknown as {
      findMany: (args: {
        where: { key: { startsWith: string } };
        orderBy: { updatedAt: "desc" };
      }) => Promise<SettingsRecord[]>;
    };

    const records = await settingsClient.findMany({
      where: {
        key: {
          startsWith: "payments.autopay_consent.",
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const userIds = Array.from(
      new Set(records.map((record) => extractUserId(record.key))),
    );

    const userClient = prisma.user as unknown as {
      findMany: (args: {
        where: { id: { in: string[] } };
        select: { id: true; name: true; email: true };
      }) => Promise<UserRecord[]>;
    };

    const users =
      userIds.length > 0
        ? await userClient.findMany({
            where: {
              id: {
                in: userIds,
              },
            },
            select: {
              id: true,
              name: true,
              email: true,
            },
          })
        : [];

    const usersById = new Map(users.map((user) => [user.id, user]));

    const rows = records.map((record) => {
      const userId = extractUserId(record.key);
      const user = usersById.get(userId);
      const searchToken = user?.email || user?.name || userId;
      const consent = parseConsent(record.value);
      return {
        userId,
        customerName: user?.name || null,
        customerEmail: user?.email || null,
        bookingsSearchHref: `/admin/bookings?search=${encodeURIComponent(searchToken)}`,
        enabled: consent.enabled,
        allowIncidentals: consent.allowIncidentals,
        updatedAt: record.updatedAt.toISOString(),
      };
    });

    const response: FinanceAutopayConsentSummaryResponse = {
      generatedAt: new Date().toISOString(),
      totals: {
        profiles: rows.length,
        enabled: rows.filter((row) => row.enabled).length,
        incidentalsAuthorized: rows.filter((row) => row.allowIncidentals).length,
      },
      rows,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logServerFailure(
      "/api/admin/finance/autopay-consents",
      "ADMIN_FINANCE_AUTOPAY_CONSENTS_FAILED",
      correlationId,
      error,
    );
    return errorResponse({
      status: 500,
      errorCode: "ADMIN_FINANCE_AUTOPAY_CONSENTS_FAILED",
      message: "Failed to load autopay consent summary",
      retryable: true,
      correlationId,
    });
  }
}
