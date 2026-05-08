import { siteConfig } from "@/config/site";

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteConfig.url}/#business`,
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    priceRange: "$$",
    image: siteConfig.ogImage,
    logo: `${siteConfig.url}/logo.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.contact.address,
      addressLocality: siteConfig.contact.city,
      addressRegion: siteConfig.contact.state,
      postalCode: siteConfig.contact.zip,
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 43.048,
      longitude: -76.147,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "06:00",
        closes: "20:00",
      },
    ],
    sameAs: [
      siteConfig.links.facebook,
      siteConfig.links.instagram,
      siteConfig.links.twitter,
    ],
    areaServed: siteConfig.serviceArea.map((city) => ({
      "@type": "City",
      name: city,
      containedInPlace: {
        "@type": "State",
        name: "New York",
      },
    })),
    hasMap: `https://maps.google.com/?q=${encodeURIComponent(
      `${siteConfig.contact.address}, ${siteConfig.contact.city}, ${siteConfig.contact.state} ${siteConfig.contact.zip}`
    )}`,
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Private Suites", value: true },
      { "@type": "LocationFeatureSpecification", name: "24/7 Supervision", value: true },
      { "@type": "LocationFeatureSpecification", name: "Camera Monitoring", value: true },
      { "@type": "LocationFeatureSpecification", name: "Owner On-Site", value: true },
      { "@type": "LocationFeatureSpecification", name: "Daily Photo Updates", value: true },
    ],
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqSchema(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}

export function serviceSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Private Dog Boarding",
    provider: {
      "@type": "LocalBusiness",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    serviceType: "Dog Boarding",
    areaServed: {
      "@type": "City",
      name: "Syracuse",
      containedInPlace: { "@type": "State", name: "New York" },
    },
    description:
      "Boutique private dog boarding with only 3 suites, owner always on-site, camera monitoring, and daily photo updates. Serving Syracuse and surrounding areas.",
    offers: [
      {
        "@type": "Offer",
        name: "Standard Suite",
        price: "65.00",
        priceCurrency: "USD",
        unitText: "per night",
      },
      {
        "@type": "Offer",
        name: "Deluxe Suite",
        price: "85.00",
        priceCurrency: "USD",
        unitText: "per night",
      },
      {
        "@type": "Offer",
        name: "Luxury Suite",
        price: "120.00",
        priceCurrency: "USD",
        unitText: "per night",
      },
    ],
  };
}
