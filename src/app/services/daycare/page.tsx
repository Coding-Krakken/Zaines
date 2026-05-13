import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FadeUp, ScaleIn } from "@/components/motion";
import { Clock3, ShieldCheck, ArrowRight } from "lucide-react";
import { simplePageMetadataFromSettings } from "@/lib/seo-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return simplePageMetadataFromSettings({
    title: "Service Update | Zaine's Stay & Play",
    description:
      "Zaine's Stay & Play currently offers private boarding with suite options and approved add-ons.",
    canonicalPath: "/services/daycare",
  });
}

export default function DaycarePage() {
  return (
    <div className="section-padding min-h-[70vh] bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4">
        <FadeUp>
          <Card className="luxury-shell grain-overlay mx-auto w-full max-w-4xl border-border/70">
            <CardContent className="space-y-8 p-8 md:p-10">
              <div className="text-center">
                <p className="eyebrow mb-4">Service update</p>
                <h1 className="headline-display mb-4 text-4xl font-semibold md:text-5xl">
                  Private Boarding Focus
                </h1>
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                  We currently operate as a private, small-capacity boarding service.
                  Standalone daycare is not offered at this time.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <ScaleIn>
                  <div className="luxury-card p-5">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <h2 className="mb-2 text-base font-semibold text-foreground">Why this model</h2>
                    <p className="text-sm text-muted-foreground">
                      Limiting service scope helps us protect safety standards, routine consistency, and personalized care.
                    </p>
                  </div>
                </ScaleIn>
                <ScaleIn delay={0.06}>
                  <div className="luxury-card p-5">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Clock3 className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <h2 className="mb-2 text-base font-semibold text-foreground">Future availability</h2>
                    <p className="text-sm text-muted-foreground">
                      If daycare opens later, updates will appear on this page and in customer notifications.
                    </p>
                  </div>
                </ScaleIn>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button asChild className="focus-ring">
                  <Link href="/book" className="inline-flex items-center gap-2">
                    Book Boarding
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button variant="outline" className="focus-ring" asChild>
                  <Link href="/suites">View Suite Options</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeUp>
      </div>
    </div>
  );
}
