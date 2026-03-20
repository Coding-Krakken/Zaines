import { beforeEach, afterEach, describe, expect, it } from "vitest";

describe("stripe.ts pure functions", () => {
  let isStripeConfigured: () => boolean;
  let formatAmountForStripe: (amount: number) => number;
  let formatAmountFromStripe: (amount: number) => number;

  beforeEach(async () => {
    // Reset module registry to allow fresh env-based evaluation
    const mod = await import("@/lib/stripe");
    isStripeConfigured = mod.isStripeConfigured;
    formatAmountForStripe = mod.formatAmountForStripe;
    formatAmountFromStripe = mod.formatAmountFromStripe;
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
  });

  describe("isStripeConfigured()", () => {
    it("returns false when STRIPE_SECRET_KEY is not set", () => {
      delete process.env.STRIPE_SECRET_KEY;
      expect(isStripeConfigured()).toBe(false);
    });

    it("returns true when STRIPE_SECRET_KEY is set", () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_abc123";
      expect(isStripeConfigured()).toBe(true);
    });

    it("returns false when STRIPE_SECRET_KEY is an empty string", () => {
      process.env.STRIPE_SECRET_KEY = "";
      expect(isStripeConfigured()).toBe(false);
    });

    it("returns false when STRIPE_SECRET_KEY is only whitespace", () => {
      process.env.STRIPE_SECRET_KEY = "   ";
      expect(isStripeConfigured()).toBe(false);
    });
  });

  describe("formatAmountForStripe()", () => {
    it("converts dollars to cents (integer)", () => {
      expect(formatAmountForStripe(10)).toBe(1000);
    });

    it("rounds fractional cents correctly", () => {
      expect(formatAmountForStripe(9.999)).toBe(1000);
    });

    it("handles zero", () => {
      expect(formatAmountForStripe(0)).toBe(0);
    });

    it("handles large amounts", () => {
      expect(formatAmountForStripe(1500)).toBe(150000);
    });

    it("rounds fractional dollar amounts to nearest cent", () => {
      // 1.006 * 100 = 100.6 → rounds to 101
      expect(formatAmountForStripe(1.006)).toBe(101);
    });
  });

  describe("formatAmountFromStripe()", () => {
    it("converts cents to dollars", () => {
      expect(formatAmountFromStripe(1000)).toBe(10);
    });

    it("handles zero", () => {
      expect(formatAmountFromStripe(0)).toBe(0);
    });

    it("handles large cent amounts", () => {
      expect(formatAmountFromStripe(150000)).toBe(1500);
    });

    it("preserves fractional cents", () => {
      expect(formatAmountFromStripe(101)).toBeCloseTo(1.01);
    });
  });
});
