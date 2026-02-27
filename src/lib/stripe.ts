import Stripe from "stripe";

// Check if Stripe is configured
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.trim().length > 0;
}

let _stripe: Stripe | undefined;

function getStripeInstance(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY environment variable to enable payment processing."
    );
  }
  
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
      typescript: true,
    });
  }
  
  return _stripe;
}

// Export a Proxy that lazily initializes Stripe only when accessed
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const instance = getStripeInstance();
    const value = instance[prop as keyof Stripe];
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(instance);
    }
    return value;
  },
});

// Helper function to format amount for Stripe (cents)
export function formatAmountForStripe(amount: number): number {
  return Math.round(amount * 100);
}

// Helper function to format amount from Stripe (cents to dollars)
export function formatAmountFromStripe(amount: number): number {
  return amount / 100;
}
