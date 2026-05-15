import { Metadata } from "next";
import ContactPageContent from "./page-content";
import { simplePageMetadataFromSettings } from "@/lib/seo-page-metadata";
import { PRICING_TRUST_DISCLOSURE } from "@/config/trust-copy";

// Pricing policy contract required for Issue #31 CP1 compliance
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PRICING_POLICY_COPY_CONTRACT = PRICING_TRUST_DISCLOSURE;

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
