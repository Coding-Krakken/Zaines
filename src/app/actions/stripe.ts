"use server";

import { isStripeConfigured, stripe } from "@/lib/stripe";
import { getAdminSettings } from "@/lib/api/admin-settings";
import { getNightlyRate } from "@/lib/booking/pricing";

type CheckoutProduct = {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
};

const SUITE_ALIASES: Record<string, string[]> = {
  standard: ["standard", "standard suite", "standard-suite"],
  deluxe: ["deluxe", "deluxe suite", "deluxe-suite"],
  luxury: ["luxury", "luxury suite", "luxury-suite"],
};

function normalizeLookupValue(value: string): string {
  return value.trim().toLowerCase();
}

function getAliasTokens(productId: string): string[] {
  const normalizedId = normalizeLookupValue(productId);
  const aliasTokens = SUITE_ALIASES[normalizedId] ?? [normalizedId];
  return Array.from(new Set(aliasTokens.map((token) => normalizeLookupValue(token))));
}

async function getProduct(productId: string): Promise<CheckoutProduct> {
  const aliasTokens = getAliasTokens(productId);
  const adminSettings = await getAdminSettings();
  const serviceTier = adminSettings.serviceSettings.serviceTiers.find((tier) => {
    const tierId = normalizeLookupValue(tier.id);
    const tierName = normalizeLookupValue(tier.name);

    return aliasTokens.some(
      (token) =>
        tierId === token ||
        tierName === token ||
        tierId.includes(token) ||
        tierName.includes(token),
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
  if (!isStripeConfigured()) {
    return null;
  }

  try {
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

    return session.client_secret ?? null;
  } catch (error) {
    console.error("Failed to start embedded checkout session", {
      productId,
      error,
    });
    return null;
  }
}
