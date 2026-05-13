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
import {
  FadeUp,
  ScaleIn,
  SlideInLeft,
  SlideInRight,
  StaggerContainer,
  StaggerItem,
} from "@/components/motion";
import { simplePageMetadataFromSettings } from "@/lib/seo-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return simplePageMetadataFromSettings({
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
    canonicalPath: "/about",
  });
}

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
    <div className="flex min-h-screen flex-col bg-background">
      <FadeUp>
        <section className="section-padding relative bg-gradient-to-br from-primary/5 via-primary/2 to-secondary/3">
          <div className="container mx-auto px-4">
            <div className="luxury-shell grain-overlay mx-auto max-w-5xl p-8 text-center md:p-12">
              <p className="eyebrow mb-4">About the care model</p>
              <h1 className="headline-display mb-6 text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
                Where Every Pet
                <br />
                <em className="not-italic text-primary">Is Treated Like Family</em>
              </h1>
              <p className="mx-auto max-w-3xl text-lg text-foreground/70 md:text-xl">
                Built on a philosophy of fewer dogs and better care, with owner-led attention, transparent communication, and safety-first routines.
              </p>
            </div>
          </div>
        </section>
      </FadeUp>

      <section className="section-padding-tight">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <SlideInLeft>
              <div className="luxury-card flex h-[380px] w-full items-center justify-center rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10">
                <div className="text-center">
                  <Users className="mx-auto h-28 w-28 text-primary/25" />
                  <p className="mt-4 text-sm uppercase tracking-[0.16em] text-muted-foreground">Owner-led care</p>
                </div>
              </div>
            </SlideInLeft>
            <SlideInRight>
              <div>
                <p className="eyebrow mb-3">Our philosophy</p>
                <h2 className="headline-display mb-6 text-3xl font-semibold md:text-4xl">
                  This Is a Relationship, Not a Rotation
                </h2>
                <div className="space-y-5 text-lg leading-relaxed text-foreground/70">
                  <p>
                    Zaine&apos;s Stay &amp; Play exists to answer one core question: where can families find boarding that feels personal, calm, and dependable?
                  </p>
                  <p>
                    Capacity is intentionally limited to three suites so each guest receives focused attention, predictable routines, and communication that actually reflects their day.
                  </p>
                  <p>
                    With owner-on-site continuity, decisions are faster, care is more consistent, and each family knows exactly who is responsible.
                  </p>
                  <p className="font-semibold text-primary">
                    We do not optimize for volume. We optimize for trust.
                  </p>
                </div>
              </div>
            </SlideInRight>
          </div>
        </div>
      </section>

      <section className="section-padding-tight bg-secondary/35">
        <div className="container mx-auto px-4">
          <FadeUp>
            <div className="mb-12 text-center">
              <p className="eyebrow mb-3">Operating principles</p>
              <h2 className="headline-display mb-4 text-3xl font-semibold md:text-4xl">Our Core Values</h2>
              <p className="text-lg text-foreground/60">Principles that guide every booking decision and care routine.</p>
            </div>
          </FadeUp>

          <StaggerContainer className="grid gap-4 md:grid-cols-2">
            {values.map((value) => {
              const ValueIcon = value.icon;
              return (
                <StaggerItem key={value.title}>
                  <Card className="luxury-card h-full border-border/60">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <ValueIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="mb-2 font-display text-lg font-semibold">{value.title}</h3>
                          <p className="text-foreground/70">{value.description}</p>
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

      <section className="section-padding-tight">
        <div className="container mx-auto px-4">
          <FadeUp>
            <div className="mb-10 text-center">
              <p className="eyebrow mb-3">Professional proof</p>
              <h2 className="headline-display mb-4 text-3xl font-semibold md:text-4xl">Certifications &amp; Credentials</h2>
            </div>
          </FadeUp>
          <StaggerContainer className="mx-auto grid max-w-4xl gap-3">
            {certifications.map((cert, index) => (
              <ScaleIn key={cert} delay={index * 0.04}>
                <div className="luxury-card flex items-center gap-4 p-4">
                  <Award className="h-6 w-6 flex-shrink-0 text-primary" />
                  <span className="font-medium text-foreground">{cert}</span>
                </div>
              </ScaleIn>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <FadeUp>
        <section className="section-padding-tight bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="luxury-shell mx-auto max-w-4xl p-8 md:p-10">
              <div className="flex items-start gap-4">
                <Zap className="mt-1 h-8 w-8 flex-shrink-0 text-primary" />
                <div>
                  <h3 className="mb-4 font-display text-2xl font-semibold">Why Only 3 Suites?</h3>
                  <div className="space-y-3 text-foreground/70">
                    <p><strong className="text-foreground">Prevents stress:</strong> lower noise, fewer conflicts, calmer routines.</p>
                    <p><strong className="text-foreground">Enables personalization:</strong> each dog&apos;s preferences and sensitivities can actually be known.</p>
                    <p><strong className="text-foreground">Improves supervision:</strong> direct attention stays consistent throughout the day.</p>
                    <p><strong className="text-foreground">Protects quality:</strong> we can decline poor-fit bookings instead of overfilling.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </FadeUp>

      <FadeUp>
        <section className="section-padding-tight bg-gradient-to-r from-primary/90 to-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 font-display text-3xl font-semibold md:text-4xl">Experience the Difference</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg opacity-90">
              Meet the team, review our standards, and choose a booking path that keeps care quality first.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" className="focus-ring bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
                <Link href="/contact">Schedule a Tour</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="focus-ring border-primary-foreground/50 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
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
