import Link from "next/link";
import { CheckCircle2, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  conversionFunnelLinks,
  localFaqs,
  localGrowthPages,
  localGrowthSchemas,
  type LocalGrowthPage,
} from "@/lib/seo";

export function StructuredData({ data }: { data: unknown[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function LocalGrowthPageView({ page }: { page: LocalGrowthPage }) {
  const supportingLocations = localGrowthPages.filter(
    (localPage) => localPage.route !== page.route,
  );

  return (
    <>
      <StructuredData data={localGrowthSchemas(page)} />
      <div className="flex flex-col">
        <section className="relative overflow-hidden border-b bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_34%),linear-gradient(135deg,#fff7ed_0%,#f8fafc_48%,#ecfeff_100%)] py-20 md:py-28">
          <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex rounded-full border bg-background/75 px-4 py-2 text-sm font-medium text-primary shadow-sm backdrop-blur">
                {page.eyebrow}
              </div>
              <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                {page.h1}
              </h1>
              <p className="mb-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
                {page.intro}
              </p>
              <div className="mb-8 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-2 shadow-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  Serving {page.city}, {page.region}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-2 shadow-sm">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Safety-first intake
                </span>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/book">Check Availability</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/pricing">Review Pricing</Link>
                </Button>
              </div>
            </div>

            <Card className="border-primary/20 bg-background/80 shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle>Why Local Families Choose Zaine&apos;s</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {page.proofPoints.map((point) => (
                  <div key={point} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {point}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h2 className="mb-4 text-3xl font-bold">
                A Booking Path Built for Conversion and Clarity
              </h2>
              <p className="mb-6 text-muted-foreground">
                {page.bookingAngle} Every local route is designed to answer fit,
                safety, price, and next-step questions before sending ready
                families into the booking funnel.
              </p>
              <div className="flex flex-wrap gap-3">
                {conversionFunnelLinks.map((link) => (
                  <Button key={link.href} variant="secondary" asChild>
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Primary Intent</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{page.primaryKeyword}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Nearby Coverage</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {page.nearbyAreas.join(", ")}
                  </p>
                </CardContent>
              </Card>
              <Card className="sm:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Supporting Searches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {page.secondaryKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="bg-muted/40 py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold">Local Boarding FAQ</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {localFaqs.map((faq) => (
                <Card key={faq.question}>
                  <CardHeader>
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 max-w-2xl">
              <h2 className="mb-3 text-3xl font-bold">
                More Syracuse-Area Boarding Pages
              </h2>
              <p className="text-muted-foreground">
                These internal links help families move from local search intent
                to the clearest next step: pricing, suite fit, and booking.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {supportingLocations.slice(0, 5).map((localPage) => (
                <Link
                  key={localPage.route}
                  href={localPage.route}
                  className="rounded-lg border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="text-sm font-medium text-primary">
                    {localPage.city}, {localPage.region}
                  </span>
                  <h3 className="mt-2 font-semibold">{localPage.h1}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {localPage.primaryKeyword}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
