import { Metadata } from "next";
import ContactPageContent from "./page-content";
import { simplePageMetadataFromSettings } from "@/lib/seo-page-metadata";

const PRICING_POLICY_COPY_CONTRACT =
  "Premium pricing with no hidden fees and no surprise add-ons. Total is shown before confirmation.";

export async function generateMetadata(): Promise<Metadata> {
  return simplePageMetadataFromSettings({
    title: "Contact Syracuse Dog Boarding Team",
    description:
      "Contact Zaine's Stay & Play for private dog boarding Syracuse support, small dog boarding Syracuse availability, and transparent care policy questions.",
    canonicalPath: "/contact",
  });
}

export default function ContactPage() {
  return <ContactPageContent />;
}
