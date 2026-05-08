import type { Metadata } from "next";

import { DogModeExperience } from "@/components/dog/DogModeExperience";
import { simplePageMetadataFromSettings } from "@/lib/seo-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return simplePageMetadataFromSettings({
    title: "Dog Mode Tablet Experience",
    description:
      "Suite tablet Dog Mode with large touch targets, calm controls, safe motion defaults, and privacy-safe interaction telemetry.",
    canonicalPath: "/dog",
  });
}

export default function DogModePage() {
  return <DogModeExperience />;
}
