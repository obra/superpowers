# Upstream Parity Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the core execution workflow to upstream Superpowers semantics as closely as Codex allows, while keeping the fork provably runnable in Codex.

**Architecture:** First make parity assertions fail on the current drifted workflow, then restore `subagent-driven-development` and its prompt templates to the upstream same-implementer review loop with only minimal Codex translations. Finish by updating validation docs so they distinguish upstream parity from Codex executability, and rerun the full suite.

**Tech Stack:** Markdown, bash, ripgrep, Codex CLI multi-agent tools (`spawn_agent`, `send_input`, `resume_agent`)

---

### Task 1: Make Upstream-Parity Checks Fail on the Current Drift

**Files:**
- Modify: `tests/codex/test-workflow-parity.sh`

- [ ] **Step 1: Rewrite the parity test around upstream invariants**

Replace the body of `tests/codex/test-workflow-parity.sh` with:

```bash
#!/usr/bin/env bash
set -euo pipefail

rg -q 'same implementer fixes them' skills/subagent-driven-development/SKILL.md
rg -q 'Commit your work' skills/subagent-driven-development/implementer-prompt.md
rg -q 'send_input|resume_agent' skills/subagent-driven-development/SKILL.md
rg -q 'Spec reviewer reviews again|Code reviewer reviews again|Reviewer reviews again' skills/subagent-driven-development/SKILL.md
rg -q 'If the plan or your human partner asks for a review checkpoint' skills/executing-plans/SKILL.md

! rg -q 'fresh fix agent' skills/subagent-driven-development/SKILL.md
! rg -q 'coordinator owns the canonical workspace' skills/subagent-driven-development/SKILL.md
! rg -q 'Do not make handoff or checkpoint commits' skills/subagent-driven-development/implementer-prompt.md
! rg -q 'Commit the completed task or batch before the review checkpoint|fix-and-rereview loop|Run the review checkpoint required by the plan or batch using' skills/executing-plans/SKILL.md

echo "workflow parity ok"
```

- [ ] **Step 2: Run the parity test and confirm the current implementation fails**

Run:

```bash
tests/codex/test-workflow-parity.sh
```

Expected:

- the script fails
- failure is caused by current drift such as `fresh fix agent`, `coordinator owns the canonical workspace`, or the missing `Commit your work` line

- [ ] **Step 3: Commit the red test rewrite**

```bash
git add tests/codex/test-workflow-parity.sh
git commit -m "test: encode upstream workflow parity checks"
```

---

### Task 2: Restore `subagent-driven-development` to the Upstream Default Loop

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md`

- [ ] **Step 1: Restore the top-level description and overview to the upstream default**

Change the frontmatter description and opening summary to this shape:

```markdown
---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session
---

# Subagent-Driven Development

Execute plan by dispatching fresh subagent per task, with two-stage review after each: spec compliance review first, then code quality review.
```

Do not keep `coordinator-owned state` or `staged reviews` in the description.

- [ ] **Step 2: Restore the process flow so the same implementer fixes review findings**

Update the process graph so the per-task loop uses these nodes:

```dot
"Implementer subagent implements, tests, commits, self-reviews" [shape=box];
"Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)" [shape=box];
"Spec reviewer subagent confirms code matches spec?" [shape=diamond];
"Implementer subagent fixes spec gaps" [shape=box];
"Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)" [shape=box];
"Code quality reviewer subagent approves?" [shape=diamond];
"Implementer subagent fixes quality issues" [shape=box];
"Mark task complete in update_plan" [shape=box];
```

Use `update_plan` in place of `TodoWrite`, but keep the rest of the loop aligned with upstream.

- [ ] **Step 3: Remove canonical-workspace-first language from the main skill body**

Delete the `Canonical Workspace Rules` section entirely.

Replace the current status handling language so `DONE` reads:

```markdown
**DONE:** Proceed to spec compliance review.
```

Replace the prompt-template guidance with:

```markdown
- `implementer-prompt.md` - Dispatch implementer subagent
- `spec-reviewer-prompt.md` - Dispatch spec compliance reviewer subagent
- `code-quality-reviewer-prompt.md` - Dispatch code quality reviewer subagent
```

Add one short Codex translation note immediately below that list:

```markdown
In Codex, send review findings back to the same implementer with `send_input`. If that worker is no longer active, use `resume_agent` before falling back to a replacement worker.
```

- [ ] **Step 4: Rewrite the example workflow and red flags to match the upstream loop**

In the example workflow, replace the current fix loop with:

```text
[Spec reviewer finds issues]
[Send findings to the same implementer]
Implementer: Removed --json flag, added progress reporting

[Spec reviewer reviews again]
Spec reviewer: ✅ Spec compliant now

[Dispatch code quality reviewer]
Code reviewer: Strengths: Solid. Issues (Important): Magic number (100)

[Send findings to the same implementer]
Implementer: Extracted PROGRESS_INTERVAL constant

[Code reviewer reviews again]
Code reviewer: ✅ Approved
```

In the `If reviewer finds issues:` block, replace the current bullets with:

```markdown
- Implementer (same subagent) fixes them
- Reviewer reviews again
- Repeat until approved
- If the original implementer is unavailable, resume that worker or explicitly replace it with the same findings and task context
```

- [ ] **Step 5: Commit the restored skill**

```bash
git add skills/subagent-driven-development/SKILL.md
git commit -m "docs: restore upstream subagent workflow semantics"
```

---

### Task 3: Restore Prompt Templates to the Upstream Implementer/Reviewer Contract

**Files:**
- Modify: `skills/subagent-driven-development/implementer-prompt.md`
- Modify: `skills/subagent-driven-development/spec-reviewer-prompt.md`
- Modify: `skills/subagent-driven-development/code-quality-reviewer-prompt.md`

- [ ] **Step 1: Restore the implementer job sequence and remove coordinator-owned-state rules**

Replace the `## Working Rules` and `## Your Job` sections in `implementer-prompt.md` so the main sequence reads:

```text
## Your Job

Once you're clear on requirements:
1. Implement exactly what the task specifies
2. Write tests (following TDD if task says to)
3. Verify implementation works
4. Commit your work
5. Self-review (see below)
6. Report back
```

Remove these current lines completely:

```text
- The coordinator owns the canonical workspace and all authoritative commits for this task.
- Do not make handoff or checkpoint commits.
- If you are fixing review findings, treat the provided findings and current canonical context as the source of truth rather than relying on your prior run.
```

Add one Codex-specific note after the job sequence:

```text
If the controller sends reviewer findings later, continue as the same implementer for this task unless explicitly told you are being replaced.
```

- [ ] **Step 2: Restore the spec-reviewer distrust language**

Replace the body of `spec-reviewer-prompt.md` with this structure:

```text
You are reviewing whether an implementation matches its specification.

## What Was Requested
[FULL TEXT of task requirements]

## What Implementer Claims They Built
[From implementer's report]

## CRITICAL: Do Not Trust the Report

The implementer finished suspiciously quickly. Their report may be incomplete, inaccurate, or optimistic. You MUST verify everything independently.

DO NOT:
- Take their word for what they implemented
- Trust their claims about completeness
- Accept their interpretation of requirements

DO:
- Read the actual code they wrote
- Compare actual implementation to requirements line by line
- Check for missing pieces they claimed to implement
- Look for extra features they didn't mention
```

Keep the report format:

```text
Report:
- ✅ Spec compliant (if everything matches after code inspection)
- ❌ Issues found: [list specifically what's missing or extra, with file:line references]
```

- [ ] **Step 3: Restore the code-quality reviewer handoff shape**

Replace the body of `code-quality-reviewer-prompt.md` with:

```markdown
# Code Quality Reviewer Prompt Template

Use this template when dispatching a code quality reviewer subagent.

**Purpose:** Verify implementation is well-built (clean, tested, maintainable)

**Only dispatch after spec compliance review passes.**

Use `agents/code-reviewer.md` with:

- `WHAT_WAS_IMPLEMENTED`: from implementer's report
- `PLAN_OR_REQUIREMENTS`: Task N from the active plan file
- `BASE_SHA`: commit before task began
- `HEAD_SHA`: current commit after implementer or fix commits
- `EXTRA_REVIEW_FOCUS`: file boundaries, decomposition, and plan alignment for this task
```

Keep the current additional checks section only if it still reads as reviewer guidance, not as a replacement for the code-reviewer prompt.

- [ ] **Step 4: Commit the restored prompts**

```bash
git add skills/subagent-driven-development/implementer-prompt.md skills/subagent-driven-development/spec-reviewer-prompt.md skills/subagent-driven-development/code-quality-reviewer-prompt.md
git commit -m "docs: restore upstream subagent prompt contracts"
```

---

### Task 4: Reframe Validation Docs Around Parity vs Executability

**Files:**
- Modify: `docs/testing.md`

- [ ] **Step 1: Rewrite the introduction around two proof layers**

Replace the opening block with:

```markdown
# Testing the Codex-Only Superpowers Fork

This repository ships two kinds of proof for the core execution workflow:

1. upstream workflow parity checks
2. Codex executability checks for the current checkout

The suite is still not a full live-session behavioral eval harness, but its green status should now answer two separate questions:

- does this checkout still preserve the upstream execution workflow?
- can this checkout actually be loaded and exercised in Codex?
```

- [ ] **Step 2: Update the automated-check bullets to match the restored meaning**

Replace the `What Automated Checks Enforce` list with:

```markdown
- `AGENTS.md` is canonical
- non-Codex product artifacts are removed
- public docs are Codex-only
- the active product surface does not use translated legacy-platform names or tool aliases
- `subagent-driven-development` keeps the upstream same-implementer review loop as the default workflow
- `executing-plans` stays free of baked-in mandatory review loops
- the current checkout can be loaded as the active `skills/` surface in an isolated Codex runtime when local Codex prerequisites are available
```

- [ ] **Step 3: Clarify what the suite does not prove**

Keep the existing limitation bullets, but ensure this wording is present:

```markdown
- full behavioral parity with upstream across live Codex sessions is still not automatically proven
- your normal interactive Codex environment may still be loading a different global install than the isolated smoke test
```

- [ ] **Step 4: Commit the validation-doc rewrite**

```bash
git add docs/testing.md
git commit -m "docs: separate upstream parity from codex executability"
```

---

### Task 5: Verify the Restored Workflow End to End

**Files:**
- Verify only

- [ ] **Step 1: Run the parity test**

Run:

```bash
tests/codex/test-workflow-parity.sh
```

Expected:

- `workflow parity ok`

- [ ] **Step 2: Run the runtime smoke**

Run:

```bash
tests/codex/test-runtime-smoke.sh
```

Expected:

- `runtime smoke ok`

Also acceptable in environments without local Codex auth:

- `runtime smoke skipped: codex not installed`
- `runtime smoke skipped: ...auth.json not found`

- [ ] **Step 3: Run the full validation suite**

Run:

```bash
scripts/validate-codex-only.sh
```

Expected:

- `repo surface ok`
- `forbidden terms ok`
- `doc consistency ok`
- `workflow parity ok`
- `runtime smoke ok`

or the same sequence with `runtime smoke skipped: ...` if local Codex prerequisites are unavailable

- [ ] **Step 4: Inspect the final diff against upstream-critical files**

Run:

```bash
git diff -- skills/subagent-driven-development/SKILL.md skills/subagent-driven-development/implementer-prompt.md skills/subagent-driven-development/spec-reviewer-prompt.md skills/subagent-driven-development/code-quality-reviewer-prompt.md docs/testing.md tests/codex/test-workflow-parity.sh
```

Expected:

- the diff shows upstream loop restoration plus only minimal Codex translations such as `update_plan`, `spawn_agent`, `send_input`, or `resume_agent`

- [ ] **Step 5: Commit the verification pass if any verification-only edits were needed**

```bash
git status --short
```

Expected:

- no unexpected modified files remain
