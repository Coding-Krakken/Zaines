import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeUp } from "@/components/motion";
import { Shield, Camera, Home } from "lucide-react";

export function HeroSection() {
  return (
    <section
      className="relative min-h-[92vh] flex items-center overflow-hidden"
      aria-label="Hero"
    >
      {/* Layered warm gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.988_0.012_80)] via-[oklch(0.975_0.022_72)] to-[oklch(0.95_0.038_62)]" />

      {/* Ambient glow elements */}
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

      {/* Subtle grain texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="container mx-auto px-4 py-32 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Eyebrow */}
          <FadeUp delay={0}>
            <p className="text-sm uppercase tracking-[0.3em] text-primary font-semibold mb-8">
              Private Boutique Dog Boarding · Syracuse, NY
            </p>
          </FadeUp>

          {/* Headline */}
          <FadeUp delay={0.12}>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-semibold text-foreground leading-[1.02] tracking-tight mb-6 text-balance">
              Your Dog Deserves
              <br />
              <em className="text-primary not-italic">More Than a Kennel.</em>
            </h1>
          </FadeUp>

          {/* Subheadline */}
          <FadeUp delay={0.24}>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-12 font-light">
              Three private suites. Owner always present. Calm routines, real
              daily updates, and the individualized care your family member
              genuinely deserves.
            </p>
          </FadeUp>

          {/* CTAs */}
          <FadeUp delay={0.36}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
              <Button
                size="lg"
                className="text-base px-10 py-7 h-auto shadow-lg shadow-primary/20 hover:shadow-primary/35 hover:-translate-y-0.5 transition-all duration-300"
                asChild
              >
                <Link href="/book">Reserve a Suite</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-10 py-7 h-auto border-foreground/20 hover:border-primary hover:text-primary hover:-translate-y-0.5 transition-all duration-300"
                asChild
              >
                <Link href="/suites">Explore Our Suites</Link>
              </Button>
            </div>
          </FadeUp>

          {/* Micro trust signals */}
          <FadeUp delay={0.48}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />
                <span>Only 3 private suites</span>
              </div>
              <div className="hidden sm:block w-1 h-1 rounded-full bg-border" />
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />
                <span>Owner always on-site</span>
              </div>
              <div className="hidden sm:block w-1 h-1 rounded-full bg-border" />
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />
                <span>Camera-monitored 24/7</span>
              </div>
            </div>
          </FadeUp>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
