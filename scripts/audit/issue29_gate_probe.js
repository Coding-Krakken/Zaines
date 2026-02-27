#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");

const base = process.argv[2] || "http://127.0.0.1:3000";

const endpoints = [
  {
    name: "booking-success",
    url: `${base}/api/booking/availability`,
    method: "POST",
    body: {
      checkIn: "2026-03-10",
      checkOut: "2026-03-12",
      serviceType: "boarding",
      partySize: 1,
    },
  },
  {
    name: "booking-invalid-range",
    url: `${base}/api/booking/availability`,
    method: "POST",
    body: {
      checkIn: "2026-03-12",
      checkOut: "2026-03-10",
      serviceType: "boarding",
      partySize: 1,
    },
  },
  {
    name: "contact-success",
    url: `${base}/api/contact/submissions`,
    method: "POST",
    body: {
      fullName: "Morgan QA",
      email: "qa@example.com",
      message: "Need daycare details for next weekend and pricing options.",
      antiAbuseToken: "qa-token-issue29",
      idempotencyKey: "issue29-contact-qa-0001",
    },
  },
  {
    name: "auth-invalid-email",
    url: `${base}/api/auth/magic-link`,
    method: "POST",
    body: { email: "bad-email", intent: "sign_in" },
  },
];

function pickP95(samples) {
  const sorted = [...samples].sort((a, b) => a.ms - b.ms);
  const index = Math.max(0, Math.ceil(0.95 * sorted.length) - 1);
  return {
    p95: sorted[index].ms,
    min: sorted[0].ms,
    max: sorted[sorted.length - 1].ms,
  };
}

async function run() {
  const latency = [];

  for (const endpoint of endpoints) {
    const samples = [];
    for (let index = 0; index < 20; index += 1) {
      const requestBody =
        endpoint.name === "contact-success"
          ? {
              ...endpoint.body,
              idempotencyKey: `issue29-contact-qa-${index.toString().padStart(4, "0")}`,
            }
          : endpoint.body;

      const requestHeaders = {
        "content-type": "application/json",
        ...(endpoint.name === "contact-success"
          ? { "x-forwarded-for": `10.0.0.${index + 1}` }
          : {}),
      };

      const start = performance.now();
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
      });
      const end = performance.now();

      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      samples.push({
        ms: Number((end - start).toFixed(2)),
        status: response.status,
        payload,
      });
    }

    const { p95, min, max } = pickP95(samples);
    const statusCounts = {};
    for (const sample of samples) {
      statusCounts[sample.status] = (statusCounts[sample.status] || 0) + 1;
    }

    latency.push({
      name: endpoint.name,
      iterations: samples.length,
      p95Ms: p95,
      minMs: min,
      maxMs: max,
      statuses: statusCounts,
      schemaSample: samples[0].payload,
    });
  }

  const routeChecks = [];
  for (const path of ["/robots.txt", "/sitemap.xml"]) {
    const response = await fetch(`${base}${path}`);
    routeChecks.push({
      path,
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get("content-type") || "",
      sample: (await response.text()).slice(0, 200),
    });
  }

  const metadata = [];
  for (const path of ["/", "/pricing", "/book", "/contact"]) {
    const response = await fetch(`${base}${path}`);
    const html = await response.text();
    const title = (html.match(/<title>(.*?)<\/title>/i) || [])[1] || "";
    const description =
      (html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) ||
        [])[1] || "";
    const ctaMentionInInitialHtml = /book|meet\s*&\s*greet|reserve/i.test(
      html.slice(0, 12000),
    );

    metadata.push({
      path,
      status: response.status,
      title,
      description,
      ctaMentionInInitialHtml,
    });
  }

  fs.mkdirSync("docs/audit_logs", { recursive: true });
  fs.writeFileSync(
    "docs/audit_logs/issue29_latency_probe.json",
    JSON.stringify(latency, null, 2),
  );
  fs.writeFileSync(
    "docs/audit_logs/issue29_route_status_probe.json",
    JSON.stringify(routeChecks, null, 2),
  );
  fs.writeFileSync(
    "docs/audit_logs/issue29_metadata_probe.json",
    JSON.stringify(metadata, null, 2),
  );

  console.log("WROTE docs/audit_logs/issue29_latency_probe.json");
  console.log("WROTE docs/audit_logs/issue29_route_status_probe.json");
  console.log("WROTE docs/audit_logs/issue29_metadata_probe.json");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
