# Issue 65 Local Growth Engine Evidence

Date: 2026-05-05

## Scope

Implemented a conversion-safe local SEO growth engine for Syracuse-area dog boarding intent coverage.

## SEO Score Targets

| Target | Evidence | Status |
| --- | --- | --- |
| Local route coverage | 6 local landing pages in sitemap, including Syracuse pillar and 5 supporting city pages | Pass |
| Indexability | Robots allows `/` and does not disallow any local growth route | Pass |
| Canonical strategy | Local metadata generated from `src/lib/seo.ts` with absolute canonicals on the Syracuse pillar and dynamic location pages | Pass |
| Schema coverage | LocalBusiness, Service, FAQPage, and BreadcrumbList emitted for every local growth landing page | Pass |
| Conversion funnel | Local pages link to `/book`, `/pricing`, `/suites`, and `/faq` | Pass |
| Regression protection | Vitest route-health contract covers sitemap, robots, metadata uniqueness, keyword map, canonical, schema, and funnel links | Pass |

## Keyword-To-Route Map

| Primary Keyword | Route | Supporting Keywords |
| --- | --- | --- |
| dog boarding Syracuse NY | `/dog-boarding-syracuse` | private dog boarding Syracuse; small-capacity dog boarding Syracuse; overnight dog boarding Syracuse; Syracuse dog boarding prices |
| dog boarding Liverpool NY | `/locations/liverpool-ny` | private dog boarding Liverpool NY; overnight dog boarding near Liverpool; Liverpool NY dog boarding prices |
| dog boarding Cicero NY | `/locations/cicero-ny` | private dog boarding Cicero NY; small dog boarding Cicero; overnight boarding near Cicero NY |
| dog boarding Baldwinsville NY | `/locations/baldwinsville-ny` | private dog boarding Baldwinsville; overnight dog boarding Baldwinsville NY; Baldwinsville dog boarding prices |
| dog boarding Fayetteville NY | `/locations/fayetteville-ny` | private dog boarding Fayetteville NY; small-capacity dog boarding Fayetteville; overnight dog boarding near Fayetteville |
| dog boarding Manlius NY | `/locations/manlius-ny` | private dog boarding Manlius NY; overnight dog boarding Manlius; Manlius dog boarding prices |

## Indexability Evidence

- `src/app/sitemap.ts` now uses `publicSeoRoutes` from `src/lib/seo.ts` and emits canonical production URLs under `https://zainesstayandplay.com`.
- `src/app/robots.ts` points to `https://zainesstayandplay.com/sitemap.xml` and blocks private/system areas only: `/api/`, `/dashboard/`, `/admin/`, `/auth/`, `/book/confirmation`, `/_next/`, `/static/`, and `/preview-themes/`.
- Local growth routes are intentionally omitted from robots disallow rules.
- `/locations` is a crawlable hub linking to all supporting local pages.
- Header navigation exposes the local growth section under Locations; footer links expose the Syracuse pillar and service-area hub.

## Regression Checks Run

- `pnpm vitest run src/app/__tests__/seo-metadata-routes.test.ts` - 8 tests passed.
- `pnpm typecheck` - passed.
- `pnpm lint` - passed.
- `pnpm run format:check` - not clean globally due to pre-existing formatting drift in 80 unrelated files; issue 65 touched files were formatted with Prettier 3.6.2.

## Touched Files

- `src/lib/seo.ts`
- `src/components/local-growth-page.tsx`
- `src/app/dog-boarding-syracuse/page.tsx`
- `src/app/locations/page.tsx`
- `src/app/locations/[slug]/page.tsx`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/config/site.ts`
- `src/components/site-footer.tsx`
- `src/app/__tests__/seo-metadata-routes.test.ts`
