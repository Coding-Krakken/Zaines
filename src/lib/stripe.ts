import Stripe from "stripe";

const STRIPE_API_VERSION = "2026-04-22.dahlia";

type StripeKeyMode = "test" | "live" | "unknown";

function getKeyMode(key: string | undefined): StripeKeyMode {
  if (!key) return "unknown";
  if (key.startsWith("sk_test_") || key.startsWith("pk_test_")) return "test";
  if (key.startsWith("sk_live_") || key.startsWith("pk_live_")) return "live";
  return "unknown";
}

// Check if Stripe is configured
export function isStripeConfigured(): boolean {
  return (
    !!process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_SECRET_KEY.trim().length > 0
  );
}

export function getConfiguredStripeApiVersion(): string {
  return STRIPE_API_VERSION;
}

export function areStripeKeysModeAligned(): boolean {
  const secretMode = getKeyMode(process.env.STRIPE_SECRET_KEY);
  const publishableMode = getKeyMode(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

  if (secretMode === "unknown" || publishableMode === "unknown") {
    return true;
  }

  return secretMode === publishableMode;
}

let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe {
  if (stripeClient) return stripeClient;

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION as Stripe.LatestApiVersion,
  });

  return stripeClient;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripeClient();
    const value = Reflect.get(client as object, prop);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
}) as Stripe;

// Helper function to format amount for Stripe (cents)
export function formatAmountForStripe(amount: number): number {
  return Math.round(amount * 100);
}

// Helper function to format amount from Stripe (cents to dollars)
export function formatAmountFromStripe(amount: number): number {
  return amount / 100;
}
