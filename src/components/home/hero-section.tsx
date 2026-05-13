"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeUp } from "@/components/motion";
import { Shield, Camera, Home, Sparkles, ChevronRight } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function HeroSection() {
  const { websiteProfile, trustCopy } = useSiteSettings();
  const primaryArea = websiteProfile.serviceArea[0] || "Syracuse";

  return (
    <section
      className="relative flex min-h-[92vh] items-center overflow-hidden section-padding"
      aria-label="Hero"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.988_0.012_80)] via-[oklch(0.975_0.022_72)] to-[oklch(0.95_0.038_62)]" />

      <div
        className="absolute top-1/4 right-1/3 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, oklch(0.55 0.14 55 / 0.10) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-1/4 -left-24 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, oklch(0.93 0.025 155 / 0.18) 0%, transparent 70%)",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="container relative z-10 mx-auto px-4">
        <div className="luxury-shell grain-overlay mx-auto max-w-6xl p-8 md:p-12 lg:p-14">
          <div className="mx-auto max-w-4xl text-center">
          <FadeUp delay={0}>
            <p className="eyebrow mb-6">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Private Boutique Dog Boarding · {primaryArea}, NY
            </p>
          </FadeUp>

          <FadeUp delay={0.12}>
            <h1 className="headline-display mb-6 text-5xl font-semibold text-foreground text-balance md:text-7xl lg:text-8xl">
              Your Dog Deserves
              <br />
              <em className="text-primary not-italic">More Than a Kennel.</em>
            </h1>
          </FadeUp>

          <FadeUp delay={0.24}>
            <p className="mx-auto mb-10 max-w-2xl text-lg font-light leading-relaxed text-muted-foreground md:text-2xl">
              Three private suites. Owner always present. Calm routines, real
              daily updates, and the individualized care your family member
              genuinely deserves.
            </p>
          </FadeUp>

          <FadeUp delay={0.36}>
            <div className="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="focus-ring h-auto px-10 py-7 text-base shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:shadow-primary/35"
                asChild
              >
                <Link href="/book" className="inline-flex items-center gap-2">
                  Reserve a Suite
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="focus-ring h-auto border-foreground/20 px-10 py-7 text-base hover:-translate-y-0.5 hover:border-primary hover:text-primary"
                asChild
              >
                <Link href="/suites">Explore Our Suites</Link>
              </Button>
            </div>
          </FadeUp>

          <FadeUp delay={0.48}>
            <div className="mx-auto grid max-w-3xl gap-4 rounded-2xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground sm:grid-cols-3 sm:gap-3 sm:p-5">
              <div className="flex items-center justify-center gap-2">
                <Home className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />
                <span>{trustCopy.trustEvidenceClaim.includes("Only 3 private suites") ? "Only 3 private suites" : "Private suites"}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Shield className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />
                <span>Owner always on-site</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Camera className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />
                <span>Camera-monitored 24/7</span>
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={0.56}>
            <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-muted-foreground">
              Next openings are limited by design. Families typically reserve 2-6 weeks in advance for holidays and long weekends.
            </p>
          </FadeUp>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
