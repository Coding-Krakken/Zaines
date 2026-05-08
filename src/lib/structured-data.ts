import { siteConfig } from "@/config/site";
import { getAdminSettings } from "@/lib/api/admin-settings";

export async function localBusinessSchema() {
  const settings = await getAdminSettings();
  const businessName = settings.businessProfileSettings.businessName;
  const socialLinks = settings.businessProfileSettings.socialLinks;
  const websiteProfile = settings.websiteProfileSettings;

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${websiteProfile.siteUrl}/#business`,
    name: businessName,
    description: websiteProfile.siteDescription,
    url: websiteProfile.siteUrl,
    telephone: settings.contactPhone,
    email: settings.contactEmail,
    priceRange: "$$",
    image: websiteProfile.ogImageUrl,
    logo: `${websiteProfile.siteUrl}/logo.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address,
      addressLocality: settings.city,
      addressRegion: settings.state,
      postalCode: settings.zip,
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
    sameAs: [socialLinks.facebook, socialLinks.instagram, socialLinks.twitter],
    areaServed: websiteProfile.serviceArea.map((city) => ({
      "@type": "City",
      name: city,
      containedInPlace: {
        "@type": "State",
        name: "New York",
      },
    })),
    hasMap: `https://maps.google.com/?q=${encodeURIComponent(
      `${settings.address}, ${settings.city}, ${settings.state} ${settings.zip}`
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

export async function serviceSchema() {
  const settings = await getAdminSettings();
  const businessName = settings.businessProfileSettings.businessName;
  const websiteProfile = settings.websiteProfileSettings;
  const pricing = settings.pricingSettings;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Private Dog Boarding",
    provider: {
      "@type": "LocalBusiness",
      name: businessName,
      url: websiteProfile.siteUrl,
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
        price: pricing.standardNightlyRate.toFixed(2),
        priceCurrency: pricing.currency,
        unitText: "per night",
      },
      {
        "@type": "Offer",
        name: "Deluxe Suite",
        price: pricing.deluxeNightlyRate.toFixed(2),
        priceCurrency: pricing.currency,
        unitText: "per night",
      },
      {
        "@type": "Offer",
        name: "Luxury Suite",
        price: pricing.luxuryNightlyRate.toFixed(2),
        priceCurrency: pricing.currency,
        unitText: "per night",
      },
    ],
  };
}
