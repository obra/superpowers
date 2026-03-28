---
name: requesting-code-review
description: Use after implementation work or an intentional review checkpoint, and before merging, to verify the work meets requirements
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: node scripts/gen-skill-docs.mjs -->

## Preamble (run first)

```bash
_REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
_BRANCH_RAW=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo current)
[ -n "$_BRANCH_RAW" ] || _BRANCH_RAW="current"
[ "$_BRANCH_RAW" != "HEAD" ] || _BRANCH_RAW="current"
_BRANCH="$_BRANCH_RAW"
_FEATUREFORGE_INSTALL_ROOT="$HOME/.featureforge/install"
_FEATUREFORGE_ROOT=""
_FEATUREFORGE_BIN="$_FEATUREFORGE_INSTALL_ROOT/bin/featureforge"
if [ ! -x "$_FEATUREFORGE_BIN" ] && [ -f "$_FEATUREFORGE_INSTALL_ROOT/bin/featureforge.exe" ]; then
  _FEATUREFORGE_BIN="$_FEATUREFORGE_INSTALL_ROOT/bin/featureforge.exe"
fi
[ -x "$_FEATUREFORGE_BIN" ] || [ -f "$_FEATUREFORGE_BIN" ] || _FEATUREFORGE_BIN=""
_FEATUREFORGE_RUNTIME_ROOT_PATH=""
if [ -n "$_FEATUREFORGE_BIN" ] && _FEATUREFORGE_RUNTIME_ROOT_PATH=$("$_FEATUREFORGE_BIN" repo runtime-root --path 2>/dev/null); then
  [ -n "$_FEATUREFORGE_RUNTIME_ROOT_PATH" ] && _FEATUREFORGE_ROOT="$_FEATUREFORGE_RUNTIME_ROOT_PATH"
fi
_UPD=""
[ -n "$_FEATUREFORGE_BIN" ] && _UPD=$("$_FEATUREFORGE_BIN" update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
_SP_STATE_DIR="${FEATUREFORGE_STATE_DIR:-$HOME/.featureforge}"
mkdir -p "$_SP_STATE_DIR/sessions"
touch "$_SP_STATE_DIR/sessions/$PPID"
_SESSIONS=$(find "$_SP_STATE_DIR/sessions" -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
find "$_SP_STATE_DIR/sessions" -mmin +120 -type f -delete 2>/dev/null || true
_CONTRIB=""
[ -n "$_FEATUREFORGE_BIN" ] && _CONTRIB=$("$_FEATUREFORGE_BIN" config get featureforge_contributor 2>/dev/null || true)
```

If output shows `UPGRADE_AVAILABLE <old> <new>`: read `featureforge-upgrade/SKILL.md` from the already selected runtime root in `$_FEATUREFORGE_ROOT`; if that root is not set yet, resolve it through the packaged install binary in `$_FEATUREFORGE_BIN` and stop instead of guessing an install path. Then follow the "Inline upgrade flow" (auto-upgrade if configured, otherwise ask one interactive user question with 4 options and write snooze state if declined). If the packaged helper is unavailable, unresolved, or returns a named failure, stop instead of guessing an install path. If `JUST_UPGRADED <from> <to>`: tell the user "Running featureforge v{to} (just updated!)" and continue.

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
See `$_FEATUREFORGE_ROOT/references/search-before-building.md`.

## Interactive User Question Format

**ALWAYS follow this structure for every interactive user question:**
1. Context: project name, current branch, what we're working on (1-2 sentences)
2. The specific question or decision point
3. `RECOMMENDATION: Choose [X] because [one-line reason]`
4. Lettered options: `A) ... B) ... C) ...`

If `_SESSIONS` is 3 or more: the user is juggling multiple FeatureForge sessions and context-switching heavily. **ELI16 mode** — they may not remember what this conversation is about. Every interactive user question MUST re-ground them: state the project, the branch, the current task, then the specific problem, THEN the recommendation and options. Be extra clear and self-contained — assume they haven't looked at this window in 20 minutes.

Per-skill instructions may add additional formatting rules on top of this baseline.

## Contributor Mode

If `_CONTRIB` is `true`: you are in **contributor mode**. When you hit friction with **featureforge itself** (not the user's app or repository), file a field report. Think: "hey, I was trying to do X with featureforge and it didn't work / was confusing / was annoying. Here's what happened."

**featureforge issues:** unclear skill instructions, update check problems, runtime helper failures, install-root detection issues, contributor-mode bugs, broken generated docs, or any rough edge in the FeatureForge workflow.
**NOT featureforge issues:** the user's application bugs, repo-specific architecture problems, auth failures on the user's site, or third-party service outages unrelated to FeatureForge tooling.

**To file:** write `~/.featureforge/contributor-logs/{slug}.md` with this structure:

```
# {Title}

Hey featureforge team — ran into this while using /{skill-name}:

**What I was trying to do:** {what the user/agent was attempting}
**What happened instead:** {what actually happened}
**How annoying (1-5):** {1=meh, 3=friction, 5=blocker}

## Steps to reproduce
1. {step}

## Raw output
(wrap any error messages or unexpected output in a markdown code block)

**Date:** {YYYY-MM-DD} | **Version:** {featureforge version} | **Skill:** /{skill}
```

Then run:

```bash
mkdir -p ~/.featureforge/contributor-logs
if command -v open >/dev/null 2>&1; then
  open ~/.featureforge/contributor-logs/{slug}.md
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open ~/.featureforge/contributor-logs/{slug}.md >/dev/null 2>&1 || true
fi
```

Slug: lowercase, hyphens, max 60 chars (for example `skill-trigger-missed`). Skip if the file already exists. Max 3 reports per session. File inline and continue — don't stop the workflow. Tell the user: "Filed featureforge field report: {title}"


# Requesting Code Review

Dispatch the `code-reviewer` sub-agent or custom agent to catch issues before they cascade. The reviewer gets precisely crafted context for evaluation — never your session's history. This keeps the reviewer focused on the work product, not your thought process, and preserves your own context for continued work.

In Codex, FeatureForge installs the `code-reviewer` custom agent alongside the shared skills checkout. In GitHub Copilot local installs, FeatureForge installs the same reviewer through the platform's custom-agent path.

**Core principle:** Review at the right checkpoints, then fail closed on the final whole-diff gate.

## When to Request Review

**Mandatory:**
- For the final cross-task review gate in workflow-routed work
- After completing major feature
- Before merge to the target base branch

**Optional but valuable:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug

## How to Request

**1. If this review is for plan-routed work, capture execution state first:**

- For plan-routed final review, require the exact approved plan path and exact approved spec path from the current execution preflight handoff or session context.
- Run `featureforge plan contract analyze-plan --spec <approved-spec-path> --plan <approved-plan-path> --format json` before dispatching the reviewer.
- If `contract_state != valid` or `packet_buildable_tasks != task_count`, stop and return to the current execution flow; do not review stale or malformed approved artifacts.
- Run `featureforge plan execution status --plan <approved-plan-path>` before dispatching the reviewer.
- If helper status fails, stop and return to the current execution flow; do not dispatch review against guessed plan state.
- Parse `active_task`, `blocking_task`, and `resume_task` from the status JSON.
- If any of `active_task`, `blocking_task`, or `resume_task` is non-null, stop and return to the current execution flow; final review is only valid when all three are `null`.
- If `evidence_path` is empty or unreadable, stop and return to the current execution flow instead of reviewing against missing execution evidence.
- Run `featureforge plan execution gate-review --plan <approved-plan-path>` before dispatching the reviewer.
- If the review gate returns `allowed` `false`, stop and return to the current execution flow; do not dispatch review against stale, drifted, or mismatched execution evidence.
- If the review gate returns warning codes such as `legacy_evidence_format`, keep the warning in the review context but do not treat it as a blocker when `allowed` remains `true`.
- Pass the exact approved plan path and helper-reported execution evidence path into the reviewer context.
- Build completed task-packet context from the approved plan and pass that completed task-packet context plus the plan's coverage matrix into the reviewer briefing.
- If the current review is not governed by an approved FeatureForge plan, skip this execution-state gate and continue with the normal diff review.

**2. Detect the base branch and review range:**
```bash
BASE_BRANCH=""
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)
if [ -n "$CURRENT_BRANCH" ] && [ "$CURRENT_BRANCH" != "HEAD" ]; then
  case "$CURRENT_BRANCH" in
    main|master|develop|dev|trunk)
      BASE_BRANCH="$CURRENT_BRANCH"
      ;;
  esac
  [ -n "$BASE_BRANCH" ] || BASE_BRANCH=$(git config --get "branch.$CURRENT_BRANCH.gh-merge-base" 2>/dev/null || true)
fi
[ -n "$BASE_BRANCH" ] || BASE_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's#^refs/remotes/origin/##' || true)
if [ -z "$BASE_BRANCH" ]; then
  for candidate in main master develop dev trunk; do
    if git show-ref --verify --quiet "refs/heads/$candidate"; then
      BASE_BRANCH="$candidate"
      break
    fi
  done
fi
if [ -z "$BASE_BRANCH" ] && [ -n "$CURRENT_BRANCH" ] && [ "$CURRENT_BRANCH" != "HEAD" ]; then
  NON_CURRENT_BRANCHES=$(git for-each-ref --format='%(refname:short)' refs/heads 2>/dev/null | grep -vxF "$CURRENT_BRANCH" || true)
  NON_CURRENT_BRANCH_COUNT=$(printf '%s\n' "$NON_CURRENT_BRANCHES" | sed '/^$/d' | wc -l | tr -d ' ')
  if [ "$NON_CURRENT_BRANCH_COUNT" = "1" ]; then
    BASE_BRANCH=$(printf '%s\n' "$NON_CURRENT_BRANCHES" | sed '/^$/d')
  fi
fi
if [ -z "$BASE_BRANCH" ]; then
  echo "Could not determine the review base branch. Stop and resolve it before dispatching final review."
  exit 1
fi
git fetch origin "$BASE_BRANCH" --quiet 2>/dev/null || true
BASE_SHA=$(git merge-base HEAD "origin/$BASE_BRANCH" 2>/dev/null || git merge-base HEAD "$BASE_BRANCH" 2>/dev/null || git rev-parse HEAD~1)
HEAD_SHA=$(git rev-parse HEAD)
```

Do not use PR metadata or repo default-branch APIs as a fallback; keep the review base aligned with `featureforge:document-release` and `gate-finish`.

The reviewer should use the shared review checklist from `review/checklist.md` in the repo when available, otherwise fall back to the installed FeatureForge copy.

**3. Dispatch the code-reviewer agent:**

Use the `code-reviewer` agent and fill the template at `code-reviewer.md`

For workflow-routed final review, dispatch a dedicated fresh-context reviewer independent of the implementation context. Do not reuse the implementation agent or its session for the terminal whole-diff review gate.

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

**4.25. Enforce runtime-owned remediation checkpoints before fixes:**

- Do not jump directly into patching after actionable findings. In plan-routed execution, route through helper-owned reopen/remediation commands so runtime can record strategy checkpoints first.
- Runtime strategy checkpoints are execution-owned state, not planning-stage transitions. Do not route back to `writing-plans` or `plan-eng-review` just because remediation is needed.
- Required checkpoint behavior:
  - `review_remediation`: runtime records this automatically whenever `gate-review` dispatch is requested for reviewable execution work and when remediation work is reopened after non-pass findings.
  - `cycle_break`: runtime records this automatically when the same task hits three review-dispatch/reopen cycles in one run.
- Cycle-break trigger: cap review churn at 3 cycles per task. On the third cycle, runtime enters `cycle_break` strategy automatically (no human replanning loopback required).
- Keep plan/scope fixed during remediation. Runtime strategy may change topology, lane ownership, worktree allocation, subagent assignment, and remediation order, but must not change approved scope or source plan revision.
- Carry the active runtime checkpoint fingerprint into review artifacts and receipts so remediation and final review can be tied to the exact runtime strategy state.
- Check and surface runtime strategy status through `featureforge plan execution status --plan ...`:
  - `strategy_state`
  - `strategy_checkpoint_kind`
  - `last_strategy_checkpoint_fingerprint`
  - `strategy_reset_required`

**4.5. Persist workflow-routed review resolution:**

For workflow-routed final review, also write a project-scoped code-review artifact after the review is resolved and any required fixes land:

- Require the exact approved plan path from the current workflow context before writing the code-review artifact.
- Derive `Source Plan` and `Source Plan Revision` from that exact approved plan; do not leave placeholders or guess from prose.
- Use the base branch detected in Step 2 exactly as written; do not substitute a different branch name when persisting the artifact.
- Use the current `HEAD` exactly as written; if new repo changes land after review, treat the earlier artifact as stale and rerun `requesting-code-review`.
- Persist dedicated-review provenance in the artifact. For plan-routed final review, `Review Stage` must be `featureforge:requesting-code-review`, `Reviewer Provenance` must be `dedicated-independent`, `Reviewer Source` and `Reviewer ID` must be copied from the completed dedicated reviewer run, `Reviewer Artifact Path` must point at a runtime-owned dedicated reviewer artifact inside `$_SP_STATE_DIR/projects/$SLUG`, `Reviewer Artifact Fingerprint` must be the canonical fingerprint of that artifact, and `Distinct From Stages` must enumerate the implementation stages this reviewer is independent from.
- Require the referenced dedicated reviewer artifact to be a structured review receipt (not an ad-hoc note). It must include at least: `Review Stage`, `Reviewer Provenance`, `Reviewer Source`, `Reviewer ID`, `Distinct From Stages`, `Recorded Execution Deviations`, `Deviation Review Verdict`, `Source Plan`, `Source Plan Revision`, `Strategy Checkpoint Fingerprint`, `Base Branch`, `Head SHA`, `Result`, and `Generated By`.
- Persist explicit deviation disposition. When execution evidence recorded topology downgrades or other runtime execution deviations for the current run, set `Recorded Execution Deviations: present` and `Deviation Review Verdict: pass` only after the reviewer explicitly inspects those deviations. When no deviations were recorded, write `Recorded Execution Deviations: none` and `Deviation Review Verdict: not_required`.

```bash
_SLUG_ENV=$("$_FEATUREFORGE_BIN" repo slug 2>/dev/null || true)
if [ -n "$_SLUG_ENV" ]; then
  eval "$_SLUG_ENV"
fi
unset _SLUG_ENV
USER=$(whoami)
DATETIME=$(date +%Y%m%d-%H%M%S)
HEAD_SHA=$(git rev-parse HEAD)
mkdir -p "$_SP_STATE_DIR/projects/$SLUG"
```

Write to:
- `$_SP_STATE_DIR/projects/$SLUG/{user}-{safe-branch}-code-review-{datetime}.md`

For workflow-routed final review, this project artifact is the structured finish-gate input for final review freshness.

Use this structure:

```markdown
# Code Review Result
**Review Stage:** featureforge:requesting-code-review
**Reviewer Provenance:** dedicated-independent
**Reviewer Source:** fresh-context-subagent
**Reviewer ID:** 019d3550-c932-7bb2-9903-33f68d7c30ca
**Reviewer Artifact Path:** `$_SP_STATE_DIR/projects/$SLUG/{user}-{safe-branch}-independent-review-{datetime}.md`
**Reviewer Artifact Fingerprint:** aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
**Distinct From Stages:** featureforge:executing-plans, featureforge:subagent-driven-development
**Recorded Execution Deviations:** none
**Deviation Review Verdict:** not_required
**Source Plan:** `docs/featureforge/plans/...`
**Source Plan Revision:** 3
**Strategy Checkpoint Fingerprint:** aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
**Branch:** feature/foo
**Repo:** featureforge
**Base Branch:** main
**Head SHA:** abc1234
**Result:** pass
**Generated By:** featureforge:requesting-code-review
**Generated At:** 2026-03-24T12:10:00Z

## Summary
- reviewer identity or transport
- critical and important findings resolved or explicitly accepted
- remaining minor follow-ups
```

Dedicated reviewer artifact (the path referenced above) should use this structure:

```markdown
# Code Review Result
**Review Stage:** featureforge:requesting-code-review
**Reviewer Provenance:** dedicated-independent
**Reviewer Source:** fresh-context-subagent
**Reviewer ID:** 019d3550-c932-7bb2-9903-33f68d7c30ca
**Distinct From Stages:** featureforge:executing-plans, featureforge:subagent-driven-development
**Recorded Execution Deviations:** none
**Deviation Review Verdict:** not_required
**Source Plan:** `docs/featureforge/plans/...`
**Source Plan Revision:** 3
**Strategy Checkpoint Fingerprint:** aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
**Branch:** feature/foo
**Repo:** featureforge
**Base Branch:** main
**Head SHA:** abc1234
**Result:** pass
**Generated By:** featureforge:requesting-code-review
**Generated At:** 2026-03-24T12:09:50Z

## Summary
- dedicated independent reviewer findings and verdict
```

Allowed `**Result:**` values:
- `pass`
- `needs-user-input`
- `blocked`

## Example

```
[Implementation is complete for the current branch and I want the final whole-diff review gate]

You: Let me request the final code review gate before branch completion.

APPROVED_PLAN_PATH=docs/featureforge/plans/deployment-plan.md
SOURCE_SPEC_PATH=docs/featureforge/specs/deployment-plan-design.md
ANALYZE_JSON=$("$_FEATUREFORGE_BIN" plan contract analyze-plan --spec "$SOURCE_SPEC_PATH" --plan "$APPROVED_PLAN_PATH" --format json)
CONTRACT_STATE=$(printf '%s\n' "$ANALYZE_JSON" | node -e 'const fs = require("fs"); const parsed = JSON.parse(fs.readFileSync(0, "utf8")); process.stdout.write(parsed.contract_state || "")')
PACKET_BUILDABLE_TASKS=$(printf '%s\n' "$ANALYZE_JSON" | node -e 'const fs = require("fs"); const parsed = JSON.parse(fs.readFileSync(0, "utf8")); process.stdout.write(String(parsed.packet_buildable_tasks ?? ""))')
TASK_COUNT=$(printf '%s\n' "$ANALYZE_JSON" | node -e 'const fs = require("fs"); const parsed = JSON.parse(fs.readFileSync(0, "utf8")); process.stdout.write(String(parsed.task_count ?? ""))')
if [ "$CONTRACT_STATE" != "valid" ] || [ "$PACKET_BUILDABLE_TASKS" != "$TASK_COUNT" ]; then
  echo "Stop and return to execution: approved artifacts are stale or malformed."
  exit 1
fi
STATUS_JSON=$("$_FEATUREFORGE_BIN" plan execution status --plan "$APPROVED_PLAN_PATH")
ACTIVE_TASK=$(printf '%s\n' "$STATUS_JSON" | node -e 'const fs = require("fs"); const parsed = JSON.parse(fs.readFileSync(0, "utf8")); process.stdout.write(parsed.active_task == null ? "" : String(parsed.active_task))')
BLOCKING_TASK=$(printf '%s\n' "$STATUS_JSON" | node -e 'const fs = require("fs"); const parsed = JSON.parse(fs.readFileSync(0, "utf8")); process.stdout.write(parsed.blocking_task == null ? "" : String(parsed.blocking_task))')
RESUME_TASK=$(printf '%s\n' "$STATUS_JSON" | node -e 'const fs = require("fs"); const parsed = JSON.parse(fs.readFileSync(0, "utf8")); process.stdout.write(parsed.resume_task == null ? "" : String(parsed.resume_task))')
EXECUTION_EVIDENCE_PATH=$(printf '%s\n' "$STATUS_JSON" | node -e 'const fs = require("fs"); const parsed = JSON.parse(fs.readFileSync(0, "utf8")); process.stdout.write(parsed.evidence_path || "")')
if [ -n "$ACTIVE_TASK$BLOCKING_TASK$RESUME_TASK" ]; then
  echo "Stop and return to execution: final review is only valid when execution is clean."
  exit 1
fi
if [ -z "$EXECUTION_EVIDENCE_PATH" ]; then
  echo "Stop and return to execution: missing execution evidence path."
  exit 1
fi
REVIEW_GATE_JSON=$("$_FEATUREFORGE_BIN" plan execution gate-review --plan "$APPROVED_PLAN_PATH")
REVIEW_ALLOWED=$(printf '%s\n' "$REVIEW_GATE_JSON" | node -e 'const fs = require("fs"); const parsed = JSON.parse(fs.readFileSync(0, "utf8")); process.stdout.write(parsed.allowed ? "true" : "false")')
if [ "$REVIEW_ALLOWED" != "true" ]; then
  echo "Stop and return to execution: review gate rejected the current execution evidence."
  exit 1
fi
TASK_PACKET_CONTEXT_TASK_1=$("$_FEATUREFORGE_BIN" plan contract build-task-packet --plan "$APPROVED_PLAN_PATH" --task 1 --format markdown --persist yes)
TASK_PACKET_CONTEXT_TASK_2=$("$_FEATUREFORGE_BIN" plan contract build-task-packet --plan "$APPROVED_PLAN_PATH" --task 2 --format markdown --persist yes)
BASE_BRANCH=<same locally derived review base branch from Step 2>
BASE_SHA=$(git merge-base HEAD "origin/$BASE_BRANCH" 2>/dev/null || git merge-base HEAD "$BASE_BRANCH" 2>/dev/null || git rev-parse HEAD~1)
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch code-reviewer agent]
  WHAT_WAS_IMPLEMENTED: Final branch diff for the deployment plan
  PLAN_OR_REQUIREMENTS: Approved plan plus completed task-packet contexts for Tasks 1 and 2 and coverage matrix excerpts
  APPROVED_PLAN_PATH: docs/featureforge/plans/deployment-plan.md
  EXECUTION_EVIDENCE_PATH: docs/featureforge/execution-evidence/deployment-plan-r1-evidence.md
  BASE_BRANCH: main
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661
  DESCRIPTION: Final whole-diff review gate before branch completion

[Subagent returns]:
  Strengths: Clean architecture, real tests, checklist pass covered enum consumers
  Issues:
    Important: Missing progress indicators
    Minor: Magic number (100) for reporting interval
  Assessment: Ready to proceed

You: [Fix progress indicators]
[Continue to final verification / branch completion]
```

## Integration with Workflows

**Subagent-Driven Development:**
- Per-task spec-compliance and code-quality reviews happen inside `subagent-driven-development`
- Use `requesting-code-review` as the final whole-diff gate after all tasks, or earlier only when you intentionally want an extra checkpoint
- Resolve Critical and Important findings before handing off to branch completion

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
- requires the persisted final-review artifact to prove dedicated independent reviewer provenance and, when present, explicit deviation disposition
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
