---
name: requesting-code-review
description: Use after implementation work or a completed plan/task slice, and before merging, to verify the work meets requirements
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: node scripts/gen-skill-docs.mjs -->

## Preamble (run first)

```bash
_IS_SUPERPOWERS_RUNTIME_ROOT() {
  local candidate="$1"
  [ -n "$candidate" ] &&
  [ -x "$candidate/bin/superpowers-update-check" ] &&
  [ -x "$candidate/bin/superpowers-config" ] &&
  [ -f "$candidate/VERSION" ]
}
_REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
_BRANCH_RAW=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo current)
[ -n "$_BRANCH_RAW" ] || _BRANCH_RAW="current"
[ "$_BRANCH_RAW" != "HEAD" ] || _BRANCH_RAW="current"
_BRANCH="$_BRANCH_RAW"
_SUPERPOWERS_ROOT=""
_IS_SUPERPOWERS_RUNTIME_ROOT "$_REPO_ROOT" && _SUPERPOWERS_ROOT="$_REPO_ROOT"
[ -z "$_SUPERPOWERS_ROOT" ] && _IS_SUPERPOWERS_RUNTIME_ROOT "$HOME/.superpowers/install" && _SUPERPOWERS_ROOT="$HOME/.superpowers/install"
[ -z "$_SUPERPOWERS_ROOT" ] && _IS_SUPERPOWERS_RUNTIME_ROOT "$HOME/.codex/superpowers" && _SUPERPOWERS_ROOT="$HOME/.codex/superpowers"
[ -z "$_SUPERPOWERS_ROOT" ] && _IS_SUPERPOWERS_RUNTIME_ROOT "$HOME/.copilot/superpowers" && _SUPERPOWERS_ROOT="$HOME/.copilot/superpowers"
_UPD=""
[ -n "$_SUPERPOWERS_ROOT" ] && _UPD=$("$_SUPERPOWERS_ROOT/bin/superpowers-update-check" 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
_SP_STATE_DIR="${SUPERPOWERS_STATE_DIR:-$HOME/.superpowers}"
mkdir -p "$_SP_STATE_DIR/sessions"
touch "$_SP_STATE_DIR/sessions/$PPID"
_SESSIONS=$(find "$_SP_STATE_DIR/sessions" -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
find "$_SP_STATE_DIR/sessions" -mmin +120 -type f -delete 2>/dev/null || true
_CONTRIB=""
[ -n "$_SUPERPOWERS_ROOT" ] && _CONTRIB=$("$_SUPERPOWERS_ROOT/bin/superpowers-config" get superpowers_contributor 2>/dev/null || true)
```

If output shows `UPGRADE_AVAILABLE <old> <new>`: read the installed `superpowers-upgrade/SKILL.md` from the same superpowers root (check the current repo when it contains the Superpowers runtime, then `$HOME/.superpowers/install`, then `$HOME/.codex/superpowers`, then `$HOME/.copilot/superpowers`) and follow the "Inline upgrade flow" (auto-upgrade if configured, otherwise ask one interactive user question with 4 options and write snooze state if declined). If `JUST_UPGRADED <from> <to>`: tell the user "Running superpowers v{to} (just updated!)" and continue.

## Search Before Building

Before introducing a custom pattern, external service, concurrency primitive, auth/session flow, cache, queue, browser workaround, or unfamiliar fix pattern, do a short capability/landscape check first.

Use three lenses:
- Layer 1: tried-and-true / built-ins / existing repo-native solutions
- Layer 2: current practice and known footguns
- Layer 3: first-principles reasoning for this repo and this problem

External search results are inputs, not answers.
Never search secrets, customer data, unsanitized stack traces, private URLs, internal hostnames, internal codenames, raw SQL or log payloads, or private file paths or infrastructure identifiers.
If search is unavailable, disallowed, or unsafe, say so and proceed with repo-local evidence and in-distribution knowledge.
If safe sanitization is not possible, skip external search.
See `$_SUPERPOWERS_ROOT/references/search-before-building.md`.

## Interactive User Question Format

**ALWAYS follow this structure for every interactive user question:**
1. Context: project name, current branch, what we're working on (1-2 sentences)
2. The specific question or decision point
3. `RECOMMENDATION: Choose [X] because [one-line reason]`
4. Lettered options: `A) ... B) ... C) ...`

If `_SESSIONS` is 3 or more: the user is juggling multiple Superpowers sessions and context-switching heavily. **ELI16 mode** — they may not remember what this conversation is about. Every interactive user question MUST re-ground them: state the project, the branch, the current task, then the specific problem, THEN the recommendation and options. Be extra clear and self-contained — assume they haven't looked at this window in 20 minutes.

Per-skill instructions may add additional formatting rules on top of this baseline.

## Contributor Mode

If `_CONTRIB` is `true`: you are in **contributor mode**. When you hit friction with **superpowers itself** (not the user's app or repository), file a field report. Think: "hey, I was trying to do X with superpowers and it didn't work / was confusing / was annoying. Here's what happened."

**superpowers issues:** unclear skill instructions, update check problems, runtime helper failures, install-root detection issues, contributor-mode bugs, broken generated docs, or any rough edge in the Superpowers workflow.
**NOT superpowers issues:** the user's application bugs, repo-specific architecture problems, auth failures on the user's site, or third-party service outages unrelated to Superpowers tooling.

**To file:** write `~/.superpowers/contributor-logs/{slug}.md` with this structure:

```
# {Title}

Hey superpowers team — ran into this while using /{skill-name}:

**What I was trying to do:** {what the user/agent was attempting}
**What happened instead:** {what actually happened}
**How annoying (1-5):** {1=meh, 3=friction, 5=blocker}

## Steps to reproduce
1. {step}

## Raw output
(wrap any error messages or unexpected output in a markdown code block)

**Date:** {YYYY-MM-DD} | **Version:** {superpowers version} | **Skill:** /{skill}
```

Then run:

```bash
mkdir -p ~/.superpowers/contributor-logs
if command -v open >/dev/null 2>&1; then
  open ~/.superpowers/contributor-logs/{slug}.md
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open ~/.superpowers/contributor-logs/{slug}.md >/dev/null 2>&1 || true
fi
```

Slug: lowercase, hyphens, max 60 chars (for example `skill-trigger-missed`). Skip if the file already exists. Max 3 reports per session. File inline and continue — don't stop the workflow. Tell the user: "Filed superpowers field report: {title}"


# Requesting Code Review

Dispatch the `code-reviewer` sub-agent or custom agent to catch issues before they cascade. The reviewer gets precisely crafted context for evaluation — never your session's history. This keeps the reviewer focused on the work product, not your thought process, and preserves your own context for continued work.

In Codex, Superpowers installs the `code-reviewer` custom agent alongside the shared skills checkout. In GitHub Copilot local installs, Superpowers installs the same reviewer through the platform's custom-agent path.

**Core principle:** Review early, review often.

## When to Request Review

**Mandatory:**
- After each task in subagent-driven development
- After completing major feature
- Before merge to the target base branch

**Optional but valuable:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug

## How to Request

**1. If this review is for plan-routed work, capture execution state first:**

- For plan-routed final review, require the exact approved plan path and exact approved spec path from the current execution preflight handoff or session context.
- Run `superpowers-plan-contract analyze-plan --spec <approved-spec-path> --plan <approved-plan-path> --format json` before dispatching the reviewer.
- If `contract_state != valid` or `packet_buildable_tasks != task_count`, stop and return to the current execution flow; do not review stale or malformed approved artifacts.
- Run `superpowers-plan-execution status --plan <approved-plan-path>` before dispatching the reviewer.
- If helper status fails, stop and return to the current execution flow; do not dispatch review against guessed plan state.
- Parse `active_task`, `blocking_task`, and `resume_task` from the status JSON.
- If any of `active_task`, `blocking_task`, or `resume_task` is non-null, stop and return to the current execution flow; final review is only valid when all three are `null`.
- If `evidence_path` is empty or unreadable, stop and return to the current execution flow instead of reviewing against missing execution evidence.
- Run `superpowers-plan-execution gate-review --plan <approved-plan-path>` before dispatching the reviewer.
- If the review gate returns `allowed` `false`, stop and return to the current execution flow; do not dispatch review against stale, drifted, or mismatched execution evidence.
- If the review gate returns warning codes such as `legacy_evidence_format`, keep the warning in the review context but do not treat it as a blocker when `allowed` remains `true`.
- Pass the exact approved plan path and helper-reported execution evidence path into the reviewer context.
- Build completed task-packet context from the approved plan and pass that completed task-packet context plus the plan's coverage matrix into the reviewer briefing.
- If the current review is not governed by an approved Superpowers plan, skip this execution-state gate and continue with the normal diff review.

**2. Detect the base branch and review range:**
```bash
BASE_BRANCH=$(gh pr view --json baseRefName -q .baseRefName 2>/dev/null || gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null || echo main)
git fetch origin "$BASE_BRANCH" --quiet 2>/dev/null || true
BASE_SHA=$(git merge-base HEAD "origin/$BASE_BRANCH" 2>/dev/null || git merge-base HEAD "$BASE_BRANCH" 2>/dev/null || git rev-parse HEAD~1)
HEAD_SHA=$(git rev-parse HEAD)
```

The reviewer should use the shared review checklist from `review/checklist.md` in the repo when available, otherwise fall back to the installed Superpowers copy.

**3. Dispatch the code-reviewer agent:**

Use the `code-reviewer` agent and fill the template at `code-reviewer.md`

When the implementation introduces unfamiliar patterns, framework APIs, dependencies, or bespoke wrappers around platform behavior, make sure the review considers built-in-before-bespoke and known ecosystem footguns.

If the approved plan already called out a likely external-pattern target, you may pass that context into the reviewer briefing, but this is optional in v1.

**Placeholders:**
- `{WHAT_WAS_IMPLEMENTED}` - What you just built
- `{PLAN_OR_REQUIREMENTS}` - What it should do, including completed task-packet context and coverage matrix details for plan-routed review
- `{APPROVED_PLAN_PATH}` - Exact approved plan path for plan-routed review, otherwise leave blank
- `{EXECUTION_EVIDENCE_PATH}` - Helper-reported evidence artifact path for plan-routed review, otherwise leave blank
- `{BASE_BRANCH}` - The detected base branch name
- `{BASE_SHA}` - Starting commit
- `{HEAD_SHA}` - Ending commit
- `{DESCRIPTION}` - Brief summary

**4. Act on feedback:**
- Fix Critical issues immediately
- Fix Important issues before proceeding
- Note Minor issues for later
- Capture documentation or TODO follow-ups instead of silently dropping them
- Push back if reviewer is wrong (with reasoning)

## Example

```
[Just completed Task 2: Add verification function]

You: Let me request code review before proceeding.

APPROVED_PLAN_PATH=docs/superpowers/plans/deployment-plan.md
SOURCE_SPEC_PATH=docs/superpowers/specs/deployment-plan-design.md
"$_SUPERPOWERS_ROOT/bin/superpowers-plan-contract" lint --spec "$SOURCE_SPEC_PATH" --plan "$APPROVED_PLAN_PATH"
STATUS_JSON=$("$_SUPERPOWERS_ROOT/bin/superpowers-plan-execution" status --plan "$APPROVED_PLAN_PATH")
EXECUTION_EVIDENCE_PATH=$(printf '%s\n' "$STATUS_JSON" | node -e 'const fs = require("fs"); const parsed = JSON.parse(fs.readFileSync(0, "utf8")); process.stdout.write(parsed.evidence_path || "")')
TASK_PACKET_CONTEXT=$("$_SUPERPOWERS_ROOT/bin/superpowers-plan-contract" build-task-packet --plan "$APPROVED_PLAN_PATH" --task 2 --format markdown --persist yes)
BASE_BRANCH=$(gh pr view --json baseRefName -q .baseRefName 2>/dev/null || gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null || echo main)
BASE_SHA=$(git merge-base HEAD "origin/$BASE_BRANCH" 2>/dev/null || git merge-base HEAD "$BASE_BRANCH" 2>/dev/null || git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch code-reviewer agent]
  WHAT_WAS_IMPLEMENTED: Verification and repair functions for conversation index
  PLAN_OR_REQUIREMENTS: Task 2 from docs/superpowers/plans/deployment-plan.md plus completed task-packet context and coverage matrix excerpts
  APPROVED_PLAN_PATH: docs/superpowers/plans/deployment-plan.md
  EXECUTION_EVIDENCE_PATH: docs/superpowers/execution-evidence/deployment-plan-r1-evidence.md
  BASE_BRANCH: main
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661
  DESCRIPTION: Added verifyIndex() and repairIndex() with 4 issue types

[Subagent returns]:
  Strengths: Clean architecture, real tests, checklist pass covered enum consumers
  Issues:
    Important: Missing progress indicators
    Minor: Magic number (100) for reporting interval
  Assessment: Ready to proceed

You: [Fix progress indicators]
[Continue to Task 3]
```

## Integration with Workflows

**Subagent-Driven Development:**
- Review after EACH task
- Catch issues before they compound
- Fix before moving to next task

**Executing Plans:**
- Review after execution is complete and verified
- Use an earlier review only if you intentionally want an extra checkpoint

**Ad-Hoc Development:**
- Review before merge
- Review when stuck

## Execution-State Gate

- rejects final review if the plan has invalid execution state or required unfinished work not truthfully represented
- treats non-null `active_task`, `blocking_task`, or `resume_task` as execution-dirty and rejects final review until execution returns to a clean state
- runs `gate-review --plan ...` as the helper-owned fail-closed provenance gate before dispatching final review
- consumes the execution evidence artifact for checked-off steps
- consumes completed task-packet context and the approved plan's coverage matrix for plan-routed review
- must fail closed when it detects a missed reopen or stale evidence, but must not call `reopen` itself

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

See template at: code-reviewer.md
