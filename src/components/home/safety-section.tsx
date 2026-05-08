import Link from "next/link";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/motion";
import {
  ShieldCheck,
  Syringe,
  Eye,
  FlaskConical,
  HeartPulse,
  Clock4,
} from "lucide-react";

const standards = [
  {
    icon: Syringe,
    title: "Vaccinations Required",
    description:
      "Rabies, DHPP, and Bordetella records must be current and submitted before every stay. No exceptions.",
  },
  {
    icon: Eye,
    title: "Owner Always On-Site",
    description:
      "Every hour, every night. Your dog is never left with an employee — the owner is always present.",
  },
  {
    icon: ShieldCheck,
    title: "Camera-Monitored Spaces",
    description:
      "All areas are camera-monitored around the clock. Deluxe and Luxury guests have personal webcam access.",
  },
  {
    icon: FlaskConical,
    title: "No Harsh Chemicals",
    description:
      "We use pet-safe, non-toxic cleaning products exclusively in all guest suite areas and outdoor spaces.",
  },
  {
    icon: HeartPulse,
    title: "Emergency Protocol",
    description:
      "If urgent care is needed, we contact you immediately and act quickly when treatment cannot wait.",
  },
  {
    icon: Clock4,
    title: "Structured Routines",
    description:
      "Feeding, rest, and play windows are consistent every day — reducing stress and supporting healthy habits.",
  },
];

export function SafetySection() {
  return (
    <section
      className="section-padding bg-secondary/30"
      aria-labelledby="safety-heading"
    >
      <div className="container mx-auto px-4">
        <FadeUp>
          <div className="text-center mb-14">
            <p className="text-sm uppercase tracking-[0.25em] text-primary font-semibold mb-4">
              Safety &amp; Standards
            </p>
            <h2
              id="safety-heading"
              className="font-display text-4xl md:text-5xl font-semibold text-foreground mb-4 text-balance"
            >
              Your Dog&apos;s Safety
              <br />
              <em className="text-primary not-italic">Is Non-Negotiable.</em>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Every standard exists for one reason: to give you confidence that
              your dog is genuinely cared for.
            </p>
          </div>
        </FadeUp>

        <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {standards.map(({ icon: Icon, title, description }) => (
            <StaggerItem key={title}>
              <div className="bg-card border border-border rounded-xl p-6 h-full hover:border-primary/30 hover:shadow-md transition-all duration-300">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Icon
                    className="h-5 w-5 text-primary"
                    aria-hidden="true"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-base">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeUp delay={0.2}>
          <div className="text-center mt-12">
            <Link
              href="/policies"
              className="text-sm font-medium text-primary hover:underline"
            >
              Read our full safety &amp; vaccination policies →
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
