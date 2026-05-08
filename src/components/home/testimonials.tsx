"use client";

import { useState } from "react";
import { FadeUp } from "@/components/motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    id: 1,
    author: "Sarah M.",
    petName: "Max",
    rating: 5,
    date: "2 weeks ago",
    text: "Max had an amazing stay. The owner sent us photos every day — real ones, not stock images — and he looked genuinely happy and relaxed. The small-capacity setup made all the difference. I felt totally at ease the entire time we were away.",
    service: "Deluxe Suite",
  },
  {
    id: 2,
    author: "James T.",
    petName: "Luna",
    rating: 5,
    date: "1 month ago",
    text: "Luna settled in within an hour. The updates were clear and on time, pickup was smooth, and she came home calm and happy — not exhausted and overwhelmed like she has been from other boarding places. We won't go anywhere else.",
    service: "Standard Suite",
  },
  {
    id: 3,
    author: "Emily R.",
    petName: "Charlie",
    rating: 5,
    date: "1 month ago",
    text: "Charlie is anxious in new environments, so I was nervous. But the quiet, small environment helped him relax almost immediately. The communication was excellent — I knew exactly how he was doing throughout the entire stay.",
    service: "Deluxe Suite",
  },
  {
    id: 4,
    author: "Michael K.",
    petName: "Bella",
    rating: 5,
    date: "2 months ago",
    text: "First time boarding Bella and I was a wreck about it. The owner reassured me from the very first conversation. When we picked her up, she didn't want to leave — which says everything. Completely converted.",
    service: "Luxury Suite",
  },
  {
    id: 5,
    author: "Rachel D.",
    petName: "Cooper",
    rating: 5,
    date: "3 months ago",
    text: "We've tried three different boarding options in Syracuse. This is the only one where we came back without our dog smelling like stress, loud facilities, or chemical cleaner. Cooper actually enjoys going now. That's remarkable.",
    service: "Standard Suite",
  },
];

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

  const prev = () =>
    setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);
  const next = () => setCurrent((c) => (c + 1) % testimonials.length);

  const t = testimonials[current];

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
                  {t.petName}&apos;s parent · {t.service} · {t.date}
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
            {testimonials.map((_, i) => (
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
