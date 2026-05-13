import { describe, expect, it } from "vitest";
import {
  getAuthSessionStrategy,
  isAuthFeatureEnabled,
} from "@/lib/auth/feature-flags";

describe("isAuthFeatureEnabled", () => {
  it("uses default when variable is undefined", () => {
    expect(isAuthFeatureEnabled(undefined, true)).toBe(true);
    expect(isAuthFeatureEnabled(undefined, false)).toBe(false);
  });

  it("disables only when value is false (case-insensitive)", () => {
    expect(isAuthFeatureEnabled("false", true)).toBe(false);
    expect(isAuthFeatureEnabled("FALSE", true)).toBe(false);
    expect(isAuthFeatureEnabled(" False ", true)).toBe(false);
  });

  it("keeps feature enabled for non-false values", () => {
    expect(isAuthFeatureEnabled("true", false)).toBe(true);
    expect(isAuthFeatureEnabled("0", true)).toBe(true);
    expect(isAuthFeatureEnabled("no", true)).toBe(true);
  });
});

describe("getAuthSessionStrategy", () => {
  it("returns database only when database is configured and flag is true", () => {
    expect(
      getAuthSessionStrategy({ hasDatabase: true, databaseSessionsFlag: "true" }),
    ).toBe("database");
  });

  it("returns jwt when flag is not true", () => {
    expect(
      getAuthSessionStrategy({ hasDatabase: true, databaseSessionsFlag: "false" }),
    ).toBe("jwt");
    expect(
      getAuthSessionStrategy({ hasDatabase: true, databaseSessionsFlag: "yes" }),
    ).toBe("jwt");
    expect(
      getAuthSessionStrategy({ hasDatabase: true, databaseSessionsFlag: undefined }),
    ).toBe("jwt");
  });

  it("returns jwt when database is unavailable even if flag is true", () => {
    expect(
      getAuthSessionStrategy({ hasDatabase: false, databaseSessionsFlag: "true" }),
    ).toBe("jwt");
  });
});
