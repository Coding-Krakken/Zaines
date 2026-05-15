import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  breadcrumbSchema,
  faqSchema,
  findLocalGrowthPage,
  localBusinessSchema,
  localGrowthMetadata,
  localGrowthPages,
  localGrowthSchemas,
  seoBaseUrl,
  serviceSchema,
  syracusePillarRoute,
} from "../seo";

// ---------------------------------------------------------------------------
// absoluteUrl
// ---------------------------------------------------------------------------
describe("absoluteUrl", () => {
  it("returns base url plus '/' when called with no argument", () => {
    expect(absoluteUrl()).toBe(`${seoBaseUrl}/`);
  });

  it("returns full URL for a leading-slash path", () => {
    expect(absoluteUrl("/book")).toBe(`${seoBaseUrl}/book`);
  });

  it("normalizes a path missing its leading slash", () => {
    expect(absoluteUrl("pricing")).toBe(`${seoBaseUrl}/pricing`);
  });

  it("does not double-slash when base url has no trailing slash", () => {
    const url = absoluteUrl("/sitemap.xml");
    expect(url).toBe(`${seoBaseUrl}/sitemap.xml`);
    expect(url).not.toContain("//sitemap");
  });
});

// ---------------------------------------------------------------------------
// findLocalGrowthPage
// ---------------------------------------------------------------------------
describe("findLocalGrowthPage", () => {
  it("finds the Syracuse pillar by slug", () => {
    const page = findLocalGrowthPage("syracuse-ny");
    expect(page).toBeDefined();
    expect(page?.city).toBe("Syracuse");
    expect(page?.route).toBe(syracusePillarRoute);
  });

  it("finds a supporting city page by slug", () => {
    const page = findLocalGrowthPage("liverpool-ny");
    expect(page).toBeDefined();
    expect(page?.city).toBe("Liverpool");
    expect(page?.route).toMatch(/^\/locations\//);
  });

  it("returns undefined for an unknown slug", () => {
    expect(findLocalGrowthPage("unknown-city-xyz")).toBeUndefined();
  });

  it("returns undefined for an empty string", () => {
    expect(findLocalGrowthPage("")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// localGrowthMetadata
// ---------------------------------------------------------------------------
describe("localGrowthMetadata", () => {
  const page = localGrowthPages[0]; // Syracuse pillar

  it("sets title and description from page data", () => {
    const meta = localGrowthMetadata(page);
    expect(meta.title).toBe(page.title);
    expect(meta.description).toBe(page.metaDescription);
  });

  it("sets canonical URL to the absolute page route", () => {
    const meta = localGrowthMetadata(page);
    const canonical = (meta.alternates as { canonical?: string })?.canonical;
    expect(canonical).toBe(absoluteUrl(page.route));
  });

  it("sets OG type to website", () => {
    const meta = localGrowthMetadata(page);
    const openGraph = meta.openGraph as { type?: string } | undefined;
    expect(openGraph?.type).toBe("website");
  });

  it("sets Twitter card to summary_large_image", () => {
    const meta = localGrowthMetadata(page);
    const twitter = meta.twitter as { card?: string } | undefined;
    expect(twitter?.card).toBe("summary_large_image");
  });

  it("includes primary keyword in keywords list", () => {
    const meta = localGrowthMetadata(page);
    const keywords = meta.keywords as string[] | undefined;
    expect(keywords).toContain(page.primaryKeyword);
  });
});

// ---------------------------------------------------------------------------
// localBusinessSchema
// ---------------------------------------------------------------------------
describe("localBusinessSchema", () => {
  it("returns a LocalBusiness schema with required fields", () => {
    const schema = localBusinessSchema();
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("LocalBusiness");
    expect(schema["@id"]).toContain("localbusiness");
    expect(schema.name).toBeTruthy();
    expect(schema.telephone).toBeTruthy();
    expect(schema.address["@type"]).toBe("PostalAddress");
  });

  it("lists each service area city in areaServed", () => {
    const schema = localBusinessSchema();
    const servedNames = schema.areaServed.map((a) => a.name);
    expect(servedNames).toContain("Syracuse");
  });

  it("includes weekday and weekend opening hours", () => {
    const schema = localBusinessSchema();
    expect(schema.openingHoursSpecification).toHaveLength(2);
  });

  it("does not expose placeholder contact values", () => {
    const schema = localBusinessSchema();
    expect(schema.telephone).not.toContain("555-PAWS");
    expect(schema.email).not.toBe("hello@pawsandplaydaycare.com");
  });
});

// ---------------------------------------------------------------------------
// serviceSchema
// ---------------------------------------------------------------------------
describe("serviceSchema", () => {
  const page = localGrowthPages[0];

  it("returns a Service schema tied to the local business entity", () => {
    const schema = serviceSchema(page);
    expect(schema["@type"]).toBe("Service");
    expect(schema.provider["@id"]).toContain("localbusiness");
  });

  it("sets areaServed to the page city", () => {
    const schema = serviceSchema(page);
    expect(schema.areaServed.name).toBe(page.city);
    expect(schema.areaServed.addressRegion).toBe(page.region);
  });

  it("links offers to the pricing page", () => {
    const schema = serviceSchema(page);
    expect(schema.offers.url).toContain("/pricing");
    expect(schema.offers.priceCurrency).toBe("USD");
  });
});

// ---------------------------------------------------------------------------
// faqSchema
// ---------------------------------------------------------------------------
describe("faqSchema", () => {
  it("returns a FAQPage schema using default local FAQs", () => {
    const schema = faqSchema();
    expect(schema["@type"]).toBe("FAQPage");
    expect(schema.mainEntity.length).toBeGreaterThan(0);
    expect(schema.mainEntity[0]["@type"]).toBe("Question");
    expect(schema.mainEntity[0].acceptedAnswer["@type"]).toBe("Answer");
  });

  it("accepts and uses custom FAQ items", () => {
    const custom = [{ question: "Custom Q?", answer: "Custom A." }];
    const schema = faqSchema(custom);
    expect(schema.mainEntity).toHaveLength(1);
    expect(schema.mainEntity[0].name).toBe("Custom Q?");
    expect(schema.mainEntity[0].acceptedAnswer.text).toBe("Custom A.");
  });
});

// ---------------------------------------------------------------------------
// breadcrumbSchema
// ---------------------------------------------------------------------------
describe("breadcrumbSchema", () => {
  it("generates a BreadcrumbList with 1-based positions", () => {
    const schema = breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Locations", path: "/locations" },
    ]);
    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(schema.itemListElement).toHaveLength(2);
    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[1].position).toBe(2);
  });

  it("converts paths to absolute URLs", () => {
    const schema = breadcrumbSchema([{ name: "Home", path: "/" }]);
    expect(schema.itemListElement[0].item).toBe(absoluteUrl("/"));
  });

  it("handles a single-item list", () => {
    const schema = breadcrumbSchema([{ name: "About", path: "/about" }]);
    expect(schema.itemListElement).toHaveLength(1);
    expect(schema.itemListElement[0].name).toBe("About");
  });
});

// ---------------------------------------------------------------------------
// localGrowthSchemas — breadcrumb depth by page type
// ---------------------------------------------------------------------------
describe("localGrowthSchemas breadcrumb depth", () => {
  it("generates a 2-level breadcrumb for the Syracuse pillar page", () => {
    const pillar = localGrowthPages.find(
      (p) => p.route === syracusePillarRoute,
    )!;
    const schemas = localGrowthSchemas(pillar);
    const breadcrumb = schemas.find(
      (s) => (s as { "@type"?: string })["@type"] === "BreadcrumbList",
    ) as ReturnType<typeof breadcrumbSchema>;
    // Home → Syracuse pillar (no intermediate Locations level)
    expect(breadcrumb.itemListElement).toHaveLength(2);
  });

  it("generates a 3-level breadcrumb for supporting city pages", () => {
    const supporting = localGrowthPages.find((p) =>
      p.route.startsWith("/locations/"),
    )!;
    const schemas = localGrowthSchemas(supporting);
    const breadcrumb = schemas.find(
      (s) => (s as { "@type"?: string })["@type"] === "BreadcrumbList",
    ) as ReturnType<typeof breadcrumbSchema>;
    // Home → Locations → City page
    expect(breadcrumb.itemListElement).toHaveLength(3);
    expect(breadcrumb.itemListElement[1].name).toBe("Locations");
  });
});

// ---------------------------------------------------------------------------
// localGrowthPages data integrity
// ---------------------------------------------------------------------------
describe("localGrowthPages data integrity", () => {
  it("has exactly one Syracuse pillar page", () => {
    const pillars = localGrowthPages.filter(
      (p) => p.route === syracusePillarRoute,
    );
    expect(pillars).toHaveLength(1);
  });

  it("all supporting pages use /locations/ prefix", () => {
    const supporting = localGrowthPages.filter(
      (p) => p.route !== syracusePillarRoute,
    );
    for (const page of supporting) {
      expect(page.route).toMatch(/^\/locations\//);
    }
  });

  it("all slugs are unique", () => {
    const slugs = localGrowthPages.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("all routes are unique", () => {
    const routes = localGrowthPages.map((p) => p.route);
    expect(new Set(routes).size).toBe(routes.length);
  });
});
