/**
 * Loyalty Tier Badge Component
 * 
 * Phase 7: AI & Automation - Display loyalty status and benefits
 * 
 * Features:
 * - Tier badge with color coding
 * - Progress to next tier
 * - Perks list
 * - Tier-specific styling
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Crown,
  Star,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  LOYALTY_TIERS, 
  getNextTierProgress,
  type LoyaltyTier 
} from "@/lib/loyalty/referral-system";

interface LoyaltyTierBadgeProps {
  tier: LoyaltyTier;
  lifetimeSpend: number;
  className?: string;
}

const TIER_ICONS = {
  bronze: Trophy,
  silver: Star,
  gold: Crown,
  platinum: Sparkles,
};

const TIER_STYLES = {
  bronze: "bg-[#CD7F32]/10 text-[#CD7F32] border-[#CD7F32]/30",
  silver: "bg-[#C0C0C0]/10 text-[#71717A] border-[#C0C0C0]/30",
  gold: "bg-[#FFD700]/10 text-[#CA8A04] border-[#FFD700]/30",
  platinum: "bg-[#E5E4E2]/10 text-[#52525B] border-[#E5E4E2]/30",
};

export function LoyaltyTierBadge({ tier, lifetimeSpend, className }: LoyaltyTierBadgeProps) {
  const tierConfig = LOYALTY_TIERS[tier];
  const nextTierInfo = getNextTierProgress({ currentTier: tier, lifetimeSpend });
  const Icon = TIER_ICONS[tier];

  return (
    <Card className={cn("paw-card", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                TIER_STYLES[tier]
              )}
            >
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-xl capitalize">{tier} Tier</CardTitle>
              <CardDescription>
                {tierConfig.pointsMultiplier}x points on every purchase
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={TIER_STYLES[tier]}>
            {tier.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Next Tier Progress */}
        {nextTierInfo.nextTier && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Progress to {nextTierInfo.nextTier}
              </span>
              <span className="font-semibold">
                ${lifetimeSpend} / ${LOYALTY_TIERS[nextTierInfo.nextTier].minLifetimeSpend}
              </span>
            </div>
            <Progress value={nextTierInfo.progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Spend ${nextTierInfo.amountNeeded} more to unlock {nextTierInfo.nextTier} benefits
            </p>
          </div>
        )}

        {tier === "platinum" && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-center">
            <p className="text-sm font-semibold text-primary">
              🎉 You've reached the highest tier! Enjoy exclusive platinum perks.
            </p>
          </div>
        )}

        {/* Tier Perks */}
        <div>
          <h4 className="mb-3 text-sm font-semibold">Your Benefits:</h4>
          <ul className="space-y-2">
            {tierConfig.perks.map((perk, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-primary">✓</span>
                <span className="text-muted-foreground">{perk}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
