import { FadeUp, StaggerContainer, StaggerItem } from "@/components/motion";
import {
  Sun,
  Coffee,
  Footprints,
  Bed,
  TreePine,
  BookOpen,
  UtensilsCrossed,
  Moon,
} from "lucide-react";

const schedule = [
  {
    time: "7:00 AM",
    title: "Good Morning",
    description:
      "A calm, quiet wake-up — no alarms, no chaos. Your dog gets up gently on their own schedule and receives a morning greeting.",
    icon: Sun,
    side: "left",
  },
  {
    time: "8:00 AM",
    title: "Breakfast",
    description:
      "We serve your dog's own food — the same brand and portion size you send, at the same time they eat at home.",
    icon: Coffee,
    side: "right",
  },
  {
    time: "9:30 AM",
    title: "Morning Potty & Play",
    description:
      "A structured potty break followed by individual outdoor time — sniffing, exploring, and moving at their own pace.",
    icon: Footprints,
    side: "left",
  },
  {
    time: "11:30 AM",
    title: "Rest Window",
    description:
      "Dogs thrive on routine. A mid-morning quiet period lets them decompress, nap, and reset — just like home.",
    icon: Bed,
    side: "right",
  },
  {
    time: "1:00 PM",
    title: "Afternoon Walk & Enrichment",
    description:
      "A private walk or backyard session with enrichment activities tailored to your dog's energy level and interests.",
    icon: TreePine,
    side: "left",
  },
  {
    time: "3:00 PM",
    title: "Photo Update Sent",
    description:
      "We send you a real update — photos, a note on how they're doing, anything interesting from the day.",
    icon: BookOpen,
    side: "right",
  },
  {
    time: "5:00 PM",
    title: "Dinner",
    description:
      "Evening meal served at their regular time with their food. Medications administered exactly as you've instructed.",
    icon: UtensilsCrossed,
    side: "left",
  },
  {
    time: "8:00 PM",
    title: "Settled for the Night",
    description:
      "Your dog winds down in their private suite — cozy, quiet, and secure. Supervision continues through the night.",
    icon: Moon,
    side: "right",
  },
];

export function DayAtZaines() {
  return (
    <section
      className="section-padding bg-muted/50"
      aria-labelledby="day-heading"
    >
      <div className="container mx-auto px-4">
        <FadeUp>
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-[0.25em] text-primary font-semibold mb-4">
              The Experience
            </p>
            <h2
              id="day-heading"
              className="font-display text-4xl md:text-5xl font-semibold text-foreground mb-4 text-balance"
            >
              A Day at Zaine&apos;s
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Calm, consistent, and designed to feel as close to home as
              possible.
            </p>
          </div>
        </FadeUp>

        {/* Timeline */}
        <div className="relative max-w-4xl mx-auto">
          {/* Spine */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2 hidden md:block" />

          <StaggerContainer className="space-y-8 md:space-y-0">
            {schedule.map((item) => {
              const Icon = item.icon;
              const isLeft = item.side === "left";

              return (
                <StaggerItem key={item.time}>
                  <div
                    className={`md:flex md:items-center md:gap-8 ${
                      isLeft ? "md:flex-row" : "md:flex-row-reverse"
                    }`}
                  >
                    {/* Content card */}
                    <div className="flex-1 mb-4 md:mb-8">
                      <div
                        className={`bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow ${
                          isLeft ? "md:text-right" : "md:text-left"
                        }`}
                      >
                        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
                          {item.time}
                        </p>
                        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Center node */}
                    <div className="hidden md:flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/30 z-10">
                      <Icon
                        className="h-4 w-4 text-primary"
                        aria-hidden="true"
                        strokeWidth={1.5}
                      />
                    </div>

                    {/* Spacer for opposite side */}
                    <div className="hidden md:block flex-1" aria-hidden="true" />
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
