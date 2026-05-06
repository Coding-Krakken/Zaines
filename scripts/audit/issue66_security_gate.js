#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const outDir = path.join(process.cwd(), "docs", "audit_logs");
fs.mkdirSync(outDir, { recursive: true });

function runAudit() {
  try {
    return execFileSync("npm", ["audit", "--omit=dev", "--json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    return error.stdout ? String(error.stdout) : "{}";
  }
}

function walkFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, files);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const auditJson = JSON.parse(runAudit());
const vulnerabilities = auditJson.metadata?.vulnerabilities ?? {};
const high = vulnerabilities.high ?? 0;
const critical = vulnerabilities.critical ?? 0;

const rawConsoleFindings = walkFiles(path.join(process.cwd(), "src", "app", "api"))
  .flatMap((file) => {
    const rel = path.relative(process.cwd(), file);
    const source = fs.readFileSync(file, "utf8");
    return source
      .split("\n")
      .map((line, index) => ({ rel, line, index: index + 1 }))
      .filter((item) => /console\.(log|warn|error|info)/.test(item.line));
  });

const summary = {
  scannedAt: new Date().toISOString(),
  npmAudit: {
    critical,
    high,
    moderate: vulnerabilities.moderate ?? 0,
    low: vulnerabilities.low ?? 0,
    total: vulnerabilities.total ?? 0,
  },
  apiConsoleFindings: rawConsoleFindings,
  pass: critical === 0 && high === 0 && rawConsoleFindings.length === 0,
};

fs.writeFileSync(
  path.join(outDir, "ISSUE66_SECURITY_GATE.json"),
  JSON.stringify(summary, null, 2),
);

const md = [
  "# Issue 66 Security Gate",
  `- Scanned at: ${summary.scannedAt}`,
  `- Result: ${summary.pass ? "PASS" : "FAIL"}`,
  `- npm audit critical/high: ${critical}/${high}`,
  `- npm audit moderate/low: ${summary.npmAudit.moderate}/${summary.npmAudit.low}`,
  `- Raw console usage in src/app/api: ${rawConsoleFindings.length}`,
  "",
  rawConsoleFindings.length
    ? rawConsoleFindings.map((finding) => `- ${finding.rel}:${finding.index}`).join("\n")
    : "No raw API console logging found.",
];
fs.writeFileSync(path.join(outDir, "ISSUE66_SECURITY_GATE.md"), md.join("\n"));

if (!summary.pass) {
  console.error("Issue 66 security gate failed. See docs/audit_logs/ISSUE66_SECURITY_GATE.json");
  process.exit(1);
}

console.log("Issue 66 security gate passed.");
