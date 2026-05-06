import { PRICING_TRUST_DISCLOSURE } from "@/config/trust-copy";

export const BOOKING_PRICING_CURRENCY = "USD";
export const BOOKING_PRICING_MODEL_LABEL = "Pre-confirmation estimate";
export const BOOKING_PRICING_DISCLOSURE = PRICING_TRUST_DISCLOSURE;

export function calculateBookingPrice(
  checkIn: string,
  checkOut: string,
  suiteType: string,
  petCount: number,
): { subtotal: number; tax: number; total: number } {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  const prices: Record<string, number> = {
    standard: 65,
    deluxe: 85,
    luxury: 120,
  };

  const nightlyRate = prices[suiteType] || 65;
  let subtotal = nightlyRate * Math.max(1, nights);

  if (petCount > 1) {
    const additionalPets = petCount - 1;
    const discount = petCount === 2 ? 0.15 : 0.2;
    subtotal += nightlyRate * nights * additionalPets * (1 - discount);
  }

  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}
