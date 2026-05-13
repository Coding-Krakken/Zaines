import { describe, expect, it } from "vitest";
import {
  getConnectableProviders,
  isLinkedProviderPayload,
  isPreferencePayload,
  withUpdatedPreference,
} from "@/lib/auth/access-preferences-state";

describe("access preferences state helpers", () => {
  it("validates linked provider payload shape", () => {
    expect(
      isLinkedProviderPayload({
        providers: ["google"],
        canLink: ["google", "facebook"],
        hasPasswordCredential: true,
      }),
    ).toBe(true);

    expect(
      isLinkedProviderPayload({
        providers: ["google"],
        canLink: ["facebook"],
      }),
    ).toBe(false);
  });

  it("validates preference payload shape", () => {
    expect(
      isPreferencePayload({
        preferences: {
          bookingStatusEmailsEnabled: true,
          productUpdatesEmailsEnabled: false,
          marketingEmailsEnabled: true,
        },
        lastLoginAt: null,
      }),
    ).toBe(true);

    expect(
      isPreferencePayload({
        preferences: {
          bookingStatusEmailsEnabled: true,
        },
        lastLoginAt: "2026-05-13T12:00:00.000Z",
      }),
    ).toBe(false);
  });

  it("derives connectable providers by excluding already linked ones", () => {
    const result = getConnectableProviders({
      linkedProviders: ["google"],
      linkableProviders: ["google", "facebook", "resend"],
    });

    expect(result).toEqual(["facebook", "resend"]);
  });

  it("returns empty array when no linkable providers are available", () => {
    const result = getConnectableProviders({
      linkedProviders: ["google", "facebook"],
      linkableProviders: [],
    });

    expect(result).toEqual([]);
  });

  it("returns empty array when all linkable providers are already linked", () => {
    const result = getConnectableProviders({
      linkedProviders: ["google", "facebook", "resend"],
      linkableProviders: ["google", "facebook", "resend"],
    });

    expect(result).toEqual([]);
  });

  it("preserves input order for mixed connectable providers", () => {
    const result = getConnectableProviders({
      linkedProviders: ["google"],
      linkableProviders: ["facebook", "google", "resend"],
    });

    expect(result).toEqual(["facebook", "resend"]);
  });

  it("updates a preference key immutably", () => {
    const current = {
      bookingStatusEmailsEnabled: true,
      productUpdatesEmailsEnabled: false,
      marketingEmailsEnabled: false,
    };

    const next = withUpdatedPreference(current, "marketingEmailsEnabled", true);

    expect(next).toEqual({
      bookingStatusEmailsEnabled: true,
      productUpdatesEmailsEnabled: false,
      marketingEmailsEnabled: true,
    });
    expect(current.marketingEmailsEnabled).toBe(false);
  });
});
