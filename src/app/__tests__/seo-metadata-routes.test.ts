import { describe, expect, it } from "vitest";
import robots from "../robots";
import sitemap from "../sitemap";

describe("SEO metadata routes", () => {
  it("returns robots contract with sitemap", () => {
    const data = robots();
    expect(data.rules).toEqual({ userAgent: "*", allow: "/" });
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
      ])
    );
  });
});
