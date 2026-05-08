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
    </>
  );
}
