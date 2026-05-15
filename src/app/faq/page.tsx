'use client';

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MessageCircle, PhoneIcon, Calendar, HelpCircle } from "lucide-react";
import { FadeUp, ScaleIn } from "@/components/motion";

const faqCategories = {
  daycare: [
    {
      q: "What ages do you accept for doggy daycare?",
      a: "We accept dogs 4 months and older who are fully vaccinated. Puppies must be 2 weeks past their final puppy shot series.",
    },
    {
      q: "How do you group dogs for playtime?",
      a: "Dogs are carefully matched by size, energy level, and play style. We conduct temperament screenings for all new guests to ensure safe, compatible playgroups.",
    },
    {
      q: "What's included in a daycare day?",
      a: "Every daycare day includes supervised group play, rest breaks, fresh water, enrichment activities, and photo updates sent to your phone!",
    },
    {
      q: "Can I do a half day instead of full day?",
      a: "Yes! We offer flexible Half Day (4 hours) and Full Day (8+ hours) options. Half Day is $28, Full Day is $38.",
    },
    {
      q: "Do I need to book daycare in advance?",
      a: "We recommend booking at least 24 hours in advance to guarantee a spot, especially for new guests. Walk-ins accepted based on availability.",
    },
    {
      q: "What if my dog doesn't like group play?",
      a: "No problem! We offer quieter enrichment activities and can arrange individual play sessions for dogs who prefer solo time.",
    },
  ],
  general: [
    {
      q: "What are your hours of operation?",
      a: "We're open 6:00 AM - 8:00 PM daily for drop-off and pick-up. We provide 24/7 supervision for overnight boarding guests.",
    },
    {
      q: "What areas do you serve?",
      a: "We serve Syracuse, Liverpool, Cicero, Baldwinsville, Fayetteville, Manlius, Clay, North Syracuse, and surrounding areas within 30 miles.",
    },
    {
      q: "Do you offer tours of your facility?",
      a: "Yes! We encourage all new clients to schedule a tour. Tours are available Monday-Saturday 10am-6pm. Book online or give us a call!",
    },
    {
      q: "Are you licensed and insured?",
      a: "Yes, we are fully licensed by the New York State Department of Agriculture and carry comprehensive liability insurance.",
    },
  ],
  boarding: [
    {
      q: "What's included with overnight boarding?",
      a: "All boarding stays include: comfortable accommodations, multiple potty breaks, group play sessions, meal service (you provide food), daily cleaning, 24/7 supervision, and photo updates.",
    },
    {
      q: "Can I bring my dog's food?",
      a: "Yes, we actually require it! Please bring enough food for your dog's entire stay, plus 1-2 extra days to prevent tummy upset from food changes.",
    },
    {
      q: "What if my dog needs medication?",
      a: "We're happy to administer medications at no additional charge. Please provide clear written instructions and medications in original packaging.",
    },
    {
      q: "How often will I get photo updates?",
      a: "We send daily photo updates via text or email during your dog's stay so you can see how they're doing!",
    },
  ],
  health: [
    {
      q: "What vaccinations are required?",
      a: "All dogs must be current on: Rabies, DHPP (Distemper/Parvo), and Bordetella (kennel cough). Canine Influenza vaccine is strongly recommended. Proof required before first visit.",
    },
    {
      q: "Do you accept puppies?",
      a: "Puppies must be at least 4 months old and fully vaccinated (2 weeks after final shots). We have special puppy play sessions available!",
    },
    {
      q: "What if my dog has behavioral issues?",
      a: "We welcome all dogs! For safety, dogs with a history of aggression toward people or other dogs may require an evaluation. Contact us to discuss.",
    },
    {
      q: "Do you accept senior dogs?",
      a: "Yes! We love senior dogs and accommodate special needs like mobility issues, frequent potty breaks, or medications.",
    },
    {
      q: "What about flea/tick prevention?",
      a: "All dogs must be on current flea/tick prevention. If fleas are discovered, we'll treat your dog (at owner's expense) to protect other guests.",
    },
  ],
  payment: [
    {
      q: "When is payment due?",
      a: "Payment is required at the time of booking. We accept all major credit cards, debit cards, and digital wallets (Apple Pay, Google Pay).",
    },
    {
      q: "What's your cancellation policy?",
      a: "Free cancellation up to 48 hours before check-in for full refund. Cancellations within 48 hours receive 50% refund. No-shows are not refunded.",
    },
    {
      q: "Do you offer package deals?",
      a: "Yes! We offer 5 Day Packages ($171) and Monthly Memberships (20 days for $520) that save you money on regular daycare visits.",
    },
    {
      q: "What if I pick up late?",
      a: "Late pickups (after 8 PM) are charged $25 per hour. If you're running late, please call us so we can arrange care for your pet.",
    },
  ],
};

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("daycare");

  const allFaqs = Object.values(faqCategories).flat();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero Section */}
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
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
                <HelpCircle className="h-4 w-4" />
                Help Center
              </div>
              <h1 className="font-display mb-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
                Got Questions?{" "}
                <span className="relative inline-block">
                  We've Got Wags!
                  <svg
                    className="absolute -right-6 -top-2 h-10 w-10 text-yellow-300 opacity-80"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
              <p className="mb-8 text-lg leading-relaxed text-white/90 md:text-xl">
                Find answers to common questions about daycare, boarding, pricing, and more
              </p>

              {/* Search */}
              <div className="relative mx-auto max-w-xl">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy/40" />
                <Input
                  type="search"
                  placeholder="Search questions..."
                  className="h-14 rounded-2xl border-white/30 bg-white pl-12 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Search Frequently Asked Questions"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
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

      {/* FAQ Content */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <FadeUp>
            <div className="mx-auto max-w-4xl">
              <Tabs
                value={activeCategory}
                onValueChange={setActiveCategory}
                className="w-full"
              >
                <TabsList className="mb-12 grid w-full grid-cols-2 gap-2 lg:grid-cols-5 h-auto">
                  <TabsTrigger value="daycare" className="text-sm md:text-base py-3">
                    🐾 Daycare
                  </TabsTrigger>
                  <TabsTrigger value="general" className="text-sm md:text-base py-3">
                    📋 General
                  </TabsTrigger>
                  <TabsTrigger value="boarding" className="text-sm md:text-base py-3">
                    🏠 Boarding
                  </TabsTrigger>
                  <TabsTrigger value="health" className="text-sm md:text-base py-3">
                    💉 Health
                  </TabsTrigger>
                  <TabsTrigger value="payment" className="text-sm md:text-base py-3">
                    💳 Payment
                  </TabsTrigger>
                </TabsList>

                {Object.entries(faqCategories).map(([category, questions]) => (
                  <TabsContent key={category} value={category}>
                    <Accordion type="single" collapsible className="space-y-4">
                      {questions
                        .filter((faq) =>
                          searchQuery
                            ? faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              faq.a.toLowerCase().includes(searchQuery.toLowerCase())
                            : true,
                        )
                        .map((faq, index) => (
                          <ScaleIn key={index} delay={index * 0.05}>
                            <AccordionItem
                              value={`${category}-${index}`}
                              className="paw-card overflow-hidden border-0 px-6"
                            >
                              <AccordionTrigger className="py-5 text-left font-display font-bold text-foreground hover:no-underline hover:text-primary">
                                <span>{faq.q}</span>
                              </AccordionTrigger>
                              <AccordionContent className="pb-5 pt-0 text-base leading-relaxed text-muted-foreground">
                                {faq.a}
                              </AccordionContent>
                            </AccordionItem>
                          </ScaleIn>
                        ))}
                    </Accordion>

                    {questions.filter((faq) =>
                      searchQuery
                        ? faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.a.toLowerCase().includes(searchQuery.toLowerCase())
                        : true,
                    ).length === 0 && (
                      <div className="py-16 text-center">
                        <Search className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                        <h3 className="font-display mb-2 text-xl font-bold text-foreground">
                          No results found
                        </h3>
                        <p className="text-muted-foreground">
                          Try adjusting your search or browse other categories
                        </p>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Quick Links */}
      <section className="section-padding bg-accent/20">
        <div className="container mx-auto px-4">
          <FadeUp>
            <h2 className="font-display mb-12 text-center text-3xl font-bold text-foreground md:text-4xl">
              Need More Help?
            </h2>
          </FadeUp>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            <ScaleIn delay={0.1}>
              <div className="paw-card p-8 text-center">
                <div className="badge-icon mx-auto mb-4 bg-primary/10">
                  <MessageCircle className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display mb-3 font-bold text-foreground">
                  Contact Us
                </h3>
                <p className="mb-6 text-sm text-muted-foreground">
                  Speak with our team for personalized assistance
                </p>
                <Button
                  className="paw-button-secondary w-full"
                  asChild
                >
                  <Link href="/contact">Get in Touch</Link>
                </Button>
              </div>
            </ScaleIn>

            <ScaleIn delay={0.15}>
              <div className="paw-card p-8 text-center">
                <div className="badge-icon mx-auto mb-4 bg-green-100">
                  <PhoneIcon className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="font-display mb-3 font-bold text-foreground">
                  Call Us
                </h3>
                <p className="mb-2 text-sm text-muted-foreground">
                  Mon-Sat 10am-6pm
                </p>
                <p className="mb-6 text-base font-bold text-foreground">
                  (315) 657-1332
                </p>
                <Button
                  className="paw-button-secondary w-full"
                  asChild
                >
                  <a href="tel:3156571332">Call Now</a>
                </Button>
              </div>
            </ScaleIn>

            <ScaleIn delay={0.2}>
              <div className="paw-card p-8 text-center">
                <div className="badge-icon mx-auto mb-4" style={{ background: "oklch(0.88 0.17 90 / 20%)" }}>
                  <Calendar className="h-7 w-7" style={{ color: "var(--color-navy)" }} />
                </div>
                <h3 className="font-display mb-3 font-bold text-foreground">
                  Schedule a Tour
                </h3>
                <p className="mb-6 text-sm text-muted-foreground">
                  See our facility and meet the team in person
                </p>
                <Button
                  className="paw-button-secondary w-full"
                  asChild
                >
                  <Link href="/contact">Book Tour</Link>
                </Button>
              </div>
            </ScaleIn>
          </div>
        </div>
      </section>

      {/* CTA */}
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
              Ready for Your Dog's Best Day?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-white/90">
              We're here to answer any remaining questions and get your pup scheduled for tail-wagging fun!
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
                <Link href="/contact">
                  <MessageCircle className="mr-2 h-5 w-5" aria-hidden="true" />
                  Contact Us
                </Link>
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

      {/* Schema.org FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: allFaqs.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.a,
              },
            })),
          }),
        }}
      />
    </div>
  );
}
