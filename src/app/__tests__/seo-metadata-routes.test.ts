import { describe, expect, it } from "vitest";
import robots from "../robots";
import sitemap from "../sitemap";
import { metadata as homeMetadata } from "../page";
import { metadata as aboutMetadata } from "../about/page";
import { metadata as pricingMetadata } from "../pricing/layout";
import { metadata as bookMetadata } from "../book/layout";
import { metadata as contactMetadata } from "../contact/page";

function titleToString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "default" in value) {
    const withDefault = value as { default?: unknown };
    return typeof withDefault.default === "string" ? withDefault.default : "";
  }
  return "";
}

describe("SEO metadata routes", () => {
  it("returns robots contract with sitemap", () => {
    const data = robots();
    expect(data.rules).toEqual(
      expect.objectContaining({
        userAgent: "*",
        allow: "/",
        disallow: expect.arrayContaining([
          "/api/",
          "/dashboard/",
          "/auth/",
          "/book/confirmation",
          "/_next/",
          "/static/",
          "/preview-themes/",
        ]),
      }),
    );
    expect(data.sitemap).toBe("https://zaines.vercel.app/sitemap.xml");
  });

  it("returns sitemap contract with required urls", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toEqual(
      expect.arrayContaining([
        "https://zaines.vercel.app/",
        "https://zaines.vercel.app/about",
        "https://zaines.vercel.app/pricing",
        "https://zaines.vercel.app/book",
        "https://zaines.vercel.app/contact",
      ]),
    );
  });

  it("enforces unique metadata on required pages", () => {
    const titles = [
      homeMetadata,
      aboutMetadata,
      pricingMetadata,
      bookMetadata,
      contactMetadata,
    ].map((metadata) => titleToString(metadata.title));

    expect(new Set(titles).size).toBe(titles.length);
  });

  it("keeps required local-intent keyword alignment", () => {
    const descriptions = [
      homeMetadata,
      aboutMetadata,
      pricingMetadata,
      bookMetadata,
      contactMetadata,
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
});
