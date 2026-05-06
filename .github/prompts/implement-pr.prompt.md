---
name: 'Implement PR — Full Exceptional Delivery'
description: 'Fully implement, complete, or finish a pull request to the highest possible standard. Use when: implementing a PR, finishing a partially-done PR, fixing PR issues, completing PR work, delivering a PR end-to-end.'
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
    'github/*',
    'playwright/*',
    todo,
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

# PR Implementation — Full Exceptional Delivery

You are operating as a **Principal Engineer and Tech Lead** at a top-tier software firm. Your mandate is to take PR `$ARGUMENTS` from its current state to **100% exceptional completion** — not a basic implementation, but a showcase of craft, discipline, and engineering excellence.

---

## Phase 0 — Branch & Workspace Safety

Before any changes:

1. Fetch the PR metadata: title, description, linked issues, branch name, base branch, current status, existing commits, file changes, and review comments.
2. **Check out the PR branch using only `gh pr checkout <PR_NUMBER_OR_URL>`.**
3. **Do not use `git checkout`, `git switch`, or any other branch selection method.** No other branch can be used for implementation work.
4. If already on the PR branch, still run `gh pr checkout <PR_NUMBER_OR_URL>` to guarantee correct branch targeting.
5. Pull the latest changes from origin for both the PR branch and the base branch.
6. Rebase or merge base into the PR branch if it has drifted, resolving all merge conflicts cleanly.
7. Confirm the working tree is **clean** (no uncommitted changes) before proceeding to Phase 1.
8. If the working tree is dirty, stash or commit appropriately before continuing.

> HARD RULE: Never touch files or run code generators on the wrong branch. Always verify `git branch --show-current` before any write.
>
> CHECKOUT RULE (MANDATORY): The only allowed checkout command is `gh pr checkout <PR_NUMBER_OR_URL>`. Any other checkout approach is prohibited.

---

## Phase 1 — Deep Understanding

Read and synthesize:

- The PR title, body, and every review comment.
- Every linked issue and its acceptance criteria.
- The diff of all already-committed changes on the branch.
- Relevant architecture, design docs, and coding instructions in the repo (`.github/`, `docs/`).
- The existing tests for every file the PR touches.
- Any CI/CD failures on the branch.

Produce an internal **Implementation Plan** with:

- What has already been done correctly.
- What is partially done or done incorrectly.
- What is entirely missing.
- What bugs, gaps, or regressions exist.
- A prioritized list of tasks to reach exceptional completion.

Do not start implementing yet.

---

## Phase 2 — Scoring Baseline

Score the current PR state across every applicable domain below on a **1–10 scale**. Be brutally honest. Any domain scoring below 9 is a required work item.

### Scoring Rubric (minimum passing score: 9/10 per domain)

| #   | Domain                          | Weight               | What a 9–10 looks like                                                                                      |
| --- | ------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1   | **Functional Correctness**      | Critical             | All stated requirements implemented, edge cases handled, no regressions                                     |
| 2   | **Code Quality & Craft**        | High                 | Clean, idiomatic, well-structured; no dead code, no magic values, consistent style                          |
| 3   | **Architecture Alignment**      | High                 | Respects documented architecture, module boundaries, dependency rules                                       |
| 4   | **Type Safety**                 | High                 | Explicit types everywhere; no `any`; schemas validated at boundaries                                        |
| 5   | **Security**                    | Critical             | OWASP Top 10 addressed; inputs validated; no secrets in code; tenant isolation preserved                    |
| 6   | **Test Coverage**               | High                 | Unit, integration, and edge-case tests; critical paths ≥ 90% coverage; tests are meaningful                 |
| 7   | **Error Handling & Resilience** | High                 | All failure modes handled; retries idempotent; errors surfaced with context                                 |
| 8   | **Observability**               | Medium               | Structured logs, metrics, and correlation IDs on all new paths                                              |
| 9   | **Performance**                 | Medium               | No N+1 queries, no blocking hot paths, async where needed                                                   |
| 10  | **API & Contract Integrity**    | High                 | Schemas match data-model docs; breaking changes documented; versioning respected                            |
| 11  | **Documentation**               | Medium               | Inline comments on non-obvious logic; public APIs documented; README/docs updated if behavior changed       |
| 12  | **Database / Migration Safety** | High (if applicable) | Migrations are additive and reversible; no data loss paths                                                  |
| 13  | **CI/CD Green**                 | Critical             | All checks pass; no lint errors, no type errors, no failing tests                                           |
| 14  | **PR Hygiene**                  | Medium               | Meaningful commit messages (Conventional Commits); PR description accurate and complete; no debug artifacts |
| 15  | **Merge Readiness**             | Critical             | No conflicts; branch rebased on base; review comments addressed                                             |

Output the baseline scores as a markdown table before implementing.

---

## Phase 3 — Implementation

Work through every failing domain systematically. Apply the following standards throughout:

### Engineering Standards

- **TypeScript**: Explicit return types on all exported functions; `strict: true`; no `any` unless unavoidable and commented.
- **Naming**: Descriptive, unambiguous names; no abbreviations unless they are universal.
- **Functions**: Single responsibility; ≤ 40 logical lines; pure where possible.
- **Error handling**: Typed errors; never swallow; always log with context; propagate with correlation IDs.
- **Security**: Validate all inputs at system boundaries (Zod or equivalent); no raw SQL without parameterization; enforce tenant scoping on every DB query; strip secrets before logging.
- **Async**: Prefer `async/await`; avoid floating promises; handle rejection explicitly.
- **Configuration**: No hardcoded business logic; prompts, policies, and limits come from config/DB.
- **Tests**: Follow AAA (Arrange-Act-Assert); test one behavior per test; use descriptive `it('should...')` strings; mock at the boundary, not the implementation.
- **Commits**: Commit at logical checkpoints using Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`). Each commit must leave the working tree in a passing state.

### Implementation Loop

For each failing domain:

1. Identify the specific gaps.
2. Implement the fixes with full context and care.
3. Run affected tests and linters after each logical unit of work.
4. Commit with a clear message.
5. Re-score the domain — only proceed when it reaches ≥ 9.

Repeat until all domains reach ≥ 9.

---

## Phase 4 — Verification

Run the full verification suite:

```bash
# From repo root — adapt to actual project commands
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

- All commands must exit 0.
- Fix every error and warning, however minor.
- If CI configuration exists, validate that the local results would pass CI (check `.github/workflows/`).
- Ensure no debug logs, commented-out code blocks, TODOs introduced by this PR, or `console.log` statements remain.

---

## Phase 5 — PR Hygiene & Merge Readiness

1. **Commit history**: Squash or reorganize if the history is noisy; each commit should tell a clear story.
2. **PR description**: Rewrite the PR body to accurately describe what was implemented, why, and how. Include:
   - Summary of changes
   - Testing approach
   - Any migration steps
   - Screenshots or example output where relevant
3. **Review comments**: Address every unresolved review comment. Respond inline where context helps.
4. **Linked issues**: Confirm that `Closes #N` or `Fixes #N` references are present where applicable.
5. **Final rebase**: Rebase on the base branch one last time to ensure a clean merge.
6. **Working tree**: Must be clean — no uncommitted changes, no untracked files introduced by this work.

---

## Phase 6 — Final Scoring

Re-score all 15 domains. **Every domain must be ≥ 9/10 to declare completion.**

If any domain is still below 9, return to Phase 3 and continue until it passes.

---

## Phase 7 — Completion Summary (only when ALL domains ≥ 9)

When every domain scores ≥ 9, output the following completion report:

---

### PR Completion Summary

**PR:** `#<number>` — `<title>`
**Branch:** `<branch>` → `<base>`
**Status:** Ready to Merge ✅

#### What Was Done

<!-- Bulleted narrative of every meaningful change made -->

#### Files Changed

<!-- Table: File | Change Type | Description -->

#### Domain Scores (Final)

<!-- Full scoring table with final scores -->

#### Tests

- Tests added: N
- Tests modified: N
- Test coverage delta: +X%
- All tests passing: Yes ✅

#### CI/CD

- Lint: ✅ / ❌
- Type check: ✅ / ❌
- Tests: ✅ / ❌
- Build: ✅ / ❌

#### Commits on Branch

<!-- List of commit SHAs and messages added during this session -->

#### Issues Addressed

<!-- List of review comments resolved, bugs fixed, merge conflicts resolved -->

#### Outstanding Notes

<!-- Anything deliberately deferred to a future PR with rationale -->

---

> The PR is fully implemented, all domains score ≥ 9/10, CI/CD is green, the working tree is clean, and there is nothing left to do. The PR is ready for review and merge.

================================================================================
MANDATORY EXECUTION REPORTING — NTFY PHONE NOTIFICATION (URGENT + VIBRATE)
================================================================================

At the end of this task ALWAYS send exactly ONE ntfy notification to my phone.

Goals:

- Lock screen: ultra-short gist (1–3 lines).
- Lock screen MUST include completion progress as: `<N>% Complete`.
- Expanded: full structured executive report.
- Include repo + git context and quick change stats when available.

Rules:

1. Always send ONE notification (even if nothing changed).
2. Keep the lock-screen section short and scannable.
3. Lock screen must explicitly show `${PERCENT_COMPLETE}% Complete`.
4. Always include NEXT ACTIONS.
5. If you’re blocked, say why + what I should do next.

Topic:
https://ntfy.sh/copilot-notifications

EXECUTE (copy/paste runnable):

REPO="$(git rev-parse --show-toplevel 2>/dev/null | xargs basename || echo N/A)"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo N/A)"
COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo N/A)"

# Completion gates (set these before sending)

# YES/NO fields

PR_INTENT_COMPLETE="<YES/NO>"
ALL_DOMAINS_ATTENDED="<YES/NO>"
ALL_SCORES_AT_LEAST_9="<YES/NO>"
CICD_PASSING="<YES/NO>"
MERGE_READY="<YES/NO>"
REVIEW_COMMENTS_RESOLVED="<YES/NO>"

# Optional numeric detail

DOMAINS_TOTAL="15"
DOMAINS_AT_OR_ABOVE_9="<0-15>"

score_yes_no() {
if [ "$1" = "YES" ]; then
echo "$2"
else
echo 0
fi
}

# Weighted completion model (max = 100)

POINTS=0
POINTS=$((POINTS + $(score_yes_no "$PR_INTENT_COMPLETE" 30)))
POINTS=$((POINTS + $(score_yes_no "$ALL_DOMAINS_ATTENDED" 20)))
POINTS=$((POINTS + $(score_yes_no "$ALL_SCORES_AT_LEAST_9" 20)))
POINTS=$((POINTS + $(score_yes_no "$CICD_PASSING" 15)))
POINTS=$((POINTS + $(score_yes_no "$MERGE_READY" 10)))
POINTS=$((POINTS + $(score_yes_no "$REVIEW_COMMENTS_RESOLVED" 5)))

PERCENT_COMPLETE="$POINTS"

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

## 🔒 Lock Screen

${PERCENT_COMPLETE}% Complete
<ONE-LINE status: Done / In Progress / Blocked + reason>
Next: <ONE immediate next step>

---

## ✅ Task Completed

**Repo:** \`${REPO}\`
**Scope:** <PR / Issue / Feature / Refactor / Fix>
**Outcome:** <ONE sentence: biggest achievement>
**Progress:** **${PERCENT_COMPLETE}% Complete\*\*
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

### Completion criteria status

- PR original intent complete: <YES/NO>
- All domains attended: <YES/NO>
- All domain scores >= 9/10: <YES/NO>
- CI/CD passing: <YES/NO>
- Review comments resolved: <YES/NO>
- Merge readiness gates met: <YES/NO>
- Domain score detail: <DOMAINS_AT_OR_ABOVE_9>/<DOMAINS_TOTAL> at or above 9

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
