import type { Metadata } from "next";
import { LocalGrowthPageView } from "@/components/local-growth-page";
import {
  localGrowthMetadataFromSettings,
  localGrowthPages,
  syracuseGroomingRoute,
} from "@/lib/seo";

const syracuseGroomingPage = localGrowthPages.find(
  (localPage) => localPage.route === syracuseGroomingRoute,
);

if (!syracuseGroomingPage) {
  throw new Error("Missing Syracuse grooming local growth page configuration.");
}

const page = syracuseGroomingPage;

export async function generateMetadata(): Promise<Metadata> {
  return localGrowthMetadataFromSettings(page);
}

export default function SyracuseDogGroomingPage() {
  return <LocalGrowthPageView page={page} />;
}
