import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Heart,
  Shield,
  Star,
  Users,
  Award,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { FadeUp, SlideInLeft, SlideInRight, StaggerContainer, StaggerItem } from "@/components/motion";

export const metadata: Metadata = {
  title: "About Zaine's Stay & Play | Luxury Dog Boarding Syracuse NY",
  description:
    "Meet the team behind Syracuse's most trusted luxury dog boarding. Certified professionals, owner on-site, 24/7 care. Learn our story and values.",
  keywords: [
    "dog boarding owner",
    "dog care philosophy",
    "certified pet care",
    "Syracuse dog boarding",
    "luxury pet care",
  ],
};

const values = [
  {
    icon: Heart,
    title: "Individualized Love",
    description:
      "Every dog receives personal attention, comfort, and affection from our caring team.",
  },
  {
    icon: Shield,
    title: "Safety First",
    description:
      "Certified professionals, secure facilities, 24/7 supervision, emergency protocols.",
  },
  {
    icon: Star,
    title: "Excellence",
    description:
      "Highest standards in pet care, facility maintenance, and customer communication.",
  },
  {
    icon: Users,
    title: "Community Trust",
    description:
      "Serving Syracuse families who value transparency, compassion, and boutique care.",
  },
];

const certifications = [
  "Licensed Pet Care Facility",
  "Certified Pet First Aid & CPR",
  "Professional Dog Trainer Certification",
  "Fully Insured & Bonded",
  "USDA Licensed Kennel",
  "Member of Pet Care Services Association",
];

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero */}
      <FadeUp>
        <section className="relative bg-gradient-to-br from-primary/5 via-primary/2 to-secondary/3 py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-6 font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight">
                Where Every Pet Is Family
              </h1>
              <p className="text-lg md:text-xl text-foreground/70">
                Built on a philosophy of fewer dogs, better care. We provide personalized attention, unwavering safety, and genuine affection to every guest.
              </p>
            </div>
          </div>
        </section>
      </FadeUp>

      {/* Owner Story */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <SlideInLeft>
              <div className="relative h-[400px] w-full rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center shadow-lg">
                {/* Placeholder for owner photo */}
                <div className="flex h-full items-center justify-center">
                  <Users className="h-32 w-32 text-primary/20" />
                </div>
              </div>
            </SlideInLeft>
            <SlideInRight>
              <div>
                <h2 className="mb-6 font-display text-3xl md:text-4xl font-semibold">
                  Our Philosophy
                </h2>
                <div className="space-y-5 text-foreground/70 text-lg leading-relaxed">
                  <p>
                    Zaine's Stay & Play exists to answer a single, persistent question: <em>"Where can I trust my dog to feel safe, loved, and comfortable?"</em>
                  </p>
                  <p>
                    We intentionally limit capacity to just three suites. This isn't a limitation—it's a promise. Every dog gets individualized attention, predictable routines, and genuine care from someone who knows them personally.
                  </p>
                  <p>
                    Our owner-on-site approach means quick responses, consistent communication, and the kind of flexibility that matters when your pup has special needs or just prefers quiet time over chaos.
                  </p>
                  <p className="font-semibold text-primary">
                    We don't run a boarding facility. We create a second home.
                  </p>
                </div>
              </div>
            </SlideInRight>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-secondary/40 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <FadeUp>
            <div className="mb-16 text-center">
              <h2 className="mb-4 font-display text-3xl md:text-4xl font-semibold">
                Our Core Values
              </h2>
              <p className="text-lg text-foreground/60">
                Principles that guide every decision, every day
              </p>
            </div>
          </FadeUp>

          <StaggerContainer>
            {values.map((value) => {
              const ValueIcon = value.icon;
              return (
                <StaggerItem key={value.title}>
                  <Card className="border-border/30 bg-background/50 backdrop-blur-sm hover:bg-background transition-colors duration-300">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <ValueIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-display text-lg font-semibold mb-2">
                            {value.title}
                          </h3>
                          <p className="text-foreground/70">
                            {value.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* Certifications & Credentials */}
      <FadeUp>
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="mb-4 font-display text-3xl md:text-4xl font-semibold">
                Certifications & Credentials
              </h2>
              <p className="text-lg text-foreground/60">
                Professional standards you can trust
              </p>
            </div>

            <StaggerContainer>
              {certifications.map((cert) => (
                <StaggerItem key={cert}>
                  <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-primary/5 transition-colors duration-300">
                    <Award className="h-6 w-6 shrink-0 text-primary flex-shrink-0" />
                    <span className="font-medium text-foreground">{cert}</span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      </FadeUp>

      {/* Why Small Capacity */}
      <FadeUp>
        <section className="bg-primary/5 py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl rounded-xl border border-primary/20 bg-primary/5 p-8 md:p-12">
              <div className="flex items-start gap-4">
                <Zap className="h-8 w-8 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="mb-4 font-display text-2xl font-semibold">
                    Why Only 3 Suites?
                  </h3>
                  <div className="space-y-3 text-foreground/70">
                    <p>
                      <strong className="text-foreground">Prevents stress:</strong> Fewer dogs means less barking, fewer conflicts, calmer environment.
                    </p>
                    <p>
                      <strong className="text-foreground">Enables personalization:</strong> We learn each dog's preferences, fears, triggers, and joys.
                    </p>
                    <p>
                      <strong className="text-foreground">Ensures supervision:</strong> One person can genuinely pay attention to three dogs simultaneously.
                    </p>
                    <p>
                      <strong className="text-foreground">Maintains quality:</strong> We can refuse poor-fit bookings. We're not trying to maximize occupancy—we're trying to maximize care.
                    </p>
                  </div>
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
              Experience the Difference
            </h2>
            <p className="mb-8 text-lg opacity-90 max-w-2xl mx-auto">
              Meet the Zaine's team and see why families across Syracuse trust us with their most precious family members.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                asChild
              >
                <Link href="/contact">Schedule a Tour</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/50 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                asChild
              >
                <Link href="/book">Book Your Stay</Link>
              </Button>
            </div>
          </div>
        </section>
      </FadeUp>

      {/* Schema.org Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "Zaine's Stay & Play",
            description:
              "Luxury private dog boarding in Syracuse, NY. Small capacity, owner on-site, 24/7 supervision.",
            url: "https://zainesstayandplay.com",
            telephone: "(315) 657-1332",
            email: "info@zainesstayandplay.com",
            address: {
              "@type": "PostalAddress",
              streetAddress: "123 Pet Care Lane",
              addressLocality: "Syracuse",
              addressRegion: "NY",
              postalCode: "13202",
              addressCountry: "US",
            },
            areaServed: [
              "Syracuse, NY",
              "Liverpool, NY",
              "Cicero, NY",
              "Baldwinsville, NY",
              "Fayetteville, NY",
              "Manlius, NY",
            ],
            priceRange: "$65-$120",
            sameAs: [
              "https://www.facebook.com/zainesstayandplay",
              "https://www.instagram.com/zainesstayandplay",
            ],
            knowsAbout: [
              "Dog Boarding",
              "Pet Care",
              "Dog Behavior",
              "Pet Safety",
            ],
            founder: {
              "@type": "Person",
              name: "Zaine's Owner",
            },
            hasCredential: [
              {
                "@type": "EducationalOccupationalCredential",
                credentialCategory: "certification",
                name: "Pet First Aid & CPR Certified",
              },
              {
                "@type": "EducationalOccupationalCredential",
                credentialCategory: "certification",
                name: "USDA Licensed Kennel",
              },
            ],
          }),
        }}
      />
    </div>
  );
}
