import "server-only";

import Stripe from "stripe";

const STRIPE_API_VERSION = "2026-04-22.dahlia";

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

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: STRIPE_API_VERSION as Stripe.LatestApiVersion,
});

// Helper function to format amount for Stripe (cents)
export function formatAmountForStripe(amount: number): number {
  return Math.round(amount * 100);
}

// Helper function to format amount from Stripe (cents to dollars)
export function formatAmountFromStripe(amount: number): number {
  return amount / 100;
}
