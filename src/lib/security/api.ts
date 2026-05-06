import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { logSecurityEvent } from "@/lib/security/logging";
import { checkRateLimit } from "@/lib/security/rate-limit";

export type PublicErrorEnvelope = {
  errorCode: string;
  message: string;
  retryable: boolean;
  correlationId: string;
};

export function getCorrelationId(request: Request): string {
  const supplied = request.headers.get("x-correlation-id")?.trim();
  return supplied || randomUUID();
}

export function publicErrorEnvelope(params: PublicErrorEnvelope) {
  return {
    errorCode: params.errorCode,
    message: params.message,
    retryable: params.retryable,
    correlationId: params.correlationId,
  };
}

export function errorResponse(
  params: PublicErrorEnvelope & {
    status: number;
    headers?: HeadersInit;
    details?: Record<string, unknown>;
  },
) {
  return NextResponse.json(
    {
      ...publicErrorEnvelope(params),
      error: params.message,
      code: params.errorCode,
      ...(params.details ? { details: params.details } : {}),
    },
    { status: params.status, headers: params.headers },
  );
}

export function rateLimitedResponse(params: {
  request: Request;
  routeKey: string;
  route: string;
  correlationId: string;
  limit: number;
  windowMs: number;
  subject?: string | null;
  errorCode?: string;
}): NextResponse<PublicErrorEnvelope> | null {
  if (
    process.env.NODE_ENV === "test" &&
    process.env.ENABLE_RATE_LIMIT_IN_TESTS !== "1"
  ) {
    return null;
  }

  const result = checkRateLimit(params);

  if (!result.limited) {
    return null;
  }

  const retryAfter = String(result.retryAfterSeconds ?? 60);
  logSecurityEvent({
    route: params.route,
    event: "RATE_LIMITED",
    correlationId: params.correlationId,
    level: "warn",
    context: { routeKey: params.routeKey, retryAfter },
  });

  return errorResponse({
    status: 429,
    errorCode: params.errorCode ?? "RATE_LIMITED",
    message: "Too many attempts. Please wait and try again.",
    retryable: true,
    correlationId: params.correlationId,
    headers: { "Retry-After": retryAfter },
  });
}

export function logServerFailure(
  route: string,
  errorCode: string,
  correlationId: string,
  error: unknown,
): void {
  console.error(
    JSON.stringify({
      route,
      errorCode,
      correlationId,
      errorType: error instanceof Error ? error.name : "unknown_error",
    }),
  );
}
