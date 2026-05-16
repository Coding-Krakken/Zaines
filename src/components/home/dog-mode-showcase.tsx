"use client";

import { FadeUp, PlayfulBounce, PawPrintAppear } from "@/components/motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Smartphone, Heart, Camera, Sparkles } from "lucide-react";

const dogModeFeatures = [
  {
    icon: Smartphone,
    title: "Dog-Optimized Interface",
    description:
      "High-contrast, large touch targets designed for paws. Your dog can interact with a tablet in their suite!",
    color: "var(--color-sky)",
  },
  {
    icon: Heart,
    title: "Calming Content",
    description:
      "Soothing animations and nature videos that reduce stress and provide enrichment during downtime.",
    color: "var(--color-coral)",
  },
  {
    icon: Camera,
    title: "Real-Time Updates",
    description:
      "You get instant notifications when your dog interacts. See what they're curious about throughout the day.",
    color: "var(--color-green)",
  },
  {
    icon: Sparkles,
    title: "Instagram-Worthy",
    description:
      "Unique tech innovation that's worth sharing. No other facility in Syracuse (or anywhere) has this!",
    color: "var(--color-yellow)",
  },
];

export function DogModeShowcase() {
  return (
    <section className="section-padding relative overflow-hidden bg-gradient-to-b from-background to-accent/20">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute left-10 top-20 text-8xl">🐾</div>
        <div className="absolute right-20 top-40 text-6xl">💡</div>
        <div className="absolute bottom-20 left-1/4 text-7xl">📱</div>
      </div>

      <div className="container relative z-10 px-4">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <FadeUp className="mb-12 text-center">
            <div className="eyebrow mx-auto mb-4">
              <Sparkles className="size-3" />
              <span>World's First</span>
            </div>
            <h2 className="heading-playful mb-4 text-4xl font-bold md:text-5xl lg:text-6xl">
              Dog Mode™: Technology for Dogs,{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                By Humans
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              The first dog-optimized web experience in the world. Every suite features a tablet
              where dogs can explore calming content, while you get real-time updates on their curiosity.
            </p>
          </FadeUp>

          {/* Features Grid */}
          <div className="mb-12 grid gap-6 md:grid-cols-2 lg:gap-8">
            {dogModeFeatures.map((feature, index) => (
              <PawPrintAppear key={feature.title} delay={index * 0.1}>
                <div className="playful-card group">
                  <div
                    className="mb-4 flex size-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110"
                    style={{
                      background: `color-mix(in oklch, ${feature.color} 20%, transparent 80%)`,
                    }}
                  >
                    <feature.icon className="size-7" style={{ color: feature.color }} />
                  </div>
                  <h3 className="mb-2 font-display text-xl font-bold">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </PawPrintAppear>
            ))}
          </div>

          {/* Innovation Statement */}
          <FadeUp className="mx-auto mb-8 max-w-3xl rounded-3xl border-2 border-primary/30 bg-primary/5 p-8 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
              Why It Matters
            </p>
            <p className="text-lg leading-relaxed">
              Dog Mode™ isn't just a gimmick—it's a genuine innovation that reduces stress,
              provides enrichment, and gives you unprecedented insight into your dog's day.
              We're not just boarding dogs; we're{" "}
              <span className="font-bold text-foreground">redefining what tech-forward pet care means</span>.
            </p>
          </FadeUp>

          {/* CTA */}
          <PlayfulBounce className="text-center">
            <Button
              asChild
              size="lg"
              className="group gap-3 font-bold shadow-lg transition-all hover:shadow-xl"
              style={{
                background: "var(--color-yellow)",
                color: "var(--color-navy)",
              }}
            >
              <Link href="/book">
                <span className="text-xl transition-transform group-hover:scale-110" aria-hidden="true">
                  🐾
                </span>
                Experience Dog Mode™
                <span className="text-xl transition-transform group-hover:scale-110" aria-hidden="true">
                  💡
                </span>
              </Link>
            </Button>
            <p className="mt-4 text-sm text-muted-foreground">
              Book your stay and see the innovation for yourself
            </p>
          </PlayfulBounce>
        </div>
      </div>
    </section>
  );
}
