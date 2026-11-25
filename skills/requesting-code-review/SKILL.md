---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements
---

# Requesting Code Review

Dispatch a code reviewer subagent to catch issues before they cascade. The reviewer gets precisely crafted context for evaluation — never your session's history.

**Core principle:** Review early, review often.

## When to Request Review

**Mandatory:**
- After each task in subagent-driven development
- After completing major feature
- Before handing completed implementation back to your human partner; reuse an existing review if it covers the same changes and requirements
- Before merge to main

**Optional but valuable:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug

## How to Request

**1. Identify the changes:**

Record the base and the staged, unstaged, and untracked state at task start,
before making changes. Preserve pre-existing work. Review the complete
task-owned change, including uncommitted work, against that state. If
ownership or the baseline cannot be established, retain the doubtful work
and report the limitation; do not guess.

For committed work, get the range:
```bash
# At task start (or use the merge base for a whole-branch review):
BASE_SHA=$(git rev-parse HEAD)
# At review:
HEAD_SHA=$(git rev-parse HEAD)
```

**2. Dispatch code reviewer subagent:**

Dispatch a `general-purpose` subagent, filling the template at [code-reviewer.md](code-reviewer.md)

**Placeholders:**
- `{DESCRIPTION}` - Use "Review the supplied diff", not a parent-authored account of requirements
- `{PLAN_OR_REQUIREMENTS}` - Relevant human request messages, quoted verbatim; if unavailable, say so
- `{BASE_SHA}` - Starting commit
- `{HEAD_SHA}` - Ending commit

Separately identify any human-approved plan or spec and its approval. Label
unapproved briefs, designs, assumptions, and summaries as context, not
requirements. Tell the reviewer which approval and ownership evidence is
known, absent, or unavailable. For uncommitted work, use a task-start
comparison as the authoritative final-state diff; replace the template's
commit-only instructions when that range would omit changes. If the
comparison is missing, have the reviewer report that it cannot verify
rather than fall back to a partial commit-only diff.

**Add this scope check to the existing review:** For each addition, determine
whether it is task-owned, authorized by the human request or approved plan,
and necessary to deliver the request or preserve existing behavior. Flag an
addition for removal only when it is demonstrably task-owned, unauthorized,
and unnecessary. Approved or necessary work stays; uncertain ownership,
authorization, or necessity is reported, not deleted. In the dispatched
template, replace its statement that reasonable expectations are requirements:
the reasonable-person lens assesses quality and compatibility, but does not
authorize new scope. Grade quality severity by impact, not by whether the
addition must be removed.

**3. Act on feedback:**
- Remove confirmed scope additions without asking, using the existing fix path; verify the result and preserve unrelated work
- Treat confirmed scope additions as requirement gaps even if their quality severity is Minor
- Retain and report uncertain additions; if a confirmed gap remains unresolved, report the work incomplete
- Fix Critical issues immediately
- Fix Important issues before proceeding
- Note Minor issues for later
- Push back if reviewer is wrong (with reasoning)

## Example

```
[Just completed Task 2: Add verification function]

You: Let me request code review before proceeding.

[Use BASE_SHA recorded before Task 2]
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch code reviewer subagent]
  DESCRIPTION: Review the supplied diff
  PLAN_OR_REQUIREMENTS: "Add index verification and report invalid entries."
  APPROVED PLAN: docs/superpowers/plans/deployment-plan.md (partner-approved)
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661

[Subagent returns]:
  Strengths: Clean architecture, real tests
  Issues:
    Important: Missing progress indicators
    Minor: Magic number (100) for reporting interval
  Assessment: Ready to proceed

You: [Fix progress indicators]
[Continue to Task 3]
```

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "I'll just review the diff myself instead of dispatching a reviewer" | You're the coordinator — reviewing the diff inline burns the context window you need to keep driving the work. Dispatch a reviewer subagent: the diff and the evaluation live in its context, and only the findings come back to you. |
| "The reviewer needs my whole session history to understand the change" | Hand it precisely crafted context, never your session's history. That keeps the reviewer on the work product, not your thought process. |

## Red Flags

**Never:**
- Skip review because "it's simple"
- Ignore Critical issues
- Proceed with unfixed Important issues
- Argue with valid technical feedback

**If reviewer wrong:**
- Push back with technical reasoning
- Show code/tests that prove it works
- Request clarification

See template at: [code-reviewer.md](code-reviewer.md)
