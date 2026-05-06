import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { absoluteUrl, localGrowthPages } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Syracuse-Area Dog Boarding Locations",
  description:
    "Find private dog boarding pages for Syracuse, Liverpool, Cicero, Baldwinsville, Fayetteville, Manlius, and nearby Central New York families.",
  alternates: {
    canonical: absoluteUrl("/locations"),
  },
};

export default function LocationsIndexPage() {
  const locationPages = localGrowthPages.filter((page) =>
    page.route.startsWith("/locations/"),
  );

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Local boarding coverage
        </p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
          Syracuse-Area Dog Boarding Locations
        </h1>
        <p className="text-lg text-muted-foreground">
          Choose your local boarding page, compare fit and pricing, then move
          into availability when you are ready to reserve.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {locationPages.map((page) => (
          <Card key={page.route}>
            <CardHeader>
              <CardTitle>
                {page.city}, {page.region}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {page.metaDescription}
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href={page.route}>View {page.city} Boarding</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-10 flex justify-center gap-3">
        <Button asChild>
          <Link href="/book">Check Availability</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/pricing">Review Pricing</Link>
        </Button>
      </div>
    </div>
  );
}
