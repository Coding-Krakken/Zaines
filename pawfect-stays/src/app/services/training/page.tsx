import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dog Training Services",
  description: "Professional dog training in Seattle. From basic obedience to advanced commands and behavior modification. Certified trainers with proven results.",
};

export default function TrainingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 to-background py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col justify-center">
              <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                Dog Training
              </h1>
              <p className="mb-8 text-lg text-muted-foreground">
                Build a better relationship with your dog through positive reinforcement training. Our certified trainers use proven methods to help your pup become their best self.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/book">Start Training</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/contact">Free Consultation</Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-[400px] w-full rounded-lg bg-muted">
                <div className="flex h-full items-center justify-center text-8xl">
                  🎓
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Training Programs */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Training Programs</h2>
            <p className="text-lg text-muted-foreground">
              Customized programs for every dog and goal
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Puppy Preschool</CardTitle>
                <CardDescription>For puppies 8-20 weeks</CardDescription>
                <div className="mt-4 text-2xl font-bold">$250<span className="text-sm font-normal text-muted-foreground">/6 weeks</span></div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Group classes teaching foundational skills
                </p>
                <ul className="space-y-2 text-sm">
                  {[
                    "Socialization with people & puppies",
                    "Potty training basics",
                    "Bite inhibition",
                    "Name recognition",
                    "Sit, down, come",
                    "Walking on leash",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" variant="outline" asChild>
                  <Link href="/book">Enroll in Puppy Class</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Basic Obedience</CardTitle>
                <CardDescription>For dogs 6 months & up</CardDescription>
                <div className="mt-4 text-2xl font-bold">$300<span className="text-sm font-normal text-muted-foreground">/6 weeks</span></div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Essential skills every dog should know
                </p>
                <ul className="space-y-2 text-sm">
                  {[
                    "Sit, down, stand, stay",
                    "Come when called (recall)",
                    "Leave it & drop it",
                    "Loose leash walking",
                    "Place/mat training",
                    "Door manners",
                    "Impulse control",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" asChild>
                  <Link href="/book">Start Basic Training</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Advanced Training</CardTitle>
                <CardDescription>For obedience graduates</CardDescription>
                <div className="mt-4 text-2xl font-bold">$350<span className="text-sm font-normal text-muted-foreground">/6 weeks</span></div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Take your dog&apos;s skills to the next level
                </p>
                <ul className="space-y-2 text-sm">
                  {[
                    "Off-leash reliability",
                    "Distance commands",
                    "Advanced recall",
                    "Heel position",
                    "Emergency stop",
                    "Tricks & enrichment",
                    "Competition prep (optional)",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" variant="outline" asChild>
                  <Link href="/book">Enroll Advanced</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Private Training */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Private Training</h2>
            <p className="text-lg text-muted-foreground">
              One-on-one sessions tailored to your needs
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Private Lessons</CardTitle>
                <CardDescription>Customized training at your pace</CardDescription>
                <div className="mt-4 text-2xl font-bold">$100<span className="text-sm font-normal text-muted-foreground">/hour</span></div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Perfect for specific goals or scheduling flexibility
                </p>
                <ul className="space-y-2 text-sm">
                  {[
                    "Personalized training plan",
                    "Focus on your specific goals",
                    "Flexible scheduling",
                    "Train at your home or ours",
                    "Progress tracking",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" asChild>
                  <Link href="/book">Book Private Session</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Behavior Consultation</CardTitle>
                <CardDescription>Address problem behaviors</CardDescription>
                <div className="mt-4 text-2xl font-bold">$150<span className="text-sm font-normal text-muted-foreground">/90 min</span></div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Comprehensive assessment & behavior modification plan
                </p>
                <ul className="space-y-2 text-sm">
                  {[
                    "Reactivity & aggression",
                    "Separation anxiety",
                    "Fear & phobias",
                    "Excessive barking",
                    "Destructive behavior",
                    "Written behavior plan",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" variant="outline" asChild>
                  <Link href="/book">Schedule Consultation</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Training Philosophy */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Our Training Philosophy</h2>
            <p className="text-lg text-muted-foreground">
              Positive reinforcement for lasting results
            </p>
          </div>
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    What We Do
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>✅ Positive reinforcement (rewards for good behavior)</li>
                    <li>✅ Science-based methods</li>
                    <li>✅ Build confidence & trust</li>
                    <li>✅ Make training fun</li>
                    <li>✅ Focus on clear communication</li>
                    <li>✅ Set dogs up for success</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-destructive">✕</span>
                    What We DON&apos;T Do
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>❌ Punishment-based methods</li>
                    <li>❌ Shock collars or prong collars</li>
                    <li>❌ Physical corrections</li>
                    <li>❌ Alpha/dominance theory</li>
                    <li>❌ Intimidation or fear</li>
                    <li>❌ One-size-fits-all approach</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
            <Card className="mt-6">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  We believe training should strengthen the bond between you and your dog. Our certified trainers use modern, science-backed methods that are effective, humane, and fun for both you and your pet. Every dog learns at their own pace, and we tailor our approach to your dog&apos;s unique personality and needs.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trainers */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Meet Our Trainers</h2>
            <p className="text-lg text-muted-foreground">
              Certified professionals who love what they do
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: "James Park",
                title: "Head Trainer",
                certs: "CPDT-KA, CBCC-KA",
                emoji: "👨‍🏫",
              },
              {
                name: "Lisa Martinez",
                title: "Senior Trainer",
                certs: "CPDT-KA, KPA CTP",
                emoji: "👩‍🏫",
              },
              {
                name: "Alex Chen",
                title: "Behavior Specialist",
                certs: "CBCC-KA, CDBC",
                emoji: "👨‍🔬",
              },
            ].map((trainer) => (
              <Card key={trainer.name}>
                <CardContent className="pt-6 text-center">
                  <div className="mb-4 text-6xl">{trainer.emoji}</div>
                  <h3 className="mb-1 text-lg font-semibold">{trainer.name}</h3>
                  <p className="mb-2 text-sm text-muted-foreground">{trainer.title}</p>
                  <p className="text-xs text-muted-foreground">{trainer.certs}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Start Training?</h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Free consultation to discuss your goals and find the right program
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/contact">Free Consultation</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/book">Enroll Now</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
