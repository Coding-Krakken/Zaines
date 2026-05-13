"use client";

import { Suspense, useEffect, useState } from "react";
import { FadeUp } from "@/components/motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useSearchParams } from "next/navigation";

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

// Inner component that reads search params — must be wrapped in Suspense
function TestimonialsSearchParamSync({
  safeTestimonials,
  setCurrent,
}: {
  safeTestimonials: Array<{ id: string }>;
  setCurrent: (idx: number) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const targetId = searchParams.get('testimonial');
    if (!targetId) return;
    const idx = safeTestimonials.findIndex((item) => item.id === targetId);
    if (idx >= 0) setCurrent(idx);
  }, [searchParams, safeTestimonials, setCurrent]);

  return null;
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
      className="section-padding overflow-hidden bg-foreground"
      aria-labelledby="testimonials-heading"
    >
      {/* Reads ?testimonial= query param to deep-link to a specific item */}
      <Suspense fallback={null}>
        <TestimonialsSearchParamSync
          safeTestimonials={safeTestimonials}
          setCurrent={setCurrent}
        />
      </Suspense>
      <div className="container mx-auto px-4">
        <FadeUp>
          <div className="text-center mb-16">
            <p className="eyebrow mb-4 border-primary/35 bg-primary/12 text-primary">
              Client Stories
            </p>
            <h2
              id="testimonials-heading"
              className="headline-display mb-4 text-4xl font-semibold text-background text-balance md:text-5xl"
            >
              What Families
              <br />
              <em className="text-primary not-italic">Are Saying</em>
            </h2>
            <p className="mx-auto max-w-xl text-background/70">
              Every review is from real bookings and reflects a small-capacity experience families can feel from check-in to pickup.
            </p>
          </div>
        </FadeUp>

        {/* Carousel */}
        <div className="max-w-3xl mx-auto">
          <div
            id={`testimonial-${t.id}`}
            className="relative rounded-3xl border border-background/15 bg-background/6 p-10 md:p-14"
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
                  className="focus-ring text-background/50 hover:bg-background/10 hover:text-background"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={next}
                  aria-label="Next testimonial"
                  className="focus-ring text-background/50 hover:bg-background/10 hover:text-background"
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
                className={`focus-ring h-1.5 rounded-full transition-all duration-300 ${
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
