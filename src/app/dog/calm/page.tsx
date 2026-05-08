import type { Metadata } from "next";

import { CalmModeExperience } from "@/components/dog/DogModeExperience";
import { simplePageMetadataFromSettings } from "@/lib/seo-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return simplePageMetadataFromSettings({
    title: "Dog Calm Mode",
    description:
      "Low-stimulation Dog Calm Mode for suite tablets with reduced motion, consent-based audio, and no-PII telemetry signals.",
    canonicalPath: "/dog/calm",
  });
}

export default function CalmModePage() {
  return <CalmModeExperience />;
}
