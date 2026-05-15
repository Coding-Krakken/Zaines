"use client";

import { FadeUp } from "@/components/motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

const galleryImages = [
  {
    src: "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=400&h=400&fit=crop",
    alt: "Dogs playing together in daycare",
  },
  {
    src: "https://images.unsplash.com/photo-1558788353-f76d92427f16?w=400&h=400&fit=crop",
    alt: "Happy dog running outdoors",
  },
  {
    src: "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=400&h=400&fit=crop",
    alt: "Puppy playing with toys",
  },
  {
    src: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop",
    alt: "Dogs socializing at daycare",
  },
  {
    src: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop",
    alt: "Resting dog enjoying comfort",
  },
];

export function GalleryPreviewSection() {
  return (
    <section className="section-padding bg-muted/30">
      <div className="container px-4">
        <FadeUp>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="text-3xl" aria-hidden="true">❤️</span>
              <h2 className="heading-playful text-3xl font-bold text-foreground md:text-4xl">
                A Day Full of Happy Moments
              </h2>
              <span className="text-3xl" aria-hidden="true">❤️</span>
            </div>
          </div>
        </FadeUp>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {galleryImages.map((image, index) => (
            <FadeUp key={index} delay={index * 0.06}>
              <div className="relative aspect-square overflow-hidden rounded-2xl shadow-lg group cursor-pointer">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.3}>
          <div className="text-center">
            <Button
              asChild
              size="lg"
              className="font-bold shadow-lg"
              style={{
                background: "var(--color-coral)",
                color: "white",
              }}
            >
              <Link href="/gallery">
                View Full Gallery
                <span className="ml-2 text-xl" aria-hidden="true">📸</span>
              </Link>
            </Button>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
