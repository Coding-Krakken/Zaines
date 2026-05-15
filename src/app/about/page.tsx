import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Shield,
  Star,
  Users,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  FadeUp,
  ScaleIn,
} from "@/components/motion";
import { simplePageMetadataFromSettings } from "@/lib/seo-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return simplePageMetadataFromSettings({
    title: "About Paws & Play | Best Doggy Daycare in Syracuse NY",
    description:
      "Learn about Syracuse's happiest doggy daycare. Safe supervised play, enrichment activities, photo updates, and a team that truly loves dogs. Meet the Paws & Play family.",
    keywords: [
      "doggy daycare Syracuse",
      "dog daycare team",
      "pet care philosophy",
      "Syracuse dog care",
      "supervised dog play",
    ],
    canonicalPath: "/about",
  });
}

const values = [
  {
    icon: Heart,
    title: "Every Dog Matters",
    description:
      "We treat every pup as an individual with unique needs, personality, and preferences.",
  },
  {
    icon: Shield,
    title: "Safety Above All",
    description:
      "Certified staff, temperament screening, supervised play groups, and clean facilities you can trust.",
  },
  {
    icon: Star,
    title: "Exceptional Care",
    description:
      "From enrichment activities to rest breaks, we go beyond basic daycare to create happy, healthy days.",
  },
  {
    icon: Users,
    title: "Community First",
    description:
      "Serving Syracuse families who want more than a kennel — a place where their dog truly belongs.",
  },
];

const certifications = [
  "Licensed Pet Care Facility",
  "Certified Pet First Aid & CPR",
  "Professional Dog Handling Certification",
  "Fully Insured & Bonded",
  "Clean & Inspected Facility",
  "Member of Pet Care Services Association",
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden py-16 md:py-20"
        style={{
          background: "linear-gradient(135deg, var(--color-deep-sky) 0%, var(--color-sky) 100%)",
        }}
      >
        <div className="container mx-auto px-4">
          <FadeUp>
            <div className="mx-auto max-w-4xl text-center text-white">
              <h1 className="font-display mb-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
                A Happier, Safer Place for{" "}
                <span className="relative inline-block">
                  Syracuse Dogs
                  <svg
                    className="absolute -right-6 -top-4 h-10 w-10 text-yellow-300 opacity-80"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="6" cy="6" r="1.5" />
                    <circle cx="18" cy="8" r="1" />
                  </svg>
                </span>
              </h1>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/90 md:text-xl">
                We're not just a doggy daycare — we're a community of dog lovers dedicated to making every day exceptional for your furry family member.
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

      {/* Our Story Section */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <FadeUp>
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
                <Image
                  src="https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=800&h=600&fit=crop"
                  alt="Happy dogs playing together at daycare"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </FadeUp>

            <FadeUp delay={0.1}>
              <div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
                  Our Philosophy
                </p>
                <h2 className="font-display mb-6 text-3xl font-bold text-foreground md:text-4xl">
                  Play Is Serious Business
                </h2>
                <div className="space-y-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                  <p>
                    At Paws & Play, we believe every dog deserves a day filled with joy, exercise, socialization, and rest — not just supervision in a kennel.
                  </p>
                  <p>
                    That's why we've built a daycare focused on <strong className="text-foreground">supervised play groups</strong>, 
                    enrichment activities, and individualized attention for each pup's personality and energy level.
                  </p>
                  <p>
                    From puppies learning social skills to senior dogs enjoying gentle playtime, we tailor the experience to what <em>your dog</em> needs — not what's easiest for us.
                  </p>
                  <p className="text-primary font-semibold">
                    We don't just watch dogs. We create their best day ever, every single day.
                  </p>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="section-padding bg-accent/30">
        <div className="container mx-auto px-4">
          <FadeUp>
            <div className="mb-12 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
                What We Stand For
              </p>
              <h2 className="font-display mb-4 text-3xl font-bold text-foreground md:text-4xl">
                Our Core Values
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                These principles guide everything we do — from hiring staff to designing play groups.
              </p>
            </div>
          </FadeUp>

          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            {values.map((value, index) => {
              const ValueIcon = value.icon;
              return (
                <ScaleIn key={value.title} delay={index * 0.08}>
                  <div className="paw-card group h-full p-6 transition-all hover:shadow-lg">
                    <div className="mb-4 flex items-start gap-4">
                      <div
                        className="badge-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-110"
                        style={{ backgroundColor: "var(--color-sky)", color: "white" }}
                      >
                        <ValueIcon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-display mb-2 text-xl font-bold text-foreground">
                          {value.title}
                        </h3>
                        <p className="text-base leading-relaxed text-muted-foreground">
                          {value.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </ScaleIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <FadeUp>
            <div className="mb-10 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
                Professional & Trusted
              </p>
              <h2 className="font-display mb-4 text-3xl font-bold text-foreground md:text-4xl">
                Certifications & Credentials
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                We meet the highest standards for safety, training, and facility excellence.
              </p>
            </div>
          </FadeUp>

          <div className="mx-auto grid max-w-3xl gap-3">
            {certifications.map((cert, index) => (
              <ScaleIn key={cert} delay={index * 0.04}>
                <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-6 w-6 text-green-600" aria-hidden="true" />
                  </div>
                  <p className="font-medium text-foreground">{cert}</p>
                </div>
              </ScaleIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="section-padding relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--color-deep-sky) 0%, var(--color-sky) 100%)",
        }}
      >
        <div className="container relative z-10 mx-auto px-4 text-center">
          <FadeUp>
            <h2 className="font-display mb-6 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              Ready to Give Your Dog{" "}
              <span className="relative inline-block">
                the Best Day Ever?
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
              Join the Paws & Play family. Book a playday or schedule a free tour of our facility.
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
                  <span className="mr-2 text-xl" aria-hidden="true">🐾</span>
                  Book a Playday
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="font-semibold text-base bg-white/10 border-2 border-white text-white hover:bg-white hover:text-primary backdrop-blur-sm"
              >
                <Link href="/contact">
                  <Calendar className="mr-2 h-5 w-5" aria-hidden="true" />
                  Schedule a Tour
                </Link>
              </Button>
            </div>
          </FadeUp>
        </div>

        {/* Decorative paw prints */}
        <div className="absolute left-8 top-8 text-6xl opacity-10">🐾</div>
        <div className="absolute right-12 bottom-12 text-5xl opacity-10">🐾</div>
      </section>
    </div>
  );
}

