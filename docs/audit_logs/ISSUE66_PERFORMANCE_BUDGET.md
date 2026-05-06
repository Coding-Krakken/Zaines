# Issue 66 Performance Budget
- Base: http://localhost:3000
- Measured at: 2026-05-06T11:53:29.237Z
- Result: PASS

| Route | Status | Load ms | DOM nodes | Encoded bytes | Script bytes | Style bytes | Violations |
|---|---:|---:|---:|---:|---:|---:|---|
| / | 200 | 2193 | 355 | 972922 | 902806 | 20409 | none |
| /book | 200 | 1266 | 269 | 249009 | 199369 | 300 | none |
| /pricing | 200 | 596 | 357 | 90386 | 41354 | 300 | none |
| /services/boarding | 200 | 626 | 471 | 54436 | 5100 | 300 | none |
| /dog | 200 | 532 | 320 | 167954 | 118314 | 300 | none |
| /auth/signin | 200 | 929 | 232 | 65588 | 15948 | 300 | none |