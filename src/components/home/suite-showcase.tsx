"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/motion";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function SuiteShowcase() {
  const { serviceSettings, pricingSettings } = useSiteSettings();

  const activeSuites = serviceSettings.serviceTiers
    .filter((suite) => suite.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: pricingSettings.currency || "USD",
    maximumFractionDigits: 0,
  });

  const suiteCountLabel =
    activeSuites.length === 1
      ? "One Private Suite."
      : `${activeSuites.length} Private Suites.`;

  return (
    <section
      className="section-padding bg-background"
      aria-labelledby="suites-heading"
    >
      <div className="container mx-auto px-4">
        <FadeUp>
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-[0.25em] text-primary font-semibold mb-4">
              Accommodations
            </p>
            <h2
              id="suites-heading"
              className="font-display text-4xl md:text-5xl font-semibold text-foreground mb-4 text-balance"
            >
              {suiteCountLabel}
              <br />
              <em className="text-primary not-italic">Zero Overcrowding.</em>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Every suite is private, climate-controlled, and cleaned between
              each guest. Your dog shares space with no one but you.
            </p>
          </div>
        </FadeUp>

        {activeSuites.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            No active service types are currently configured. Update Services & Pricing in Admin Settings.
          </div>
        ) : (
        <StaggerContainer className="grid gap-8 md:grid-cols-3">
          {activeSuites.map((suite, index) => (
            <StaggerItem key={suite.name}>
              <div
                id={`suite-${suite.id}`}
                className={`relative flex flex-col h-full rounded-2xl border-2 ${index === 1 ? "border-primary" : "border-border"} bg-card p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
              >
                {index === 1 && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1 text-xs tracking-wider uppercase">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="relative mb-6 h-48 w-full rounded-xl overflow-hidden bg-gradient-to-br from-muted to-accent flex items-center justify-center">
                  <img
                    src={suite.imageUrl || '/images/suites/placeholder.svg'}
                    alt={`${suite.name} preview`}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="mb-2">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                    Private Suite · Configured in Admin
                  </p>
                  <h3 className="font-display text-2xl font-semibold text-foreground">
                    {suite.name}
                  </h3>
                </div>

                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-bold text-primary">
                    {formatter.format(suite.baseNightlyRate)}
                  </span>
                  <span className="text-sm text-muted-foreground">per night</span>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {suite.description}
                </p>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {[
                    "Private suite environment",
                    "Structured care and routines",
                    "Daily updates during stay",
                    "Configured and managed in real time",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2
                        className="h-4 w-4 text-primary flex-shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span className="text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={index === 1 ? "default" : "outline"}
                  className="w-full"
                  asChild
                >
                  <Link href={`/suites#${suite.id}`}>Learn About This Suite</Link>
                </Button>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
        )}

        <FadeUp delay={0.2}>
          <p className="text-center text-sm text-muted-foreground mt-10">
            Multi-dog family?{" "}
            <Link href="/pricing" className="text-primary hover:underline font-medium">
              View our multi-dog discounts
            </Link>{" "}
            — {pricingSettings.twoPetDiscountPercent}% off the second dog, {pricingSettings.threePlusPetsDiscountPercent}% off the third.
          </p>
        </FadeUp>
      </div>
    </section>
  );
}
