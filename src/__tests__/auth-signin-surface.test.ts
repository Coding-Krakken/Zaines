import { describe, expect, it } from "vitest";
import { deriveSignInSurface } from "@/lib/auth/signin-surface";

describe("deriveSignInSurface", () => {
  it("shows only configured and enabled oauth providers", () => {
    const surface = deriveSignInSurface({
      capabilities: [
        { id: "google", kind: "oauth", label: "Continue with Google", enabled: true },
        { id: "facebook", kind: "oauth", label: "Continue with Facebook", enabled: true },
      ],
      providerIds: new Set(["google"]),
    });

    expect(surface.oauthProviders.map((provider) => provider.id)).toEqual(["google"]);
  });

  it("enables magic-link and credentials only when capability and provider are both present", () => {
    const surface = deriveSignInSurface({
      capabilities: [
        { id: "resend", kind: "passwordless", label: "Email me a magic link", enabled: true },
        {
          id: "credentials",
          kind: "credentials",
          label: "Sign in with email and password",
          enabled: true,
        },
      ],
      providerIds: new Set(["resend"]),
    });

    expect(surface.hasMagicLink).toBe(true);
    expect(surface.hasCredentials).toBe(false);
  });

  it("hides guest checkout when guest capability is disabled", () => {
    const surface = deriveSignInSurface({
      capabilities: [
        { id: "guest", kind: "guest", label: "Continue as guest", enabled: false },
      ],
      providerIds: new Set(),
    });

    expect(surface.hasGuest).toBe(false);
  });

  it("enables all sign-in surfaces when all required providers and capabilities are available", () => {
    const surface = deriveSignInSurface({
      capabilities: [
        { id: "google", kind: "oauth", label: "Continue with Google", enabled: true },
        { id: "resend", kind: "passwordless", label: "Email me a magic link", enabled: true },
        {
          id: "credentials",
          kind: "credentials",
          label: "Sign in with email and password",
          enabled: true,
        },
        { id: "guest", kind: "guest", label: "Continue as guest", enabled: true },
      ],
      providerIds: new Set(["google", "resend", "credentials"]),
    });

    expect(surface.oauthProviders.map((provider) => provider.id)).toEqual(["google"]);
    expect(surface.hasMagicLink).toBe(true);
    expect(surface.hasCredentials).toBe(true);
    expect(surface.hasGuest).toBe(true);
  });
});
