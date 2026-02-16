#!/usr/bin/env node
const fs = require('fs');
const { chromium } = require('playwright');
const { injectAxe, checkA11y } = require('axe-playwright');

const BASE = process.argv[2] || 'http://localhost:3000';
const ROUTES = [
  '/', '/about', '/contact', '/book', '/dog', '/dog/calm', '/faq', '/gallery',
  '/policies', '/pricing', '/privacy', '/reviews', '/services/boarding',
  '/services/daycare', '/services/grooming', '/services/training', '/suites',
  '/auth/signin'
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const out = { base: BASE, scannedAt: new Date().toISOString(), results: [] };

  for (const route of ROUTES) {
    const url = BASE.replace(/\/$/, '') + route;
    try {
      console.log('Visiting', url);
      await page.goto(url, { waitUntil: 'networkidle' });
      await injectAxe(page);
      const results = await checkA11y(page, undefined, { detailedReport: true, detailedReportOptions: { html: true } });
      out.results.push({ route, url, violations: results.violations.length, results });
      console.log(`  Violations: ${results.violations.length}`);
    } catch (err) {
      console.error('  Error on', url, err && err.message);
      out.results.push({ route, url, error: String(err) });
    }
  }

  await browser.close();

  const outDir = 'docs/audit_logs';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(`${outDir}/PLAYWRIGHT_A11Y.json`, JSON.stringify(out, null, 2));

  // Create a short markdown summary
  const md = [];
  md.push('# Playwright accessibility scan');
  md.push(`- Base: ${out.base}`);
  md.push(`- Scanned at: ${out.scannedAt}`);
  md.push('');
  out.results.forEach(r => {
    if (r.error) md.push(`- ${r.route} — ERROR: ${r.error}`);
    else md.push(`- ${r.route} — Violations: ${r.violations}`);
  });
  fs.writeFileSync(`${outDir}/PLAYWRIGHT_A11Y.md`, md.join('\n'));

  console.log('\nPlaywright accessibility scan complete — results written to docs/audit_logs');
})();
