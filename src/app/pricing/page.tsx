import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { CheckCircle2, HelpCircle } from "lucide-react";
import { FadeUp, ScaleIn } from "@/components/motion";
import { simplePageMetadataFromSettings } from "@/lib/seo-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return simplePageMetadataFromSettings({
    title: "Pricing | Doggy Daycare Syracuse NY | Paws & Play",
    description:
      "Simple, transparent daycare pricing. Half Day $28, Full Day $38, 5 Day Package $171, Monthly Membership $520. No hidden fees, no contracts.",
    keywords: [
      "doggy daycare pricing Syracuse",
      "dog daycare rates",
      "Syracuse dog daycare costs",
      "daycare packages",
    ],
    canonicalPath: "/pricing",
  });
}

const daycareOptions = [
  {
    name: "Half Day",
    price: "$28",
    duration: "Up to 4 hours",
    description: "Perfect for short schedules",
    features: [
      "Morning or afternoon session",
      "Supervised play groups",
      "Fun & enrichment",
      "Photo updates",
    ],
  },
  {
    name: "Full Day",
    price: "$38",
    duration: "Up to 10 hours",
    popular: true,
    description: "Most popular option",
    features: [
      "Full day of play",
      "Supervised play groups",
      "Enrichment activities",
      "Rest & quiet time",
      "Photo updates",
    ],
  },
  {
    name: "5 Day Package",
    price: "$171",
    duration: "5 full days",
    description: "Great value package",
    features: [
      "Use within 30 days",
      "Anytime flexibility",
      "All Full Day benefits",
      "$9 savings",
    ],
  },
  {
    name: "Monthly Membership",
    price: "$520",
    duration: "20 days/month",
    description: "Best value for regulars",
    features: [
      "Best weekly value",
      "Priority scheduling",
      "10% off add-on services",
      "Flexible scheduling",
    ],
  },
];

const addOns = [
  { name: "Bath & Brush", price: "$30" },
  { name: "Nail Trim", price: "$15" },
  { name: "Teeth Brushing", price: "$10" },
  { name: "Ear Cleaning", price: "$10" },
  { name: "Birthday Party Package", price: "$75" },
  { name: "Extra Enrichment (30 min)", price: "$20" },
];

const faqs = [
  {
    question: "Do I need to commit to a membership?",
    answer:
      "No! All our options are drop-in friendly. Memberships are optional for families who want the best value.",
  },
  {
    question: "What if my dog doesn't like group play?",
    answer:
      "We do a free temperament screening first. If your dog prefers solo play, we'll create a custom plan with individual activities.",
  },
  {
    question: "Are meals included?",
    answer:
      "You can bring your dog's food or we can provide it at no extra charge. Just let us know your pup's dietary needs.",
  },
  {
    question: "What's your cancellation policy?",
    answer:
      "Cancel up to 24 hours before for a full refund. We understand plans change!",
  },
  {
    question: "Do you offer boarding too?",
    answer:
      "Yes! We offer overnight boarding in addition to daycare. Visit our Boarding page for overnight pricing.",
  },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero */}
      <section
        className="relative overflow-hidden py-16 md:py-20"
        style={{
          background:
            "linear-gradient(135deg, var(--color-deep-sky) 0%, var(--color-sky) 100%)",
        }}
      >
        <div className="container mx-auto px-4">
          <FadeUp>
            <div className="mx-auto max-w-3xl text-center text-white">
              <h1 className="font-display mb-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
                Simple, Transparent{" "}
                <span className="relative inline-block">
                  Pricing
                  <svg
                    className="absolute -right-4 -top-3 h-8 w-8 text-yellow-300 opacity-80"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="6" cy="6" r="1.5" />
                  </svg>
                </span>
              </h1>
              <p className="mb-2 text-lg leading-relaxed text-white/90 md:text-xl">
                Choose the option that works best for you and your pup!
              </p>
              <p className="text-base text-white/75">
                No contracts. No hidden fees. Just happy dogs and transparent
                pricing.
              </p>
            </div>
          </FadeUp>
        </div>

        {/* Wave bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16 bg-background"
          style={{
            clipPath: "ellipse(70% 100% at 50% 100%)",
            transform: "translateY(50%)",
          }}
        ></div>
      </section>

      {/* Daycare Pricing */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <FadeUp>
            <div className="mb-12 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
                Daycare Options
              </p>
              <h2 className="font-display mb-4 text-3xl font-bold text-foreground md:text-4xl">
                Choose What Works for You
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                From occasional playdays to full-time care, we've got options
                for every schedule.
              </p>
            </div>
          </FadeUp>

          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-4">
            {daycareOptions.map((option, index) => (
              <ScaleIn key={option.name} delay={index * 0.1}>
                <div
                  className={`paw-card relative h-full p-6 transition-all ${
                    option.popular
                      ? "border-2 border-primary shadow-xl scale-105"
                      : ""
                  }`}
                >
                  {option.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm font-bold text-white">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-6 text-center">
                    <h3 className="font-display mb-2 text-2xl font-bold text-foreground">
                      {option.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {option.duration}
                    </p>
                    <p className="mt-4 text-5xl font-bold text-primary">
                      {option.price}
                    </p>
                    <p className="mt-2 text-sm font-medium text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                  <ul className="mb-6 space-y-3">
                    {option.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle2
                          className="mt-0.5 h-5 w-5 shrink-0 text-green-600"
                          aria-hidden="true"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className="w-full"
                    variant={option.popular ? "default" : "outline"}
                  >
                    <Link href="/book">Book Now</Link>
                  </Button>
                </div>
              </ScaleIn>
            ))}
          </div>
        </div>
      </section>

      {/* Add-Ons Section */}
      <section className="section-padding bg-accent/30">
        <div className="container mx-auto px-4">
          <FadeUp>
            <div className="mb-12 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
                Optional Extras
              </p>
              <h2 className="font-display mb-4 text-3xl font-bold text-foreground md:text-4xl">
                Pamper Your Pup
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Add grooming, special treats, or celebration packages to make
                their day extra special.
              </p>
            </div>
          </FadeUp>

          <div className="mx-auto grid max-w-3xl gap-4">
            {addOns.map((addOn, index) => (
              <ScaleIn key={addOn.name} delay={index * 0.05}>
                <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md">
                  <span className="font-medium text-foreground">
                    {addOn.name}
                  </span>
                  <span className="text-xl font-bold text-primary">
                    {addOn.price}
                  </span>
                </div>
              </ScaleIn>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <FadeUp>
            <div className="mb-12 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
                Common Questions
              </p>
              <h2 className="font-display mb-4 text-3xl font-bold text-foreground md:text-4xl">
                Pricing FAQs
              </h2>
            </div>
          </FadeUp>

          <div className="mx-auto max-w-3xl space-y-4">
            {faqs.map((faq, index) => (
              <ScaleIn key={faq.question} delay={index * 0.06}>
                <div className="paw-card p-6">
                  <div className="mb-2 flex items-start gap-3">
                    <HelpCircle
                      className="mt-1 h-5 w-5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <h3 className="font-display text-lg font-bold text-foreground">
                      {faq.question}
                    </h3>
                  </div>
                  <p className="ml-8 text-base text-muted-foreground">
                    {faq.answer}
                  </p>
                </div>
              </ScaleIn>
            ))}
          </div>

          <FadeUp delay={0.3}>
            <div className="mt-12 text-center">
              <p className="mb-4 text-base text-muted-foreground">
                More questions? We're here to help!
              </p>
              <Button asChild size="lg" variant="outline">
                <Link href="/faq">View All FAQs</Link>
              </Button>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="section-padding relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--color-deep-sky) 0%, var(--color-sky) 100%)",
        }}
      >
        <div className="container relative z-10 mx-auto px-4 text-center">
          <FadeUp>
            <h2 className="font-display mb-6 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              Ready to Book Your Dog's{" "}
              <span className="relative inline-block">
                First Playday?
                <svg
                  className="absolute -right-4 -top-3 h-8 w-8 text-yellow-300 opacity-80"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </span>
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-white/90">
              Start with a free meet & greet to make sure your pup is a good fit
              for our pack!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="font-bold text-base shadow-lg"
                style={{
                  background: "var(--color-yellow)",
                  color: "var(--color-navy)",
                }}
              >
                <Link href="/book">
                  <span className="mr-2 text-xl" aria-hidden="true">
                    🐾
                  </span>
                  Book a Playday
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="font-semibold text-base border-2 border-white bg-white/10 text-white backdrop-blur-sm hover:bg-white hover:text-primary"
              >
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </FadeUp>
        </div>

        {/* Decorative paw prints */}
        <div className="absolute left-8 top-8 text-6xl opacity-10">🐾</div>
        <div className="absolute bottom-12 right-12 text-5xl opacity-10">
          🐾
        </div>
      </section>
    </div>
  );
}
