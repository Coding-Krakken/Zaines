"use client";

import { useCallback } from "react";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { startCheckoutSession } from "@/app/actions/stripe";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export default function Checkout({ productId }: { productId: string }) {
  if (!stripePromise) {
    return (
      <p className="text-sm text-destructive" role="alert">
        Checkout is temporarily unavailable. Please try again later.
      </p>
    );
  }

  const startCheckoutSessionForProduct = useCallback(
    async () => {
      const clientSecret = await startCheckoutSession(productId);

      if (!clientSecret) {
        throw new Error(
          "Unable to initialize secure checkout. Please refresh and try again.",
        );
      }

      return clientSecret;
    },
    [productId],
  );

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ fetchClientSecret: startCheckoutSessionForProduct }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
