import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type RouteAuditCase = {
  route: string;
  file: string;
  requiredClaims: string[];
  forbiddenClaims: RegExp[];
};

const requiredClaimsForAllRoutes = [
  "before confirmation",
  "no hidden fees",
  "no surprise add-ons",
  "premium",
];

const forbiddenClaimsForAllRoutes = [
  /\bbudget\b/i,
  /\bdiscount\b/i,
  /hidden\s+fees?.{0,25}\bafter\b/i,
];

const routeAuditCases: RouteAuditCase[] = [
  {
    route: "/",
    file: "src/app/page.tsx",
    requiredClaims: requiredClaimsForAllRoutes,
    forbiddenClaims: forbiddenClaimsForAllRoutes,
  },
  {
    route: "/pricing",
    file: "src/app/pricing/page.tsx",
    requiredClaims: requiredClaimsForAllRoutes,
    forbiddenClaims: forbiddenClaimsForAllRoutes,
  },
  {
    route: "/book",
    file: "src/app/book/page.tsx",
    requiredClaims: requiredClaimsForAllRoutes,
    forbiddenClaims: forbiddenClaimsForAllRoutes,
  },
  {
    route: "/contact",
    file: "src/app/contact/page.tsx",
    requiredClaims: requiredClaimsForAllRoutes,
    forbiddenClaims: forbiddenClaimsForAllRoutes,
  },
  {
    route: "/reviews",
    file: "src/app/reviews/page.tsx",
    requiredClaims: requiredClaimsForAllRoutes,
    forbiddenClaims: forbiddenClaimsForAllRoutes,
  },
  {
    route: "/faq",
    file: "src/app/faq/page.tsx",
    requiredClaims: requiredClaimsForAllRoutes,
    forbiddenClaims: forbiddenClaimsForAllRoutes,
  },
  {
    route: "/policies",
    file: "src/app/policies/page.tsx",
    requiredClaims: requiredClaimsForAllRoutes,
    forbiddenClaims: forbiddenClaimsForAllRoutes,
  },
];

function readRouteSource(relativePath: string) {
  const absolutePath = path.join(process.cwd(), relativePath);
  return fs.readFileSync(absolutePath, "utf8").toLowerCase();
}

describe("Issue #31 CP1 route copy consistency", () => {
  for (const routeCase of routeAuditCases) {
    it(`enforces required and forbidden pricing policy copy for ${routeCase.route}`, () => {
      const source = readRouteSource(routeCase.file);

      for (const requiredClaim of routeCase.requiredClaims) {
        expect(
          source,
          `${routeCase.route} (${routeCase.file}) is missing required claim: ${requiredClaim}`,
        ).toContain(requiredClaim.toLowerCase());
      }

      for (const forbiddenClaim of routeCase.forbiddenClaims) {
        expect(
          source,
          `${routeCase.route} (${routeCase.file}) contains forbidden claim: ${forbiddenClaim}`,
        ).not.toMatch(forbiddenClaim);
      }
    });
  }
});
