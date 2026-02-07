/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Star } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-primary/3 to-background py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4" variant="secondary">
              Syracuse's Premier Pet Resort
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
              Your Pet&apos;s <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Home Away From Home</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Premium dog boarding, daycare, and grooming with 24/7 care, luxury suites, and real-time photo updates.
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
              <span className="font-semibold">4.9/5</span>
              <span>(500+ reviews)</span>
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
              <h3 className="font-semibold">24/7 Supervision</h3>
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
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Comprehensive Pet Care Services</h2>
            <p className="text-lg text-muted-foreground">Everything your furry friend needs under one roof</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="mb-2 text-4xl">🏨</div>
                <CardTitle>Dog Boarding</CardTitle>
                <CardDescription>Overnight & extended stays</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Luxury suites with webcams</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>24/7 supervision</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Daily activities & playtime</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Real-time photo updates</span>
                  </li>
                </ul>
                <Link href="/services/boarding" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
                  Learn More →
                </Link>
              </CardContent>
            </Card>

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="mb-2 text-4xl">☀️</div>
                <CardTitle>Daycare</CardTitle>
                <CardDescription>Full day play & socialization</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Group play sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Indoor & outdoor areas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Trained play supervisors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Flexible scheduling</span>
                  </li>
                </ul>
                <Link href="/services/daycare" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
                  Learn More →
                </Link>
              </CardContent>
            </Card>

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="mb-2 text-4xl">✂️</div>
                <CardTitle>Grooming</CardTitle>
                <CardDescription>Professional spa services</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Full grooming packages</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Bath & nail trim</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Breed-specific cuts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Premium products</span>
                  </li>
                </ul>
                <Link href="/services/grooming" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
                  Learn More →
                </Link>
              </CardContent>
            </Card>

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="mb-2 text-4xl">🎓</div>
                <CardTitle>Training</CardTitle>
                <CardDescription>Expert behavior programs</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Basic obedience</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Advanced commands</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Behavior modification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>Certified trainers</span>
                  </li>
                </ul>
                <Link href="/services/training" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
                  Learn More →
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-20 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Ready to Book Your Pet&apos;s Stay?</h2>
          <p className="mb-8 text-lg opacity-90">Join hundreds of happy pet parents who trust us with their furry family members</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/book">Book Now</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground bg-background text-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <a href="tel:+13156571332">Call Us: (315) 657-1332</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
