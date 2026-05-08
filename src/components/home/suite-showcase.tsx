import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/motion";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const suites = [
  {
    name: "Standard Suite",
    price: "$65",
    period: "per night",
    size: "6&prime; × 8&prime;",
    description:
      "Comfortable private accommodations with everything your dog needs for a great stay.",
    features: [
      "Premium raised orthopedic bed",
      "Climate-controlled environment",
      "2 structured potty breaks",
      "Daily cleaning & sanitation",
      "Meal service (owner-provided food)",
      "Daily photo update",
    ],
    href: "/suites#standard",
    color: "border-border",
    badge: null,
  },
  {
    name: "Deluxe Suite",
    price: "$85",
    period: "per night",
    size: "8&prime; × 10&prime;",
    description:
      "More space, more enrichment, and webcam access so you can check in anytime.",
    features: [
      "Everything in Standard, plus:",
      "Larger private space",
      "Webcam access for you",
      "3 structured potty breaks",
      "Curated Spotify playlist",
      "Extra enrichment activities",
    ],
    href: "/suites#deluxe",
    color: "border-primary",
    badge: "Most Popular",
  },
  {
    name: "Luxury Suite",
    price: "$120",
    period: "per night",
    size: "10&prime; × 12&prime;",
    description:
      "Our premier experience — maximum space, individual attention, and premium everything.",
    features: [
      "Everything in Deluxe, plus:",
      "Our largest private suite",
      "Individual 1-on-1 enrichment",
      "Premium bedding & amenities",
      "Priority scheduling",
      "Extended evening check-ins",
    ],
    href: "/suites#luxury",
    color: "border-border",
    badge: null,
  },
];

export function SuiteShowcase() {
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
              Three Private Suites.
              <br />
              <em className="text-primary not-italic">Zero Overcrowding.</em>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Every suite is private, climate-controlled, and cleaned between
              each guest. Your dog shares space with no one but you.
            </p>
          </div>
        </FadeUp>

        <StaggerContainer className="grid gap-8 md:grid-cols-3">
          {suites.map((suite) => (
            <StaggerItem key={suite.name}>
              <div
                className={`relative flex flex-col h-full rounded-2xl border-2 ${suite.color} bg-card p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
              >
                {suite.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1 text-xs tracking-wider uppercase">
                      {suite.badge}
                    </Badge>
                  </div>
                )}

                {/* Photo placeholder */}
                <div className="relative mb-6 h-48 w-full rounded-xl overflow-hidden bg-gradient-to-br from-muted to-accent flex items-center justify-center">
                  <div className="text-center text-muted-foreground/60">
                    <div className="text-4xl mb-2">🐾</div>
                    <p className="text-xs">Suite photo coming soon</p>
                  </div>
                  {/* TODO: Replace with next/image once real photos are at /public/images/suites/ */}
                </div>

                <div className="mb-2">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                    {/* size rendered from HTML entity string — use dangerouslySetInnerHTML inline */}
                    Private Suite · {suite.size.replace("&prime;", "′")}
                  </p>
                  <h3 className="font-display text-2xl font-semibold text-foreground">
                    {suite.name}
                  </h3>
                </div>

                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-bold text-primary">{suite.price}</span>
                  <span className="text-sm text-muted-foreground">{suite.period}</span>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {suite.description}
                </p>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {suite.features.map((feature) => (
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
                  variant={suite.badge ? "default" : "outline"}
                  className="w-full"
                  asChild
                >
                  <Link href={suite.href}>Learn About This Suite</Link>
                </Button>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeUp delay={0.2}>
          <p className="text-center text-sm text-muted-foreground mt-10">
            Multi-dog family?{" "}
            <Link href="/pricing" className="text-primary hover:underline font-medium">
              View our multi-dog discounts
            </Link>{" "}
            — 15% off the second dog, 20% off the third.
          </p>
        </FadeUp>
      </div>
    </section>
  );
}
