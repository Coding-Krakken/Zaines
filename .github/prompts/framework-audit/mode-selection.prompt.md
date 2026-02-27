# Framework Audit Mode Selection

> **Category:** Framework Audit
> **File:** `framework-audit/mode-selection.prompt.md`

---

## Purpose

Guide the user to select the appropriate audit mode (FAST, STANDARD, or THOROUGH) based on their needs, time constraints, and audit goals.

## When to Use

- Starting a framework audit
- User requests "audit framework health"
- After framework modernization changes
- Before major releases

## Inputs Required

- User's time availability
- Audit purpose (daily check, weekly audit, deep analysis)
- Recent framework changes (if any)

## Outputs Required

```markdown
## Audit Mode Selection

**Selected Mode:** [FAST|STANDARD|THOROUGH]

**Rationale:** [Why this mode was selected]

**Expected Duration:** [30 min | 2 hours | 6 hours]

**Tasks to Execute:** [5 | 12 | 30] synthetic tasks

**Metrics to Calculate:** [Subset | All 12 | All 12 + statistical analysis]

**User Approval:** ✅ Approved by [user name] at [timestamp]
```

## Workflow Steps

### 1. Ask User for Context

Present these questions:

```
🔍 Framework Audit Mode Selection

I can audit the framework in three modes:

**FAST Mode (30 minutes)**
- 5 synthetic tasks (quick health check)
- Subset of metrics (execution time, handoffs, completion rate)
- Ideal for: Daily CI checks, quick validation

**STANDARD Mode (2 hours)**
- 12 synthetic tasks (comprehensive coverage)
- All 12 performance metrics
- Ideal for: Weekly audits, pre-release validation

**THOROUGH Mode (6 hours)**
- 30 synthetic tasks (edge cases, stress tests)
- All 12 metrics + statistical analysis (P50, P95, P99)
- Ideal for: Monthly deep audits, post-framework changes

**Questions:**
1. What's your time availability? (30 min / 2 hours / 6 hours)
2. What's the audit purpose? (Daily check / Weekly audit / Deep analysis)
3. Have there been recent framework changes? (Yes / No / Don't know)
```

### 2. Recommend Mode Based on Context

**Recommend FAST if:**

- User has <1 hour available
- Audit purpose is "daily check" or "CI validation"
- No recent framework changes
- User wants quick confirmation framework is healthy

**Recommend STANDARD if:**

- User has 2-4 hours available
- Audit purpose is "weekly audit" or "pre-release"
- Minor framework changes (bug fixes, small features)
- First time running audit

**Recommend THOROUGH if:**

- User has 6+ hours available
- Audit purpose is "deep analysis" or "post-modernization"
- Major framework changes (routing redesign, agent consolidation)
- Previous audit found significant issues (grade D or F)

### 3. Get User Approval

```
**Recommended Mode:** STANDARD

**Why:** You have 2 hours available, this is a weekly audit, and there have been minor framework changes (handoff protocol v2).

**What will happen:**
1. Execute 12 synthetic tasks (various complexities, all agent types)
2. Monitor execution in real-time (timing, handoffs, failures)
3. Calculate 12 performance metrics
4. Generate comprehensive audit report
5. Create remediation plan (if issues found)

**Proceed with STANDARD mode?** (Yes / No / Choose different mode)
```

### 4. Record Selection

Document the selection with rationale and user approval timestamp.

## Quality Expectations

- User understands what each mode does
- Recommendation is justified based on context
- User explicitly approves before proceeding
- Selection is documented for audit trail

## Failure Cases

- User uncertain → Recommend STANDARD as safe default
- User wants custom mode → Explain only 3 modes available, pick closest match
- User has <30 min → Suggest running later when more time available

## Evidence Expectations

- Mode selection document (markdown)
- User approval timestamp
- Rationale for recommendation
- Context captured (time, purpose, recent changes)

---

## Example Output

```markdown
## Audit Mode Selection

**Selected Mode:** STANDARD

**Rationale:** User has 2 hours available, this is a weekly audit before release v1.5.0, and there have been minor framework changes (handoff protocol v2 implemented in Phase 2). STANDARD mode provides comprehensive coverage of all agent types and all 12 metrics without the time commitment of THOROUGH mode.

**Expected Duration:** 2 hours

**Tasks to Execute:** 12 synthetic tasks

- 2 trivial (docs, typos)
- 4 simple (single-file edits, test-only)
- 4 medium (multi-file features, API changes)
- 2 complex (architecture changes, security reviews)

**Metrics to Calculate:** All 12 metrics

1. Average execution time
2. Average handoff count
3. Express lane usage rate
4. Routing accuracy
5. Quality gate pass rate
6. Quality gate execution time
7. Handoff file size
8. Telemetry overhead
9. Task completion rate
10. Deadlock detection rate
11. Error rate
12. Agent utilization

**User Approval:** ✅ Approved by David at 2026-02-25T14:30:00

**Next Step:** Create audit plan with baseline capture and task selection.
```

---

## Handoff to Next Prompt

After mode selection, proceed to:

- **Next Prompt:** `framework-audit/audit-plan.prompt.md`
- **Input:** Selected mode (FAST/STANDARD/THOROUGH)
- **Task:** Create structured audit execution plan
