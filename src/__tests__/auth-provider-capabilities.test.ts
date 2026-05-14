import { afterEach, describe, expect, it } from "vitest";
import { getAuthProviderCapabilities, getEnabledCapabilityIds } from "@/lib/auth/provider-capabilities";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("auth provider capabilities", () => {
  it("enables only configured providers", () => {
    process.env.GOOGLE_CLIENT_ID = "google-client";
    process.env.GOOGLE_CLIENT_SECRET = "google-secret";
    delete process.env.FACEBOOK_CLIENT_ID;
    delete process.env.FACEBOOK_CLIENT_SECRET;
    process.env.AUTH_ENABLE_PASSWORD_LOGIN = "true";

    const capabilities = getAuthProviderCapabilities({
      hasDatabase: true,
      enablePasswordLogin: true,
      enableGuestFlow: true,
    });

    const byId = new Map(capabilities.map((capability) => [capability.id, capability]));

    expect(byId.get("google")?.enabled).toBe(true);
    expect(byId.get("facebook")?.enabled).toBe(false);
    expect(byId.get("credentials")?.enabled).toBe(true);
    expect(byId.get("guest")?.enabled).toBe(true);
  });

  it("disables password auth without database", () => {
    const capabilities = getAuthProviderCapabilities({
      hasDatabase: false,
      enablePasswordLogin: true,
      enableGuestFlow: true,
    });

    const byId = new Map(capabilities.map((capability) => [capability.id, capability]));

    expect(byId.get("credentials")?.enabled).toBe(false);
    expect(byId.get("credentials")?.reasonDisabled).toBe("database_unavailable");
  });

  it("disables oauth providers when placeholder credentials are present", () => {
    process.env.GOOGLE_CLIENT_ID = "your_google_client_id";
    process.env.GOOGLE_CLIENT_SECRET = "placeholder-secret";

    const capabilities = getAuthProviderCapabilities({
      hasDatabase: true,
      enablePasswordLogin: true,
      enableGuestFlow: true,
    });

    const google = capabilities.find((capability) => capability.id === "google");
    expect(google?.enabled).toBe(false);
    expect(google?.reasonDisabled).toBe("placeholder_credentials");
  });

  it("disables guest and password when feature flags are disabled", () => {
    const capabilities = getAuthProviderCapabilities({
      hasDatabase: true,
      enablePasswordLogin: false,
      enableGuestFlow: false,
    });

    const byId = new Map(capabilities.map((capability) => [capability.id, capability]));

    expect(byId.get("credentials")?.enabled).toBe(false);
    expect(byId.get("credentials")?.reasonDisabled).toBe("password_login_disabled");
    expect(byId.get("guest")?.enabled).toBe(false);
    expect(byId.get("guest")?.reasonDisabled).toBe("guest_flow_disabled");
  });

  it("keeps deterministic capability ordering and static oauth placeholders", () => {
    process.env.GOOGLE_CLIENT_ID = "google-client";
    process.env.GOOGLE_CLIENT_SECRET = "google-secret";
    process.env.FACEBOOK_CLIENT_ID = "facebook-client";
    process.env.FACEBOOK_CLIENT_SECRET = "facebook-secret";

    const capabilities = getAuthProviderCapabilities({
      hasDatabase: true,
      enablePasswordLogin: true,
      enableGuestFlow: true,
    });

    expect(capabilities.map((capability) => capability.id)).toEqual([
      "credentials",
      "google",
      "facebook",
      "apple",
      "microsoft",
      "guest",
    ]);

    const apple = capabilities.find((capability) => capability.id === "apple");
    const microsoft = capabilities.find((capability) => capability.id === "microsoft");

    expect(apple?.enabled).toBe(false);
    expect(apple?.reasonDisabled).toBe("not_implemented_yet");
    expect(microsoft?.enabled).toBe(false);
    expect(microsoft?.reasonDisabled).toBe("not_implemented_yet");
  });

  it("derives enabled capability IDs from mixed capability states", () => {
    const capabilities = getAuthProviderCapabilities({
      hasDatabase: true,
      enablePasswordLogin: true,
      enableGuestFlow: false,
    });

    const enabledIds = getEnabledCapabilityIds(capabilities);

    expect(enabledIds.has("credentials")).toBe(true);
    expect(enabledIds.has("guest")).toBe(false);
    expect(enabledIds.has("apple")).toBe(false);
  });
});
