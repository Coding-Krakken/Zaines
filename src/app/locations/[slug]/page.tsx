import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalGrowthPageView } from "@/components/local-growth-page";
import {
  findLocalGrowthPage,
  localGrowthMetadata,
  localGrowthPages,
} from "@/lib/seo";

type LocationPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return localGrowthPages
    .filter((page) => page.route.startsWith("/locations/"))
    .map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: LocationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = findLocalGrowthPage(slug);

  if (!page || !page.route.startsWith("/locations/")) {
    return {};
  }

  return localGrowthMetadata(page);
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { slug } = await params;
  const page = findLocalGrowthPage(slug);

  if (!page || !page.route.startsWith("/locations/")) {
    notFound();
  }

  return <LocalGrowthPageView page={page} />;
}
