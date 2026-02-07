"use client";

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
import { Search, HelpCircle } from "lucide-react";

const faqCategories = {
  general: [
    {
      q: "What are your hours of operation?",
      a: "We're open 6:00 AM - 8:00 PM daily for drop-off and pick-up. However, we provide 24/7 supervision for all boarding guests.",
    },
    {
      q: "What areas do you serve?",
      a: "We serve Syracuse, Liverpool, Cicero, Baldwinsville, Fayetteville, Manlius, and surrounding areas within 30 miles of our facility.",
    },
    {
      q: "Do you offer tours of your facility?",
      a: "Yes! We encourage all new clients to schedule a tour. You can book a tour through our website or give us a call. Tours are available Monday-Saturday 10am-6pm.",
    },
    {
      q: "Are you licensed and insured?",
      a: "Yes, we are fully licensed by the Washington State Department of Agriculture and carry comprehensive liability insurance for your peace of mind.",
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
  daycare: [
    {
      q: "What's the difference between daycare and boarding?",
      a: "Daycare is for daytime care only - you drop off in the morning and pick up in the evening. Boarding includes overnight accommodations. Daycare is great for socialization and exercise while you work!",
    },
    {
      q: "Does my dog need to be neutered/spayed for daycare?",
      a: "Dogs over 7 months must be spayed/neutered to participate in group daycare. This helps reduce behavioral issues and maintain a calm play environment.",
    },
    {
      q: "How are play groups organized?",
      a: "We organize play groups by size, temperament, and play style. Small/gentle dogs play separately from large/rowdy dogs. Groups are limited to 12-15 dogs with dedicated staff supervision.",
    },
    {
      q: "Can I do part-time daycare?",
      a: "Absolutely! We offer flexible options: single days, weekly packages (5 days), or monthly packages (20 days). Packages are valid for 3 months from purchase.",
    },
    {
      q: "What if my dog doesn't like group play?",
      a: "Some dogs prefer quieter time, which is fine! We offer individual play sessions and rest time. Just let us know your dog's preferences during intake.",
    },
  ],
  grooming: [
    {
      q: "Do I need an appointment for grooming?",
      a: "Yes, all grooming services require an appointment. We recommend booking 2-3 weeks in advance, especially during peak seasons (spring/summer).",
    },
    {
      q: "How long does grooming take?",
      a: "Bath & brush takes about 1-2 hours. Full grooms take 2-4 hours depending on your dog's size, coat condition, and temperament. We'll give you a pickup time when you drop off.",
    },
    {
      q: "What if my dog is nervous about grooming?",
      a: "Our groomers are trained in gentle handling techniques. We go at your dog's pace and take breaks as needed. For very anxious dogs, we can split services across multiple shorter appointments.",
    },
    {
      q: "Can you groom dogs with matted fur?",
      a: "Yes, but severe matting may require a shorter cut than desired. We'll assess your dog's coat and discuss options. De-matting can be uncomfortable, so we prioritize your pet's comfort.",
    },
    {
      q: "Do you use natural/organic products?",
      a: "Yes! All our shampoos and conditioners are hypoallergenic, pH-balanced, and free from harmful chemicals. We also offer CBD-infused spa treatments for anxious pets.",
    },
  ],
  requirements: [
    {
      q: "What vaccinations are required?",
      a: "All dogs must be current on: Rabies, DHPP (Distemper/Parvo), and Bordetella (kennel cough). Canine Influenza vaccine is strongly recommended but not required. Proof of vaccination must be provided before the first visit.",
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
      q: "Do you offer discounts?",
      a: "Yes! We offer: 10% off stays over 14 nights, 15% off for 2nd pet from same family, 20% off for 3rd+ pets, and monthly daycare packages save 20%+.",
    },
    {
      q: "What if I pick up late?",
      a: "Late pickups (after 8 PM) are charged $25 per hour. If you're running late, please call us so we can arrange care for your pet.",
    },
    {
      q: "Do you charge extra for holidays?",
      a: "Yes, major holidays (Thanksgiving, Christmas, New Year's) have a 20% surcharge due to high demand. We recommend booking 2-3 months in advance for holidays.",
    },
  ],
};

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("general");

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-teal-50 to-blue-50 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Help Center</Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Frequently Asked Questions
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              Find answers to common questions about our services, policies, and facility
            </p>

            {/* Search */}
            <div className="relative mx-auto max-w-xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search questions..."
                className="h-14 pl-12 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mx-auto max-w-4xl">
            <TabsList className="mb-8 grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="boarding">Boarding</TabsTrigger>
              <TabsTrigger value="daycare">Daycare</TabsTrigger>
              <TabsTrigger value="grooming">Grooming</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
            </TabsList>

            {Object.entries(faqCategories).map(([category, questions]) => (
              <TabsContent key={category} value={category}>
                <Accordion type="single" collapsible className="space-y-4">
                  {questions
                    .filter((faq) =>
                      searchQuery
                        ? faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.a.toLowerCase().includes(searchQuery.toLowerCase())
                        : true
                    )
                    .map((faq, index) => (
                      <AccordionItem
                        key={index}
                        value={`${category}-${index}`}
                        className="rounded-lg border px-6"
                      >
                        <AccordionTrigger className="text-left hover:no-underline">
                          <span className="font-semibold">{faq.q}</span>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                </Accordion>

                {questions.filter((faq) =>
                  searchQuery
                    ? faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
                    : true
                ).length === 0 && (
                  <div className="py-12 text-center">
                    <HelpCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                    <h3 className="mb-2 text-xl font-semibold">No results found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search or browse other categories
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Quick Links */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-3xl font-bold">Need More Information?</h2>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            <Card className="text-center transition-shadow hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <HelpCircle className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="mb-2 text-xl font-semibold">View Our Policies</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Detailed information about cancellations, health requirements, and more
                </p>
                <Button variant="outline" asChild>
                  <Link href="/policies">Read Policies</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center transition-shadow hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    📞
                  </div>
                </div>
                <h3 className="mb-2 text-xl font-semibold">Contact Us</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Speak with our team directly for personalized assistance
                </p>
                <Button variant="outline" asChild>
                  <Link href="/contact">Get in Touch</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center transition-shadow hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    🏠
                  </div>
                </div>
                <h3 className="mb-2 text-xl font-semibold">Schedule a Tour</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  See our facility in person and meet our team
                </p>
                <Button variant="outline" asChild>
                  <Link href="/contact">Book Tour</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Book Your Pet&apos;s Stay?</h2>
          <p className="mb-8 text-lg opacity-90">
            We&apos;re here to answer any remaining questions and get your pet scheduled
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/book">Book Now</Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              asChild
            >
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
