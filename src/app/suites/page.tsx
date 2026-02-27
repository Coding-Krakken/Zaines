import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Wifi, Camera, Bed, Tv, Music, Thermometer, Home } from "lucide-react";

export const metadata: Metadata = {
  title: "Private Boarding Suites | Zaine's Stay & Play",
  description: "Choose from our Standard, Deluxe, and Luxury suites for your dog&apos;s perfect home away from home. All suites include 24/7 supervision and daily activities.",
};

const suites = [
  {
    name: "Standard Suite",
    price: "$65",
    period: "/ night",
    size: "6' x 8'",
    image: "/images/suites/standard.jpg",
    features: [
      "Comfortable raised bed",
      "Climate controlled",
      "Daily cleaning",
      "2 potty breaks",
      "2 group play sessions",
      "Meal service (2x daily)",
    ],
    bestFor: "Budget-conscious pet parents",
  },
  {
    name: "Deluxe Suite",
    price: "$85",
    period: "/ night",
    size: "8' x 10'",
    image: "/images/suites/deluxe.jpg",
    popular: true,
    features: [
      "Premium bedding",
      "Climate controlled",
      "Webcam access",
      "3 potty breaks",
      "3 group play sessions",
      "Meal service (3x daily)",
      "Spotify playlist",
      "Puzzle toys included",
    ],
    bestFor: "Most dogs and families",
  },
  {
    name: "Luxury Suite",
    price: "$120",
    period: "/ night",
    size: "10' x 12'",
    image: "/images/suites/luxury.jpg",
    features: [
      "Private outdoor patio",
      "Luxury orthopedic bed",
      "Climate controlled",
      "24/7 webcam access",
      "4 potty breaks",
      "4 group play sessions",
      "Meal service (custom schedule)",
      "TV with calming content",
      "Premium toys & treats",
      "Turndown service",
    ],
    bestFor: "VIP pups who deserve the best",
  },
];

const amenities = [
  { icon: Camera, title: "Live Webcams", description: "Check in on your pet anytime from anywhere" },
  { icon: Wifi, title: "Smart Monitoring", description: "Temperature and air quality sensors" },
  { icon: Thermometer, title: "Climate Control", description: "Perfect temperature year-round" },
  { icon: Music, title: "Calming Music", description: "Curated playlists for relaxation" },
  { icon: Bed, title: "Premium Bedding", description: "Comfortable, washable, hypoallergenic" },
  { icon: Tv, title: "Entertainment", description: "Dog-friendly TV content (Luxury only)" },
];

export default function SuitesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-50 to-purple-50 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Luxury Accommodations</Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Choose Your Pet&apos;s Perfect Suite
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              From cozy and comfortable to lavish and luxurious, we have the perfect space for every pet and budget.
            </p>
          </div>
        </div>
      </section>

      {/* Suites Comparison */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Compare Our Suites</h2>
            <p className="text-lg text-muted-foreground">
              All suites include 24/7 supervision, daily activities, and lots of love
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {suites.map((suite) => (
              <Card key={suite.name} className={`relative flex flex-col ${suite.popular ? 'border-primary shadow-lg' : ''}`}>
                {suite.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <div className="mb-4 aspect-video w-full overflow-hidden rounded-lg bg-muted">
                    {/* Placeholder for suite images */}
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                      <Home className="h-20 w-20 text-muted-foreground" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">{suite.name}</CardTitle>
                  <CardDescription className="text-sm">{suite.size} • {suite.bestFor}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{suite.price}</span>
                    <span className="text-muted-foreground">{suite.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {suite.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-6 w-full" size="lg" asChild>
                    <Link href="/book">Book This Suite</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Amenities Grid */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Suite Amenities</h2>
            <p className="text-lg text-muted-foreground">
              Modern comforts and smart technology for your pet&apos;s wellbeing
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {amenities.map((amenity) => (
              <Card key={amenity.title}>
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <amenity.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{amenity.title}</CardTitle>
                  <CardDescription>{amenity.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-center text-3xl font-bold">Suite FAQs</h2>
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-semibold">Can I upgrade my suite after booking?</h3>
                <p className="text-muted-foreground">
                  Yes! Subject to availability, you can upgrade to a larger suite. Contact us before your check-in date.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold">Can multiple dogs share a suite?</h3>
                <p className="text-muted-foreground">
                  Yes, dogs from the same family can share a Deluxe or Luxury suite. Additional pet fees apply.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold">How do the webcams work?</h3>
                <p className="text-muted-foreground">
                  After booking, you&apos;ll receive secure login credentials to view your pet&apos;s suite webcam 24/7 through our portal.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold">What if my dog has special needs?</h3>
                <p className="text-muted-foreground">
                  We accommodate special needs including medications, dietary restrictions, and mobility issues. Let us know during booking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Book Your Pet&apos;s Stay?</h2>
          <p className="mb-8 text-lg opacity-90">
            Reserve your preferred suite today and give your pet the vacation they deserve
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/book">Book Now</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link href="/contact">Schedule a Tour</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
