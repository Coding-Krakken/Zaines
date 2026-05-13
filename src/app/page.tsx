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
import { FadeUp, ScaleIn } from "@/components/motion";
import { ArrowRight, ShieldCheck, Clock3, Sparkles } from "lucide-react";
import Link from "next/link";
import { serviceSchema } from "@/lib/structured-data";
import { homeMetadataFromSettings } from "@/lib/seo";

const proofPillars = [
  {
    title: "Limited Capacity",
    value: "3",
    unit: "private suites",
    description: "Small by design so every guest receives focused care.",
    icon: Sparkles,
  },
  {
    title: "Owner Presence",
    value: "24/7",
    unit: "on-site",
    description: "Continuity and faster decisions during every stay.",
    icon: ShieldCheck,
  },
  {
    title: "Daily Updates",
    value: "1:1",
    unit: "family communication",
    description: "Real photo and message updates, never generic templates.",
    icon: Clock3,
  },
] as const;

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

      <section className="section-padding-tight">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <FadeUp>
              <div>
                <p className="eyebrow mb-3">Why families switch</p>
                <h2 className="headline-display text-3xl font-semibold text-foreground md:text-4xl">
                  Trust Should Be Measurable
                </h2>
              </div>
            </FadeUp>
            <FadeUp delay={0.08}>
              <Button asChild variant="outline" className="focus-ring">
                <Link href="/locations" className="inline-flex items-center gap-2">
                  Explore local boarding pages
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </FadeUp>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {proofPillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <ScaleIn key={pillar.title} delay={0.06 * index}>
                  <article className="luxury-card h-full p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {pillar.title}
                    </p>
                    <p className="mt-1 text-3xl font-semibold text-foreground">
                      {pillar.value}
                      <span className="ml-2 text-sm font-medium text-muted-foreground">
                        {pillar.unit}
                      </span>
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {pillar.description}
                    </p>
                  </article>
                </ScaleIn>
              );
            })}
          </div>
        </div>
      </section>

      <TrustBar />
      <PositioningSection />
      <SuiteShowcase />
      <SafetySection />
      <DayAtZaines />
      <MeetOwner />
      <Testimonials />
      <ComparisonTable />
      <BookingCTA />

      <section className="section-padding-tight bg-background">
        <div className="container mx-auto px-4">
          <FadeUp>
            <div className="luxury-shell mx-auto max-w-5xl p-8 md:p-10">
              <div className="grid items-center gap-6 md:grid-cols-[1.2fr_1fr]">
                <div>
                  <p className="eyebrow mb-3">Plan with confidence</p>
                  <h2 className="headline-display text-3xl font-semibold text-foreground md:text-4xl">
                    Start with Availability, Finish with Clarity
                  </h2>
                  <p className="mt-4 max-w-2xl text-muted-foreground">
                    Check dates, compare suite options, and review your full pricing before confirmation. No hidden charges and no pressure to pay before you are ready.
                  </p>
                </div>
                <div className="flex flex-col gap-3 md:items-end">
                  <Button asChild size="lg" className="focus-ring w-full md:w-auto">
                    <Link href="/book">Check Availability</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="focus-ring w-full md:w-auto">
                    <Link href="/pricing">Review Full Pricing</Link>
                  </Button>
                  <Button asChild variant="ghost" size="lg" className="focus-ring w-full md:w-auto">
                    <Link href="/faq">Read Booking FAQ</Link>
                  </Button>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>
    </>
  );
}
