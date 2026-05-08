import type { Metadata } from "next";
import { simplePageMetadataFromSettings } from "@/lib/seo-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return simplePageMetadataFromSettings({
    title: "Pricing Private Dog Boarding Syracuse",
    description:
      "Review premium but fair private boarding planning ranges with clear pricing before confirmation, no hidden fees, and no surprise add-ons.",
    canonicalPath: "/pricing",
  });
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
