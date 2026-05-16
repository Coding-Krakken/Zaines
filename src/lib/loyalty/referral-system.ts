/**
 * Referral & Loyalty Program System
 * 
 * Phase 7: AI & Automation - Viral growth through referrals and loyalty rewards
 * 
 * Features:
 * - Unique referral code generation
 * - Referral tracking and attribution
 * - Reward calculation (referrer + referee)
 * - Loyalty tier management (Bronze/Silver/Gold/Platinum)
 * - Point accumulation and redemption
 */

export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";

export interface LoyaltyTierBenefits {
  tier: LoyaltyTier;
  minLifetimeSpend: number;
  pointsMultiplier: number; // e.g., 1.5x = 50% bonus
  perks: string[];
  badgeColor: string;
}

export const LOYALTY_TIERS: Record<LoyaltyTier, LoyaltyTierBenefits> = {
  bronze: {
    tier: "bronze",
    minLifetimeSpend: 0,
    pointsMultiplier: 1.0,
    perks: [
      "Earn 1 point per $1 spent",
      "Birthday month 10% discount",
      "Priority email support",
    ],
    badgeColor: "#CD7F32",
  },
  silver: {
    tier: "silver",
    minLifetimeSpend: 500,
    pointsMultiplier: 1.25,
    perks: [
      "Earn 1.25 points per $1 spent",
      "Birthday month 15% discount",
      "Free nail trim per visit",
      "Early access to holiday bookings",
    ],
    badgeColor: "#C0C0C0",
  },
  gold: {
    tier: "gold",
    minLifetimeSpend: 1500,
    pointsMultiplier: 1.5,
    perks: [
      "Earn 1.5 points per $1 spent",
      "Birthday month 20% discount",
      "Free suite upgrade (subject to availability)",
      "Dedicated account manager",
      "Complimentary grooming session (quarterly)",
    ],
    badgeColor: "#FFD700",
  },
  platinum: {
    tier: "platinum",
    minLifetimeSpend: 3500,
    pointsMultiplier: 2.0,
    perks: [
      "Earn 2 points per $1 spent",
      "Birthday month 25% discount",
      "Guaranteed suite availability (72h notice)",
      "VIP check-in/checkout",
      "Concierge pet care planning",
      "Exclusive member events",
    ],
    badgeColor: "#E5E4E2",
  },
};

/**
 * Calculate loyalty tier based on lifetime spend
 */
export function calculateLoyaltyTier(lifetimeSpend: number): LoyaltyTier {
  if (lifetimeSpend >= LOYALTY_TIERS.platinum.minLifetimeSpend) return "platinum";
  if (lifetimeSpend >= LOYALTY_TIERS.gold.minLifetimeSpend) return "gold";
  if (lifetimeSpend >= LOYALTY_TIERS.silver.minLifetimeSpend) return "silver";
  return "bronze";
}

/**
 * Calculate points earned for a purchase
 */
export function calculatePointsEarned(params: {
  amountSpent: number;
  tier: LoyaltyTier;
  isReferralBonus?: boolean;
}): number {
  const { amountSpent, tier, isReferralBonus = false } = params;
  const tierConfig = LOYALTY_TIERS[tier];
  
  let points = Math.floor(amountSpent * tierConfig.pointsMultiplier);
  
  // Referral bonus: 2x points
  if (isReferralBonus) {
    points *= 2;
  }
  
  return points;
}

/**
 * Calculate dollar value of points
 * Standard redemption: 100 points = $1
 */
export function calculatePointsValue(points: number): number {
  return points / 100;
}

/**
 * Generate unique referral code
 */
export function generateReferralCode(userId: string, userName: string): string {
  // Create readable code from name + random suffix
  const namePart = userName
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 4)
    .padEnd(4, "X");
  
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `${namePart}${randomPart}`;
}

/**
 * Validate referral code format
 */
export function isValidReferralCode(code: string): boolean {
  return /^[A-Z]{4}[A-Z0-9]{4}$/.test(code);
}

/**
 * Calculate referral rewards
 */
export interface ReferralReward {
  referrerReward: {
    creditAmount: number;
    bonusPoints: number;
    description: string;
  };
  refereeReward: {
    discountPercent: number;
    bonusPoints: number;
    description: string;
  };
}

export function calculateReferralRewards(params: {
  refereeFirstBookingAmount: number;
}): ReferralReward {
  const { refereeFirstBookingAmount } = params;

  return {
    referrerReward: {
      creditAmount: 25, // $25 credit for referrer
      bonusPoints: 500, // 500 bonus points ($5 value)
      description: "Thank you for spreading the love! Enjoy $25 credit + 500 bonus points.",
    },
    refereeReward: {
      discountPercent: 20, // 20% off first booking
      bonusPoints: 200, // 200 welcome points
      description: "Welcome to the pack! Get 20% off your first booking + 200 bonus points.",
    },
  };
}

/**
 * Check if customer is eligible for birthday discount
 */
export function getBirthdayDiscount(params: {
  tier: LoyaltyTier;
  currentDate?: Date;
  birthMonth?: number; // 1-12
}): { eligible: boolean; discountPercent: number } {
  const { tier, currentDate = new Date(), birthMonth } = params;
  
  if (!birthMonth) {
    return { eligible: false, discountPercent: 0 };
  }

  const currentMonth = currentDate.getMonth() + 1; // 0-indexed to 1-indexed
  
  if (currentMonth !== birthMonth) {
    return { eligible: false, discountPercent: 0 };
  }

  // Birthday discount by tier
  const discounts: Record<LoyaltyTier, number> = {
    bronze: 10,
    silver: 15,
    gold: 20,
    platinum: 25,
  };

  return {
    eligible: true,
    discountPercent: discounts[tier],
  };
}

/**
 * Get next tier progress
 */
export function getNextTierProgress(params: {
  currentTier: LoyaltyTier;
  lifetimeSpend: number;
}): {
  nextTier: LoyaltyTier | null;
  amountNeeded: number;
  progressPercent: number;
} {
  const { currentTier, lifetimeSpend } = params;

  const tierOrder: LoyaltyTier[] = ["bronze", "silver", "gold", "platinum"];
  const currentIndex = tierOrder.indexOf(currentTier);
  
  if (currentIndex === tierOrder.length - 1) {
    // Already at highest tier
    return {
      nextTier: null,
      amountNeeded: 0,
      progressPercent: 100,
    };
  }

  const nextTier = tierOrder[currentIndex + 1];
  const nextTierThreshold = LOYALTY_TIERS[nextTier].minLifetimeSpend;
  const currentTierThreshold = LOYALTY_TIERS[currentTier].minLifetimeSpend;
  
  const amountNeeded = Math.max(0, nextTierThreshold - lifetimeSpend);
  const progressPercent = Math.min(
    100,
    ((lifetimeSpend - currentTierThreshold) / (nextTierThreshold - currentTierThreshold)) * 100
  );

  return {
    nextTier,
    amountNeeded,
    progressPercent: Math.round(progressPercent),
  };
}
