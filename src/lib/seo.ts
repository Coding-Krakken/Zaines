import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

// Data, types, and constants live in seo.data.ts (kept under 300-line limit).
// All symbols are re-exported here so existing `@/lib/seo` imports remain stable.
export {
  seoBaseUrl,
  type LocalGrowthPage,
  syracusePillarRoute,
  localGrowthPages,
  type LocalGrowthSlug,
  keywordRouteMap,
  publicSeoRoutes,
  conversionFunnelLinks,
  localFaqs,
} from "./seo.data";
import {
  seoBaseUrl,
  type LocalGrowthPage,
  syracusePillarRoute,
  localGrowthPages,
  localFaqs,
} from "./seo.data";

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${seoBaseUrl}${normalizedPath}`;
}

export function findLocalGrowthPage(slug: string) {
  return localGrowthPages.find((page) => page.slug === slug);
}

export function localGrowthMetadata(page: LocalGrowthPage): Metadata {
  const url = absoluteUrl(page.route);

  return {
    title: page.title,
    description: page.metaDescription,
    keywords: [page.primaryKeyword, ...page.secondaryKeywords],
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      url,
      title: page.title,
      description: page.metaDescription,
      siteName: siteConfig.name,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} private dog boarding for ${page.city}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.metaDescription,
      images: [siteConfig.ogImage],
    },
  };
}

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${seoBaseUrl}/#localbusiness`,
    name: siteConfig.name,
    url: seoBaseUrl,
    image: siteConfig.ogImage,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.contact.address,
      addressLocality: siteConfig.contact.city,
      addressRegion: siteConfig.contact.state,
      postalCode: siteConfig.contact.zip,
      addressCountry: "US",
    },
    areaServed: siteConfig.serviceArea.map((area) => ({
      "@type": "City",
      name: area,
    })),
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "06:00",
        closes: "20:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday"],
        opens: "08:00",
        closes: "18:00",
      },
    ],
    sameAs: Object.values(siteConfig.links),
  };
}

export function serviceSchema(page: LocalGrowthPage) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${absoluteUrl(page.route)}#service`,
    name: `Private dog boarding for ${page.city}, ${page.region}`,
    serviceType: "Private dog boarding",
    provider: {
      "@id": `${seoBaseUrl}/#localbusiness`,
    },
    areaServed: {
      "@type": "City",
      name: page.city,
      addressRegion: page.region,
      addressCountry: "US",
    },
    offers: {
      "@type": "Offer",
      url: absoluteUrl("/pricing"),
      availability: "https://schema.org/LimitedAvailability",
      priceCurrency: "USD",
    },
  };
}

export function faqSchema(faqs = localFaqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function localGrowthSchemas(page: LocalGrowthPage) {
  return [
    localBusinessSchema(),
    serviceSchema(page),
    faqSchema(),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      {
        name: page.route === syracusePillarRoute ? page.h1 : "Locations",
        path: page.route === syracusePillarRoute ? page.route : "/locations",
      },
      ...(page.route === syracusePillarRoute
        ? []
        : [{ name: page.h1, path: page.route }]),
    ]),
  ];
}
