import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { isDatabaseConfiguredMock } = vi.hoisted(() => ({
  isDatabaseConfiguredMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  isDatabaseConfigured: isDatabaseConfiguredMock,
}));

import { GET } from "@/app/api/auth/capabilities/route";

type Capability = {
  id: string;
  enabled: boolean;
  reasonDisabled?: string;
};

const originalEnv = { ...process.env };

describe("auth capabilities route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.AUTH_SECRET = "test-auth-secret";
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.FACEBOOK_CLIENT_ID;
    delete process.env.FACEBOOK_CLIENT_SECRET;
    delete process.env.AUTH_RESEND_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    delete process.env.AUTH_ENABLE_PASSWORD_LOGIN;
    delete process.env.AUTH_ENABLE_GUEST_FLOW;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns capabilities payload with expected defaults", async () => {
    isDatabaseConfiguredMock.mockReturnValueOnce(true);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body.capabilities)).toBe(true);
    expect(typeof body.generatedAt).toBe("string");
    expect(body.authOperational).toBe(true);
    expect(body.authIssues).toEqual([]);

    const byId = new Map<string, Capability>(
      (body.capabilities as Capability[]).map((capability) => [
        capability.id,
        capability,
      ]),
    );

    expect(byId.get("credentials")?.enabled).toBe(true);
    expect(byId.get("guest")?.enabled).toBe(true);
    expect(byId.get("resend")?.enabled).toBe(false);
  });

  it("reflects configured providers and disabled feature flags", async () => {
    isDatabaseConfiguredMock.mockReturnValueOnce(true);
    process.env.GOOGLE_CLIENT_ID = "google-client";
    process.env.GOOGLE_CLIENT_SECRET = "google-secret";
    process.env.AUTH_RESEND_KEY = "resend-key";
    process.env.EMAIL_FROM = "noreply@example.com";
    process.env.AUTH_ENABLE_PASSWORD_LOGIN = "false";
    process.env.AUTH_ENABLE_GUEST_FLOW = "false";

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);

    const byId = new Map<string, Capability>(
      (body.capabilities as Capability[]).map((capability) => [
        capability.id,
        capability,
      ]),
    );

    expect(byId.get("google")?.enabled).toBe(true);
    expect(byId.get("resend")?.enabled).toBe(true);
    expect(byId.get("credentials")?.enabled).toBe(false);
    expect(byId.get("credentials")?.reasonDisabled).toBe("password_login_disabled");
    expect(byId.get("guest")?.enabled).toBe(false);
    expect(byId.get("guest")?.reasonDisabled).toBe("guest_flow_disabled");
    expect(body.authOperational).toBe(true);
    expect(body.authIssues).toEqual([]);
  });

  it("treats non-false feature flag strings as enabled", async () => {
    isDatabaseConfiguredMock.mockReturnValueOnce(true);
    process.env.AUTH_ENABLE_PASSWORD_LOGIN = "0";
    process.env.AUTH_ENABLE_GUEST_FLOW = "yes";

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);

    const byId = new Map<string, Capability>(
      (body.capabilities as Capability[]).map((capability) => [
        capability.id,
        capability,
      ]),
    );

    expect(byId.get("credentials")?.enabled).toBe(true);
    expect(byId.get("guest")?.enabled).toBe(true);
    expect(body.authOperational).toBe(true);
    expect(body.authIssues).toEqual([]);
  });

  it("disables database-dependent providers when database is unavailable", async () => {
    isDatabaseConfiguredMock.mockReturnValueOnce(false);
    process.env.AUTH_RESEND_KEY = "resend-key";
    process.env.EMAIL_FROM = "noreply@example.com";

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);

    const byId = new Map<string, Capability>(
      (body.capabilities as Capability[]).map((capability) => [
        capability.id,
        capability,
      ]),
    );

    expect(byId.get("resend")?.enabled).toBe(false);
    expect(byId.get("resend")?.reasonDisabled).toBe("database_unavailable");
    expect(byId.get("credentials")?.enabled).toBe(false);
    expect(byId.get("credentials")?.reasonDisabled).toBe("database_unavailable");
    expect(body.authOperational).toBe(false);
    expect(body.authIssues).toContain("no_auth_provider_enabled");
  });

  it("reports non-operational auth when secret is missing", async () => {
    isDatabaseConfiguredMock.mockReturnValueOnce(true);
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.authOperational).toBe(false);
    expect(body.authIssues).toContain("missing_auth_secret");
  });
});
