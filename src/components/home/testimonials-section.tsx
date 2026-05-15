"use client";

import { FadeUp } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import Link from "next/link";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function TestimonialsSection() {
  const { testimonialsSettings } = useSiteSettings();

  const activeTestimonials = testimonialsSettings.testimonials
    .filter((t) => t.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, 3);

  if (activeTestimonials.length === 0) {
    return null;
  }
  return (
    <section className="section-padding bg-background">
      <div className="container px-4">
        <FadeUp>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="text-3xl" aria-hidden="true">💬</span>
              <h2 className="heading-playful text-3xl font-bold text-foreground md:text-4xl">
                What Dog Parents Are Saying
              </h2>
              <span className="text-3xl" aria-hidden="true">💬</span>
            </div>
          </div>
        </FadeUp>

        <div className={`grid gap-6 max-w-5xl mx-auto mb-8 ${activeTestimonials.length === 3 ? 'md:grid-cols-3' : activeTestimonials.length === 2 ? 'md:grid-cols-2' : ''}`}>
          {activeTestimonials.map((testimonial, index) => (
            <FadeUp key={testimonial.id} delay={index * 0.1}>
              <div className="paw-card">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-current"
                      style={{ color: "var(--color-yellow)" }}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <p className="text-foreground leading-relaxed mb-6 italic">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <span className="text-2xl" aria-hidden="true">🐕</span>
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.petName} · {testimonial.serviceLabel}
                    </div>
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.3}>
          <div className="text-center">
            <Button
              asChild
              size="lg"
              style={{
                background: "var(--color-sky)",
                color: "white",
              }}
              className="font-bold shadow-lg"
            >
              <Link href="/reviews">
                Read All Reviews
                <span className="ml-2 text-xl" aria-hidden="true">👍</span>
              </Link>
            </Button>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
