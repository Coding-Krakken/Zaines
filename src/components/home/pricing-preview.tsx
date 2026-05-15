"use client";

import { FadeUp } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";

const pricingTiers = [
  {
    name: "Half Day",
    subtitle: "Up to 5 hours",
    price: "$28",
    period: "/day",
    features: [
      "Great for short activities",
      "Enrichment included",
      "Fun & exercise",
    ],
    cta: "Book Now",
    popular: false,
    color: "var(--color-sky)",
  },
  {
    name: "Full Day",
    subtitle: "Up to 12 hours",
    price: "$38",
    period: "/day",
    badge: "Most Popular!",
    features: [
      "Full day of play",
      "Enrichment activities",
      "Photo update",
    ],
    cta: "Book Now",
    popular: true,
    color: "var(--color-yellow)",
  },
  {
    name: "5 Day Package",
    subtitle: "Save 10%",
    price: "$171",
    period: "/5 days",
    features: [
      "Use within 30 days",
      "Anytime play",
      "Great flexibility",
    ],
    cta: "Book Now",
    popular: false,
    color: "var(--color-sky)",
  },
  {
    name: "Monthly Membership",
    subtitle: "20 Days Per Month",
    price: "$520",
    period: "/mo",
    features: [
      "Best value",
      "Priority booking",
      "10% off add-on services",
    ],
    cta: "Join Now",
    popular: false,
    color: "var(--color-green)",
  },
];

export function PricingPreviewSection() {
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto mb-8">
          {pricingTiers.map((tier, index) => (
            <FadeUp key={index} delay={index * 0.08}>
              <div className={`paw-card relative ${tier.popular ? "ring-2 ring-primary shadow-xl" : ""}`}>
                {tier.badge && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white shadow-md whitespace-nowrap"
                    style={{ backgroundColor: tier.color }}
                  >
                    {tier.badge}
                  </div>
                )}
                <div className="text-center mb-4">
                  <h3 className="heading-playful text-xl font-bold text-foreground mb-1">
                    {tier.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{tier.subtitle}</p>
                </div>
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold" style={{ color: tier.color }}>
                    {tier.price}
                  </span>
                  <span className="text-muted-foreground">{tier.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {tier.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 flex-shrink-0" style={{ color: tier.color }} aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="w-full font-bold"
                  style={{
                    background: tier.popular ? tier.color : "transparent",
                    color: tier.popular ? "var(--color-navy)" : tier.color,
                    border: tier.popular ? "none" : `2px solid ${tier.color}`,
                  }}
                >
                  <Link href="/book">{tier.cta}</Link>
                </Button>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.4}>
          <div className="text-center">
            <Button asChild variant="outline" size="lg" className="font-semibold">
              <Link href="/pricing">View Full Pricing & Add-Ons</Link>
            </Button>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
