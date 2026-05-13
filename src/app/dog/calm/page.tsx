import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

import { simplePageMetadataFromSettings } from "@/lib/seo-page-metadata";

const CalmModeExperience = dynamic(
  () => import("@/components/dog/DogModeExperience").then((m) => ({ default: m.CalmModeExperience })),
  { loading: () => <Skeleton className="min-h-screen w-full" /> },
);

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
