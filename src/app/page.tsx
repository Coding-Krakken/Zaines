import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Private Dog Boarding Syracuse",
  description:
    "Zaine's Stay & Play provides Syracuse dog boarding families trust, with private dog boarding Syracuse quality, small dog boarding Syracuse capacity, owner-on-site care, and dependable booking support.",
};

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-primary/3 to-background py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4" variant="secondary">
              Private 3-Suite Boarding in Syracuse
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
              Safe. Fun.{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Loved.
              </span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Owner-on-site private boarding with only three suites, calm
              routines, and dependable daily updates.
            </p>
            <p className="mb-6 text-sm text-muted-foreground md:text-base">
              Only 3 private suites, owner onsite, camera-monitored safety, no
              harsh chemicals, and premium but fair pricing with no hidden
              fees.
            </p>
            <p className="mb-4 text-sm text-muted-foreground md:text-base">
              No surprise add-ons are introduced after your pre-confirmation
              quote.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/book">Book Your Stay</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/suites">View Our Suites</Link>
              </Button>
            </div>
            <div className="mt-6 flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">Trusted by local families</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-b bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="text-center">
              <div className="mb-2 text-3xl">🏆</div>
              <h3 className="font-semibold">Licensed & Insured</h3>
            </div>
            <div className="text-center">
              <div className="mb-2 text-3xl">👨‍⚕️</div>
              <h3 className="font-semibold">Certified Staff</h3>
            </div>
            <div className="text-center">
              <div className="mb-2 text-3xl">👁️</div>
              <h3 className="font-semibold">Owner On-Site</h3>
            </div>
            <div className="text-center">
              <div className="mb-2 text-3xl">📸</div>
              <h3 className="font-semibold">Live Photo Updates</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Private Boarding, Not High-Volume Drop-Off
            </h2>
            <p className="text-lg text-muted-foreground">
              A calm, small-capacity environment designed for safety and
              consistency
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="mb-2 text-4xl">🏨</div>
                <CardTitle>Private Boarding</CardTitle>
                <CardDescription>Overnight and extended stays</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Three-suite capacity for focused care</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Owner-on-site supervision</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Family-matched daily routines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Reliable updates and check-ins</span>
                  </li>
                </ul>
                <Link
                  href="/services/boarding"
                  className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Learn More →
                </Link>
              </CardContent>
            </Card>

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="mb-2 text-4xl">🛡️</div>
                <CardTitle>Safety Standards</CardTitle>
                <CardDescription>
                  Clear, consistent care practices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>No overcrowded group handling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Camera-monitored environment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Structured feeding and rest windows</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>
                      No harsh cleaning chemicals in guest suite routines
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Medication and special instructions tracked</span>
                  </li>
                </ul>
                <Link
                  href="/policies"
                  className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
                >
                  View Policies →
                </Link>
              </CardContent>
            </Card>

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="mb-2 text-4xl">💬</div>
                <CardTitle>Transparent Communication</CardTitle>
                <CardDescription>
                  Fewer surprises, clearer expectations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Simple booking and confirmation flow</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Support-safe sign-in and recovery messaging</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Contact confirmations with reference IDs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Reviews moderated before public listing</span>
                  </li>
                </ul>
                <Link
                  href="/contact"
                  className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Contact Us →
                </Link>
              </CardContent>
            </Card>

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="mb-2 text-4xl">💵</div>
                <CardTitle>All-In Pricing Clarity</CardTitle>
                <CardDescription>
                  Premium but fair rates shown before confirmation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Suite rates shown before reservation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Cancellation terms visible up front</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Multi-dog discounts listed plainly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>No hidden booking fees and no surprise add-ons</span>
                  </li>
                </ul>
                <Link
                  href="/pricing"
                  className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
                >
                  View Pricing →
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-20 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Ready to Book Your Pet&apos;s Stay?
          </h2>
          <p className="mb-8 text-lg opacity-90">
            Join hundreds of happy pet parents who trust us with their furry
            family members
          </p>
          <p className="mb-6 text-sm opacity-90 md:text-base">
            Clear total before confirmation, no hidden fees, no surprise add-ons, and premium but fair pricing.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/book">Book Now</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground bg-background text-foreground hover:bg-primary-foreground hover:text-primary"
              asChild
            >
              <a href="tel:+13156571332">Call Us: (315) 657-1332</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
