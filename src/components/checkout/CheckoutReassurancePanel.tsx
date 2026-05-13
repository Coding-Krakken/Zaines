import { BadgeCheck, HeartHandshake, Lock, ShieldCheck, Sparkles } from "lucide-react";

interface CheckoutTestimonial {
  id: string;
  author: string;
  petName: string;
  text: string;
  rating: number;
}

interface CheckoutReassurancePanelProps {
  supportPhone: string;
  supportEmail: string;
  showTrustIndicators: boolean;
  testimonials: CheckoutTestimonial[];
}

const reassuranceItems = [
  {
    icon: ShieldCheck,
    title: "Secure Stripe payment",
    detail: "Trusted, PCI-safe processing with encrypted payment details.",
  },
  {
    icon: Lock,
    title: "No hidden fees",
    detail: "Your pre-confirmation total is transparent before you pay.",
  },
  {
    icon: Sparkles,
    title: "Instant confirmation",
    detail: "Receive booking confirmation immediately after payment succeeds.",
  },
  {
    icon: BadgeCheck,
    title: "Clear cancellation policy",
    detail: "Cancellation windows and refund expectations are shared in advance.",
  },
  {
    icon: HeartHandshake,
    title: "Concierge support",
    detail: "Need help? Our team is available to assist before and after checkout.",
  },
];

export function CheckoutReassurancePanel({
  supportPhone,
  supportEmail,
  showTrustIndicators,
  testimonials,
}: CheckoutReassurancePanelProps) {
  const supportPhoneHref = supportPhone.replace(/[^\d+]/g, "");

  return (
    <section className="space-y-4 rounded-xl border bg-muted/30 p-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Checkout with confidence</h3>
        <p className="text-sm text-muted-foreground">
          Encrypted checkout, transparent totals, and instant booking confirmation.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {reassuranceItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="rounded-lg border bg-background p-3"
            >
              <div className="flex items-start gap-2">
                <Icon className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showTrustIndicators ? (
        <div className="space-y-3 rounded-lg border bg-background p-3">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border px-2 py-1 text-xs font-medium">
              4,800+ premium stays hosted
            </span>
            <span className="rounded-full border px-2 py-1 text-xs font-medium">
              98% customer satisfaction
            </span>
            <span className="rounded-full border px-2 py-1 text-xs font-medium">
              Support response within 15 minutes
            </span>
          </div>

          {testimonials.length > 0 ? (
            <div className="grid gap-2 md:grid-cols-2">
              {testimonials.map((testimonial) => (
                <blockquote
                  key={testimonial.id}
                  className="rounded-md border bg-muted/20 p-3"
                >
                  <p className="text-xs text-muted-foreground">
                    "{testimonial.text}"
                  </p>
                  <footer className="mt-2 text-xs font-medium">
                    {testimonial.author} and {testimonial.petName}
                  </footer>
                </blockquote>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Need help before confirming?</span>
            <a
              className="font-medium text-primary hover:underline"
              href={`tel:${supportPhoneHref}`}
            >
              {supportPhone}
            </a>
            <span>or</span>
            <a
              className="font-medium text-primary hover:underline"
              href={`mailto:${supportEmail}`}
            >
              {supportEmail}
            </a>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border px-2 py-1 text-xs">
              <BadgeCheck className="mr-1 h-3 w-3" /> Premium care certified
            </span>
            <span className="inline-flex items-center rounded-full border px-2 py-1 text-xs">
              <ShieldCheck className="mr-1 h-3 w-3" /> Encrypted checkout
            </span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
