import { afterEach, describe, expect, it } from "vitest";
import { getAuthProviderCapabilities } from "@/lib/auth/provider-capabilities";
import { getAuthRuntimeConfig } from "@/lib/auth/runtime-config";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("auth runtime config parity", () => {
  it("keeps defaults aligned for sign-in surfaces and jwt session strategy", () => {
    delete process.env.AUTH_ENABLE_PASSWORD_LOGIN;
    delete process.env.AUTH_ENABLE_GUEST_FLOW;
    delete process.env.AUTH_ENABLE_DATABASE_SESSIONS;

    const runtime = getAuthRuntimeConfig(true);
    const capabilities = getAuthProviderCapabilities({
      hasDatabase: runtime.hasDatabase,
      enablePasswordLogin: runtime.enablePasswordLogin,
      enableGuestFlow: runtime.enableGuestFlow,
    });

    const byId = new Map(capabilities.map((capability) => [capability.id, capability]));

    expect(runtime.sessionStrategy).toBe("jwt");
    expect(byId.get("credentials")?.enabled).toBe(true);
    expect(byId.get("guest")?.enabled).toBe(true);
  });

  it("aligns disabled password/guest flags with database sessions enabled", () => {
    process.env.AUTH_ENABLE_PASSWORD_LOGIN = "false";
    process.env.AUTH_ENABLE_GUEST_FLOW = "false";
    process.env.AUTH_ENABLE_DATABASE_SESSIONS = "true";

    const runtime = getAuthRuntimeConfig(true);
    const capabilities = getAuthProviderCapabilities({
      hasDatabase: runtime.hasDatabase,
      enablePasswordLogin: runtime.enablePasswordLogin,
      enableGuestFlow: runtime.enableGuestFlow,
    });

    const byId = new Map(capabilities.map((capability) => [capability.id, capability]));

    expect(runtime.sessionStrategy).toBe("database");
    expect(byId.get("credentials")?.enabled).toBe(false);
    expect(byId.get("credentials")?.reasonDisabled).toBe("password_login_disabled");
    expect(byId.get("guest")?.enabled).toBe(false);
    expect(byId.get("guest")?.reasonDisabled).toBe("guest_flow_disabled");
  });

  it("forces jwt strategy and database-disabled capabilities when database is unavailable", () => {
    process.env.AUTH_ENABLE_PASSWORD_LOGIN = "true";
    process.env.AUTH_ENABLE_GUEST_FLOW = "true";
    process.env.AUTH_ENABLE_DATABASE_SESSIONS = "true";
    process.env.AUTH_RESEND_KEY = "resend-key";
    process.env.EMAIL_FROM = "noreply@example.com";

    const runtime = getAuthRuntimeConfig(false);
    const capabilities = getAuthProviderCapabilities({
      hasDatabase: runtime.hasDatabase,
      enablePasswordLogin: runtime.enablePasswordLogin,
      enableGuestFlow: runtime.enableGuestFlow,
    });

    const byId = new Map(capabilities.map((capability) => [capability.id, capability]));

    expect(runtime.sessionStrategy).toBe("jwt");
    expect(byId.get("credentials")?.enabled).toBe(false);
    expect(byId.get("credentials")?.reasonDisabled).toBe("database_unavailable");
    expect(byId.get("resend")?.enabled).toBe(false);
    expect(byId.get("resend")?.reasonDisabled).toBe("database_unavailable");
  });
});
