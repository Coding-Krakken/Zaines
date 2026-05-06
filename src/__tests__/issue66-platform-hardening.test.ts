import { describe, expect, it, beforeEach, vi } from "vitest";
import { createSecurityLogPayload } from "@/lib/security/logging";
import {
  checkRateLimit,
  resetRateLimitBucketsForTests,
} from "@/lib/security/rate-limit";
import { errorResponse, rateLimitedResponse } from "@/lib/security/api";

describe("Issue #66 platform hardening", () => {
  beforeEach(() => {
    resetRateLimitBucketsForTests();
    delete process.env.ENABLE_RATE_LIMIT_IN_TESTS;
  });

  it("redacts sensitive context before structured security logging", () => {
    const payload = createSecurityLogPayload({
      route: "/api/bookings",
      event: "BOOKING_CREATE_FAILED",
      correlationId: "issue66-log",
      error: new Error("email=private@example.com phone=555-123-4567"),
      context: {
        bookingId: "booking-001",
        email: "private@example.com",
        phone: "555-123-4567",
        nested: {
          clientSecret: "pi_123_secret_abc",
          suiteType: "deluxe",
        },
      },
    });

    const serialized = JSON.stringify(payload);
    expect(serialized).toContain("booking-001");
    expect(serialized).toContain("deluxe");
    expect(serialized).not.toContain("private@example.com");
    expect(serialized).not.toContain("555-123-4567");
    expect(serialized).not.toContain("pi_123_secret_abc");
    expect(payload).toEqual(
      expect.objectContaining({
        route: "/api/bookings",
        event: "BOOKING_CREATE_FAILED",
        correlationId: "issue66-log",
        errorType: "Error",
      }),
    );
  });

  it("enforces fixed-window throttles by client and subject", () => {
    const request = new Request("http://localhost/api/auth/magic-link", {
      headers: { "x-forwarded-for": "203.0.113.10" },
    });

    expect(
      checkRateLimit({
        request,
        routeKey: "auth_magic_link",
        limit: 2,
        windowMs: 60_000,
        subject: "owner@example.com",
      }).limited,
    ).toBe(false);
    expect(
      checkRateLimit({
        request,
        routeKey: "auth_magic_link",
        limit: 2,
        windowMs: 60_000,
        subject: "owner@example.com",
      }).limited,
    ).toBe(false);

    const blocked = checkRateLimit({
      request,
      routeKey: "auth_magic_link",
      limit: 2,
      windowMs: 60_000,
      subject: "owner@example.com",
    });

    expect(blocked.limited).toBe(true);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("returns contract-compatible error envelopes with correlation ids", async () => {
    const response = errorResponse({
      status: 503,
      errorCode: "ISSUE66_TEST_ERROR",
      message: "Temporary failure.",
      retryable: true,
      correlationId: "issue66-contract",
      details: { fields: ["bookingId"] },
    });
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      errorCode: "ISSUE66_TEST_ERROR",
      message: "Temporary failure.",
      retryable: true,
      correlationId: "issue66-contract",
      error: "Temporary failure.",
      code: "ISSUE66_TEST_ERROR",
      details: { fields: ["bookingId"] },
    });
  });

  it("returns rate-limit envelopes with Retry-After and no PII log context", async () => {
    process.env.ENABLE_RATE_LIMIT_IN_TESTS = "1";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const request = new Request("http://localhost/api/contact/submissions", {
      headers: { "x-forwarded-for": "198.51.100.8" },
    });

    for (let index = 0; index < 5; index += 1) {
      expect(
        rateLimitedResponse({
          request,
          routeKey: "contact_submit",
          route: "/api/contact/submissions",
          correlationId: "issue66-rate",
          limit: 5,
          windowMs: 60_000,
          errorCode: "CONTACT_RATE_LIMITED",
        }),
      ).toBeNull();
    }

    const blocked = rateLimitedResponse({
      request,
      routeKey: "contact_submit",
      route: "/api/contact/submissions",
      correlationId: "issue66-rate",
      limit: 5,
      windowMs: 60_000,
      errorCode: "CONTACT_RATE_LIMITED",
    });

    expect(blocked).not.toBeNull();
    if (!blocked) throw new Error("Expected rate-limit response");
    const body = await blocked.json();

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toEqual(expect.any(String));
    expect(body).toEqual(
      expect.objectContaining({
        errorCode: "CONTACT_RATE_LIMITED",
        retryable: true,
        correlationId: expect.any(String),
      }),
    );
    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain("taylor@example.com");
    warnSpy.mockRestore();
  });
});
