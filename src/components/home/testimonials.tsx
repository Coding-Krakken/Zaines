"use client";

import { useState } from "react";
import { FadeUp } from "@/components/motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/use-site-settings";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? "fill-primary text-primary" : "text-muted"
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export function Testimonials() {
  const [current, setCurrent] = useState(0);
  const { testimonialsSettings } = useSiteSettings();
  const testimonials = testimonialsSettings.testimonials
    .filter((item) => item.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const safeTestimonials = testimonials.length
    ? testimonials
    : [
        {
          id: 'fallback-testimonial',
          author: 'Zaine\'s Stay & Play Family',
          petName: 'Guest Pup',
          rating: 5,
          date: 'Recently',
          text: 'No testimonials are currently active. Add testimonials in Admin Settings to display customer feedback here.',
          serviceLabel: 'Configured Service',
          isActive: true,
          displayOrder: 0,
        },
      ];

  const prev = () =>
    setCurrent((c) => (c - 1 + safeTestimonials.length) % safeTestimonials.length);
  const next = () => setCurrent((c) => (c + 1) % safeTestimonials.length);

  const t = safeTestimonials[current];

  return (
    <section
      className="section-padding bg-foreground overflow-hidden"
      aria-labelledby="testimonials-heading"
    >
      <div className="container mx-auto px-4">
        <FadeUp>
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-[0.25em] text-primary font-semibold mb-4">
              Client Stories
            </p>
            <h2
              id="testimonials-heading"
              className="font-display text-4xl md:text-5xl font-semibold text-background mb-4 text-balance"
            >
              What Families
              <br />
              <em className="text-primary not-italic">Are Saying</em>
            </h2>
          </div>
        </FadeUp>

        {/* Carousel */}
        <div className="max-w-3xl mx-auto">
          <div
            className="bg-background/5 border border-background/10 rounded-2xl p-10 md:p-14 relative"
            aria-live="polite"
            aria-atomic="true"
          >
            <Quote
              className="absolute top-8 right-8 h-8 w-8 text-primary/30"
              aria-hidden="true"
            />

            <div className="mb-6">
              <StarRating rating={t.rating} />
            </div>

            <blockquote className="font-display text-2xl md:text-3xl font-normal italic text-background leading-relaxed mb-8">
              &ldquo;{t.text}&rdquo;
            </blockquote>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-background text-sm">
                  {t.author}
                </p>
                <p className="text-xs text-background/50 mt-0.5">
                  {t.petName}&apos;s parent · {t.serviceLabel} · {t.date}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prev}
                  aria-label="Previous testimonial"
                  className="text-background/50 hover:text-background hover:bg-background/10"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={next}
                  aria-label="Next testimonial"
                  className="text-background/50 hover:text-background hover:bg-background/10"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Pagination dots */}
          <div
            className="flex justify-center gap-2 mt-6"
            role="tablist"
            aria-label="Testimonial navigation"
          >
            {safeTestimonials.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === current}
                aria-label={`Go to testimonial ${i + 1}`}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-background/20 hover:bg-background/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
