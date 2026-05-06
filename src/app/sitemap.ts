import type { MetadataRoute } from "next";
import { absoluteUrl, publicSeoRoutes } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return publicSeoRoutes.map((route) => ({
    url: absoluteUrl(route.route),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
