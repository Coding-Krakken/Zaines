/**
 * Referral Dashboard Page
 * 
 * Phase 7: AI & Automation - Referral program UI
 * 
 * Features:
 * - Display user's unique referral code
 * - Track referral stats (sent, converted, rewards earned)
 * - Social sharing buttons
 * - Copy-to-clipboard functionality
 */

import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardUnavailableState } from "@/components/dashboard/dashboard-states";
import { 
  Share2, 
  Gift, 
  Users, 
  TrendingUp,
  Copy,
  Mail,
  MessageCircle,
} from "lucide-react";
import { generateReferralCode } from "@/lib/loyalty/referral-system";

export default async function ReferralsPage() {
  const session = await auth();
  if (!session?.user?.id) return redirect("/auth/signin");

  if (!isDatabaseConfigured()) {
    return (
      <DashboardUnavailableState
        title="Referrals unavailable"
        description="Database is not configured in this environment."
      />
    );
  }

  // Generate referral code (in real app, this would be stored in database)
  const referralCode = generateReferralCode(
    session.user.id,
    session.user.name || "USER"
  );

  // Fetch referral stats (placeholder - would query database in production)
  const referralStats = {
    totalReferred: 0,
    converted: 0,
    pending: 0,
    totalRewardsEarned: 0,
    availableCredit: 0,
  };

  const shareUrl = `https://zainesstayandplay.com/book?ref=${referralCode}`;
  const shareMessage = `Join me at Zaine's Stay & Play - the best dog daycare in Syracuse! Get 20% off your first booking with my referral code: ${referralCode}`;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="💰 Earn Rewards"
        title="Refer Friends, Earn Credit"
        description="Share the love and earn $25 credit for every friend who books their first stay!"
        className="paw-card"
      />

      {/* Referral Code Card */}
      <Card className="paw-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Your Referral Code
          </CardTitle>
          <CardDescription>
            Share this code with friends or use the quick share buttons below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Referral Code Display */}
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-lg border-2 border-primary/20 bg-primary/5 p-4 text-center">
              <div className="text-3xl font-bold tracking-wider text-primary">
                {referralCode}
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12"
              onClick={() => navigator.clipboard.writeText(referralCode)}
            >
              <Copy className="h-5 w-5" />
              <span className="sr-only">Copy referral code</span>
            </Button>
          </div>

          {/* Share Buttons */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">
              Quick Share:
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(shareUrl)}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href={`mailto:?subject=Try Zaine's Stay & Play&body=${encodeURIComponent(shareMessage + '\n\n' + shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href={`sms:?body=${encodeURIComponent(shareMessage + ' ' + shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Text
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="paw-card">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Referred
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referralStats.totalReferred}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Friends invited
            </p>
          </CardContent>
        </Card>

        <Card className="paw-card">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Converted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {referralStats.converted}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Completed bookings
            </p>
          </CardContent>
        </Card>

        <Card className="paw-card">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Total Earned
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${referralStats.totalRewardsEarned}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime rewards
            </p>
          </CardContent>
        </Card>

        <Card className="paw-card">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Available Credit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${referralStats.availableCredit}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready to use
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card className="paw-card">
        <CardHeader>
          <CardTitle>How Referrals Work</CardTitle>
          <CardDescription>
            It's simple! Share, they book, you both win 🎉
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                1
              </div>
              <h3 className="font-semibold">Share Your Code</h3>
              <p className="text-sm text-muted-foreground">
                Send your unique code to friends via email, text, or social media
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                2
              </div>
              <h3 className="font-semibold">They Book & Save</h3>
              <p className="text-sm text-muted-foreground">
                Your friend gets 20% off their first booking + 200 bonus points
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                3
              </div>
              <h3 className="font-semibold">You Earn Rewards</h3>
              <p className="text-sm text-muted-foreground">
                Get $25 credit + 500 bonus points for each successful referral
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm">
              <strong className="text-primary">Pro Tip:</strong> Credits stack! Refer 4 friends and earn $100 credit toward your next stay. Plus, the more you refer, the faster you'll climb our loyalty tiers for even better perks.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
