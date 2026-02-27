# Operational Runbook

> **Version:** 1.0.0 | **Updated:** 2026-02-25
> **Audience:** On-call engineers, SREs, Incident Commanders

---

## Table of Contents

1. [Service Overview](#service-overview)
2. [Health Checks](#health-checks)
3. [Common Incidents](#common-incidents)
4. [Rollback Procedures](#rollback-procedures)
5. [Square API Issues](#square-api-issues)
6. [Deployment Procedures](#deployment-procedures)
7. [Workflow Runbook](#workflow-runbook)

---

## Service Overview

| Component | Technology              | Hosting          | Health Endpoint    |
| --------- | ----------------------- | ---------------- | ------------------ |
| Frontend  | Next.js 16 (App Router) | Vercel           | `/api/health`      |
| Payments  | Square Web Payments SDK | Square (managed) | Square Status Page |
| Database  | Square (managed)        | Square           | N/A (API-based)    |
| CDN       | Vercel Edge Network     | Vercel           | Vercel Status Page |
| Images    | Square CDN / S3         | AWS              | N/A                |

### Key URLs

- **Production:** https://funkytowncomics.com
- **Staging:** https://staging.funkytowncomics.com
- **Vercel Dashboard:** https://vercel.com/team/funkytown
- **Square Dashboard:** https://squareup.com/dashboard
- **Sentry:** https://sentry.io/organizations/funkytown

---

## Health Checks

### Manual Health Check

```bash
# Check application health
curl -s https://funkytowncomics.com/api/health | jq .

# Check Square API connectivity
curl -s https://funkytowncomics.com/api/health/square | jq .

# Check build status
curl -s https://api.vercel.com/v6/deployments?projectId=$PROJECT_ID -H "Authorization: Bearer $VERCEL_TOKEN" | jq '.deployments[0].state'
```

### Automated Monitoring

| Monitor     | Tool                 | Frequency  | Alert Channel |
| ----------- | -------------------- | ---------- | ------------- |
| Uptime      | Vercel / UptimeRobot | 1 min      | PagerDuty     |
| Error rate  | Sentry               | Real-time  | Slack #alerts |
| Performance | Vercel Analytics     | Continuous | Slack #perf   |
| Square API  | Custom monitor       | 5 min      | PagerDuty     |

---

## Common Incidents

### INC-001: Site Down (500 Errors)

**Symptoms:** Users see 500 error pages, error rate spike in Sentry

**Diagnosis:**

1. Check Vercel deployment status
2. Check Sentry for error details
3. Check Square API status page
4. Check recent deployments

**Resolution:**

1. If bad deployment: Rollback via Vercel dashboard (instant)
2. If Square API down: Activate degraded mode banner, wait for Square resolution
3. If infrastructure: Check Vercel status page, file support ticket

**Prevention:** E2E tests in CI, canary deployments, health checks

---

### INC-002: Checkout Failures

**Symptoms:** Customers cannot complete purchases, payment errors in Sentry

**Diagnosis:**

1. Check Square API status
2. Check Sentry for specific error codes
3. Verify SQUARE_ACCESS_TOKEN is valid
4. Check network connectivity to Square APIs

**Resolution:**

1. If token expired: Rotate token in Vercel env vars, redeploy
2. If Square outage: Display maintenance banner, monitor Square status
3. If code bug: Hotfix → fast-track PR → deploy
4. If persistent: DNS rollback to Square Online (<5 min)

**Prevention:** Token rotation reminders, Square API health monitoring, fallback mode

---

### INC-003: Performance Degradation

**Symptoms:** Slow page loads, LCP >2s, user complaints

**Diagnosis:**

1. Check Vercel Analytics for timing breakdown
2. Check Vercel Edge function cold starts
3. Check Square API response times
4. Check for increased traffic (DDoS possibility)

**Resolution:**

1. If cold starts: Verify function configuration, check for large bundles
2. If Square API slow: Increase cache durations, implement stale-while-revalidate
3. If traffic spike: Vercel auto-scales, monitor costs
4. If code regression: Identify commit, rollback or hotfix

**Prevention:** Performance budgets in CI, Lighthouse CI, caching strategy

---

### INC-004: Data Sync Issues

**Symptoms:** Products showing wrong prices/availability, stale inventory

**Diagnosis:**

1. Check Square Dashboard for source of truth
2. Compare cached data with Square API response
3. Check revalidation schedules

**Resolution:**

1. Purge cache: Trigger ISR revalidation
2. If sync broken: Check Square webhooks, verify API connectivity
3. Manual correction: Update in Square Dashboard (source of truth)

**Prevention:** Webhook monitoring, cache TTL limits, periodic full sync

---

### INC-005: Security Incident

**Symptoms:** Suspicious activity, credential exposure, vulnerability report

**Immediate Actions (Do All):**

1. **Contain:** Revoke compromised credentials immediately
2. **Assess:** Determine scope of compromise
3. **Notify:** Alert Security Engineer and Incident Commander
4. **Document:** Begin incident timeline

**Resolution:**

1. Rotate ALL potentially compromised secrets
2. Audit access logs
3. Patch vulnerability
4. Communication to affected parties (if data breach)
5. Post-incident review within 48 hours

**Prevention:** Secrets scanning, dependency scanning, security reviews, penetration testing

---

## Rollback Procedures

### Option 1: Vercel Instant Rollback (Preferred)

```
1. Go to Vercel Dashboard → Deployments
2. Find last known good deployment
3. Click "..." → "Promote to Production"
4. Verify site is healthy
5. Time: ~30 seconds
```

### Option 2: Git Revert + Deploy

```bash
# Revert the problematic commit
git revert <commit-hash>
git push origin main

# Vercel auto-deploys from main
# Monitor deployment in Vercel dashboard
# Time: ~2-3 minutes
```

### Option 3: DNS Rollback to Square Online (Nuclear Option)

```
1. Go to DNS provider (Cloudflare/Vercel domains)
2. Change CNAME from Vercel to Square Online
3. Verify Square Online is serving traffic
4. Time: <5 minutes (DNS propagation may vary)
5. Note: File incident report after activation
```

### Rollback Decision Tree

```
Error rate >5%? → Vercel Instant Rollback
  ↓ Still broken?
Checkout broken? → DNS Rollback to Square Online
  ↓ Still broken?
Engage Incident Commander → War Room
```

---

## Square API Issues

### Token Rotation

```bash
# 1. Generate new token in Square Developer Dashboard
# 2. Update in Vercel:
#    Vercel Dashboard → Settings → Environment Variables
#    Update SQUARE_ACCESS_TOKEN for production
# 3. Trigger redeployment:
#    Vercel Dashboard → Deployments → Redeploy
# 4. Verify checkout works end-to-end
```

### Square API Rate Limits

| API       | Limit        | Strategy                 |
| --------- | ------------ | ------------------------ |
| Catalog   | 1000 req/min | Cache aggressively (ISR) |
| Orders    | 500 req/min  | Queue during spikes      |
| Payments  | 500 req/min  | No caching (real-time)   |
| Inventory | 100 req/min  | Cache with 5-min TTL     |

---

## Deployment Procedures

### Standard Deployment

```
1. PR merged to main
2. Vercel auto-deploys to production
3. Monitor Sentry + Analytics for 15 minutes
4. If issues: instant rollback
```

### Gradual Rollout (Major Changes)

```
1. Deploy behind feature flag (off)
2. Enable for 10% → monitor 24h
3. Enable for 25% → monitor 48h
4. Enable for 50% → monitor 72h
5. Enable for 100% → monitor 1 week
6. Remove feature flag
```

### Pre-Deployment Checklist

- [ ] All CI checks passing
- [ ] E2E tests passing on staging
- [ ] Performance budget met
- [ ] Rollback plan confirmed
- [ ] On-call engineer identified
- [ ] Monitoring dashboards open
- [ ] Runbook reviewed

---

## Workflow Runbook

### From idea → issue → branch → commits → PR → review → merge

1. **Create/select issue first**
  - Use `.github/ISSUE_TEMPLATE/work-item.yml`
  - Include problem statement, goals/non-goals, acceptance criteria, approach, risk, test plan, rollback plan
  - Add labels: one type (`bug|feature|chore|security|performance|docs|tech-debt`), one priority (`P0-P3`), one component (`component:*`)

2. **Create issue branch**
  - Naming: `feature/<issue-id>-slug` or `bugfix/<issue-id>-slug`
  - All implementation happens on that branch

3. **Review before coding**
  - Read issue acceptance criteria
  - Read existing PR context (if any)
  - Confirm implementation scope and test plan

4. **Commit early and often**
  - Commit after each coherent milestone
  - Use format: `<type>(<scope>): <imperative summary> (#<issue>)`
  - Keep branch in a buildable state whenever practical

5. **Open PR when divergence threshold is reached**
  - PR title format: `<type>(<scope>): <summary> (#<issue>)`
  - Body must include `Closes #<issue>`
  - Use `.github/pull_request_template.md`
  - Include how-to-test steps, risk notes, and checklist completion

6. **Run review gates before merge**
  - Author self-review
  - Independent reviewer-agent review (can block)
  - Tester-agent verification
  - Security review when relevant

7. **Merge only when Definition of Done passes**
  - Tests updated
  - Lint/typecheck pass
  - Docs updated
  - PR checklist complete
  - Issue acceptance criteria satisfied

8. **Emit final traceability summary**
  - Record: `Issue#`, `Branch`, `PR#`, commit list, time-to-first-commit, time-to-PR, review iterations

---

## Contacts

| Role               | Who            | Contact                |
| ------------------ | -------------- | ---------------------- |
| On-Call Primary    | Rotated weekly | PagerDuty              |
| Incident Commander | As escalated   | Slack #incidents       |
| Square Support     | Square Team    | Square Developer Forum |
| Vercel Support     | Vercel Team    | Vercel Support Portal  |
