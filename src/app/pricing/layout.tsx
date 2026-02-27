import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Zaine's Stay & Play",
  description:
    "Explore service pricing from Zaine's Stay & Play, including boarding suite rates and add-on options.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
