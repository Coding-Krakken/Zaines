import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/motion";

export const metadata: Metadata = {
  title: "Pricing | Luxury Dog Boarding Syracuse NY | Zaine's Stay & Play",
  description:
    "Transparent pricing for luxury dog boarding in Syracuse. Standard ($65), Deluxe ($85), and Luxury ($120) suites. No hidden fees, no surprise charges.",
  keywords: [
    "dog boarding pricing",
    "luxury dog boarding rates",
    "Syracuse dog boarding costs",
    "pet boarding suites",
  ],
};

const suites = [
  {
    name: "Standard Suite",
    price: "$65",
    period: "/ night",
    description: "Comfortable, clean, and secure",
    features: [
      "6' x 8' private suite",
      "Climate controlled",
      "Professional daily cleaning",
      "2 potty breaks",
      "2 group play sessions",
      "Meals included (2x daily)",
    ],
  },
  {
    name: "Deluxe Suite",
    price: "$85",
    period: "/ night",
    popular: true,
    description: "Premium comfort with premium care",
    features: [
      "8' x 10' private suite",
      "Climate controlled with air purification",
      "Live webcam access (24/7)",
      "3 potty breaks + solo enrichment",
      "3 group play sessions",
      "Meals included (3x daily, custom options)",
      "Weekly photo updates",
    ],
  },
  {
    name: "Luxury Suite",
    price: "$120",
    period: "/ night",
    description: "VIP experience for VIP pups",
    features: [
      "10' x 12' private suite with outdoor patio",
      "Climate + humidity controlled",
      "HD webcam access + live chat support",
      "4 potty breaks + on-demand access",
      "4 customized play sessions",
      "Meals included (custom schedule)",
      "Daily video updates & photo album",
      "Priority support line",
    ],
  },
];

const addOns = [
  { name: "Extra Playtime (30 min)", price: "$15" },
  { name: "Private Walk (30 min)", price: "$20" },
  { name: "Photo Package (10 photos)", price: "$25" },
  { name: "Spa Treatment (bath & nails)", price: "$35" },
  { name: "Birthday Party Package", price: "$75" },
  { name: "Comfort Care Package", price: "$50" },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero */}
      <FadeUp>
        <section className="relative bg-gradient-to-br from-primary/5 via-primary/2 to-secondary/3 py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                Transparent Pricing
              </Badge>
              <h1 className="mb-6 font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight">
                Premium Pricing, Premium Care
              </h1>
              <p className="mb-8 text-lg md:text-xl text-foreground/70">
                No hidden fees. No surprise add-ons. Just honest, luxury dog boarding with complete price transparency before you confirm.
              </p>
            </div>
          </div>
        </section>
      </FadeUp>

      {/* Suite Pricing */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <FadeUp>
            <div className="mb-16 text-center">
              <h2 className="mb-4 font-display text-3xl md:text-4xl font-semibold">
                Boarding Suite Pricing
              </h2>
              <p className="text-lg text-foreground/60">
                All-inclusive rates. No hourly charges. No surprise costs at checkout.
              </p>
            </div>
          </FadeUp>

          <StaggerContainer>
            {suites.map((suite) => (
              <StaggerItem key={suite.name}>
                <div className={`relative group transition-all duration-300 ${
                  suite.popular ? "md:scale-105" : ""
                }`}>
                  {suite.popular && (
                    <div className="absolute -inset-1 rounded-xl bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                  <Card
                    className={`relative flex flex-col h-full border-border/50 hover:border-primary/30 transition-all duration-300 ${
                      suite.popular ? "border-primary/50 shadow-lg" : ""
                    }`}
                  >
                    {suite.popular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground shadow-lg">
                        Most Popular
                      </Badge>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <CardTitle className="font-display text-2xl md:text-3xl">
                            {suite.name}
                          </CardTitle>
                          <CardDescription className="text-base mt-2">
                            {suite.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <div className="mb-6">
                        <div className="flex items-baseline gap-1 mb-2">
                          <span className="font-display text-4xl font-semibold text-primary">
                            {suite.price}
                          </span>
                          <span className="text-sm text-foreground/60">
                            {suite.period}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/50">
                          All features included. No extra charges.
                        </p>
                      </div>

                      <ul className="space-y-3 flex-1">
                        {suite.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary flex-shrink-0" />
                            <span className="text-sm text-foreground/70">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className="mt-8 w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        size="lg"
                        asChild
                      >
                        <Link href="/book">Book This Suite</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Multi-Dog & Extended Stays */}
      <FadeUp>
        <section className="bg-secondary/40 py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl rounded-xl border border-primary/20 bg-background/80 backdrop-blur-sm p-8">
              <h3 className="mb-4 font-display text-2xl font-semibold">
                Special Pricing
              </h3>
              <div className="space-y-4 text-foreground/70">
                <div>
                  <strong className="text-foreground">Multiple Dogs (Same Family):</strong>
                  <p className="mt-1 text-sm">Additional dogs receive a discounted rate. Exact pricing shown in your pre-confirmation quote.</p>
                </div>
                <div>
                  <strong className="text-foreground">Extended Stays (14+ Nights):</strong>
                  <p className="mt-1 text-sm">We offer special rates for longer stays. Contact us for a custom quote.</p>
                </div>
                <div>
                  <strong className="text-foreground">Holiday Surcharge:</strong>
                  <p className="mt-1 text-sm">A 20% surcharge applies to Thanksgiving, Christmas, and New Year's holidays. Book early.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </FadeUp>

      {/* Optional Add-Ons */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <FadeUp>
            <div className="mb-16 text-center">
              <h2 className="mb-4 font-display text-3xl md:text-4xl font-semibold">
                Optional Enhancements
              </h2>
              <p className="text-lg text-foreground/60">
                Customize your stay with premium care options (all optional, all clearly itemized)
              </p>
            </div>
          </FadeUp>

          <div className="mx-auto max-w-4xl">
            <StaggerContainer>
              {addOns.map((addOn) => (
                <StaggerItem key={addOn.name}>
                  <div className="flex items-center justify-between p-4 rounded-lg hover:bg-primary/5 transition-colors duration-300 border border-border/30">
                    <span className="font-medium text-foreground">
                      {addOn.name}
                    </span>
                    <span className="font-semibold text-primary">
                      {addOn.price}
                    </span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </section>

      {/* Trust & Transparency */}
      <FadeUp>
        <section className="bg-primary/5 py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl rounded-xl border border-primary/20 p-8 md:p-12">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="mb-4 font-display text-xl font-semibold">
                    Our Promise: Zero Hidden Fees
                  </h3>
                  <ul className="space-y-2 text-foreground/70 text-sm">
                    <li>✓ All prices confirmed before booking</li>
                    <li>✓ No surprise charges at checkout</li>
                    <li>✓ Optional add-ons clearly itemized</li>
                    <li>✓ Multi-dog totals disclosed upfront</li>
                    <li>✓ Holiday rates disclosed at booking</li>
                    <li>✓ Transparent cancellation policy</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </FadeUp>

      {/* Policies */}
      <FadeUp>
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-12 text-center font-display text-3xl md:text-4xl font-semibold">
                Policies & Terms
              </h2>
              <div className="space-y-8">
                <div>
                  <h3 className="mb-3 font-display text-lg font-semibold">
                    Payment
                  </h3>
                  <p className="text-foreground/70">
                    Payment is required at booking. We accept all major credit cards, debit cards, and digital wallets (Apple Pay, Google Pay). Secure checkout guaranteed.
                  </p>
                </div>
                <div>
                  <h3 className="mb-3 font-display text-lg font-semibold">
                    Cancellation Policy
                  </h3>
                  <p className="text-foreground/70">
                    <strong className="text-foreground">30+ days before stay:</strong> Full refund. <strong className="text-foreground">15-29 days:</strong> 50% refund. <strong className="text-foreground">Less than 15 days:</strong> Booking retained (reschedule available). No fees charged.
                  </p>
                </div>
                <div>
                  <h3 className="mb-3 font-display text-lg font-semibold">
                    What's Included
                  </h3>
                  <p className="text-foreground/70">
                    All meals, treats, bedding, climate control, cleaning, activities, and supervision are included in your nightly rate. No additional fees for these core services.
                  </p>
                </div>
                <div>
                  <h3 className="mb-3 font-display text-lg font-semibold">
                    Questions?
                  </h3>
                  <p className="text-foreground/70">
                    Contact us anytime at <strong>(315) 657-1332</strong> or <strong>info@zainesstayandplay.com</strong>. We're happy to walk you through pricing details.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </FadeUp>

      {/* CTA */}
      <FadeUp>
        <section className="bg-gradient-to-r from-primary/90 to-primary py-16 md:py-24 text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 font-display text-3xl md:text-4xl font-semibold">
              Ready to Book?
            </h2>
            <p className="mb-8 text-lg opacity-90 max-w-2xl mx-auto">
              Choose your suite and secure your dog's stay. Your full price is confirmed before checkout.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                asChild
              >
                <Link href="/book">Check Availability</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link href="/contact">Talk With Our Team</Link>
              </Button>
            </div>
          </div>
        </section>
      </FadeUp>
    </div>
  );
}
