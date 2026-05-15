"use client";

import { FadeUp } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sun, Heart, Moon, Scissors, Sparkles, Cake } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const services = [
  {
    icon: Sun,
    title: "Doggy Daycare",
    description: "Full-day fun, friends, and enrichment for every pup!",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop",
    color: "var(--color-yellow)",
    href: "/services/daycare",
  },
  {
    icon: Heart,
    title: "Puppy Play",
    description: "Specialized play and socialization for young pups.",
    image: "https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=400&h=300&fit=crop",
    color: "var(--color-coral)",
    href: "/services/daycare",
  },
  {
    icon: Moon,
    title: "Boarding",
    description: "Cozy overnight stays with loving care and supervision.",
    image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=300&fit=crop",
    color: "var(--color-deep-sky)",
    href: "/services/boarding",
  },
  {
    icon: Scissors,
    title: "Grooming",
    description: "Baths, haircuts, and daily refreshes to keep pups looking great.",
    image: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&h=300&fit=crop",
    color: "var(--color-green)",
    href: "/services/grooming",
  },
  {
    icon: Sparkles,
    title: "Enrichment",
    description: "Brain games, activities, and daily routines for happy, healthy dogs.",
    image: "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400&h=300&fit=crop",
    color: "var(--color-sky)",
    href: "/services/daycare",
  },
  {
    icon: Cake,
    title: "Birthday Pawties",
    description: "Celebrate their big day! Cake, treats, friends, and fun.",
    image: "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=400&h=300&fit=crop",
    color: "var(--color-coral)",
    href: "/services/daycare",
  },
];

export function ServicesSection() {
  return (
    <section className="section-padding bg-muted/30">
      <div className="container px-4">
        <FadeUp>
          <div className="text-center mb-12">
            <h2 className="heading-playful text-3xl font-bold text-foreground md:text-4xl mb-4">
              Our Services
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything your dog needs for a happy, healthy, tail-wagging day!
            </p>
          </div>
        </FadeUp>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          {services.map((service, index) => (
            <FadeUp key={index} delay={index * 0.08}>
              <Link href={service.href} className="group block">
                <div className="paw-card overflow-hidden p-0">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div
                      className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-full shadow-lg"
                      style={{ backgroundColor: service.color }}
                    >
                      <service.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="heading-playful text-xl font-bold text-foreground mb-2">
                      {service.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>
              </Link>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.4}>
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
              <Link href="/services/daycare">
                View All Services
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
