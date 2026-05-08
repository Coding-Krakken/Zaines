'use client';

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MessageCircle, PhoneIcon, MapPin } from "lucide-react";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/motion";

const faqCategories = {
  general: [
    {
      q: "What are your hours of operation?",
      a: "We're open 6:00 AM - 8:00 PM daily for drop-off and pick-up. However, we provide 24/7 supervision for all boarding guests.",
    },
    {
      q: "What areas do you serve?",
      a: "We serve Syracuse, Liverpool, Cicero, Baldwinsville, Fayetteville, Manlius, Clay, North Syracuse, and surrounding areas within 30 miles of our facility.",
    },
    {
      q: "Do you offer tours of your facility?",
      a: "Yes! We encourage all new clients to schedule a tour. You can book a tour through our website or give us a call. Tours are available Monday-Saturday 10am-6pm.",
    },
    {
      q: "Are you licensed and insured?",
      a: "Yes, we are fully licensed by the New York State Department of Agriculture and carry comprehensive liability insurance for your peace of mind.",
    },
  ],
  boarding: [
    {
      q: "What's included with boarding?",
      a: "All boarding stays include: comfortable accommodations, multiple potty breaks, group play sessions, meal service (you provide food), daily cleaning, 24/7 supervision, and photo updates.",
    },
    {
      q: "Can I bring my dog's food?",
      a: "Yes, we actually require it! Please bring enough food for your dog's entire stay, plus 1-2 extra days. This helps prevent tummy upset from food changes.",
    },
    {
      q: "What if my dog needs medication?",
      a: "We're happy to administer medications at no additional charge. Please provide clear written instructions and all medications in their original packaging.",
    },
    {
      q: "How often will I get photo updates?",
      a: "We send daily photo updates via text or email. Deluxe and Luxury suite guests also have 24/7 webcam access to their pet's suite.",
    },
    {
      q: "Can dogs from the same family share a suite?",
      a: "Yes! Dogs from the same family can share Deluxe or Luxury suites. Additional pet rates apply but are discounted (15% off for 2nd pet, 20% off for 3rd+).",
    },
    {
      q: "What if my plans change and I need to extend my stay?",
      a: "No problem! As long as we have availability, we can extend your stay. Contact us as soon as possible to avoid any scheduling conflicts.",
    },
  ],
  health: [
    {
      q: "What vaccinations are required?",
      a: "All dogs must be current on: Rabies, DHPP (Distemper/Parvo), and Bordetella (kennel cough). Canine Influenza vaccine is strongly recommended. Proof of vaccination must be provided before the first visit.",
    },
    {
      q: "Do you accept puppies?",
      a: "Puppies must be at least 4 months old and fully vaccinated (2 weeks after final puppy shots). We have Puppy Preschool available for younger pups!",
    },
    {
      q: "What if my dog has behavioral issues?",
      a: "We welcome all dogs! However, for the safety of all guests, dogs with a history of aggression toward people or other dogs may require an evaluation before acceptance. Contact us to discuss.",
    },
    {
      q: "Do you accept senior dogs?",
      a: "Yes! We love senior dogs. We'll work with you to accommodate any special needs like mobility issues, frequent potty breaks, or medications.",
    },
    {
      q: "What about flea/tick prevention?",
      a: "All dogs must be on current flea/tick prevention. If we discover fleas, we'll treat your dog (at owner's expense) to protect other guests.",
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
      q: "How is pricing for multiple dogs handled?",
      a: "Multi-dog pricing is itemized in your quote before confirmation so you can review a clear subtotal, tax, and total with no hidden fees.",
    },
    {
      q: "What if I pick up late?",
      a: "Late pickups (after 8 PM) are charged $25 per hour. If you're running late, please call us so we can arrange care for your pet.",
    },
    {
      q: "Do you charge extra for holidays?",
      a: "Holiday pricing may differ for select dates and is always disclosed before confirmation. No hidden fees or surprise add-ons are introduced later.",
    },
  ],
};

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("general");

  const allFaqs = Object.values(faqCategories).flat();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero Section */}
      <FadeUp>
        <section className="relative bg-gradient-to-br from-primary/5 via-primary/2 to-secondary/3 py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                Help Center
              </Badge>
              <h1 className="mb-6 font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight">
                Frequently Asked Questions
              </h1>
              <p className="mb-8 text-lg md:text-xl text-foreground/70">
                Find answers to questions about our boarding services, policies, vaccinations, and booking process
              </p>

              {/* Search */}
              <div className="relative mx-auto max-w-xl">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/40" />
                <Input
                  type="search"
                  placeholder="Search questions..."
                  className="h-14 pl-12 text-lg border-border/30 bg-background/50 backdrop-blur-sm"
                  aria-label="Search Frequently Asked Questions"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>
      </FadeUp>

      {/* FAQ Content */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <FadeUp>
            <div className="mx-auto max-w-4xl">
              <Tabs
                value={activeCategory}
                onValueChange={setActiveCategory}
                className="w-full"
              >
                <TabsList className="mb-12 grid w-full grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2">
                  <TabsTrigger value="general" className="text-sm md:text-base">General</TabsTrigger>
                  <TabsTrigger value="boarding" className="text-sm md:text-base">Boarding</TabsTrigger>
                  <TabsTrigger value="health" className="text-sm md:text-base">Health</TabsTrigger>
                  <TabsTrigger value="payment" className="text-sm md:text-base">Payment</TabsTrigger>
                </TabsList>

                {Object.entries(faqCategories).map(([category, questions]) => (
                  <TabsContent key={category} value={category}>
                    <StaggerContainer>
                      <Accordion type="single" collapsible className="space-y-3">
                        {questions
                          .filter((faq) =>
                            searchQuery
                              ? faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                faq.a.toLowerCase().includes(searchQuery.toLowerCase())
                              : true,
                          )
                          .map((faq, index) => (
                            <StaggerItem key={index}>
                              <AccordionItem
                                value={`${category}-${index}`}
                                className="border border-border/30 rounded-lg px-6 bg-background/50 hover:bg-background transition-colors duration-200 data-[state=open]:bg-background"
                              >
                                <AccordionTrigger className="text-left hover:no-underline py-4 font-display font-semibold text-foreground/90 hover:text-foreground">
                                  <span>{faq.q}</span>
                                </AccordionTrigger>
                                <AccordionContent className="text-foreground/70 pb-4 pt-0 leading-relaxed">
                                  {faq.a}
                                </AccordionContent>
                              </AccordionItem>
                            </StaggerItem>
                          ))}
                      </Accordion>

                      {questions.filter((faq) =>
                        searchQuery
                          ? faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            faq.a.toLowerCase().includes(searchQuery.toLowerCase())
                          : true,
                      ).length === 0 && (
                        <div className="py-16 text-center">
                          <Search className="mx-auto mb-4 h-16 w-16 text-foreground/20" />
                          <h3 className="mb-2 font-display text-xl font-semibold">
                            No results found
                          </h3>
                          <p className="text-foreground/60">
                            Try adjusting your search or browse other categories
                          </p>
                        </div>
                      )}
                    </StaggerContainer>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Quick Links */}
      <FadeUp>
        <section className="bg-secondary/40 py-16 md:py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center font-display text-3xl md:text-4xl font-semibold">
              Need More Help?
            </h2>
            <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
              <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <MessageCircle className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="mb-2 text-center font-display font-semibold">
                    Contact Us
                  </h3>
                  <p className="mb-4 text-center text-sm text-foreground/70">
                    Speak with our team directly for personalized assistance
                  </p>
                  <div className="flex justify-center">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/contact">Get in Touch</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <PhoneIcon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="mb-2 text-center font-display font-semibold">
                    Call Us
                  </h3>
                  <p className="mb-4 text-center text-sm text-foreground/70">
                    Mon-Sat 10am-6pm<br />(315) 657-1332
                  </p>
                  <div className="flex justify-center">
                    <Button variant="outline" size="sm" asChild>
                      <a href="tel:3156571332">Call Now</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="mb-2 text-center font-display font-semibold">
                    Schedule a Tour
                  </h3>
                  <p className="mb-4 text-center text-sm text-foreground/70">
                    See our facility in person and meet our team
                  </p>
                  <div className="flex justify-center">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/contact">Book Tour</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </FadeUp>

      {/* CTA */}
      <FadeUp>
        <section className="bg-gradient-to-r from-primary/90 to-primary py-16 md:py-24 text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 font-display text-3xl md:text-4xl font-semibold">
              Ready to Book Your Pet's Stay?
            </h2>
            <p className="mb-8 text-lg opacity-90 max-w-2xl mx-auto">
              We're here to answer any remaining questions and get your dog scheduled for the care they deserve.
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
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </section>
      </FadeUp>

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
