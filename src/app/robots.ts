import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard/",
        "/auth/",
        "/book/confirmation",
        "/_next/",
        "/static/",
        "/preview-themes/",
      ],
    },
    sitemap: "https://zaines.vercel.app/sitemap.xml",
  };
}
