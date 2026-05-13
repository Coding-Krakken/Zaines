import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

import { simplePageMetadataFromSettings } from "@/lib/seo-page-metadata";

const DogModeExperience = dynamic(
  () => import("@/components/dog/DogModeExperience").then((m) => ({ default: m.DogModeExperience })),
  { loading: () => <Skeleton className="min-h-screen w-full" /> },
);

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
