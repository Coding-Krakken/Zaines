import { Metadata } from "next";
import ContactPageContent from "./page-content";
import { simplePageMetadataFromSettings } from "@/lib/seo-page-metadata";

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
