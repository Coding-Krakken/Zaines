import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";

vi.mock("@/lib/auth", () => ({ signIn: vi.fn() }));
vi.mock("@/lib/api/issue26", () => ({
  getCorrelationId: vi.fn(() => "cid-test-auth"),
  logServerFailure: vi.fn(),
  magicLinkRequestSchema: {
    safeParse: (input: { email?: string; intent?: string }) => {
      const email = typeof input?.email === "string" ? input.email : "";
      const intent = input?.intent;
      const valid = /.+@.+\..+/.test(email) && (intent === "sign_in" || intent === "manage_booking");
      return valid ? { success: true, data: input } : { success: false, error: {} };
    },
  },
}));

describe("POST /api/auth/magic-link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_RESEND_KEY = "";
    process.env.RESEND_API_KEY = "";
    process.env.EMAIL_FROM = "";
  });

  it("returns INVALID_EMAIL for malformed payload", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/magic-link", {
      method: "POST",
      body: JSON.stringify({ email: "bad", intent: "sign_in" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.errorCode).toBe("INVALID_EMAIL");
  });

  it("returns support-safe misconfiguration contract", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/magic-link", {
      method: "POST",
      body: JSON.stringify({ email: "owner@example.com", intent: "sign_in" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.errorCode).toBe("AUTH_PROVIDER_MISCONFIGURED");
  });
});