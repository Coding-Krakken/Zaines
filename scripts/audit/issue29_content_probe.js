#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { chromium, devices } = require("@playwright/test");

const base = process.argv[2] || "http://127.0.0.1:3000";
const routes = ["/", "/pricing", "/book", "/contact"];

async function run() {
  const outDir = path.join("docs", "audit_logs", "issue29_cta_snapshots");
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  const profiles = [
    { name: "desktop", viewport: { width: 1440, height: 900 } },
    { name: "mobile", device: devices["iPhone 13"] },
  ];

  const results = [];

  for (const profile of profiles) {
    const context = profile.device
      ? await browser.newContext({ ...profile.device, baseURL: base })
      : await browser.newContext({ viewport: profile.viewport, baseURL: base });

    const page = await context.newPage();

    for (const route of routes) {
      await page.goto(route, { waitUntil: "networkidle" });

      const ctaLocator = page
        .getByRole("link", { name: /book|meet\s*&\s*greet|reserve/i })
        .first();
      const buttonLocator = page
        .getByRole("button", { name: /book|meet\s*&\s*greet|reserve/i })
        .first();

      let ctaVisibleInViewport = false;
      let ctaText = null;

      if (await ctaLocator.count()) {
        ctaVisibleInViewport = await ctaLocator.isVisible();
        ctaText = await ctaLocator.innerText();
      } else if (await buttonLocator.count()) {
        ctaVisibleInViewport = await buttonLocator.isVisible();
        ctaText = await buttonLocator.innerText();
      }

      const heading = await page
        .locator("h1")
        .first()
        .textContent()
        .catch(() => null);
      const lead = await page
        .locator("main p")
        .first()
        .textContent()
        .catch(() => null);

      const safeRoute =
        route === "/" ? "home" : route.replace(/\//g, "_").replace(/^_/, "");
      const screenshotPath = path.join(
        outDir,
        `${profile.name}-${safeRoute}.png`,
      );
      await page.screenshot({ path: screenshotPath, fullPage: false });

      results.push({
        route,
        profile: profile.name,
        ctaVisibleInViewport,
        ctaText,
        fiveSecondSummarySignals: {
          heading: heading ? heading.trim() : null,
          leadSnippet: lead ? lead.trim().slice(0, 180) : null,
        },
        screenshot: screenshotPath.replace(/\\/g, "/"),
      });
    }

    await context.close();
  }

  await browser.close();

  const summary = {
    base,
    scannedAt: new Date().toISOString(),
    routes,
    results,
  };

  fs.writeFileSync(
    path.join("docs", "audit_logs", "issue29_content_probe.json"),
    JSON.stringify(summary, null, 2),
  );
  console.log("WROTE docs/audit_logs/issue29_content_probe.json");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
