import type { Metadata } from "next";

import { DogModeExperience } from "@/components/dog/DogModeExperience";

export const metadata: Metadata = {
  title: "Dog Mode Tablet Experience",
  description:
    "Suite tablet Dog Mode with large touch targets, calm controls, safe motion defaults, and privacy-safe interaction telemetry.",
};

export default function DogModePage() {
  return <DogModeExperience />;
}
