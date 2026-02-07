import Stripe from "stripe";

// Allow CI/build environments to skip strict env validation using
// `SKIP_ENV_VALIDATION`. When skipping, building should not throw on import.
const rawSkip = process.env.SKIP_ENV_VALIDATION;
const skipValidation =
  typeof rawSkip === "string" && rawSkip.length > 0 && !["0", "false", "no"].includes(rawSkip.toLowerCase());

let _stripe: Stripe | undefined;

function createStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    if (process.env.NODE_ENV === "development" || skipValidation) {
      // During development or when explicitly skipping validation, don't
      // throw at import time — callers will receive a clear runtime error
      // if they attempt to use the client.
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-01-28.clover",
    typescript: true,
  });
}

function getStripe(): Stripe {
  if (!_stripe) {
    try {
      _stripe = createStripeClient();
    } catch (e) {
      // Defer throwing until runtime usage; continue returning an undefined
      // internal client so the proxy can provide a nicer error if invoked.
      _stripe = undefined;
    }
  }
  return _stripe as unknown as Stripe;
}

const stripeProxy = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getStripe();
      if (!client) {
        return () => {
          throw new Error(
            "STRIPE_SECRET_KEY not configured — stripe operations are disabled. Set STRIPE_SECRET_KEY to enable payments."
          );
        };
      }
      const value = (client as any)[prop];
      if (typeof value === "function") {
        return (...args: any[]) => value.apply(client, args);
      }
      return value;
    },
  }
);

export const stripe: Stripe = stripeProxy as unknown as Stripe;

// Helper function to format amount for Stripe (cents)
export function formatAmountForStripe(amount: number): number {
  return Math.round(amount * 100);
}

// Helper function to format amount from Stripe (cents to dollars)
export function formatAmountFromStripe(amount: number): number {
  return amount / 100;
}
