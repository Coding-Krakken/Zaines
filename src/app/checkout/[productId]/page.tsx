import { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Checkout from "@/app/components/checkout";
import { getAdminSettings } from "@/lib/api/admin-settings";
import { getNightlyRate } from "@/lib/booking/pricing";
import { simplePageMetadataFromSettings } from "@/lib/seo-page-metadata";

type CheckoutPageProps = {
  params: Promise<{
    productId: string;
  }>;
};

function formatSuiteLabel(productId: string) {
  const normalizedId = productId.trim().toLowerCase();

  if (normalizedId === "standard") return "Standard Suite";
  if (normalizedId === "deluxe") return "Deluxe Suite";
  if (normalizedId === "luxury") return "Luxury Suite";

  return productId;
}

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { productId } = await params;
  const suiteLabel = formatSuiteLabel(productId);

  return simplePageMetadataFromSettings({
    title: `${suiteLabel} Checkout | Zaine's Stay & Play`,
    description: `Complete payment for the ${suiteLabel.toLowerCase()} using Stripe Checkout.`,
    canonicalPath: `/checkout/${encodeURIComponent(productId)}`,
  });
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { productId } = await params;
  const adminSettings = await getAdminSettings();

  const serviceTier = adminSettings.serviceSettings.serviceTiers.find((tier) => {
    const normalizedId = productId.trim().toLowerCase();
    const tierId = tier.id.trim().toLowerCase();
    const tierName = tier.name.trim().toLowerCase();

    return tierId === normalizedId || tierName === normalizedId || tierName.includes(normalizedId);
  });

  const suiteLabel = serviceTier?.name || formatSuiteLabel(productId);
  const nightlyRate = serviceTier
    ? getNightlyRate(
        serviceTier.id,
        adminSettings.serviceSettings.serviceTiers,
        adminSettings.pricingSettings,
      )
    : null;

  return (
    <div className="bg-gradient-to-br from-primary/5 via-background to-secondary/10 py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <section className="space-y-6">
            <Badge className="w-fit bg-primary/10 text-primary border-primary/20">
              Stripe Checkout
            </Badge>
            <div className="space-y-3">
              <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
                {suiteLabel} Checkout
              </h1>
              <p className="max-w-2xl text-base text-foreground/70 md:text-lg">
                Complete a secure one-time payment for this suite using Stripe&apos;s embedded checkout experience.
              </p>
            </div>

            <Card className="border-border/50 bg-background/90 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle className="font-display text-2xl">What happens next</CardTitle>
                <CardDescription>
                  This checkout flow collects payment only. Your full booking flow remains available at /book.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-foreground/70">
                <div className="flex items-center justify-between border-b pb-3">
                  <span>Selected suite</span>
                  <span className="font-medium text-foreground">{suiteLabel}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-3">
                  <span>Base nightly rate</span>
                  <span className="font-medium text-foreground">
                    {nightlyRate ? `$${nightlyRate.toFixed(2)}` : "Unavailable"}
                  </span>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild>
                    <Link href="/book">Use Full Booking Flow</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/suites">Back to Suites</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          <Card className="sticky top-6 border-border/50 bg-background/95 shadow-lg backdrop-blur">
            <CardHeader>
              <CardTitle className="font-display text-2xl">Secure Checkout</CardTitle>
              <CardDescription>
                Stripe-hosted embedded payment UI for {suiteLabel.toLowerCase()}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Checkout productId={productId} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}