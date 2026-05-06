import type { Metadata } from "next";

import { CalmModeExperience } from "@/components/dog/DogModeExperience";

export const metadata: Metadata = {
  title: "Dog Calm Mode",
  description:
    "Low-stimulation Dog Calm Mode for suite tablets with reduced motion, consent-based audio, and no-PII telemetry signals.",
};

export default function CalmModePage() {
  return <CalmModeExperience />;
}
