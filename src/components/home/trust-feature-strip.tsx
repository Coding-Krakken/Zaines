"use client";

import { FadeUp } from "@/components/motion";
import { Shield, Heart, Home, Camera } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Supervised Play",
    description: "Trained staff keeps play safe, fun, and engaging all day long.",
    color: "var(--color-sky)",
    bgColor: "rgba(79, 195, 247, 0.1)",
  },
  {
    icon: Heart,
    title: "Temperament Screening",
    description: "We ensure every pup feels comfortable and fits the right group.",
    color: "var(--color-coral)",
    bgColor: "rgba(255, 107, 107, 0.1)",
  },
  {
    icon: Home,
    title: "Safe & Clean Facility",
    description: "Clean spaces, fresh water, rest breaks, and lots of care.",
    color: "var(--color-green)",
    bgColor: "rgba(107, 203, 119, 0.1)",
  },
  {
    icon: Camera,
    title: "Photo Updates",
    description: "Get fun pictures and updates so you never miss a moment.",
    color: "var(--color-yellow)",
    bgColor: "rgba(255, 212, 59, 0.1)",
  },
];

export function TrustFeatureStrip() {
  return (
    <section className="section-padding-tight bg-background">
      <div className="container px-4">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <FadeUp key={index} delay={index * 0.1}>
              <div className="paw-card text-center group">
                <div
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: feature.bgColor,
                    color: feature.color,
                  }}
                >
                  <feature.icon className="h-8 w-8" aria-hidden="true" />
                </div>
                <h3 className="heading-playful text-lg font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
