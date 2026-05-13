import { describe, expect, it } from "vitest";
import { resolvePostRegisterOutcome } from "@/lib/auth/signin-flow";

describe("resolvePostRegisterOutcome", () => {
  it("falls back to sign-in mode when signIn result is missing", () => {
    const outcome = resolvePostRegisterOutcome({
      signInResult: null,
      callbackUrl: "/dashboard",
    });

    expect(outcome).toEqual({
      kind: "fallback_signin",
      mode: "sign_in",
      message: "Account created. Please sign in with your new password.",
    });
  });

  it("falls back to sign-in mode when signIn has an error", () => {
    const outcome = resolvePostRegisterOutcome({
      signInResult: { error: "Invalid credentials", url: "/dashboard" },
      callbackUrl: "/dashboard",
    });

    expect(outcome.kind).toBe("fallback_signin");
  });

  it("redirects to callback when signIn succeeds without explicit url", () => {
    const outcome = resolvePostRegisterOutcome({
      signInResult: { error: null, url: null },
      callbackUrl: "/dashboard/bookings",
    });

    expect(outcome).toEqual({
      kind: "redirect",
      targetUrl: "/dashboard/bookings",
    });
  });

  it("redirects to signIn-provided url when present", () => {
    const outcome = resolvePostRegisterOutcome({
      signInResult: { error: null, url: "/dashboard/security" },
      callbackUrl: "/dashboard",
    });

    expect(outcome).toEqual({
      kind: "redirect",
      targetUrl: "/dashboard/security",
    });
  });
});
