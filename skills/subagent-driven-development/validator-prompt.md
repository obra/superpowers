# Validator Prompt Template (Persistent Team Member — Combined Spec + Quality)

Use this template when sending a review request to a persistent validator team member via `SendMessage`.

**Purpose:** Single-pass combined spec compliance and code quality review. Validators are persistent agents that retain context across tasks — use this to detect cross-task gaps by re-reading prior task diffs.

**Note:** This is a `SendMessage` payload, not a `Task` tool dispatch. The validator is already running as a team member.

---

## Review Request (send this as the SendMessage content)

```
You are reviewing Task N: [task name]

## What Was Requested

[FULL TEXT of task requirements]

## Implementer Report

[Full report from implementer, including their evidence: test output, diff stat, files changed.]

## CRITICAL: Do Not Trust the Report

The report may be optimistic, incomplete, or inaccurate. Read the actual code — verify everything independently.

## Git Information

BASE_SHA: [commit before this task's work]
HEAD_SHA: [current HEAD after implementer's commit]

SHA map of completed tasks (for dependency re-reads):
[dict, e.g.: task-1: abc1234, task-2: def5678]

## Your Job — Two Sections

### Section 1: Spec Compliance

Read the git diff (BASE_SHA to HEAD_SHA) and the task spec.

For each requirement in the task spec:
- Find the implementing code
- Cite the specific `file:line`
- Include a 2–3 line code excerpt or function signature

If the task spec mentions prior tasks (e.g., "uses the function from task 2"), look up that task's SHA in the SHA map above, read its diff, and verify the dependency actually exists. Do not rely on your memory of approving it.

Mark any requirement with no citation found as **❌ MISSING**.

### Section 2: Code Quality

On the same code (you've already read it for Section 1), assess:

- **Naming:** Do names match what things do (not how they work)?
- **Testing:** Do tests verify behavior, not just mock it? Are they comprehensive?
- **YAGNI:** Is there overbuilding — features not in the spec?
- **Patterns:** Does the code follow existing codebase conventions?

## Report Format

**Spec Compliance:**
For each requirement: [requirement text] → `file:line` — [excerpt]
For each gap: ❌ MISSING — [requirement], expected: [what spec says], found: [what code shows]

**Code Quality:**
- Strengths: [list]
- Issues:
  - Critical (must fix before approval): [list with file:line]
  - Important (fix before merging): [list with file:line]
  - Minor (note for later): [list]

**Verdict:**
- ✅ APPROVED — all requirements cited, no Critical or Important issues
- ❌ NEEDS FIXES — [bulleted list of exactly what must change]

After sending this verdict, notify the team lead via `SendMessage` so they know you are available for the next review. Also update your review task status via `TaskUpdate(status: 'completed')` so your availability survives compaction.

## Re-Review Protocol

If you receive a re-review request after the implementer made fixes:
- Re-read the full diff (use the updated HEAD_SHA provided)
- Re-check only the previously failing items (don't re-litigate approved items)
- Your prior approvals of other requirements stand unless new evidence contradicts them
```
