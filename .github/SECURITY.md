# Security Policy

> **Version:** 1.0.0 | **Updated:** 2026-02-25

---

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly:

1. **DO NOT** open a public GitHub issue
2. Email: security@funkytowncomics.com (or use GitHub Security Advisories)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (if any)

### Response SLA

| Severity | Acknowledgment | Resolution   |
| -------- | -------------- | ------------ |
| Critical | 4 hours        | 24 hours     |
| High     | 8 hours        | 72 hours     |
| Medium   | 24 hours       | 2 weeks      |
| Low      | 72 hours       | Next release |

---

## Security Architecture

### Trust Boundaries

```
┌─────────────────────────────────────────────────┐
│  CLIENT BROWSER (Untrusted)                      │
│  - No secrets, no PII storage                    │
│  - CSP enforced                                  │
│  - Square Payment iframe (isolated)              │
└──────────────────┬──────────────────────────────┘
                   │ HTTPS only
┌──────────────────▼──────────────────────────────┐
│  NEXT.JS EDGE / SERVER (Semi-trusted)            │
│  - Input validation (Zod) at all boundaries      │
│  - Rate limiting on API routes                   │
│  - Server-only secrets (env vars)                │
│  - Structured logging (no PII)                   │
└──────────────────┬──────────────────────────────┘
                   │ Authenticated API calls
┌──────────────────▼──────────────────────────────┐
│  SQUARE APIs (Trusted - External)                │
│  - Payment processing (PCI DSS compliant)        │
│  - Inventory management                          │
│  - Order management                              │
│  - Customer data (Square manages)                │
└─────────────────────────────────────────────────┘
```

### PCI Compliance

- **Scope:** SAQ A (fully delegated to Square)
- **Card data:** NEVER touches our servers
- **Payment flow:** Square Web Payments SDK → Square APIs
- **Prohibited:** Logging, storing, or transmitting card data

### Authentication & Authorization

- Square API: OAuth 2.0 with scoped access tokens
- Admin: Protected by environment-level access
- Customer: Managed by Square (if customer accounts enabled)

---

## Security Controls

### Input Validation

- All API route inputs validated with Zod schemas
- File uploads: type checking, size limits, sanitization
- URL parameters: validated and sanitized
- Query strings: validated against allowlists

### Output Encoding

- React auto-escapes JSX output
- No `dangerouslySetInnerHTML` without Security Engineer approval
- API responses: typed and validated
- Error messages: generic to users, detailed in logs

### Headers

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://js.squareup.com; connect-src 'self' https://connect.squareup.com; frame-src https://connect.squareup.com;
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

### Secrets Management

| Secret                | Storage              | Rotation      |
| --------------------- | -------------------- | ------------- |
| SQUARE_ACCESS_TOKEN   | Vercel env vars      | 90 days       |
| SQUARE_APPLICATION_ID | Vercel env vars      | On compromise |
| SQUARE_LOCATION_ID    | Vercel env vars      | N/A (static)  |
| NEXT*PUBLIC*\*        | Build-time injection | N/A           |

### Dependency Security

- Dependabot: Automatic PRs for vulnerable dependencies
- npm audit: Run in CI on every PR
- gitleaks: Secrets scanning in CI
- License review: Required for new dependencies

---

## Incident Response

See `.github/RUNBOOK.md` for detailed incident procedures.

### Severity Levels

| Level | Criteria                             | Response                                      |
| ----- | ------------------------------------ | --------------------------------------------- |
| SEV-1 | Data breach, payment compromise      | Immediate: all hands, notify affected parties |
| SEV-2 | Service down, checkout broken        | 15 min: on-call + incident commander          |
| SEV-3 | Degraded performance, partial outage | 1 hour: engineering team                      |
| SEV-4 | Minor bug, cosmetic issue            | Next business day                             |

---

## Compliance Checklist

- [x] PCI DSS: Delegated to Square (SAQ A)
- [ ] GDPR: Privacy by design implemented
- [x] HTTPS: Enforced via Vercel
- [x] CSP: Content Security Policy headers
- [x] Secrets: Environment variables only
- [x] Scanning: gitleaks + Dependabot in CI
- [ ] Penetration testing: Scheduled quarterly
- [ ] Security training: Team onboarding requirement

---

## Supported Versions

| Version          | Supported                |
| ---------------- | ------------------------ |
| Current (main)   | ✅                       |
| Previous release | ✅ (security fixes only) |
| Older            | ❌                       |
