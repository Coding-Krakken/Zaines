"use client";

import { FadeUp } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function PricingPreviewSection() {
  const { serviceSettings, pricingSettings } = useSiteSettings();

  const activeTiers = serviceSettings.serviceTiers
    .filter((tier) => tier.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, 4);

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: pricingSettings.currency || "USD",
    maximumFractionDigits: 0,
  });

  if (activeTiers.length === 0) {
    return (
      <section className="section-padding bg-background">
        <div className="container px-4">
          <FadeUp>
            <div className="text-center mb-12">
              <h2 className="heading-playful text-3xl font-bold text-foreground md:text-4xl">
                Pricing Information
              </h2>
              <p className="text-lg text-muted-foreground mt-4">
                Service pricing is being configured. Please contact us for current rates.
              </p>
            </div>
          </FadeUp>
        </div>
      </section>
    );
  }

  return (
    <section className="section-padding bg-background">
      <div className="container px-4">
        <FadeUp>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="text-3xl" aria-hidden="true">✨</span>
              <h2 className="heading-playful text-3xl font-bold text-foreground md:text-4xl">
                Simple Pricing
              </h2>
              <span className="text-3xl" aria-hidden="true">✨</span>
            </div>
            <p className="text-lg text-muted-foreground">
              Choose the option that works best for you and your pup!
            </p>
          </div>
        </FadeUp>

        <div className={`grid gap-6 ${activeTiers.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : activeTiers.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} max-w-6xl mx-auto mb-8`}>
          {activeTiers.map((tier, index) => {
            const isPopular = index === 1;
            
            return (
              <FadeUp key={tier.id} delay={index * 0.08}>
                <div className={`paw-card relative ${isPopular ? "ring-2 ring-primary shadow-xl" : ""}`}>
                  {isPopular && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white shadow-md whitespace-nowrap"
                      style={{ backgroundColor: "var(--color-yellow)" }}
                    >
                      Most Popular!
                    </div>
                  )}
                  <div className="text-center mb-4">
                    <h3 className="heading-playful text-xl font-bold text-foreground mb-1">
                      {tier.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{tier.description.substring(0, 50)}</p>
                  </div>

                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold" style={{ color: "var(--color-sky)" }}>
                        {formatter.format(tier.baseNightlyRate)}
                      </span>
                      <span className="text-sm text-muted-foreground">/night</span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {tier.description.split('.').filter(s => s.trim()).slice(0, 3).map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 flex-shrink-0" style={{ color: "var(--color-green)" }} aria-hidden="true" />
                        <span className="text-foreground/80">{feature.trim()}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    className={isPopular ? "paw-button-primary w-full" : "paw-button-secondary w-full"}
                  >
                    <Link href="/book">Book Now</Link>
                  </Button>
                </div>
              </FadeUp>
            );
          })}
        </div>

        <FadeUp delay={0.3}>
          <div className="text-center">
            <Button asChild variant="outline" size="lg" className="paw-button-secondary">
              <Link href="/pricing">View All Pricing Details</Link>
            </Button>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
