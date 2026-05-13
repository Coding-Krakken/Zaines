import type { VariantProps } from "class-variance-authority";
import { badgeVariants } from "@/components/ui/badge";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

type BookingStatusMeta = {
  label: string;
  badgeVariant: BadgeVariant;
  toneClass: string;
};

const BOOKING_STATUS_META: Record<string, BookingStatusMeta> = {
  confirmed: {
    label: "confirmed",
    badgeVariant: "default",
    toneClass: "bg-emerald-100 text-emerald-800",
  },
  pending: {
    label: "pending",
    badgeVariant: "secondary",
    toneClass: "bg-amber-100 text-amber-800",
  },
  checked_in: {
    label: "checked in",
    badgeVariant: "secondary",
    toneClass: "bg-sky-100 text-sky-800",
  },
  completed: {
    label: "completed",
    badgeVariant: "outline",
    toneClass: "bg-slate-100 text-slate-800",
  },
  cancelled: {
    label: "cancelled",
    badgeVariant: "destructive",
    toneClass: "bg-rose-100 text-rose-800",
  },
};

export function getBookingStatusMeta(status: string): BookingStatusMeta {
  return (
    BOOKING_STATUS_META[status] ?? {
      label: status.replaceAll("_", " "),
      badgeVariant: "outline",
      toneClass: "bg-muted text-foreground",
    }
  );
}
