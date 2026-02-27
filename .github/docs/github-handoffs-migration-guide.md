# GitHub-Native Handoffs Migration Guide

**Version:** 2.0.0  
**Effective Date:** 2026-02-26  
**Status:** Active  
**Migration:** File-based → GitHub-native

---

## 🎯 Overview

SubZero has **fully migrated** from file-based handoffs (`.github/.handoffs/`) to **GitHub-native handoffs** using Issue and PR comments. This provides:

- ✅ **Single source of truth:** GitHub Issues and PRs
- ✅ **Better traceability:** All handoffs visible in GitHub UI
- ✅ **Enhanced auditability:** Permanent comment history
- ✅ **Improved collaboration:** Comments support @mentions, reactions, threading
- ✅ **CI integration:** PR comments centralize review + CI context

---

## 🚨 Breaking Change

**File-based handoffs (`.github/.handoffs/`) are DEPRECATED.**

- ✋ **No new handoff files** will be created during normal operation
- ✋ **Reading from `.handoffs/` is no longer supported** (except via legacy flag)
- ✅ **All handoffs now posted as GitHub comments** (Issue or PR)

---

## 📋 New Workflow

### 1. Work Item Creation

Every work unit starts with a GitHub Issue:

```powershell
gh issue create --title "feature(component): Brief description" \
  --body "Full description with acceptance criteria" \
  --label "feature,P1"
```

**Required:**
- Title follows convention: `<type>(<component>): <description>`
- Body includes acceptance criteria
- Labels applied: type, priority, component

### 2. Branch Creation

Tech Lead or Solution Architect creates feature branch:

```powershell
git checkout main
git pull origin main
git checkout -b feature/<issue-number>-short-slug
git push -u origin feature/<issue-number>-short-slug
```

**Branch naming:** `<type>/<issue-number>-<description>`

### 3. Agent Work Cycle

Each agent follows this cycle:

```typescript
// 1. Resolve context
const context = await contextResolver.resolve()

// 2. Perform work
// ... implementation ...

// 3. Post handoff comment
const handoffData: HandoffCommentData = {
  agent: 'frontend-engineer',
  workItem: { issueNumber: context.issueNumber, prNumber: context.prNumber },
  status: 'Done', // or 'Partial' or 'Blocked'
  scopeCompleted: [/* ... */],
  keyDecisions: [/* ... */],
  changesSummary: {/* ... */},
  verification: {/* ... */},
  risks: [/* ... */],
  followUps: [/* ... */],
  nextAgent: 'backend-engineer',
  nextActions: [/* ... */],
  links: {},
}

const { commentUrl } = await handoffProvider.postHandoff(context, handoffData)

// 4. Dispatch next agent (MANDATORY)
await dispatcher.dispatch(
  'backend-engineer',
  context,
  commentUrl,
  'Additional context if needed'
)
```

**Both steps 3 and 4 are MANDATORY.** If either fails, the handoff fails.

### 4. PR Creation

When work is ready for review:

```powershell
gh pr create --title "feat(component): Description" \
  --body "Full PR description using template" \
  --base main \
  --head feature/<issue-number>-slug \
  --label "feature" \
  --reviewer "reviewer-username"
```

**From this point forward, all handoffs post to the PR (preferred).**

### 5. Review & Merge

Quality Director validates all gates and creates PR:

```typescript
// Validate all quality gates
const allGatesPassed = await validateAllGates()

if (allGatesPassed) {
  // Post PR review using pr_review template
  await handoffProvider.postPRReview(context, reviewData)
  
  // Request merge (or auto-merge if approved)
  await githubClient.mergePR(context.prNumber, '--squash')
}
```

---

## 🔧 Setup Requirements

### 1. GitHub CLI Authentication

**Required:** GitHub CLI (`gh`) must be authenticated.

```powershell
# Check authentication status
gh auth status

# If not authenticated, login
gh auth login
```

**Troubleshooting:**

If `gh auth status` fails:
1. Run `gh auth login`
2. Select `GitHub.com`
3. Select `HTTPS` or `SSH` (your preference)
4. Authenticate via browser or token

### 2. Environment Variables (Optional)

Configure handoff behavior via environment variables:

```powershell
# Handoff provider (default: github)
$env:SUBZERO_HANDOFF_PROVIDER = "github"

# Dry-run mode (no actual GitHub API calls)
$env:SUBZERO_GITHUB_DRY_RUN = "1"

# Comment target preference (default: pr_preferred)
$env:SUBZERO_GITHUB_COMMENT_TARGET = "pr_preferred"  # or "issue_only" or "pr_only"

# Max comments to fetch when reading context (default: 25)
$env:SUBZERO_GITHUB_MAX_COMMENTS = "25"

# Template directory (default: .github/comment_templates)
$env:SUBZERO_TEMPLATES_DIR = ".github/comment_templates"

# Dispatcher config
$env:SUBZERO_CODE_COMMAND = "code"  # or "code-insiders"
$env:SUBZERO_DISPATCH_DRY_RUN = "0"
```

### 3. Context Resolution

Context can be provided via:

**Priority 1: Explicit Config**

```typescript
const context = await contextResolver.resolve({
  repo: 'owner/repo',
  issueNumber: 42,
  prNumber: 123,
  branchName: 'feature/42-test',
  agent: 'frontend-engineer',
  nextAgent: 'backend-engineer',
})
```

**Priority 2: Environment Variables**

```powershell
$env:SUBZERO_REPO = "owner/repo"
$env:SUBZERO_ISSUE = "42"
$env:SUBZERO_PR = "123"
$env:SUBZERO_BRANCH = "feature/42-test"
$env:SUBZERO_AGENT = "frontend-engineer"
$env:SUBZERO_NEXT_AGENT = "backend-engineer"
```

**Priority 3: Auto-Detection**

- **Repo:** Parsed from `git remote get-url origin`
- **Issue:** Extracted from branch name (e.g., `feature/42-description` → issue #42)
- **Branch:** Detected via `git branch --show-current`
- **PR:** Detected via `gh pr list --search "closes #42"` or `gh pr view <branch>`

---

## 📝 Handoff Comment Template

All handoffs MUST use the standardized template (`.github/comment_templates/handoff.md`).

**Required Sections:**

1. **Agent & Work Item** — Who, what issue/PR
2. **Status** — Done / Partial / Blocked
3. **Scope Completed** — Checklist of completed work
4. **Key Decisions** — Significant architectural/design decisions
5. **Changes Summary** — Files changed, commits, lines added/removed
6. **Verification** — Commands run, expected vs. actual outcomes
7. **Risks / Follow-ups** — Identified risks and future work
8. **Next Agent** — Who to dispatch to
9. **Next Actions** — Explicit checklist for next agent
10. **Links** — Comment URL, CI run, docs, test evidence

**Example:**

```markdown
## Handoff

**Agent:** frontend-engineer  
**Work Item:** Issue #42 | PR #123  
**Status:** Done  
**Timestamp:** 2026-02-26T14:30:00Z

---

### Scope Completed

- [x] Implemented UI components
- [x] Added unit tests
- [x] Updated documentation

---

### Key Decisions

1. **Used React Query for state management**
   - Rationale: Better caching and synchronization
   - Alternatives considered: Redux, Zustand

---

### Changes Summary

**Files Changed:** 5 files (+250 -50)

**Notable Files:**
- `src/components/NewComponent.tsx` — Main component
- `src/hooks/useData.ts` — Data fetching hook

**Commits:**
- abc123 — feat: add new component
- def456 — test: add component tests

---

### Verification

**Commands Run:**

```bash
npm test
npm run lint
npm run typecheck
```

**Expected Outcome:**
- All tests pass
- No lint errors
- No type errors

**Actual Outcome:**
- ✓ 15 tests passed
- ✓ No issues
- ✓ No errors

**Verification Status:** ✅ Passed

---

### Risks / Follow-ups

**Risks:**
- New dependency added (React Query)

**Follow-ups:**
- Update integration tests
- Add E2E tests

---

### Next Agent

**Handoff To:** `backend-engineer`

---

### Next Actions (Explicit Checklist)

- [ ] Review frontend changes
- [ ] Implement matching API endpoints
- [ ] Update API documentation
- [ ] Run integration tests
- [ ] Post handoff comment before dispatching to next agent
- [ ] Dispatch to: `qa-test-engineer`

---

### Links

- **Handoff Comment (self):** https://github.com/owner/repo/pull/123#issuecomment-1234567
- **CI Run:** https://github.com/owner/repo/actions/runs/123456789
- **Relevant Docs:** N/A
- **Test Evidence:** N/A

---

**End of Handoff**
```

---

## 🧪 Testing

### Dry-Run Mode

Test GitHub handoffs without actual API calls:

```powershell
$env:SUBZERO_GITHUB_DRY_RUN = "1"

# Run your workflow
# Handoffs will be logged but not posted
```

### Unit Tests

Run framework tests:

```powershell
cd .github/framework
npm test
```

**Test Coverage:**

- `comment-template-service.test.ts` — Template rendering and validation
- `github-handoff-provider.test.ts` — GitHub API interactions
- `context-resolver.test.ts` — Context resolution logic
- `dispatcher.test.ts` — Agent dispatch logic

---

## 🔄 Migration from File-Based Handoffs

### Legacy File-Based System (DEPRECATED)

The old system wrote handoff files to `.github/.handoffs/<agent-id>/handoff-<timestamp>.md`.

**Status:** ❌ **DEPRECATED**

**Behavior:**
- No new handoff files are created by default
- Existing files are preserved for historical reference
- System no longer reads from `.handoffs/` during operation

### Migration Steps

If you have old workflows using file-based handoffs:

1. **Update code to use GitHub handoff provider:**

   ```typescript
   // OLD (deprecated)
   import { FileHandoffProvider } from './file-handoff-provider'
   const provider = new FileHandoffProvider()

   // NEW (recommended)
   import { GitHubHandoffProvider } from './github-handoff-provider'
   const provider = new GitHubHandoffProvider({ dryRun: false })
   ```

2. **Update dispatch calls to include comment URL:**

   ```typescript
   // OLD (deprecated)
   await dispatcher.dispatch(nextAgent, context, /* no comment URL */)

   // NEW (mandatory)
   const { commentUrl } = await provider.postHandoff(context, handoffData)
   await dispatcher.dispatch(nextAgent, context, commentUrl)
   ```

3. **Use helper for atomic handoff + dispatch:**

   ```typescript
   import { postHandoffAndDispatch } from './dispatcher'

   await postHandoffAndDispatch(provider, dispatcher, context, handoffData)
   ```

### Rollback (Emergency Only)

If GitHub handoffs fail catastrophically, you can temporarily enable file-based fallback:

```powershell
$env:SUBZERO_HANDOFF_PROVIDER = "file"
```

**⚠️ WARNING:** This is for emergency use only. File-based handoffs are deprecated and will be removed in a future version.

---

## 🐛 Troubleshooting

### "GitHub CLI (gh) is not authenticated"

**Solution:**

```powershell
gh auth login
```

Follow prompts to authenticate.

### "Failed to resolve repository"

**Cause:** Not in a git repository or no remote origin configured.

**Solution:**

```powershell
# Check remote
git remote -v

# Add remote if missing
git remote add origin https://github.com/owner/repo.git

# Or set environment variable
$env:SUBZERO_REPO = "owner/repo"
```

### "Failed to resolve issue number"

**Cause:** Branch name doesn't follow convention or no issue linked.

**Solution:**

1. Use branch naming convention: `feature/<issue>-description`
2. Or set environment variable: `$env:SUBZERO_ISSUE = "42"`

### "No PR number available for posting comment"

**Cause:** Comment target is `pr_only` but PR doesn't exist yet.

**Solution:**

1. Change target to `pr_preferred` (falls back to Issue)
2. Or create PR before posting handoff
3. Or set `$env:SUBZERO_GITHUB_COMMENT_TARGET = "issue_only"`

### "Dispatch failed after handoff was posted"

**Cause:** Handoff posted successfully but `code chat` dispatch failed.

**Solution:**

1. Check that `code` command is in PATH
2. Verify VS Code is installed
3. Use `$env:SUBZERO_CODE_COMMAND = "code-insiders"` if using Insiders build
4. Handoff comment URL is preserved — manually dispatch if needed

---

## 📚 Related Documentation

- [Comment Templates README](../comment_templates/README.md) — Template usage guide
- [Framework README](../framework/README.md) — Architecture overview
- [Agent Workflow Guide](../WORKFLOW_INTEGRATION_SUMMARY.md) — Complete workflow details
- [Git Workflow](../GIT_WORKFLOW.md) — Git and GitHub best practices
- [Quality Gates](../QUALITY-GATES.md) — Quality enforcement

---

## 🎓 Best Practices

1. **Always post handoff before dispatching**
   - Use `postHandoffAndDispatch()` helper to enforce atomicity

2. **Include all required template sections**
   - Even if a section is N/A, include it

3. **Provide explicit next actions**
   - Next agent should know exactly what to do

4. **Document key decisions**
   - Future maintainers need context

5. **Verify before handing off**
   - Include verification commands and actual outcomes

6. **Link to CI runs and evidence**
   - Makes review faster and more confident

7. **Use PR comments when available**
   - Centralizes all context (code + CI + handoffs)

8. **Read previous handoffs**
   - Use `provider.readComments()` to get context

---

## ❓ FAQ

**Q: Can I still use file-based handoffs?**  
A: Deprecated. Use GitHub handoffs. File-based fallback available via `SUBZERO_HANDOFF_PROVIDER=file` (emergency only).

**Q: What if I'm working locally without internet?**  
A: Use dry-run mode (`SUBZERO_GITHUB_DRY_RUN=1`) for local testing.

**Q: Where do handoffs go if there's no PR yet?**  
A: Issue comments (automatically falls back if `commentTarget=pr_preferred`).

**Q: Can I customize comment templates?**  
A: Yes, edit files in `.github/comment_templates/`. Required sections must remain.

**Q: What happens if dispatch fails?**  
A: Handoff comment is already posted (preserved). You can manually dispatch or retry.

**Q: How do I read handoff history?**  
A: View PR or Issue comments in GitHub UI, or use `provider.readComments()`.

---

**Last Updated:** 2026-02-26  
**Version:** 2.0.0  
**Maintainer:** Chief of Staff (`00-chief-of-staff`)
