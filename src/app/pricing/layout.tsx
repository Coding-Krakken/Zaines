import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing Private Dog Boarding Syracuse",
  description:
    "Review premium but fair private boarding planning ranges with clear pricing before confirmation, no hidden fees, and no surprise add-ons.",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
