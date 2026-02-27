# Pull Request

## Problem Statement / Context

<!-- Provide clear context on why this change is needed -->

**What problem does this solve?**

**What is the current behavior?**

**What is the new behavior?**

## Linked Issues

<!-- Use "Closes #<issue-number>" to auto-close issues when PR merges -->

Closes #

## Scope

**In Scope:**

- 

**Out of Scope:**

- 

## Change Summary

<!-- Bullet list of key changes -->

### Files Changed

- **Added:**
  - 
- **Modified:**
  - 
- **Removed:**
  - 

### Key Changes

1. 
2. 
3. 

## Design Notes / Key Decisions

<!-- Document significant architectural or design decisions -->

**Alternatives Considered:**

**Why This Approach:**

**Architectural Decision Records (ADRs) Created:**

- 

## Test Plan

<!-- Explicit commands and expected results -->

### Unit Tests

```bash
# Run unit tests

```

**Expected Result:**

### Integration Tests

```bash
# Run integration tests

```

**Expected Result:**

### E2E Tests

```bash
# Run end-to-end tests

```

**Expected Result:**

### Manual Testing

**Steps:**

1. 
2. 
3. 

**Expected Outcome:**

## Risk Assessment & Mitigations

**Risks Identified:**

| Risk | Likelihood (H/M/L) | Impact (H/M/L) | Mitigation |
|------|-------------------|----------------|------------|
|      |                   |                |            |

**Backward Compatibility:**

- [ ] No breaking changes
- [ ] Breaking changes documented below

**Database Migrations:**

- [ ] No migrations required
- [ ] Migrations included (documented below)

**Configuration Changes:**

- [ ] No config changes
- [ ] Config changes documented below

## Observability / Logging Changes

**New Metrics:**

**New Logs:**

**Alert Thresholds:**

## Performance Considerations

**Impact:**

- [ ] No performance impact expected
- [ ] Performance improvement expected
- [ ] Potential performance degradation (documented below)

**Load Testing Results:**

**Performance Budget:**

| Metric | Before | After | Budget | Status |
|--------|--------|-------|--------|--------|
| Lighthouse Performance |  |  | >90 | ✅/❌ |
| LCP |  |  | <1.2s | ✅/❌ |
| FID |  |  | <10ms | ✅/❌ |
| CLS |  |  | <0.05 | ✅/❌ |

## Security Considerations

**Security Impact:**

- [ ] No security impact
- [ ] Security enhancement
- [ ] Requires security review (tagged `security-review`)

**Secrets Management:**

- [ ] No secrets added
- [ ] Secrets added (documented in secure channel)

**Dependency Changes:**

- [ ] No new dependencies
- [ ] New dependencies added (security scanned)

**PII/Sensitive Data:**

- [ ] No PII handling changes
- [ ] PII handling documented

## Rollout Plan / Release Notes

**Gradual Rollout:**

- [ ] Not applicable (non-customer-facing)
- [ ] Deploy at once (low risk)
- [ ] Gradual rollout (10% → 25% → 50% → 100%)

**Feature Flags:**

**Rollback Plan:**

**Release Notes (Customer-Facing):**

```markdown
### [Type: Feature/Fix/Enhancement]

**Title:**

**Description:**

**Impact:**

**Action Required:**
```

## Pre-Merge Checklist

### Code Quality

- [ ] Linting passes (`npm run lint` or equivalent)
- [ ] Type checking passes (`npm run typecheck` or equivalent)
- [ ] All tests pass (`npm test` or equivalent)
- [ ] Test coverage ≥80%
- [ ] No hardcoded secrets
- [ ] No TODO/FIXME comments (or tracked in issues)

### Documentation

- [ ] README updated (if applicable)
- [ ] API documentation updated (if applicable)
- [ ] Inline code comments for complex logic
- [ ] Architecture diagrams updated (if applicable)
- [ ] `.customer/` documentation updated (if customer-facing)
- [ ] `.github/.developer/` documentation updated

### Business Owner Intent (Feature / Customer-Facing)

- [ ] Reviewed `.github/.system-state/model/business_owner_profile.zaine.yaml`
- [ ] Acceptance Criteria map to intent tags (BRAND|TRUST|SAFETY|PRICING|BOOKING)
- [ ] Slice plan maps to intent tags (BRAND|TRUST|SAFETY|PRICING|BOOKING)
- [ ] PR body lists satisfied intent tags
- [ ] Any unsatisfied tag has explicit rationale and follow-up issue

### Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated (if critical user journey)
- [ ] Test plan executed and verified

### Security

- [ ] Security scanning passed (Snyk/SonarQube)
- [ ] Dependency audit passed (Dependabot)
- [ ] Secrets scan passed (gitleaks)
- [ ] No PII in logs
- [ ] OWASP Top 10 considerations addressed

### Accessibility (if UI changes)

- [ ] Keyboard navigation tested
- [ ] Screen reader tested
- [ ] Color contrast validated (WCAG AA)
- [ ] Focus indicators visible

### Performance

- [ ] Performance budget met
- [ ] Lighthouse score >90 (if frontend changes)
- [ ] No unnecessary rerenders (React)
- [ ] Images optimized
- [ ] Bundle size checked

### Git/GitHub

- [ ] All commits follow conventional commit format
- [ ] Branch follows naming convention (`feature/issue#-description`)
- [ ] All changes committed and pushed
- [ ] No merge conflicts

## Reviewer Notes

**Areas of Focus:**

**Questions for Reviewers:**

**Specific Concerns:**

---

## Handoff History

<!-- Agents should append handoffs here during implementation -->

<details>
<summary>Agent Handoffs (Click to expand)</summary>

### [Agent Name] → [Next Agent] — [Timestamp]

**Status:** Done/Partial/Blocked

**Scope Completed:**
- 

**Key Decisions:**
- 

**Next Actions:**
- [ ] 

**Risks/Follow-ups:**
- 

**Links:**
- Commit: 
- CI Run: 

---

</details>
