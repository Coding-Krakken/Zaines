import type { Metadata } from "next";
import { LocalGrowthPageView } from "@/components/local-growth-page";
import {
  localGrowthMetadataFromSettings,
  localGrowthPages,
  syracuseDaycareRoute,
} from "@/lib/seo";

const syracuseDaycarePage = localGrowthPages.find(
  (localPage) => localPage.route === syracuseDaycareRoute,
);

if (!syracuseDaycarePage) {
  throw new Error("Missing Syracuse daycare local growth page configuration.");
}

const page = syracuseDaycarePage;

export async function generateMetadata(): Promise<Metadata> {
  return localGrowthMetadataFromSettings(page);
}

export default function SyracuseDogDaycarePage() {
  return <LocalGrowthPageView page={page} />;
}
