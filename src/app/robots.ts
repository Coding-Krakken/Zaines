import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard/",
        "/admin/",
        "/auth/",
        "/book/confirmation",
        "/_next/",
        "/static/",
        "/preview-themes/",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
