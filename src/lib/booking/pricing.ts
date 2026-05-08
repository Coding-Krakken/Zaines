import { PRICING_TRUST_DISCLOSURE } from "@/config/trust-copy";
import type { PricingSettings } from "@/types/admin";

export const BOOKING_PRICING_CURRENCY = "USD";
export const BOOKING_PRICING_MODEL_LABEL = "Pre-confirmation estimate";
export const BOOKING_PRICING_DISCLOSURE = PRICING_TRUST_DISCLOSURE;

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  currency: "USD",
  standardNightlyRate: 65,
  deluxeNightlyRate: 85,
  luxuryNightlyRate: 120,
  taxRatePercent: 10,
  twoPetDiscountPercent: 15,
  threePlusPetsDiscountPercent: 20,
};

export function calculateBookingPrice(
  checkIn: string,
  checkOut: string,
  suiteType: string,
  petCount: number,
  pricingSettings: PricingSettings = DEFAULT_PRICING_SETTINGS,
): { subtotal: number; tax: number; total: number } {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  const prices: Record<string, number> = {
    standard: pricingSettings.standardNightlyRate,
    deluxe: pricingSettings.deluxeNightlyRate,
    luxury: pricingSettings.luxuryNightlyRate,
  };

  const nightlyRate = prices[suiteType] || 65;
  let subtotal = nightlyRate * Math.max(1, nights);

  if (petCount > 1) {
    const additionalPets = petCount - 1;
    const discount =
      petCount === 2
        ? pricingSettings.twoPetDiscountPercent / 100
        : pricingSettings.threePlusPetsDiscountPercent / 100;
    subtotal += nightlyRate * nights * additionalPets * (1 - discount);
  }

  const tax = subtotal * (pricingSettings.taxRatePercent / 100);
  const total = subtotal + tax;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}
