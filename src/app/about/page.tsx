import { Metadata } from "next";
import AboutPageContent from "./page-content";
import { simplePageMetadataFromSettings } from "@/lib/seo-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return simplePageMetadataFromSettings({
    title: "About Zaine's Stay & Play | Best Doggy Daycare in Syracuse NY",
    description:
      "Learn about Syracuse's happiest doggy daycare. Safe supervised play, enrichment activities, photo updates, and a team that truly loves dogs. Meet the Zaine's Stay & Play family.",
    keywords: [
      "doggy daycare Syracuse",
      "dog daycare team",
      "pet care philosophy",
      "Syracuse dog care",
      "supervised dog play",
    ],
    canonicalPath: "/about",
  });
}

export default function AboutPage() {
  return <AboutPageContent />;
}
