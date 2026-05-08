import { FadeIn } from "@/components/motion";
import { Award, HeartHandshake, Eye, Syringe, Clock } from "lucide-react";

const trustSignals = [
  {
    icon: Award,
    label: "Licensed & Insured",
    detail: "Fully covered for your peace of mind",
  },
  {
    icon: HeartHandshake,
    label: "Pet First Aid Certified",
    detail: "Trained for emergency response",
  },
  {
    icon: Eye,
    label: "Owner Always On-Site",
    detail: "Never left with staff alone",
  },
  {
    icon: Eye,
    label: "Camera-Monitored 24/7",
    detail: "Every area, every hour",
  },
  {
    icon: Syringe,
    label: "Vaccinations Required",
    detail: "Rabies, DHPP & Bordetella",
  },
  {
    icon: Clock,
    label: "Daily Photo Updates",
    detail: "Real updates, not templates",
  },
];

export function TrustBar() {
  return (
    <section
      className="border-y border-border bg-card py-12"
      aria-label="Trust signals"
    >
      <FadeIn>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-y-8 gap-x-6 md:grid-cols-3 lg:grid-cols-6">
            {trustSignals.map(({ icon: Icon, label, detail }) => (
              <div key={label} className="flex flex-col items-center text-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Icon
                    className="h-5 w-5 text-primary"
                    aria-hidden="true"
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-snug">
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
