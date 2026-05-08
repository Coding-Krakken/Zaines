import type { Metadata } from "next";
import { LocalGrowthPageView } from "@/components/local-growth-page";
import {
  localGrowthMetadataFromSettings,
  localGrowthPages,
  syracusePillarRoute,
} from "@/lib/seo";

const syracusePage = localGrowthPages.find(
  (localPage) => localPage.route === syracusePillarRoute,
);

if (!syracusePage) {
  throw new Error("Missing Syracuse local growth pillar page configuration.");
}

const page = syracusePage;

export async function generateMetadata(): Promise<Metadata> {
  return localGrowthMetadataFromSettings(page);
}

export default function SyracuseDogBoardingPage() {
  return <LocalGrowthPageView page={page} />;
}
