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
import {
  CheckCircle2,
  Clock,
  Camera,
  Utensils,
  Shield,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { FadeUp, ScaleIn } from "@/components/motion";
import { simplePageMetadataFromSettings } from "@/lib/seo-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return simplePageMetadataFromSettings({
    title: "Dog Boarding Services",
    description:
      "Premium overnight dog boarding in Syracuse with luxury suites, 24/7 supervision, webcams, and real-time photo updates. Book your dog's perfect stay today.",
    canonicalPath: "/services/boarding",
  });
}

export default function BoardingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="section-padding bg-gradient-to-br from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="luxury-shell grain-overlay mx-auto grid max-w-6xl gap-12 p-8 lg:grid-cols-2 lg:gap-16 lg:p-12">
            <FadeUp>
              <div className="flex flex-col justify-center">
                <Badge className="mb-4 w-fit border-primary/30 bg-primary/10 text-primary">Most Popular Service</Badge>
                <h1 className="headline-display mb-6 text-4xl font-semibold text-foreground md:text-6xl">
                  Private Dog Boarding
                  <br />
                  <em className="not-italic text-primary">for Syracuse Families</em>
                </h1>
                <p className="mb-8 text-lg text-muted-foreground">
                  Small-capacity luxury suites with owner-led care, daily updates, and clear booking steps from first inquiry to pickup.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button size="lg" className="focus-ring" asChild>
                    <Link href="/book">Check Availability</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="focus-ring" asChild>
                    <Link href="/pricing">Review Pricing</Link>
                  </Button>
                  <Button size="lg" variant="ghost" className="focus-ring" asChild>
                    <Link href="/suites">View Suites</Link>
                  </Button>
                </div>
              </div>
            </FadeUp>
            <ScaleIn delay={0.08}>
              <div className="luxury-card flex h-full min-h-[340px] items-center justify-center rounded-3xl bg-gradient-to-br from-muted to-accent p-10">
                <div className="max-w-sm space-y-4 text-center">
                  <p className="eyebrow mx-auto">Service promise</p>
                  <p className="font-display text-3xl leading-tight text-foreground">
                    Calm routines,
                    <br />
                    structured care,
                    <br />
                    and no overcrowding.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Built for dogs who do better with consistency and owners who want confidence.
                  </p>
                </div>
              </div>
            </ScaleIn>
          </div>
        </div>
      </section>

      {/* What&apos;s Included */}
      <section className="section-padding-tight">
        <div className="container mx-auto px-4">
          <FadeUp>
            <div className="mb-12 text-center">
              <p className="eyebrow mb-3">Boarding essentials</p>
              <h2 className="headline-display mb-4 text-3xl font-semibold text-foreground md:text-4xl">What&apos;s Included</h2>
              <p className="text-lg text-muted-foreground">
                Everything your dog needs for a comfortable stay
              </p>
            </div>
          </FadeUp>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Shield className="h-8 w-8" />,
                title: "24/7 Supervision",
                description:
                  "Certified staff on-site around the clock to ensure safety and comfort.",
              },
              {
                icon: <Camera className="h-8 w-8" />,
                title: "Live Webcams",
                description:
                  "Check in on your pet anytime with our suite webcams.",
              },
              {
                icon: <Utensils className="h-8 w-8" />,
                title: "Meals Included",
                description:
                  "Premium dog food or bring your own for sensitive stomachs.",
              },
              {
                icon: <Heart className="h-8 w-8" />,
                title: "Daily Playtime",
                description:
                  "Group play sessions and individual attention every day.",
              },
              {
                icon: <Clock className="h-8 w-8" />,
                title: "Flexible Times",
                description:
                  "Drop-off and pick-up windows that work with your schedule.",
              },
              {
                icon: <CheckCircle2 className="h-8 w-8" />,
                title: "Photo Updates",
                description: "Daily photos sent directly to your phone.",
              },
            ].map((feature) => (
              <ScaleIn key={feature.title}>
                <Card className="luxury-card h-full border-border/60">
                <CardHeader>
                  <div className="mb-2 text-primary">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
                </Card>
              </ScaleIn>
            ))}
          </div>
        </div>
      </section>

      {/* Daily Schedule */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">A Day in the Life</h2>
            <p className="text-lg text-muted-foreground">
              Your dog&apos;s typical day with us
            </p>
          </div>
          <div className="mx-auto max-w-3xl space-y-4">
            {[
              { time: "7:00 AM", activity: "Morning wake-up & potty break" },
              { time: "7:30 AM", activity: "Breakfast time with fresh water" },
              { time: "9:00 AM", activity: "Group playtime in outdoor yard" },
              {
                time: "11:00 AM",
                activity: "Individual enrichment activities",
              },
              { time: "12:30 PM", activity: "Midday rest & quiet time" },
              { time: "3:00 PM", activity: "Afternoon play session" },
              { time: "5:00 PM", activity: "Dinner service" },
              { time: "6:30 PM", activity: "Evening walk & final potty break" },
              { time: "8:00 PM", activity: "Wind down & bedtime" },
              { time: "Throughout", activity: "Photo updates sent to parents" },
            ].map((item) => (
              <Card key={item.time}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="w-24 shrink-0 font-semibold text-primary">
                    {item.time}
                  </div>
                  <div className="text-sm">{item.activity}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Suite Options */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Choose Your Suite</h2>
            <p className="text-lg text-muted-foreground">
              From cozy standards to luxury penthouses
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Standard Suite</CardTitle>
                <CardDescription>Perfect for most dogs</CardDescription>
                <div className="mt-4 text-3xl font-bold">
                  $65
                  <span className="text-base font-normal text-muted-foreground">
                    /night
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {[
                    "6' x 8' private suite",
                    "Raised bed & blanket",
                    "Food & water bowls",
                    "Daily playtime",
                    "Photo updates",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" asChild>
                  <Link href="/book">Book Standard</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardHeader>
                <Badge className="mb-2 w-fit">Most Popular</Badge>
                <CardTitle>Deluxe Suite</CardTitle>
                <CardDescription>Extra space & amenities</CardDescription>
                <div className="mt-4 text-3xl font-bold">
                  $85
                  <span className="text-base font-normal text-muted-foreground">
                    /night
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {[
                    "8' x 10' private suite",
                    "Premium orthopedic bed",
                    "TV with calming content",
                    "Webcam access",
                    "Extended playtime",
                    "Twice-daily photos",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" asChild>
                  <Link href="/book">Book Deluxe</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Luxury Suite</CardTitle>
                <CardDescription>The ultimate experience</CardDescription>
                <div className="mt-4 text-3xl font-bold">
                  $120
                  <span className="text-base font-normal text-muted-foreground">
                    /night
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {[
                    "10' x 12' penthouse suite",
                    "Private outdoor patio",
                    "Luxury bedding & toys",
                    "HD webcam with sound",
                    "One-on-one playtime",
                    "Multiple daily updates",
                    "Turndown service",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" variant="outline" asChild>
                  <Link href="/book">Book Luxury</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-3xl font-bold">Boarding Requirements</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 font-semibold">
                      Required Vaccinations
                    </h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                      <li>Rabies (current)</li>
                      <li>
                        DHPP (Distemper, Hepatitis, Parvovirus, Parainfluenza)
                      </li>
                      <li>Bordetella (within 6 months)</li>
                      <li>Canine Influenza (recommended)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold">Health Requirements</h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                      <li>Flea & tick prevention (within 30 days)</li>
                      <li>Spayed/neutered (for dogs over 7 months)</li>
                      <li>Must be in good health (no contagious illnesses)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold">
                      Behavior Requirements
                    </h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                      <li>Must be social with other dogs</li>
                      <li>No history of aggression</li>
                      <li>Comfortable with handling by staff</li>
                    </ul>
                  </div>
                </div>
                <Button className="mt-6 w-full" variant="outline" asChild>
                  <Link href="/policies">View Full Policies</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding-tight">
        <div className="container mx-auto px-4 text-center">
          <FadeUp>
            <div className="luxury-shell mx-auto max-w-4xl p-8 md:p-10">
              <h2 className="headline-display mb-4 text-3xl font-semibold text-foreground md:text-4xl">
                Ready to Book Your Dog&apos;s Stay?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Reserve your spot today. Availability stays intentionally limited.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" className="focus-ring" asChild>
                  <Link href="/book">Book Now</Link>
                </Button>
                <Button size="lg" variant="outline" className="focus-ring" asChild>
                  <Link href="/contact">Schedule a Tour</Link>
                </Button>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>
    </div>
  );
}
