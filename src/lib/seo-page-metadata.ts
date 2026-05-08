import type { Metadata } from "next";
import { getSeoRuntimeConfig } from "@/lib/seo";

type SimplePageMetadataOptions = {
  title: string;
  description: string;
  keywords?: string[];
  canonicalPath?: string;
  ogTitle?: string;
  ogDescription?: string;
};

function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, "");
}

function absoluteUrlFromBase(baseUrl: string, path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${stripTrailingSlash(baseUrl)}${normalizedPath}`;
}

export async function simplePageMetadataFromSettings(
  options: SimplePageMetadataOptions,
): Promise<Metadata> {
  const seo = await getSeoRuntimeConfig();
  const canonical = options.canonicalPath
    ? absoluteUrlFromBase(seo.siteUrl, options.canonicalPath)
    : undefined;

  return {
    title: options.title,
    description: options.description,
    keywords: options.keywords,
    alternates: options.canonicalPath
      ? {
          canonical,
        }
      : undefined,
    openGraph: {
      type: "website",
      url: canonical,
      title: options.ogTitle ?? options.title,
      description: options.ogDescription ?? options.description,
      siteName: seo.siteName,
      images: [
        {
          url: seo.ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${seo.siteName} marketing page image`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: options.ogTitle ?? options.title,
      description: options.ogDescription ?? options.description,
      images: [seo.ogImageUrl],
    },
  };
}
