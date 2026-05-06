import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { signInMock } = vi.hoisted(() => ({
  signInMock: vi.fn(
    async (): Promise<{ ok?: boolean; error?: Error }> => ({ ok: true }),
  ),
}));

vi.mock("@/lib/auth", () => ({
  signIn: signInMock,
}));

import { POST } from "@/app/api/auth/magic-link/route";

function makeRequest(body: unknown, correlationId = "ml-test") {
  return new NextRequest("http://localhost/api/auth/magic-link", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-correlation-id": correlationId,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("magic-link route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Provide valid auth config by default
    process.env.AUTH_RESEND_KEY = "re_test_key";
    process.env.EMAIL_FROM = "noreply@example.com";
  });

  afterEach(() => {
    delete process.env.AUTH_RESEND_KEY;
    delete process.env.EMAIL_FROM;
    delete process.env.RESEND_API_KEY;
  });

  it("returns 422 when body is invalid JSON", async () => {
    const req = new NextRequest("http://localhost/api/auth/magic-link", {
      method: "POST",
      body: "not-json{{",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.errorCode).toBe("INVALID_EMAIL");
  });

  it("returns 422 when email is missing", async () => {
    const res = await POST(makeRequest({ foo: "bar" }));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.errorCode).toBe("INVALID_EMAIL");
  });

  it("returns 422 when email is invalid format", async () => {
    const res = await POST(makeRequest({ email: "not-an-email" }));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.errorCode).toBe("INVALID_EMAIL");
  });

  it("returns 500 when auth is misconfigured (no keys)", async () => {
    delete process.env.AUTH_RESEND_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;

    const res = await POST(
      makeRequest({ email: "user@example.com", intent: "sign_in" }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.errorCode).toBe("AUTH_PROVIDER_MISCONFIGURED");
  });

  it("returns 500 when EMAIL_FROM is missing", async () => {
    delete process.env.EMAIL_FROM;

    const res = await POST(
      makeRequest({ email: "user@example.com", intent: "sign_in" }),
    );
    expect(res.status).toBe(500);
  });

  it("returns 202 on successful sign-in link dispatch", async () => {
    signInMock.mockResolvedValueOnce({ ok: true });

    const res = await POST(
      makeRequest({ email: "user@example.com", intent: "sign_in" }),
    );
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.state).toBe("sent");
  });

  it("uses manage_booking callbackUrl when intent is manage_booking", async () => {
    signInMock.mockResolvedValueOnce({ ok: true });

    const res = await POST(
      makeRequest({ email: "user@example.com", intent: "manage_booking" }),
    );
    expect(res.status).toBe(202);
    expect(signInMock).toHaveBeenCalledWith(
      "resend",
      expect.objectContaining({ callbackUrl: "/dashboard/bookings" }),
    );
  });

  it("uses /dashboard callbackUrl when intent is sign_in", async () => {
    signInMock.mockResolvedValueOnce({ ok: true });

    const res = await POST(
      makeRequest({ email: "user@example.com", intent: "sign_in" }),
    );
    expect(res.status).toBe(202);
    expect(signInMock).toHaveBeenCalledWith(
      "resend",
      expect.objectContaining({ callbackUrl: "/dashboard" }),
    );
  });

  it("returns 500 when signIn returns an error object (misconfigured)", async () => {
    signInMock.mockResolvedValueOnce({
      error: new Error("resend configuration failed"),
    });

    const res = await POST(
      makeRequest({ email: "user@example.com", intent: "sign_in" }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.errorCode).toBe("AUTH_PROVIDER_MISCONFIGURED");
    expect(body.retryable).toBe(false);
  });

  it("returns 500 when signIn returns an error object (transient)", async () => {
    signInMock.mockResolvedValueOnce({ error: new Error("network timeout") });

    const res = await POST(
      makeRequest({ email: "user@example.com", intent: "sign_in" }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.errorCode).toBe("AUTH_TRANSIENT_FAILURE");
    expect(body.retryable).toBe(true);
  });

  it("returns 500 when signIn throws (misconfigured error)", async () => {
    signInMock.mockRejectedValueOnce(new Error("resend configuration failed"));

    const res = await POST(
      makeRequest({ email: "user@example.com", intent: "sign_in" }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.errorCode).toBe("AUTH_PROVIDER_MISCONFIGURED");
  });

  it("returns 500 when signIn throws (transient error)", async () => {
    signInMock.mockRejectedValueOnce(new Error("connection reset"));

    const res = await POST(
      makeRequest({ email: "user@example.com", intent: "sign_in" }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.errorCode).toBe("AUTH_TRANSIENT_FAILURE");
    expect(body.retryable).toBe(true);
  });

  it("accepts RESEND_API_KEY as alternative to AUTH_RESEND_KEY", async () => {
    delete process.env.AUTH_RESEND_KEY;
    process.env.RESEND_API_KEY = "re_test_key";
    signInMock.mockResolvedValueOnce({ ok: true });

    const res = await POST(
      makeRequest({ email: "user@example.com", intent: "sign_in" }),
    );
    expect(res.status).toBe(202);
  });
});
