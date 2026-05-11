"use server";

import { stripe } from "@/lib/stripe";
import { getAdminSettings } from "@/lib/api/admin-settings";
import { getNightlyRate } from "@/lib/booking/pricing";

type CheckoutProduct = {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
};

async function getProduct(productId: string): Promise<CheckoutProduct> {
  const normalizedId = productId.trim().toLowerCase();
  const adminSettings = await getAdminSettings();
  const serviceTier = adminSettings.serviceSettings.serviceTiers.find((tier) => {
    const tierId = tier.id.trim().toLowerCase();
    const tierName = tier.name.trim().toLowerCase();

    return (
      tierId === normalizedId ||
      tierName === normalizedId ||
      tierName.includes(normalizedId)
    );
  });

  if (!serviceTier) {
    throw new Error(`Unknown productId: ${productId}`);
  }

  const nightlyRate = getNightlyRate(
    serviceTier.id,
    adminSettings.serviceSettings.serviceTiers,
    adminSettings.pricingSettings,
  );

  return {
    id: serviceTier.id,
    name: serviceTier.name,
    description: `${serviceTier.name} at Zaine's Stay & Play`,
    priceInCents: Math.round(nightlyRate * 100),
  };
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
