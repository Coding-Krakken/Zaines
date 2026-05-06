# Launch Observability Plan

> **Version:** 1.0.0 | **Date:** May 6, 2026  
> **Issue:** #67 (Operational Launch Readiness)  
> **Owner:** SRE Engineer  
> **Status:** Pre-Launch Configuration

---

## Executive Summary

This document defines the observability strategy for Funky Town's staged rollout, ensuring real-time visibility into system health, customer experience, and business impact throughout all 4 phases and the 14-day monitoring period.

**Observability Stack:**
- **Logs:** Pino (structured JSON)
- **Metrics:** Vercel Analytics + Custom metrics
- **Errors:** Sentry
- **Tracing:** Correlation IDs (request level)
- **Dashboards:** Vercel, Sentry, Custom (Business metrics)

---

## Observability Architecture

### 1. Structured Logging Strategy

#### Log Ingestion

All application logs flow through Pino JSON logger:

```typescript
// Example: src/lib/logger.ts
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino/file',
    options: { destination: '/var/log/app.log' },
  },
})

// Structured log format (PII-redacted)
logger.info({
  timestamp: new Date().toISOString(),
  correlationId: request.correlationId,
  userId: redactUserId(request.userId),
  action: 'checkout_initiated',
  eventType: 'checkout',
  data: {
    cartValue: order.total,
    itemCount: order.items.length,
  },
  duration_ms: elapsed,
})
```

#### Log Levels (When to Use)

| Level | Threshold | Usage | Example |
|-------|-----------|-------|---------|
| **ERROR** | 100% | Exceptions, failed transactions, API errors | "Payment API returned 500" |
| **WARN** | 50% | Degraded performance, retries, timeouts | "Square API latency >1s" |
| **INFO** | 20% | Major events, phase transitions, orders | "Order #12345 completed" |
| **DEBUG** | 5% | Detailed flow, variable states (dev only) | "Cache hit for product ID 789" |

#### PII Redaction Rules

**NEVER log:**
- Full credit card numbers (delegated to Square)
- Full email addresses (redact to `user@...`)
- Full names (redact to initials + domain)
- Phone numbers (redact to `+1 *** *** 1234`)
- Addresses (redact to city + state)

**Safe to log:**
- Order amounts (no PII)
- Correlation IDs (tracking only)
- Error types and codes (no messages)
- Route names (no user data)
- Timestamps (no PII)

#### Correlation IDs

Every request gets a unique correlation ID for end-to-end tracing:

```typescript
// Express middleware
app.use((req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || uuidv4()
  res.setHeader('x-correlation-id', req.correlationId)
  next()
})

// Log every step with correlation ID
logger.info({ correlationId: req.correlationId, action: 'checkout_start' })
logger.info({ correlationId: req.correlationId, action: 'payment_processing' })
logger.info({ correlationId: req.correlationId, action: 'order_confirmed' })

// Enables tracing full customer journey through logs
```

### 2. Metrics Collection Strategy

#### Business Metrics (Tracked Every Transaction)

| Metric | Type | Unit | Frequency | Alert Threshold |
|--------|------|------|-----------|-----------------|
| **Orders Processed** | Counter | count | Real-time | N/A (informational) |
| **Revenue** | Gauge | USD | Hourly | <90% of baseline |
| **Conversion Rate** | Gauge | % | Hourly | <1.8% (Phase 3+) |
| **Checkout Success Rate** | Gauge | % | 5-min | <95% (SEV-1) |
| **Average Order Value** | Gauge | USD | Hourly | Trend only |
| **Cart Abandonment Rate** | Gauge | % | Hourly | Trend only |
| **Payment Decline Rate** | Gauge | % | Real-time | >1% above baseline |
| **Customer Support Tickets** | Counter | count | Hourly | >5% increase |

**Collection Method:**
```typescript
// src/lib/metrics.ts
export function trackOrder(order: Order) {
  metrics.counter('orders_processed', { success: true, phase: '3' })
  metrics.gauge('revenue_hourly', order.total)
  metrics.histogram('order_value', order.total)
  metrics.gauge('conversion_rate', calculateConversion())
}

export function trackCheckout(checkout: Checkout) {
  metrics.counter('checkout_attempt', { success: checkout.success })
  if (!checkout.success) {
    metrics.counter('checkout_failed', { reason: checkout.failureReason })
  }
}
```

#### Technical Metrics (System Health)

| Metric | Type | Unit | Frequency | SLO |
|--------|------|------|-----------|-----|
| **Error Rate** | Gauge | % | 5-min | <0.1% |
| **HTTP Error Rate** | Gauge | % (by status code) | 5-min | <0.1% (5xx), <0.5% (4xx) |
| **Latency P50** | Histogram | ms | Continuous | <500ms |
| **Latency P95** | Histogram | ms | Continuous | <1500ms |
| **Latency P99** | Histogram | ms | Continuous | <2500ms |
| **Time to Interactive** | Gauge | ms | Per page load | <2000ms |
| **Core Web Vitals:** | | | | |
| — LCP (Largest Contentful Paint) | Gauge | ms | Per page load | <1200ms |
| — FID (First Input Delay) | Gauge | ms | Per interaction | <100ms |
| — CLS (Cumulative Layout Shift) | Gauge | unitless | Per session | <0.1 |
| **Cache Hit Rate** | Gauge | % | 5-min | >80% |
| **Database Connections** | Gauge | count | 5-min | <80% of pool limit |
| **Memory Usage** | Gauge | MB | 5-min | <500MB |
| **CPU Usage** | Gauge | % | 5-min | <70% |

**Collection Method (Vercel Analytics):**
```typescript
// Automatic via Next.js Analytics
// No code required; Lighthouse runs on every deployment
```

**Collection Method (Custom Metrics):**
```typescript
// src/app/api/metrics/route.ts
export async function POST(req: Request) {
  const { event, value, metadata } = await req.json()
  
  // Send to custom metrics backend
  await metricsBackend.track({
    event,
    value,
    metadata,
    timestamp: new Date(),
    phase: getCurrentPhase(),
  })
  
  return Response.json({ ok: true })
}
```

#### Square API Metrics

| Metric | Type | Unit | Frequency | Alert |
|--------|------|------|-----------|-------|
| **Square API Response Time** | Histogram | ms | Per call | >1s = WARN |
| **Square API Error Rate** | Gauge | % | 5-min | >0.5% = SEV-2 |
| **Square API Timeout Rate** | Gauge | % | 5-min | >0.1% = SEV-1 |
| **Catalog Sync Lag** | Gauge | seconds | 5-min | >60s = WARN |
| **Inventory Sync Failure Rate** | Gauge | % | 5-min | >10% = SEV-1 |

**Collection Method:**
```typescript
// src/lib/square.ts (wrapper around Square SDK)
export async function callSquareAPI(method: string, params: any) {
  const start = Date.now()
  try {
    const result = await squareClient[method](params)
    metrics.histogram('square_api_latency', Date.now() - start, { method })
    metrics.counter('square_api_success', { method })
    return result
  } catch (error) {
    metrics.counter('square_api_error', { method, reason: error.code })
    metrics.gauge('square_api_error_rate', calculateErrorRate())
    throw error
  }
}
```

### 3. Error Tracking via Sentry

#### Sentry Configuration

```javascript
// next.config.ts or sentry.server.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 0.1,  // Sample 10% of transactions
  integrations: [
    new Sentry.Replay({ maskAllText: true, blockAllMedia: true }),
  ],
  beforeSend(event, hint) {
    // Redact PII before sending
    if (event.request?.url) {
      event.request.url = redactUrl(event.request.url)
    }
    if (event.user?.email) {
      event.user.email = redactEmail(event.user.email)
    }
    return event
  },
})
```

#### Error Grouping Rules

| Pattern | Grouping | Rationale |
|---------|----------|-----------|
| `Square API Error: 429` | Group all rate-limit errors together | Detect rate-limit patterns |
| `Network Timeout` | Group by endpoint | Separate per-endpoint timeout analysis |
| `Checkout Failed` | Group by failure reason (payment, validation, etc.) | Separate checkout issues by root cause |
| `Memory exhausted` | Single group | Critical incident |

#### Alert Rules in Sentry

- **New issue detected** → Slack #alerts + #launches
- **Issue frequency spike** (2x normal) → Slack #alerts
- **Critical severity** (error_code=CRITICAL) → PagerDuty + Slack
- **Checkout-related errors** → Slack #launches + Product Owner

#### PII Scrubbing

Sentry configuration automatically redacts:
- Credit card patterns (even though PCI delegated to Square)
- Email addresses
- Phone numbers
- IP addresses
- Cookies and authentication headers

### 4. Dashboard Configuration

#### Executive Dashboard (Stakeholder View)

**URL:** https://vercel.com/team/funkytown/launches/phase-X

**Widgets Displayed:**
1. **Status Summary** (Big number: HEALTHY / WARNING / CRITICAL)
2. **Traffic Phase** (Current: 10% | Phase 1/4)
3. **Key Metrics (Big Numbers):**
   - Error Rate: 0.08% (Target: <0.1%) ✅
   - Checkout Success: 99.7% (Target: >99%) ✅
   - P95 Latency: 1.2s (Target: <1.5s) ✅
   - Revenue (24h): $5,800 (Baseline: $5,250) 📈
4. **Incident Log** (Last 5 incidents, if any)
5. **Alerts Active** (Count of open SEV-1/2 alerts)
6. **Trend Charts** (24h revenue, error rate trend)

#### Technical Dashboard (Engineer View)

**URL:** https://sentry.io/organizations/funkytown/launches/phase-X

**Widgets:**
1. **Error Rate by Endpoint** (Bar chart, top 10)
2. **Latency Distribution** (P50/P95/P99 sparkline)
3. **Sentry Error Stream** (Live, real-time)
4. **Database Metrics** (Connection pool, query latency)
5. **Memory/CPU** (Trend + alerts)
6. **Square API Health** (Response time + error rate)
7. **Recent Incidents** (Timeline)

#### Business Dashboard (Product View)

**URL:** Analytics tool (internal or third-party)

**Widgets:**
1. **Orders Processed** (Hourly count, trend vs baseline)
2. **Revenue** (Hourly, cumulative, vs budget)
3. **Conversion Rate** (% of visitors → order, vs 2% target)
4. **Cart Abandonment** (% carts not completed)
5. **Customer Feedback** (Sentiment, ticket volume)
6. **Top Issues** (Most common customer complaints)

---

## Request Tracing via Correlation IDs

### Flow Example

```
1. User initiates checkout
   → Browser generates UUID: abc-123-def
   → Set header: X-Correlation-ID: abc-123-def

2. Request hits Next.js API
   → Middleware captures: abc-123-def
   → Logger includes in all logs: "correlationId": "abc-123-def"
   → Response header: X-Correlation-ID: abc-123-def

3. API calls Square
   → Include header: X-Correlation-ID: abc-123-def
   → Square logs transaction under same ID

4. Order confirmation email
   → Include ID in email: "Order ref: abc-123-def"
   → Customer can reference in support tickets

5. Post-incident analysis
   → Search logs by ID: grep "abc-123-def" /var/log/app.log
   → See full journey: init → payment → confirmation → email
   → Trace any errors across all systems
```

### Implementation Checklist

- [ ] Correlation ID generation on client
- [ ] Correlation ID capture in API middleware
- [ ] Correlation ID inclusion in all logs
- [ ] Correlation ID sent to Square (if possible)
- [ ] Correlation ID visible in Sentry error grouping
- [ ] Customer support uses ID for ticket correlation

---

## SLO Definitions & Tracking

### Service Level Objectives (SLOs)

**Uptime SLO:** 99.9%
- Monthly allowance: ~43 minutes downtime
- Tracked per phase via health check endpoint

**Checkout Success SLO:** >99%
- Definition: (completed transactions / initiated transactions) × 100%
- Tracked per hour, aggregated per phase

**Error Rate SLO:** <0.1%
- Definition: (5xx errors / total requests) × 100%
- Tracked per 5-minute window, alerted if exceeded for >5 min

**Latency SLO:** P95 <1.5s
- Definition: 95th percentile of response times
- Tracked per route, aggregated per phase
- Alerted if P95 >3s for 5 consecutive minutes

**Conversion Rate SLO:** >2.0%
- Definition: (completed orders / site visitors) × 100%
- Tracked per 24-hour period (not real-time)
- Target by Phase 4 stabilization

### SLO Tracking Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│ PHASE 3 (50% traffic): Hours 42-66 of 72                    │
├──────────────────────────────────────────────────────────────┤
│ UPTIME:        99.94%  ✅ (within SLO)                       │
│ CHECKOUT:      99.6%   ✅ (within SLO)                       │
│ ERROR RATE:    0.08%   ✅ (within SLO)                       │
│ LATENCY P95:   1.18s   ✅ (within SLO)                       │
│ CONVERSION:    1.92%   ⚠️  (trending toward 2% target)      │
├──────────────────────────────────────────────────────────────┤
│ Phase Gate: Approve Phase 4 transition? → YES (all metrics OK) │
└──────────────────────────────────────────────────────────────┘
```

---

## Monitoring Schedule

### During Staged Rollout (Phases 1-4)

| Time | Activity | Owner | Frequency |
|------|----------|-------|-----------|
| Continuous | Alert monitoring | On-call engineer | 24/7 |
| Every 5 min | Metric checks (automated) | Monitoring stack | Continuous |
| Every 15 min | Dashboard review | On-call team | Phase 1-3 |
| Every 2 hours | Metrics snapshot | SRE Engineer | Snapshot log |
| Every 6 hours | Leadership update | Incident Commander | Sync in Slack |
| Phase transition | Gate criteria validation | SRE + Tech Lead | At each transition |

### During 14-Day Post-Launch Monitoring (Phase 4)

| Time | Activity | Owner | Frequency |
|------|----------|-------|-----------|
| Continuous | Alert monitoring | On-call engineer | 24/7 |
| Daily @ 9 AM | Executive review | SRE Engineer + Product Owner | Daily |
| Daily @ 3 PM | Technical review | Tech Lead + Backend Engineer | Daily |
| Weekly | Trending analysis | SRE Engineer | Weekly |
| End of Day 14 | Final sign-off | Quality Director | Once |

---

## Observability Readiness Checklist

- [ ] Pino logger configured with PII redaction
- [ ] Correlation ID middleware implemented
- [ ] All API endpoints emit structured logs
- [ ] Business metrics instrumented (orders, revenue, conversion)
- [ ] Technical metrics instrumented (latency, errors, resources)
- [ ] Square API metrics tracked (response time, errors)
- [ ] Sentry project configured and PII scrubbing enabled
- [ ] Vercel Analytics enabled for Core Web Vitals
- [ ] Executive dashboard created and accessible
- [ ] Technical dashboard created and accessible
- [ ] Business dashboard created and accessible
- [ ] SLO tracking dashboard configured
- [ ] Alert rules configured in Sentry + PagerDuty
- [ ] Slack channels (#launches, #alerts, #perf) created
- [ ] On-call schedule confirmed
- [ ] Monitoring drill completed (alerts fired successfully)
- [ ] Team trained on dashboard navigation

---

## References

- [`.github/.system-state/ops/launch_alert_config.yaml`](.github/.system-state/ops/launch_alert_config.yaml) — Alert rules and thresholds
- [`.github/framework-config/slo-thresholds.yaml`](.github/framework-config/slo-thresholds.yaml) — SLO definitions
- [`.github/.system-state/ops/launch_exposure_plan.yaml`](.github/.system-state/ops/launch_exposure_plan.yaml) — Staged rollout plan
- [`docs/LAUNCH_INCIDENT_RUNBOOKS.md`](docs/LAUNCH_INCIDENT_RUNBOOKS.md) — Incident response procedures
- [`docs/POST_LAUNCH_MONITORING_PLAN.md`](docs/POST_LAUNCH_MONITORING_PLAN.md) — 14-day monitoring strategy

---

**✅ Observability stack READY for launch when all checklist items completed.**
