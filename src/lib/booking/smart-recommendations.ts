/**
 * Smart Add-On Recommendation Engine
 * 
 * Provides personalized add-on recommendations based on:
 * - Suite type selected
 * - Length of stay
 * - Time of year (seasonal)
 * - Historical booking patterns (future enhancement)
 * 
 * Phase 5: Booking UX Refinement - Conversion Optimization
 */

export interface AddOnRecommendation {
  id: string;
  name: string;
  description: string;
  price: number;
  reason: string; // Why this is recommended
  priority: "high" | "medium" | "low";
}

interface RecommendationContext {
  suiteType?: "standard" | "deluxe" | "luxury";
  nights: number;
  petCount: number;
  checkInDate?: string;
}

/**
 * Generate smart add-on recommendations based on booking context
 */
export function getSmartRecommendations(
  context: RecommendationContext,
  availableAddOns: Array<{ id: string; name: string; description: string; price: number }>
): AddOnRecommendation[] {
  const recommendations: AddOnRecommendation[] = [];

  const { suiteType, nights, petCount } = context;

  // Recommendation: Extended Playtime for longer stays
  if (nights >= 3) {
    const playtime = availableAddOns.find((a) => a.id === "playtime");
    if (playtime) {
      recommendations.push({
        ...playtime,
        reason: `Perfect for ${nights}-night stays to keep your pup extra active`,
        priority: "high",
      });
    }
  }

  // Recommendation: Extra walks for standard suites (upsell comfort)
  if (suiteType === "standard" && nights >= 2) {
    const extraWalk = availableAddOns.find((a) => a.id === "extra-walk");
    if (extraWalk) {
      recommendations.push({
        ...extraWalk,
        reason: "Give your pup more outdoor time during their stay",
        priority: "high",
      });
    }
  }

  // Recommendation: Comfort Care for luxury suites (premium experience)
  if (suiteType === "luxury") {
    const comfortCare = availableAddOns.find((a) => a.id === "comfort-care");
    if (comfortCare) {
      recommendations.push({
        ...comfortCare,
        reason: "Complete the premium experience with extra comfort",
        priority: "medium",
      });
    }
  }

  // Recommendation: Nail trim for 5+ night stays (practical value)
  if (nights >= 5) {
    const nailTrim = availableAddOns.find((a) => a.id === "nail-trim");
    if (nailTrim) {
      recommendations.push({
        ...nailTrim,
        reason: "Convenient grooming during extended stays",
        priority: "medium",
      });
    }
  }

  // Recommendation: Extra walk for multiple pets (they need more activity)
  if (petCount >= 2) {
    const extraWalk = availableAddOns.find((a) => a.id === "extra-walk");
    if (extraWalk && !recommendations.find((r) => r.id === "extra-walk")) {
      recommendations.push({
        ...extraWalk,
        reason: "Multiple pups need extra exercise and attention",
        priority: "medium",
      });
    }
  }

  // Sort by priority (high → medium → low) and limit to top 3
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return recommendations
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 3);
}

/**
 * Calculate potential savings message for bundle recommendations
 */
export function getBundleSavingsMessage(
  selectedAddOns: string[],
  nights: number
): string | null {
  // If customer selects 2+ recurring add-ons for 3+ nights, suggest value
  const recurringAddOns = ["extra-walk", "medication"];
  const selectedRecurring = selectedAddOns.filter((id) =>
    recurringAddOns.includes(id)
  );

  if (selectedRecurring.length >= 2 && nights >= 3) {
    return `💡 Pro tip: These daily add-ons over ${nights} nights add up! Consider our weekly packages for better value.`;
  }

  return null;
}
