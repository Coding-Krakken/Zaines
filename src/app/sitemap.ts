import type { MetadataRoute } from "next";

const BASE_URL = "https://zaines.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/about", "/pricing", "/book", "/contact"];

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
