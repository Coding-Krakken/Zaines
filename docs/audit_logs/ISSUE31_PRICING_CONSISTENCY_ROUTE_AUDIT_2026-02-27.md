# Issue #31 Pricing Consistency Route Audit (2026-02-27)

## Scope

- Issue: `#31`
- Slice: `I31-S3` (QA regression and evidence)
- Checkpoint: `CP1-route-policy-consistency`
- Required route set: `/`, `/pricing`, `/book`, `/contact`, `/reviews`, `/faq`, `/policies`
- Test source: `src/__tests__/issue31-pricing-consistency.test.ts`

## Command Executed

```bash
pnpm run test:app -- src/__tests__/issue31-pricing-consistency.test.ts
```

Supplemental machine-readable evidence:

```bash
pnpm exec vitest run src/__tests__/issue31-pricing-consistency.test.ts --reporter=json --outputFile=tmp/issue31-pricing-consistency-vitest.json
node -e "const fs=require('fs');const path=require('path');const routes=[{route:'/',file:'src/app/page.tsx'},{route:'/pricing',file:'src/app/pricing/page.tsx'},{route:'/book',file:'src/app/book/page.tsx'},{route:'/contact',file:'src/app/contact/page.tsx'},{route:'/reviews',file:'src/app/reviews/page.tsx'},{route:'/faq',file:'src/app/faq/page.tsx'},{route:'/policies',file:'src/app/policies/page.tsx'}];const required=['before confirmation','no hidden fees','no surprise add-ons','premium'];const forbidden=[/\bbudget\b/i,/\bdiscount\b/i,/hidden\s+fees?.{0,25}\bafter\b/i];const out=routes.map(r=>{const s=fs.readFileSync(path.join(process.cwd(),r.file),'utf8');const lower=s.toLowerCase();const missing=required.filter(c=>!lower.includes(c));const forbiddenHits=forbidden.filter(rx=>rx.test(s)).map(rx=>rx.toString());return {route:r.route,file:r.file,missingRequired:missing,forbiddenHits,pass:missing.length===0&&forbiddenHits.length===0};});const result={timestamp:new Date().toISOString(),total:out.length,passCount:out.filter(x=>x.pass).length,failCount:out.filter(x=>!x.pass).length,details:out};console.log(JSON.stringify(result,null,2));" | Tee-Object -FilePath tmp/issue31-pricing-consistency-route-audit-runtime.json
```

## Objective Results

- Total tests: `7`
- Passed: `7`
- Failed: `0`
- Status: `PASS`

## Route-by-Route Matrix

| Route | File | Result | Evidence |
|---|---|---|---|
| `/` | `src/app/page.tsx` | PASS | Required claims present; forbidden claims absent |
| `/pricing` | `src/app/pricing/page.tsx` | PASS | Required claims present; forbidden claims absent |
| `/book` | `src/app/book/page.tsx` | PASS | Required claims present; forbidden claims absent |
| `/contact` | `src/app/contact/page.tsx` | PASS | Required claims present; forbidden claims absent |
| `/reviews` | `src/app/reviews/page.tsx` | PASS | Current copy satisfies test policy gates |
| `/faq` | `src/app/faq/page.tsx` | PASS | Current copy satisfies test policy gates |
| `/policies` | `src/app/policies/page.tsx` | PASS | Required claims present; forbidden claims absent |

## CP1 Decision

- `CP1-route-policy-consistency`: **PASS**

## Validation Notes

- Runtime route-audit artifact confirms all required routes pass with zero forbidden claim hits:
	- `tmp/issue31-pricing-consistency-route-audit-runtime.json`

## Traceability

- AC-I31-001: **PASS**
- AC-I31-002: **PASS**
- AC-I31-004: **PASS**
