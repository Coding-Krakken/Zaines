import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dog Daycare Services",
  description: "Full-day dog daycare in Seattle with supervised play, socialization, and enrichment activities. Drop off in the morning, pick up a happy, tired pup!",
};

export default function DaycarePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 to-background py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col justify-center">
              <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                Dog Daycare
              </h1>
              <p className="mb-8 text-lg text-muted-foreground">
                Let your dog socialize, exercise, and have fun while you&apos;re at work or running errands. Our supervised daycare keeps tails wagging all day long!
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/book">Book Daycare</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-[400px] w-full rounded-lg bg-muted">
                <div className="flex h-full items-center justify-center text-8xl">
                  ☀️
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Why Choose Our Daycare</h2>
            <p className="text-lg text-muted-foreground">
              More than just playtime - it&apos;s enrichment for your dog
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Exercise & Energy Burn",
                description: "Hours of play means a tired, happy dog who&apos;s ready to relax at home.",
              },
              {
                title: "Socialization",
                description: "Interact with other dogs in a safe, supervised environment.",
              },
              {
                title: "Mental Stimulation",
                description: "Enrichment activities keep your dog&apos;s mind engaged and sharp.",
              },
              {
                title: "Professional Supervision",
                description: "Certified play supervisors monitor all interactions.",
              },
              {
                title: "Flexible Scheduling",
                description: "Full days, half days, or weekly packages to fit your needs.",
              },
              {
                title: "Photo Updates",
                description: "See your pup having fun with photos sent throughout the day.",
              },
            ].map((benefit) => (
              <Card key={benefit.title}>
                <CardHeader>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Daycare Schedule */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Sample Daycare Day</h2>
            <p className="text-lg text-muted-foreground">
              A fun-filled day of play and rest
            </p>
          </div>
          <div className="mx-auto max-w-3xl space-y-4">
            {[
              { time: "7:00 AM", activity: "Drop-off & check-in begins" },
              { time: "8:00 AM", activity: "Morning group play - outdoor yard" },
              { time: "10:00 AM", activity: "Water break & calm activities" },
              { time: "11:00 AM", activity: "Indoor enrichment games" },
              { time: "12:00 PM", activity: "Rest time & lunch (if needed)" },
              { time: "1:00 PM", activity: "Afternoon play session" },
              { time: "3:00 PM", activity: "Individual attention & training" },
              { time: "4:00 PM", activity: "Final play period" },
              { time: "5:00 PM", activity: "Wind down & pick-up begins" },
              { time: "6:30 PM", activity: "Late pick-up available" },
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

      {/* Pricing */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Daycare Pricing</h2>
            <p className="text-lg text-muted-foreground">
              Flexible options to fit your schedule
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Single Day</CardTitle>
                <CardDescription>Perfect for occasional needs</CardDescription>
                <div className="mt-4 text-3xl font-bold">$45<span className="text-base font-normal text-muted-foreground">/day</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {[
                    "Full day (7am-6:30pm)",
                    "All-day play & supervision",
                    "Water & treats provided",
                    "Photo updates",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" variant="outline" asChild>
                  <Link href="/book">Book Single Day</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Weekly Package</CardTitle>
                <CardDescription>5 days of daycare</CardDescription>
                <div className="mt-4 text-3xl font-bold">$200<span className="text-base font-normal text-muted-foreground">/week</span></div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Save $25/week vs single days!
                </p>
                <ul className="space-y-2 text-sm">
                  {[
                    "Mon-Fri attendance",
                    "All standard amenities",
                    "Priority booking",
                    "Weekly report card",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" asChild>
                  <Link href="/book">Book Weekly</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Unlimited</CardTitle>
                <CardDescription>Come as often as you like</CardDescription>
                <div className="mt-4 text-3xl font-bold">$600<span className="text-base font-normal text-muted-foreground">/month</span></div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Best value for frequent visitors!
                </p>
                <ul className="space-y-2 text-sm">
                  {[
                    "Unlimited daycare days",
                    "Flexible scheduling",
                    "Priority suite access",
                    "10% off boarding",
                    "Free monthly nail trim",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" variant="outline" asChild>
                  <Link href="/book">Book Monthly</Link>
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
            <h2 className="mb-8 text-3xl font-bold">Daycare Requirements</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 font-semibold">Vaccinations</h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                      <li>Rabies (current)</li>
                      <li>DHPP (Distemper, Hepatitis, Parvovirus, Parainfluenza)</li>
                      <li>Bordetella (within 6 months) - required for group play</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold">Temperament</h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                      <li>Must enjoy playing with other dogs</li>
                      <li>Pass a temperament evaluation (free!)</li>
                      <li>Be comfortable in group settings</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold">Age & Health</h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                      <li>At least 4 months old</li>
                      <li>Spayed/neutered if over 7 months</li>
                      <li>Free from contagious illnesses</li>
                      <li>Current flea/tick prevention</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-6 rounded-lg bg-primary/10 p-4">
                  <h4 className="mb-2 font-semibold">Free Trial Day!</h4>
                  <p className="text-sm text-muted-foreground">
                    Not sure if daycare is right for your pup? Book a free trial day to see if they love it!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Give Your Dog the Best Day Ever</h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Book a free trial day or sign up for regular daycare
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/book">Book Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Questions? Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
