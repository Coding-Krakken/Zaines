import { type Metadata } from "next";
import { HeroSection } from "@/components/home/hero-section";
import { TrustBar } from "@/components/home/trust-bar";
import { PositioningSection } from "@/components/home/positioning-section";
import { SuiteShowcase } from "@/components/home/suite-showcase";
import { DayAtZaines } from "@/components/home/day-at-zaines";
import { SafetySection } from "@/components/home/safety-section";
import { MeetOwner } from "@/components/home/meet-owner";
import { Testimonials } from "@/components/home/testimonials";
import { ComparisonTable } from "@/components/home/comparison-table";
import { BookingCTA } from "@/components/home/booking-cta";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { serviceSchema } from "@/lib/structured-data";
import { homeMetadataFromSettings } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return homeMetadataFromSettings();
}

export default async function Home() {
  const serviceJsonLd = await serviceSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />

      <HeroSection />
      <TrustBar />
      <PositioningSection />
      <SuiteShowcase />
      <DayAtZaines />
      <SafetySection />
      <MeetOwner />
      <Testimonials />
      <ComparisonTable />
      <BookingCTA />
      <section className="pb-16">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex flex-col gap-3 rounded-xl border border-border/40 bg-background/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-center">
            <Button asChild variant="outline" size="lg">
              <Link href="/checkout/standard">Stripe Checkout</Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/book">Book Your Stay</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
