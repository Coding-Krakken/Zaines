import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dog Grooming Services",
  description: "Professional dog grooming in Seattle. From basic baths to full spa packages, our certified groomers will have your pup looking and feeling their best.",
};

export default function GroomingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 to-background py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col justify-center">
              <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                Dog Grooming
              </h1>
              <p className="mb-8 text-lg text-muted-foreground">
                Pamper your pup with our professional grooming services. From quick baths to full spa packages, we&apos;ll have your dog looking and feeling their absolute best!
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/book">Book Grooming</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-[400px] w-full rounded-lg bg-muted">
                <div className="flex h-full items-center justify-center text-8xl">
                  ✂️
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Grooming Services</h2>
            <p className="text-lg text-muted-foreground">
              A la carte or full-service packages
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Bath & Brush</CardTitle>
                <CardDescription>The basics done right</CardDescription>
                <div className="mt-4 text-2xl font-bold">From $45</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {[
                    "Premium shampoo & conditioner",
                    "Thorough brushing & de-shedding",
                    "Ear cleaning",
                    "Nail trim",
                    "Sanitary trim",
                    "Cologne spritz",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-muted-foreground">
                  Pricing varies by size and coat type
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Full Groom</CardTitle>
                <CardDescription>Complete grooming package</CardDescription>
                <div className="mt-4 text-2xl font-bold">From $75</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {[
                    "Everything in Bath & Brush",
                    "Haircut or breed-specific clip",
                    "Face & feet trim",
                    "Teeth brushing",
                    "Paw pad moisturizer",
                    "Bow or bandana",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-muted-foreground">
                  Pricing varies by size and coat type
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Spa Package</CardTitle>
                <CardDescription>The ultimate pampering</CardDescription>
                <div className="mt-4 text-2xl font-bold">From $110</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {[
                    "Everything in Full Groom",
                    "Deep conditioning treatment",
                    "Blueberry facial",
                    "Paw & nose balm",
                    "Nail polish (safe for dogs)",
                    "De-shedding treatment",
                    "Extended massage",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-muted-foreground">
                  Pricing varies by size and coat type
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Add-Ons */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Add-On Services</h2>
            <p className="text-lg text-muted-foreground">
              Customize your grooming experience
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
            {[
              { service: "De-shedding Treatment", price: "$20-35" },
              { service: "Flea & Tick Shampoo", price: "$15" },
              { service: "Medicated Bath", price: "$20" },
              { service: "Teeth Brushing", price: "$10" },
              { service: "Nail Grinding (Dremel)", price: "$15" },
              { service: "Anal Gland Expression", price: "$15" },
              { service: "Blueberry Facial", price: "$15" },
              { service: "Deep Conditioning", price: "$15-25" },
            ].map((addon) => (
              <Card key={addon.service}>
                <CardContent className="flex items-center justify-between py-4">
                  <span className="font-medium">{addon.service}</span>
                  <span className="text-sm text-muted-foreground">{addon.price}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Size-Based Pricing */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-3xl font-bold text-center">Size Guide & Pricing</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="pb-3 text-left font-semibold">Size</th>
                        <th className="pb-3 text-left font-semibold">Weight</th>
                        <th className="pb-3 text-right font-semibold">Bath & Brush</th>
                        <th className="pb-3 text-right font-semibold">Full Groom</th>
                        <th className="pb-3 text-right font-semibold">Spa Package</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { size: "Small", weight: "0-20 lbs", bath: "$45", full: "$75", spa: "$110" },
                        { size: "Medium", weight: "21-40 lbs", bath: "$55", full: "$85", spa: "$125" },
                        { size: "Large", weight: "41-70 lbs", bath: "$65", full: "$95", spa: "$140" },
                        { size: "X-Large", weight: "71-100 lbs", bath: "$75", full: "$110", spa: "$160" },
                        { size: "Giant", weight: "100+ lbs", bath: "$85+", full: "$125+", spa: "$180+" },
                      ].map((row) => (
                        <tr key={row.size} className="border-b">
                          <td className="py-3 font-medium">{row.size}</td>
                          <td className="py-3 text-muted-foreground">{row.weight}</td>
                          <td className="py-3 text-right">{row.bath}</td>
                          <td className="py-3 text-right">{row.full}</td>
                          <td className="py-3 text-right">{row.spa}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-6 text-sm text-muted-foreground">
                  *Prices may vary based on coat condition, matting, and temperament. De-matting fee applies for severely matted coats.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Why Choose Our Groomers</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Certified Professionals",
                description: "All groomers are certified and experienced with all breeds.",
              },
              {
                title: "Premium Products",
                description: "We use only high-quality, pet-safe shampoos and products.",
              },
              {
                title: "Gentle Handling",
                description: "Stress-free grooming with patience and positive reinforcement.",
              },
              {
                title: "Breed Experts",
                description: "Breed-specific cuts and styling by knowledgeable groomers.",
              },
            ].map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Pamper Your Pup?</h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Book your grooming appointment today - spaces fill up fast!
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/book">Book Grooming</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Questions? Call Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
