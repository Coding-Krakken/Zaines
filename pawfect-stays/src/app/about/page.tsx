import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Heart, Shield, Star, Users } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about Pawfect Stays - Seattle's premier dog boarding, daycare, and grooming facility with certified staff and luxury accommodations.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 to-background py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
              Where Every Pet Is Family
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              Since 2018, we&apos;ve been providing exceptional care for dogs in the Seattle area. Our state-of-the-art facility combines luxury accommodations with expert care.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="mb-6 text-3xl font-bold">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Pawfect Stays was founded by lifelong dog lovers Sarah Chen and Mark Williams, who recognized the need for a premium pet care facility that truly treats pets like family.
                </p>
                <p>
                  After years of struggling to find quality care for their own dogs, they decided to create the facility they always wished existed - a place where pets receive individualized attention, luxury accommodations, and round-the-clock care.
                </p>
                <p>
                  Today, we&apos;re proud to serve hundreds of Seattle-area families, providing peace of mind while they&apos;re away and enriching experiences for their beloved pets.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-[400px] w-full rounded-lg bg-muted">
                {/* Placeholder for image */}
                <div className="flex h-full items-center justify-center text-6xl">
                  🏢
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Our Values</h2>
            <p className="text-lg text-muted-foreground">
              What drives everything we do
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <Heart className="mb-4 h-10 w-10 text-primary" />
                <h3 className="mb-2 text-xl font-semibold">Love & Care</h3>
                <p className="text-sm text-muted-foreground">
                  Every pet receives individualized attention and affection from our caring team.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Shield className="mb-4 h-10 w-10 text-primary" />
                <h3 className="mb-2 text-xl font-semibold">Safety First</h3>
                <p className="text-sm text-muted-foreground">
                  Certified staff, secure facilities, and 24/7 supervision ensure your pet&apos;s safety.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Star className="mb-4 h-10 w-10 text-primary" />
                <h3 className="mb-2 text-xl font-semibold">Excellence</h3>
                <p className="text-sm text-muted-foreground">
                  We maintain the highest standards in pet care, facilities, and customer service.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Users className="mb-4 h-10 w-10 text-primary" />
                <h3 className="mb-2 text-xl font-semibold">Community</h3>
                <p className="text-sm text-muted-foreground">
                  We&apos;re proud to be part of the Seattle pet-loving community.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Meet Our Team</h2>
            <p className="text-lg text-muted-foreground">
              Certified professionals who love what they do
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "Sarah Chen", role: "Co-Founder & CEO", emoji: "👩‍💼" },
              { name: "Mark Williams", role: "Co-Founder & COO", emoji: "👨‍💼" },
              { name: "Dr. Emily Rodriguez", role: "Veterinary Consultant", emoji: "👩‍⚕️" },
              { name: "James Park", role: "Head Trainer", emoji: "👨‍🏫" },
            ].map((member) => (
              <Card key={member.name}>
                <CardContent className="pt-6 text-center">
                  <div className="mb-4 text-6xl">{member.emoji}</div>
                  <h3 className="mb-1 text-lg font-semibold">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Certifications & Standards</h2>
            <p className="text-lg text-muted-foreground">
              We maintain the highest industry standards
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              "Licensed Pet Care Facility",
              "Certified Pet First Aid & CPR",
              "Professional Dog Trainer Certification",
              "Fully Insured & Bonded",
              "USDA Licensed Kennel",
              "Member of Pet Care Services Association",
            ].map((cert) => (
              <div key={cert} className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" />
                <span className="font-medium">{cert}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="rounded-lg bg-primary px-8 py-16 text-center text-primary-foreground">
            <h2 className="mb-4 text-3xl font-bold">Ready to Join Our Family?</h2>
            <p className="mb-8 text-lg opacity-90">
              Book a tour and see why pet parents trust us with their furry family members
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/contact">Schedule a Tour</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/book">Book Your Stay</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
