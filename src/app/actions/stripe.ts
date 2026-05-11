"use server";

import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";

type CheckoutProduct = {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
};

async function getProduct(productId: string): Promise<CheckoutProduct> {
  void headers();

  // TODO: Replace this placeholder with a real product catalog lookup.
  throw new Error(`Product lookup is not implemented for productId: ${productId}`);
}

export async function startCheckoutSession(productId: string) {
  const product = await getProduct(productId);

  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    redirect_on_completion: "never",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceInCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
  });

  return session.client_secret;
}
