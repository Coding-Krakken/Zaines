import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@stripe/stripe-js", () => ({
  loadStripe: vi.fn(async () => ({ /* mock Stripe instance */ })),
}));

describe("stripe-client.ts – getStripe()", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    vi.restoreAllMocks();
  });

  it("returns null when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { getStripe } = await import("@/lib/stripe-client");
    const result = getStripe();
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("publishable key not configured"),
    );
  });

  it("returns a promise when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set", async () => {
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_abc";
    const { getStripe } = await import("@/lib/stripe-client");
    const result = getStripe();
    expect(result).not.toBeNull();
    expect(result).toBeInstanceOf(Promise);
  });

  it("returns the same promise on subsequent calls (cached)", async () => {
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_abc";
    const { getStripe } = await import("@/lib/stripe-client");
    const r1 = getStripe();
    const r2 = getStripe();
    expect(r1).toBe(r2);
  });

  it("isStripeConfigured() returns false when key is not set", async () => {
    const { isStripeConfigured } = await import("@/lib/stripe-client");
    expect(isStripeConfigured()).toBe(false);
  });

  it("isStripeConfigured() returns true when key is set", async () => {
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_abc";
    const { isStripeConfigured } = await import("@/lib/stripe-client");
    expect(isStripeConfigured()).toBe(true);
  });
});
