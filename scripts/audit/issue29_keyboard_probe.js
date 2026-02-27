#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const { chromium } = require("@playwright/test");

const base = process.argv[2] || "http://127.0.0.1:3000";
const routes = ["/", "/pricing", "/book", "/contact"];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    baseURL: base,
  });
  const page = await context.newPage();

  const walkthrough = [];

  for (const route of routes) {
    await page.goto(route, { waitUntil: "networkidle" });

    const focusTrail = [];
    for (let index = 0; index < 12; index += 1) {
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => {
        const element = document.activeElement;
        if (!element) return null;
        const role = element.getAttribute("role");
        const ariaLabel = element.getAttribute("aria-label");
        const text = (element.textContent || "").trim().slice(0, 60);
        const id = element.id || null;
        const tag = element.tagName.toLowerCase();
        const href = element.getAttribute("href");
        return { tag, role, ariaLabel, id, text, href };
      });
      focusTrail.push(focused);
    }

    const hasFocusableProgress = focusTrail.filter(Boolean).length >= 5;
    const hasCtaFocus = focusTrail.some(
      (item) =>
        item &&
        /book|reserve|meet/i.test(`${item.text || ""} ${item.ariaLabel || ""}`),
    );

    walkthrough.push({
      route,
      focusTrail,
      checks: {
        hasFocusableProgress,
        hasCtaFocus,
      },
    });
  }

  await context.close();
  await browser.close();

  fs.mkdirSync("docs/audit_logs", { recursive: true });
  fs.writeFileSync(
    "docs/audit_logs/issue29_keyboard_walkthrough.json",
    JSON.stringify(
      { base, scannedAt: new Date().toISOString(), routes, walkthrough },
      null,
      2,
    ),
  );
  console.log("WROTE docs/audit_logs/issue29_keyboard_walkthrough.json");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
