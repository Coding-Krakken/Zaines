import type { MetadataRoute } from "next";
import { absoluteUrl, publicSeoRoutes, seoRouteArchitecture } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const architectureOrder = new Map(
    seoRouteArchitecture.map((entry, index) => [entry.route, index]),
  );

  return [...publicSeoRoutes]
    .sort(
      (a, b) =>
        (architectureOrder.get(a.route) ?? Number.MAX_SAFE_INTEGER) -
        (architectureOrder.get(b.route) ?? Number.MAX_SAFE_INTEGER),
    )
    .map((route) => ({
      url: absoluteUrl(route.route),
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }));
}
