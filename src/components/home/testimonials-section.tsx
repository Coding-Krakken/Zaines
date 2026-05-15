"use client";

import { FadeUp } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const testimonials = [
  {
    name: "Sarah M.",
    location: "Syracuse, NY",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces",
    rating: 5,
    text: "These folks make daycare feel easy. My dog comes home happy, tired, and loved. I can't imagine going anywhere else!",
  },
  {
    name: "Mike T.",
    location: "DeWitt, NY",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
    rating: 5,
    text: "The staff is incredible and truly cares. I love the photo updates and how much attention my pup gets every single day.",
  },
  {
    name: "Jessica L.",
    location: "Fayetteville, NY",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces",
    rating: 5,
    text: "Best decision we made for our energetic pup. Safe, clean, and so much fun. They really understand dogs!",
  },
];

export function TestimonialsSection() {
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

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto mb-8">
          {testimonials.map((testimonial, index) => (
            <FadeUp key={index} delay={index * 0.1}>
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
                  <div className="relative h-12 w-12 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.location}</div>
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
