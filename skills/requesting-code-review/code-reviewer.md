# Code Review Briefing Template

This file is the skill-local reviewer briefing template, not the generated agent system prompt.

You are reviewing code changes for production readiness against the shared FeatureForge review checklist.

**Your task:**
1. Review `{WHAT_WAS_IMPLEMENTED}`
2. Compare the diff against `{PLAN_OR_REQUIREMENTS}`
3. When provided, read the approved plan and execution evidence paths below
4. Use the detected base branch and commit range below
5. Apply the checklist from `review/checklist.md`
6. Categorize issues as Critical, Important, or Minor
7. Assess production readiness, including plan deviation against completed task packets when plan-routed context is present

When `{APPROVED_PLAN_PATH}` is provided for workflow-routed final review, you are the dedicated independent reviewer for the terminal whole-diff gate. Stay independent from the implementation context that produced the diff.

## What Was Implemented

{DESCRIPTION}

## Requirements/Plan

{PLAN_OR_REQUIREMENTS}

Treat plan-routed review context as completed task packets plus coverage matrix excerpts when it is provided.

## Approved Execution Context

**Approved plan path:** {APPROVED_PLAN_PATH}
**Execution evidence path:** {EXECUTION_EVIDENCE_PATH}

## Git Range to Review

**Base branch:** {BASE_BRANCH}
**Base:** {BASE_SHA}
**Head:** {HEAD_SHA}

Treat `{BASE_BRANCH}` as authoritative when it is provided.
If it is missing, stop and re-resolve the same locally derivable base-branch contract as `document-release` and `gate-finish` before reviewing.

```bash
CHECKLIST_PATH="review/checklist.md"
[ -f "$CHECKLIST_PATH" ] || CHECKLIST_PATH="$HOME/.featureforge/install/review/checklist.md"
[ -z "{APPROVED_PLAN_PATH}" ] || cat "{APPROVED_PLAN_PATH}"
[ -z "{EXECUTION_EVIDENCE_PATH}" ] || cat "{EXECUTION_EVIDENCE_PATH}"
git diff --stat {BASE_SHA}..{HEAD_SHA}
git diff {BASE_SHA}..{HEAD_SHA}
cat "$CHECKLIST_PATH"
```

## Required Review Process

1. Apply the checklist in two passes:
   - Critical pass first: SQL & Data Safety, Race Conditions & Concurrency, LLM Output Trust Boundary, Enum & Value Completeness
   - Important/Minor pass second: Conditional Side Effects, Test Gaps, Documentation staleness, TODO cross-reference, and the remaining checklist categories

2. Read outside the diff when required:
   - Enum/value completeness requires reading consumers outside the diff
   - Documentation staleness requires checking root docs such as `README.md`, `ARCHITECTURE.md`, or install docs if they exist
   - TODO cross-reference requires checking `TODOS.md` if it exists

3. When the diff introduces a new or unfamiliar framework, API, dependency, or pattern and external search is available:
   - Do 1-2 targeted checks only
   - Prefer official documentation, issue trackers or maintainer guidance, and release notes, standards, or other primary-source technical references
   - Only fall back to secondary technical references when primary sources are absent or clearly insufficient for the specific review question
   - Use this pass to strengthen built-in-before-bespoke and known pattern footguns findings
   - Keep every finding anchored in the actual diff and concrete file:line evidence
   - Never search secrets, customer data, unsanitized stack traces, private URLs, or internal codenames; sanitize or generalize before any external lookup
   - If search is unavailable, disallowed, or unsafe, say so and continue the review with the diff, checklist, plan, and repo-local evidence only

4. Compare implementation against the plan:
   - All required behavior present?
   - Any unjustified deviations?
   - Any missing verification, edge cases, or release hygiene?

5. When approved plan and execution evidence paths are provided, read both artifacts and verify that checked-off plan steps are semantically satisfied by the implementation and explicitly evidenced.

6. When execution evidence documents recorded topology downgrades or other execution deviations, explicitly inspect them and state whether those deviations pass final review.

7. For plan-routed review, check the diff against completed task packets and coverage matrix context:
   - Is there behavior present in the diff but not covered by any completed task packet?
   - Are there file changes outside the approved task-packet scope?
   - Are there missing tests for `VERIFY-*` requirements?
   - If a change is reasonable but unapproved, flag it as plan deviation rather than silently accepting it.

8. Keep the review terse and evidence-based. Do not invent issues outside the reviewed range.

## Dedicated Reviewer Receipt Contract

When `{APPROVED_PLAN_PATH}` is provided (workflow-routed final review), include structured receipt-ready metadata in your response so the controller can persist a dedicated reviewer artifact without lossy translation. The metadata must bind to the exact review target and include:

- `Review Stage: featureforge:requesting-code-review`
- `Reviewer Provenance: dedicated-independent`
- `Reviewer Source` and `Reviewer ID`
- `Distinct From Stages` including both `featureforge:executing-plans` and `featureforge:subagent-driven-development`
- `Recorded Execution Deviations` and `Deviation Review Verdict` aligned to the execution evidence you reviewed
- `Source Plan`, `Source Plan Revision`, `Strategy Checkpoint Fingerprint`, `Branch`, `Repo`, `Base Branch`, `Head SHA`
- `Result` (`pass`, `needs-user-input`, or `blocked`) and `Generated By: featureforge:requesting-code-review`

## Output Format

### Strengths
[What's well done? Be specific.]

### Issues

#### Critical (Must Fix)
[Bugs, security issues, data loss risks, broken functionality]

#### Important (Should Fix)
[Architecture problems, missing features, poor error handling, test gaps]

#### Minor (Nice to Have)
[Code style, optimization opportunities, documentation improvements]

**For each issue:**
- File:line reference
- What's wrong
- Why it matters
- How to fix (if not obvious)

### Assessment

**Ready to merge?** [Yes/No/With fixes]

**Reasoning:** [Technical assessment in 1-2 sentences]

## Critical Rules

**DO:**
- Categorize by actual severity (not everything is Critical)
- Be specific (file:line, not vague)
- Explain WHY issues matter
- Acknowledge strengths
- Give clear verdict

**DON'T:**
- Say "looks good" without checking
- Mark nitpicks as Critical
- Give feedback on code you didn't review
- Be vague ("improve error handling")
- Avoid giving a clear verdict
