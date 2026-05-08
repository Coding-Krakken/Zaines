import { describe, expect, it } from "vitest";
import robots from "../robots";
import sitemap from "../sitemap";
import { metadata as homeMetadata } from "../page";
import { metadata as aboutMetadata } from "../about/page";
import { metadata as pricingMetadata } from "../pricing/layout";
import { metadata as bookMetadata } from "../book/layout";
import { metadata as contactMetadata } from "../contact/page";
import { generateMetadata as generateSyracuseMetadata } from "../dog-boarding-syracuse/page";
import {
  absoluteUrl,
  conversionFunnelLinks,
  keywordRouteMap,
  localGrowthPages,
  localGrowthSchemas,
  publicSeoRoutes,
} from "@/lib/seo";

function titleToString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "default" in value) {
    const withDefault = value as { default?: unknown };
    return typeof withDefault.default === "string" ? withDefault.default : "";
  }
  return "";
}

function getCanonical(metadata: { alternates?: unknown }) {
  const alternates = metadata.alternates as { canonical?: unknown } | undefined;
  return typeof alternates?.canonical === "string" ? alternates.canonical : "";
}

describe("SEO metadata routes", () => {
  it("returns robots contract with sitemap and keeps local growth routes indexable", () => {
    const data = robots();
    expect(data.rules).toEqual(
      expect.objectContaining({
        userAgent: "*",
        allow: "/",
        disallow: expect.arrayContaining([
          "/api/",
          "/dashboard/",
          "/admin/",
          "/auth/",
          "/book/confirmation",
          "/_next/",
          "/static/",
          "/preview-themes/",
        ]),
      }),
    );
    expect(data.sitemap).toBe("https://zainesstayandplay.com/sitemap.xml");

    const disallow = Array.isArray(data.rules)
      ? []
      : (data.rules.disallow ?? []);
    for (const page of localGrowthPages) {
      expect(disallow).not.toContain(page.route);
    }
  });

  it("returns sitemap contract with required urls", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toEqual(
      expect.arrayContaining([
        "https://zainesstayandplay.com/",
        "https://zainesstayandplay.com/about",
        "https://zainesstayandplay.com/pricing",
        "https://zainesstayandplay.com/book",
        "https://zainesstayandplay.com/contact",
        "https://zainesstayandplay.com/dog-boarding-syracuse",
        "https://zainesstayandplay.com/locations",
        "https://zainesstayandplay.com/locations/liverpool-ny",
      ]),
    );
    expect(urls).toHaveLength(
      new Set(publicSeoRoutes.map((r) => r.route)).size,
    );
  });

  it("enforces unique metadata on required pages", async () => {
    const syracuseMetadata = await generateSyracuseMetadata();
    const titles = [
      homeMetadata,
      aboutMetadata,
      pricingMetadata,
      bookMetadata,
      contactMetadata,
      syracuseMetadata,
    ].map((metadata) => titleToString(metadata.title));

    expect(new Set(titles).size).toBe(titles.length);
  });

  it("keeps required local-intent keyword alignment", async () => {
    const syracuseMetadata = await generateSyracuseMetadata();
    const descriptions = [
      homeMetadata,
      aboutMetadata,
      pricingMetadata,
      bookMetadata,
      contactMetadata,
      syracuseMetadata,
    ]
      .map((metadata) =>
        typeof metadata.description === "string"
          ? metadata.description.toLowerCase()
          : "",
      )
      .join(" ");

    expect(descriptions).toContain("syracuse dog boarding");
    expect(descriptions).toContain("private dog boarding syracuse");
    expect(descriptions).toContain("small dog boarding syracuse");
  });

  it("defines a keyword-to-route map for every local growth page", () => {
    expect(keywordRouteMap).toHaveLength(localGrowthPages.length);

    for (const page of localGrowthPages) {
      expect(keywordRouteMap).toContainEqual({
        keyword: page.primaryKeyword,
        route: page.route,
        supportingKeywords: page.secondaryKeywords,
      });
      expect(page.route).toMatch(/^\/dog-boarding-syracuse$|^\/locations\//);
      expect(page.metaDescription.length).toBeGreaterThanOrEqual(120);
      expect(page.metaDescription.length).toBeLessThanOrEqual(160);
    }
  });

  it("sets canonical metadata for the Syracuse pillar", async () => {
    const syracuseMetadata = await generateSyracuseMetadata();
    expect(getCanonical(syracuseMetadata)).toBe(
      absoluteUrl("/dog-boarding-syracuse"),
    );
  });

  it("covers LocalBusiness, Service, FAQ, and Breadcrumb schema", () => {
    for (const page of localGrowthPages) {
      const schemaTypes = localGrowthSchemas(page).map((schema) => {
        const typedSchema = schema as { "@type"?: string };
        return typedSchema["@type"];
      });

      expect(schemaTypes).toEqual(
        expect.arrayContaining([
          "LocalBusiness",
          "Service",
          "FAQPage",
          "BreadcrumbList",
        ]),
      );
    }
  });

  it("keeps local landing pages pointed at booking and pricing funnels", () => {
    expect(conversionFunnelLinks.map((link) => link.href)).toEqual(
      expect.arrayContaining(["/book", "/pricing", "/suites", "/faq"]),
    );
  });
});
