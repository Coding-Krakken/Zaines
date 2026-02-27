# ⚠️ DEPRECATED: File-Based Handoff System

> **Status:** ❌ **DEPRECATED**  
> **Effective Date:** 2026-02-26  
> **Replaced By:** GitHub-native handoffs (Issue/PR comments)

---

## 🚨 Important Notice

**This file-based handoff system is DEPRECATED and no longer used by default.**

✋ **DO NOT create new handoff files in this directory.**

✅ **USE GitHub-native handoffs instead** (Issue and PR comments).

---

## Migration

SubZero has migrated from file-based handoffs to GitHub-native handoffs for better traceability, auditability, and collaboration.

**New System:**
- ✅ Post handoff comments to GitHub Issues or PRs
- ✅ Use standardized comment templates (`.github/comment_templates/`)
- ✅ Dispatch agents via `code chat` with comment URL

**Read the Migration Guide:**  
📖 [GitHub Handoffs Migration Guide](../docs/github-handoffs-migration-guide.md)

---

## Why Deprecated?

**Problems with file-based handoffs:**

1. ❌ **Fragmented context:** Handoffs separated from Issue/PR discussion
2. ❌ **No GitHub UI visibility:** Must read files in repo
3. ❌ **Limited collaboration:** No @mentions, reactions, threading
4. ❌ **PR review friction:** Reviewers can't see handoff context in PR
5. ❌ **CI integration gaps:** Handoffs not linked to CI runs

**Benefits of GitHub-native handoffs:**

1. ✅ **Single source of truth:** Everything in GitHub Issues/PRs
2. ✅ **Better traceability:** Full comment history preserved
3. ✅ **Enhanced auditability:** Permanent, timestamped, linked to work items
4. ✅ **Improved collaboration:** Native GitHub features (mentions, threads, reactions)
5. ✅ **Centralized review:** PR comments unify code + CI + handoffs

---

## Historical Reference

This directory is **preserved for historical reference only**. Existing handoff files remain accessible but are no longer actively used by the system.

**Directory Structure (Historical):**

```
.github/.handoffs/
├── README.md                          ← This file (deprecation notice)
├── 00-chief-of-staff/                 ← Agent inbox directories (historical)
├── frontend-engineer/
├── backend-engineer/
├── qa-test-engineer/
├── security-engineer/
├── quality-director/
└── ... (other agents)
```

---

## Emergency Rollback (NOT RECOMMENDED)

If you need to temporarily re-enable file-based handoffs (emergency only):

```powershell
$env:SUBZERO_HANDOFF_PROVIDER = "file"
```

**⚠️ WARNING:**  
- This is a **temporary fallback only**
- File-based handoffs will be removed in a future version
- GitHub-native handoffs are the intended system

---

## New Handoff Workflow

### 1. Create Work Item (GitHub Issue)

```powershell
gh issue create --title "feature(component): Description" \
  --body "Full description with acceptance criteria" \
  --label "feature,P1"
```

### 2. Create Feature Branch

```powershell
git checkout -b feature/<issue>-description
git push -u origin feature/<issue>-description
```

### 3. Post Handoff Comment (NOT file)

```typescript
import { GitHubHandoffProvider } from './.github/framework/github-handoff-provider'
import { ContextResolver } from './.github/framework/context-resolver'
import { AgentDispatcher, postHandoffAndDispatch } from './.github/framework/dispatcher'

// Resolve context
const contextResolver = new ContextResolver()
const context = await contextResolver.resolve()

// Prepare handoff data
const handoffData = {
  agent: 'frontend-engineer',
  workItem: { issueNumber: context.issueNumber, prNumber: context.prNumber },
  status: 'Done',
  scopeCompleted: ['Implemented feature X', 'Added tests'],
  keyDecisions: [{ title: 'Used pattern Y', rationale: 'Better performance' }],
  changesSummary: { filesChanged: 5, linesAdded: 200, linesRemoved: 50, notableFiles: [], commits: [] },
  verification: { commandsRun: ['npm test'], expectedOutcome: ['Tests pass'], actualOutcome: ['✓ 10 tests passed'], status: 'Passed' },
  risks: [],
  followUps: [],
  nextAgent: 'backend-engineer',
  nextActions: ['Review changes', 'Implement backend'],
  links: {},
}

// Post handoff + dispatch (atomic operation)
const provider = new GitHubHandoffProvider()
const dispatcher = new AgentDispatcher()

await postHandoffAndDispatch(provider, dispatcher, context, handoffData)
```

### 4. Next Agent Receives Context

Next agent receives dispatch with handoff comment URL:

```
📋 HANDOFF RECEIVED

Work Item: Issue #42 | PR #123
Branch: feature/42-test-feature

🔗 READ THIS HANDOFF FIRST:
https://github.com/owner/repo/pull/123#issuecomment-1234567

✅ MANDATORY INSTRUCTIONS:
1. Open the handoff comment URL above and READ IT COMPLETELY
2. Quote the "Handoff:" title line to confirm you read it
3. Complete ALL items in the "Next Actions" checklist
4. Before dispatching to the next agent, you MUST:
   - Post your own handoff comment using the handoff template
   - Include the comment URL in your dispatch

Begin work now.
```

---

## Documentation

Read the full migration guide and new system documentation:

- 📖 [GitHub Handoffs Migration Guide](../docs/github-handoffs-migration-guide.md)
- 📖 [Comment Templates README](../comment_templates/README.md)
- 📖 [Framework README](../framework/README.md)
- 📖 [Workflow Integration Summary](../WORKFLOW_INTEGRATION_SUMMARY.md)

---

## Questions?

Contact: Chief of Staff (`00-chief-of-staff`)

---

**This directory is preserved for historical reference only.**  
**Use GitHub-native handoffs for all new work.**

**Deprecated:** 2026-02-26  
**Version:** 1.0.0 → 2.0.0 (GitHub-native)


The sending agent writes a timestamped handoff file into the receiving agent's directory:

```powershell
$handoffDir = ".github/.handoffs/<target-agent-id>"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$handoffFile = "$handoffDir/handoff-$timestamp.md"
```

### Step 2: File Naming Convention

```
handoff-<YYYYMMDD-HHmmss>.md
```

Examples:

- `handoff-20260225-143022.md`
- `handoff-20260225-160500.md`

### Step 3: Handoff File Template

Every handoff file MUST use this structure:

```markdown
# Handoff: <Short Title>

**From:** <sending-agent-id>
**To:** <receiving-agent-id>
**Date:** <ISO 8601 timestamp>
**Dispatch Chain:** [agent1] → [agent2] → [you]
**Dispatch Depth:** N/10

---

## Original Request

<What the user originally asked for>

## Context

<Background information, current state, relevant history>

## Work Completed So Far

- <What previous agents have done>
- <Files changed, decisions made>

## Your Task

<Specific, actionable instructions for this agent>

### Deliverables

1. <Concrete deliverable 1>
2. <Concrete deliverable 2>

### Acceptance Criteria

- [ ] <Measurable criterion 1>
- [ ] <Measurable criterion 2>

## Constraints

- <Constraint 1>
- <Constraint 2>

## Reference Files

- <path/to/relevant/file1>
- <path/to/relevant/file2>

## Next Agent

After your work is complete, hand off to: `<next-agent-id>`

## Autonomous Execution

- Do not ask user for confirmation.
- Complete all executable work in this handoff.
- Dispatch to `<next-agent-id>` automatically when done.
- If blocked, escalate in-chain and document blocker.
```

### Step 4: Dispatch Command

```powershell
$repo = (Get-Location).Path
$handoffFile = ".github/.handoffs/<target-agent-id>/handoff-<timestamp>.md"
code chat -m <target-agent-id> --add-file $repo --add-file $handoffFile "Read your handoff file at $handoffFile and execute the task described within."
```

---

## Lifecycle Rules

### File Retention

- Handoff files are **kept** after processing (for audit trail)
- Old handoff files can be cleaned up periodically (>30 days)
- Never delete a handoff file for an in-progress task

### Conflict Resolution

- If multiple handoff files exist, process the **most recent** one
- If instructions conflict, the most recent file wins
- If unclear, escalate to `00-chief-of-staff`

### Validation

- Receiving agent MUST acknowledge the handoff by reading the file
- Receiving agent MUST verify all referenced files exist
- If a referenced file is missing, escalate immediately

---

## Agent Quick Reference

| Agent ID                     | Inbox Path                                      |
| ---------------------------- | ----------------------------------------------- |
| `00-chief-of-staff`          | `.github/.handoffs/00-chief-of-staff/`          |
| `product-owner`              | `.github/.handoffs/product-owner/`              |
| `program-manager`            | `.github/.handoffs/program-manager/`            |
| `stakeholder-executive`      | `.github/.handoffs/stakeholder-executive/`      |
| `solution-architect`         | `.github/.handoffs/solution-architect/`         |
| `tech-lead`                  | `.github/.handoffs/tech-lead/`                  |
| `frontend-engineer`          | `.github/.handoffs/frontend-engineer/`          |
| `backend-engineer`           | `.github/.handoffs/backend-engineer/`           |
| `platform-engineer`          | `.github/.handoffs/platform-engineer/`          |
| `data-engineer`              | `.github/.handoffs/data-engineer/`              |
| `ml-engineer`                | `.github/.handoffs/ml-engineer/`                |
| `ux-designer`                | `.github/.handoffs/ux-designer/`                |
| `accessibility-specialist`   | `.github/.handoffs/accessibility-specialist/`   |
| `qa-test-engineer`           | `.github/.handoffs/qa-test-engineer/`           |
| `performance-engineer`       | `.github/.handoffs/performance-engineer/`       |
| `security-engineer`          | `.github/.handoffs/security-engineer/`          |
| `privacy-compliance-officer` | `.github/.handoffs/privacy-compliance-officer/` |
| `devops-engineer`            | `.github/.handoffs/devops-engineer/`            |
| `sre-engineer`               | `.github/.handoffs/sre-engineer/`               |
| `documentation-engineer`     | `.github/.handoffs/documentation-engineer/`     |
| `support-readiness-engineer` | `.github/.handoffs/support-readiness-engineer/` |
| `legal-counsel`              | `.github/.handoffs/legal-counsel/`              |
| `finance-procurement`        | `.github/.handoffs/finance-procurement/`        |
| `localization-specialist`    | `.github/.handoffs/localization-specialist/`    |
| `incident-commander`         | `.github/.handoffs/incident-commander/`         |
| `red-team`                   | `.github/.handoffs/red-team/`                   |
| `quality-director`           | `.github/.handoffs/quality-director/`           |
