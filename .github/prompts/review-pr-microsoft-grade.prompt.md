---
name: 'Review PR — Microsoft Grade, 110% Completion'
description: 'Run an exhaustive, comprehensive PR review with weighted domain scoring, strict 9/10 minimum gates, PR summary and TODO updates, and conditional auto-merge/post-merge verification. Use when: full PR audit, merge readiness decision, production-quality review.'
argument-hint: 'PR number or URL (e.g. 42 or https://github.com/org/repo/pull/42)'
agent: 'agent'
tools:
  [
    vscode,
    execute,
    read,
    agent,
    browser,
    edit,
    search,
    web,
    doist/todoist-ai/fetch,
    doist/todoist-ai/search,
    'github/*',
    todo,
    vscode.mermaid-chat-features/renderMermaidDiagram,
    github.vscode-pull-request-github/issue_fetch,
    github.vscode-pull-request-github/labels_fetch,
    github.vscode-pull-request-github/notification_fetch,
    github.vscode-pull-request-github/doSearch,
    github.vscode-pull-request-github/activePullRequest,
    github.vscode-pull-request-github/pullRequestStatusChecks,
    github.vscode-pull-request-github/openPullRequest,
    github.vscode-pull-request-github/create_pull_request,
    github.vscode-pull-request-github/resolveReviewThread,
  ]
---

# PR Review Prompt: Microsoft-Grade, Exhaustive, 110% Intent Fulfillment

You are acting as a Principal Engineer + Staff Reviewer performing a Microsoft-grade pull request review for PR `$ARGUMENTS`.

Your objective is not baseline correctness. Your objective is exceptional completion that exceeds the PR's original intent while staying aligned to product scope and architecture.

If the PR does not meet the required threshold, do not merge. Identify all gaps and create/refresh a concrete completion plan.

## Core Standard

- Every scored domain must be at least `9.0/10`.
- Overall weighted score must be at least `9.2/10`.
- CI/CD must be fully green.
- No unresolved review comments.
- No merge conflicts.
- PR summary must be fully updated.
- TODO and acceptance criteria must be reconciled (completed items checked off, missing work added).

If and only if all gates pass, complete merge flow and post-merge checks.

## Review Philosophy

- Be exhaustive and evidence-based.
- Prioritize correctness, risk reduction, operability, and long-term maintainability.
- Apply proportionate focus across domains using the weighted framework below.
- Prefer concrete, actionable findings over generic remarks.

## Phase 0: Intake And Context Lock

1. Load PR metadata: title, body, linked issues, files changed, commits, review threads, checks, conflict state.
2. Check out the PR branch using only `gh pr checkout <PR_NUMBER_OR_URL>`.
3. Do not use `git checkout`, `git switch`, or any other branch selection method. No other branch can be used for review execution work.
4. Even if the workspace appears to already be on the PR branch, still run `gh pr checkout <PR_NUMBER_OR_URL>` to guarantee correct branch targeting.
5. Summarize original PR intent in 5-10 bullets.
6. Read relevant repository guidance (`.github/copilot-instructions.md`, `docs/`, issue scope docs).
7. Identify impacted modules, runtime paths, data contracts, and tenants/compliance implications.

> CHECKOUT RULE (MANDATORY): The only allowed checkout command is `gh pr checkout <PR_NUMBER_OR_URL>`. Any other checkout approach is prohibited.

## Phase 1: Weighted Domain Scorecard (Baseline)

Score each domain from 1-10 and provide concrete evidence for each score.

| Domain                                     | Weight | Minimum | What 9-10 Means                                                                     |
| ------------------------------------------ | -----: | ------: | ----------------------------------------------------------------------------------- |
| Functional Correctness                     |    20% |     9.0 | All requirements, edge cases, failure paths, and regressions handled                |
| Architecture And Design Integrity          |    12% |     9.0 | Clean boundaries, no layering violations, aligns with architecture docs             |
| Security, Privacy, Compliance              |    12% |     9.0 | Input validation, authz/authn, secrets hygiene, tenant isolation, policy adherence  |
| Reliability And Performance                |    10% |     9.0 | Deterministic behavior on hot paths, acceptable latency, safe retries/timeouts      |
| Testing And Quality Engineering            |    12% |     9.0 | Meaningful unit/integration/e2e coverage, negative tests, deterministic CI behavior |
| Documentation And Developer Experience     |     8% |     9.0 | Updated docs, clear contracts, migration/runbook notes, onboarding clarity          |
| Project Management And Delivery Readiness  |    10% |     9.0 | Scope clarity, acceptance criteria traceability, TODO hygiene, release readiness    |
| CI/CD And Operational Readiness            |    10% |     9.0 | All checks green, deploy-safe, telemetry/observability adequate                     |
| Maintainability And Technical Debt Control |     6% |     9.0 | Readable, extensible, low-complexity implementation with justified tradeoffs        |

Compute and report:

- Per-domain score.
- Weighted overall score.
- Pass/Fail status per domain and globally.

## Phase 2: Gap Discovery (Fine-Grained)

Find everything still missing or improvable, including:

- Functional gaps and behavior mismatches with original intent.
- Unhandled edge cases and failure modes.
- Better implementation options (clarity, scalability, safety).
- Code quality opportunities (naming, decomposition, dead code, duplication).
- Contract/schema mismatches.
- Incomplete tests or weak assertions.
- Missing docs/changelog/runbook updates.
- PM hygiene gaps (acceptance criteria, checklist accuracy, release notes).

For each finding, include:

- Severity: Critical, High, Medium, Low.
- Domain impact.
- Why it matters.
- Exact remediation.
- Verification method.

## Phase 3: Execute Improvements Until All Gates Pass

1. Implement fixes in priority order (Critical -> High -> Medium -> Low).
2. Re-run targeted validations after each logical unit.
3. Re-score affected domains after each batch.
4. Continue until every domain reaches at least 9.0 and weighted score is at least 9.2.

Non-negotiable checks:

- Lint, typecheck, tests, and build all pass.
- No flaky behavior introduced.
- No unresolved conflicts/comments.
- No TODO drift.

## Phase 4: Update PR Summary And TODO/Acceptance Criteria

Update PR description with a structured section set:

1. Executive summary of what was reviewed and improved.
2. Final weighted scorecard table.
3. Merge status: `Ready` or `Not Ready`.
4. CI/CD status by check.
5. PR completion status: `% complete` and explicit blockers if any.
6. TODO checklist updates:
   - Check completed items.
   - Add newly discovered required tasks.
   - Remove stale or invalid tasks.
7. Acceptance criteria updates:
   - Mark satisfied criteria.
   - Add missing criteria discovered during review.
8. Residual risks and mitigation notes.

## Phase 5: Conditional Auto-Merge Workflow

Only if ALL are true:

- Every domain score >= 9.0.
- Weighted score >= 9.2.
- CI/CD is fully green.
- Zero unresolved review threads.
- No merge conflicts.
- PR summary and TODO/acceptance criteria updated.
- No remaining required work.

Then:

1. Merge PR using repository-preferred strategy.
2. Switch to `main`.
3. Sync local and remote (`fetch`, `pull --ff-only`).
4. Perform post-merge checks:
   - Confirm merge commit or squash commit landed on `main`.
   - Run quick smoke validations relevant to the PR scope.
   - Confirm default branch remains green.
5. Report `Merged` with post-merge validation evidence.

If any gate fails, do not merge and output `Not Ready` with a prioritized remediation checklist.

## Required Output Format

Return results in this order:

1. PR Intent Snapshot (bullets)
2. Baseline Scorecard Table (with weighted total)
3. Findings List (severity-ordered)
4. Actions Taken
5. Final Scorecard Table (with weighted total)
6. CI/CD Status Matrix
7. Merge Decision (`Merged` or `Not Ready`)
8. Updated TODO + Acceptance Criteria Delta
9. Post-Merge Check Results (only if merged)

## TelePhonesis-Specific Guardrails

Always enforce repository standards while reviewing and improving:

- Configuration-driven behavior; no hardcoded business logic.
- Multi-tenant safety and tenant-scoped data operations.
- Minimal real-time hot path; heavy work shifted async.
- Strong package boundaries and typed contracts.
- Validated tool execution with permissions and telemetry.
- Compliance-first outbound behavior (consent, DNC, call-window checks).
- Observability with correlation IDs and key metrics.

Do not claim completion unless objective evidence supports every gate.

================================================================================
MANDATORY EXECUTION REPORTING — NTFY PHONE NOTIFICATION (URGENT + VIBRATE)
================================================================================

At the end of this task ALWAYS send exactly ONE ntfy notification to my phone.

Goals:

- Lock screen: ultra-short gist (1–3 lines).
- Expanded: full structured executive report.
- Include repo + git context and quick change stats when available.

Rules:

1. Always send ONE notification (even if nothing changed).
2. Keep the lock-screen section short and scannable.
3. Always include NEXT ACTIONS.
4. If you’re blocked, say why + what I should do next.

Topic:
https://ntfy.sh/copilot-notifications

EXECUTE (copy/paste runnable):

REPO="$(git rev-parse --show-toplevel 2>/dev/null | xargs basename || echo N/A)"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo N/A)"
COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo N/A)"

# Prefer staged/working-tree stats; fall back to last commit if clean

CHANGE_SUMMARY="$(git diff --shortstat 2>/dev/null)"
if [ -z "$CHANGE_SUMMARY" ]; then
CHANGE_SUMMARY="$(git show --stat --oneline --format= 2>/dev/null | head -n 1 | sed 's/^ //')"
fi
if [ -z "$CHANGE_SUMMARY" ]; then
CHANGE_SUMMARY="No changes detected"
fi

curl -fsS -X POST "https://ntfy.sh/copilot-notifications" \
 -H "Title: 🚨 Copilot Update — ${REPO}" \
  -H "Priority: urgent" \
  -H "Tags: rotating_light,robot,rocket" \
  -H "Click: https://github.com" \
  -H "Markdown: yes" \
  -H "Sound: default" \
  -d "$(cat <<EOF

## ✅ Task Completed

**Repo:** \`${REPO}\`
**Scope:** <PR / Issue / Feature / Refactor / Fix>
**Outcome:** <ONE sentence: biggest achievement>
**Changes:** \`${CHANGE_SUMMARY}\`
**Next:** <ONE immediate next step>

---

## 📌 Executive Summary

### What was done

- <bullet>
- <bullet>
- <bullet>

### Files touched

- <path>
- <path>

### Quality checks

- Tests: <command> → <PASS/FAIL/SKIPPED>
- Lint: <command> → <PASS/FAIL/SKIPPED>
- Build: <command> → <PASS/FAIL/SKIPPED>

### Git context

- Branch: \`${BRANCH}\`
- Commit: \`${COMMIT}\`

### Risks / Notes

- <risk or note, or "None">

### Next actions (required)

1. <next step>
2. <next step>
3. <next step>

### High-value followups

- <optimization>
- <hardening>
  EOF
  )"
