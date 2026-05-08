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

export const metadata: Metadata = {
  title:
    "Luxury Private Dog Boarding Syracuse NY | Zaine's Stay & Play",
  description:
    "Boutique private dog boarding in Syracuse, NY. Only 3 suites, owner always on-site, camera-monitored 24/7, cage-free, no hidden fees. Serving Syracuse, Liverpool, Cicero, Baldwinsville & surrounding areas.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Luxury Private Dog Boarding Syracuse NY | Zaine's Stay & Play",
    description:
      "Only 3 private suites. Owner always on-site. Calm routines, daily photo updates, and genuine individualized care. Your dog's home away from home.",
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema()) }}
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
