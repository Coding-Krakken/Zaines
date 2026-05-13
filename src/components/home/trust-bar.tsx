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
      className="section-padding-tight border-y border-border bg-card/70"
      aria-label="Trust signals"
    >
      <FadeIn>
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <p className="eyebrow mb-3">Trust framework</p>
            <h2 className="headline-display text-3xl font-semibold text-foreground md:text-4xl">
              Designed for Safety, Proven by Process
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {trustSignals.map(({ icon: Icon, label, detail }) => (
              <div key={label} className="luxury-card flex flex-col items-center gap-3 p-5 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Icon
                    className="h-5 w-5 text-primary"
                    aria-hidden="true"
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-snug text-foreground">
                    {label}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
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
