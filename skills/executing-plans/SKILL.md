---
name: executing-plans
description: Use when you have an engineering-approved FeatureForge implementation plan and need to execute it in a separate session
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: node scripts/gen-skill-docs.mjs -->

## Preamble (run first)

```bash
_IS_FEATUREFORGE_RUNTIME_ROOT() {
  local candidate="$1"
  [ -n "$candidate" ] &&
  [ -x "$candidate/bin/featureforge" ] &&
  [ -f "$candidate/VERSION" ]
}
_REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
_BRANCH_RAW=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo current)
[ -n "$_BRANCH_RAW" ] || _BRANCH_RAW="current"
[ "$_BRANCH_RAW" != "HEAD" ] || _BRANCH_RAW="current"
_BRANCH="$_BRANCH_RAW"
_FEATUREFORGE_ROOT=""
_IS_FEATUREFORGE_RUNTIME_ROOT "$_REPO_ROOT" && _FEATUREFORGE_ROOT="$_REPO_ROOT"
[ -z "$_FEATUREFORGE_ROOT" ] && _IS_FEATUREFORGE_RUNTIME_ROOT "$HOME/.featureforge/install" && _FEATUREFORGE_ROOT="$HOME/.featureforge/install"
[ -z "$_FEATUREFORGE_ROOT" ] && _IS_FEATUREFORGE_RUNTIME_ROOT "$HOME/.codex/featureforge" && _FEATUREFORGE_ROOT="$HOME/.codex/featureforge"
[ -z "$_FEATUREFORGE_ROOT" ] && _IS_FEATUREFORGE_RUNTIME_ROOT "$HOME/.copilot/featureforge" && _FEATUREFORGE_ROOT="$HOME/.copilot/featureforge"
_UPD=""
[ -n "$_FEATUREFORGE_ROOT" ] && _UPD=$("$_FEATUREFORGE_ROOT/bin/featureforge" update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
_SP_STATE_DIR="${FEATUREFORGE_STATE_DIR:-$HOME/.featureforge}"
mkdir -p "$_SP_STATE_DIR/sessions"
touch "$_SP_STATE_DIR/sessions/$PPID"
_SESSIONS=$(find "$_SP_STATE_DIR/sessions" -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
find "$_SP_STATE_DIR/sessions" -mmin +120 -type f -delete 2>/dev/null || true
_CONTRIB=""
[ -n "$_FEATUREFORGE_ROOT" ] && _CONTRIB=$("$_FEATUREFORGE_ROOT/bin/featureforge" config get featureforge_contributor 2>/dev/null || true)
```

If output shows `UPGRADE_AVAILABLE <old> <new>`: read the installed `featureforge-upgrade/SKILL.md` from the same featureforge root (check the current repo when it contains the FeatureForge runtime, then `$HOME/.featureforge/install`, then `$HOME/.codex/featureforge`, then `$HOME/.copilot/featureforge`) and follow the "Inline upgrade flow" (auto-upgrade if configured, otherwise ask one interactive user question with 4 options and write snooze state if declined). If `JUST_UPGRADED <from> <to>`: tell the user "Running featureforge v{to} (just updated!)" and continue.

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


# Executing Plans

## Overview

Load plan, review critically, execute all tasks in a separate session, request final review, then report when complete.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

**Note:** Prefer `featureforge:subagent-driven-development` whenever isolated-agent support is available and you want same-session isolated-agent execution. Use this skill when implementation should happen in a separate session.

## The Process

### Step 1: Implementation Preflight
1. Require the exact approved plan path as input. If you are not given one, stop and ask for it or route back to `featureforge:plan-eng-review`.
2. Read the plan file first.
3. Verify these exact header lines exist and are current:
   - `**Workflow State:** Engineering Approved`
   - `**Source Spec:** <path>`
   - `**Source Spec Revision:** <integer>`
4. Read the source spec named in the plan and confirm it is still `CEO Approved`, and that the latest approved spec still matches that exact source-spec path and revision.
5. Stop immediately and redirect:
   - to `featureforge:plan-eng-review` if the plan is draft or malformed
   - to `featureforge:writing-plans` if the source spec path or revision is stale
6. Verify workspace readiness before starting:
   - stop on a default protected branch (`main`, `master`, `dev`, or `develop`) unless the user explicitly approves in-place execution
   - stop on detached HEAD
   - stop if merge conflicts, unresolved index entries, rebase, or cherry-pick state is present
   - if the working tree is dirty, stop and ask the user to confirm the workspace is intentionally prepared
7. Do not auto-clean the workspace and do not auto-create a worktree.
8. The later repo-safety checks still govern any additional protected branches declared through repo or user instructions.
9. Run `featureforge plan execution preflight --plan <approved-plan-path>` before starting execution.
10. If the preflight helper returns `allowed` `false`, stop and resolve the reported `failure_class`, `reason_codes`, and `diagnostics` before starting work.
11. If preflight passes, review the plan critically for execution concerns and use the approved plan checklist as the execution progress record.

## Helper-Owned Execution State

- calls `status --plan ...` during preflight
- calls `preflight --plan ...` before execution starts
- calls `begin` before starting work on a plan step
- calls `complete` after each completed step
- calls `note` when work is interrupted or blocked
- On the first `begin` for a revision whose plan still says `**Execution Mode:** none`, initialize execution with `--execution-mode featureforge:executing-plans`
- The approved plan checklist is the execution progress record; do not create or maintain a separate authoritative task tracker.

## Protected-Branch Repo-Write Gate

Before starting any plan step that mutates repo state, run the shared repo-safety preflight for that exact task slice:

```bash
featureforge repo-safety check --intent write --stage featureforge:executing-plans --task-id <current-task-slice> --path <repo-relative-path> --write-target execution-task-slice
```

- Use one stable task id per repo-writing task slice and pass the concrete repo-relative paths when they are known.
- If the helper returns `allowed`, continue with that task slice.
- If it returns `blocked`, name the branch, the stage, and the blocking `failure_class`, then route to either a feature branch / `featureforge:using-git-worktrees` or explicit user approval for this exact task slice.
- If the user explicitly approves the protected-branch write, approve the full task-slice scope you intend to use on that branch, including the repo-relative paths and any follow-on git targets that are part of the same slice:

```bash
featureforge repo-safety approve --stage featureforge:executing-plans --task-id <current-task-slice> --reason "<explicit user approval>" --path <repo-relative-path> --write-target execution-task-slice [--write-target git-commit] [--write-target git-merge] [--write-target git-push]
featureforge repo-safety check --intent write --stage featureforge:executing-plans --task-id <current-task-slice> --path <repo-relative-path> --write-target execution-task-slice [--write-target git-commit] [--write-target git-merge] [--write-target git-push]
```

- Continue only if the re-check returns `allowed`.
- Before a follow-on `git commit`, `git merge`, or `git push` on the same protected-branch task slice, re-run the gate with the same task id, the same repo-relative paths, and the same approved write-target set.
- If the protected-branch task scope changes, run a new `approve` plus full-scope `check` before continuing.
- Do not treat a worktree on `main`, `master`, `dev`, or `develop` as safe by itself; the branch must be non-protected or explicitly approved.

### Step 2: Execute Tasks

For each task:
1. Before starting a task, build the canonical task packet:

```bash
"$_FEATUREFORGE_ROOT/bin/featureforge" plan contract build-task-packet \
  --plan <approved-plan-path> \
  --task <task-number> \
  --format markdown \
  --persist yes
```

2. treat it as the exact task contract for that execution segment. Coordinator-added logistics may clarify branch, cwd, or base commit, but they may not reinterpret approved requirements.
3. Use the approved plan checklist as the visible progress record for the task's steps.
4. Follow each step exactly (plan has bite-sized steps).
5. Run verifications as specified.
6. If the packet is malformed, stale, or still leaves ambiguity unresolved, stop and route back to review instead of guessing.
7. Call `complete` as soon as a step is truly satisfied so the plan checkbox flips to `- [x]`.

### Step 3: Request Final Review

After all tasks complete and verified:
- Announce: "I'm using the requesting-code-review skill for the final review pass."
- **REQUIRED SUB-SKILL:** Use `featureforge:requesting-code-review`
- Resolve any Critical or Important findings before proceeding

### Step 4: Complete Development

After the final review is resolved:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use featureforge:finishing-a-development-branch
- Follow that skill to verify tests, require `qa-only` when browser QA is warranted, require `document-release` for workflow-routed work, present options, and execute the chosen completion path

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Remember
- Review plan critically first
- Start only from an engineering-approved current plan
- Follow plan steps exactly
- Don't skip verifications
- Reference skills when plan says to
- Stop when blocked, don't guess
- Never start implementation on a default protected branch (`main`, `master`, `dev`, or `develop`) without explicit user consent
- Workspace preparation is the user's responsibility; `featureforge:using-git-worktrees` is optional, not automatic

## Integration

**Required workflow skills:**
- **featureforge:writing-plans** - Creates the plan this skill executes
- **featureforge:plan-eng-review** - Provides the approved plan and the execution preflight handoff
- **featureforge:requesting-code-review** - REQUIRED: Final review gate after execution completes
- **featureforge:finishing-a-development-branch** - Complete development after all tasks

**Optional manual prep:**
- **featureforge:using-git-worktrees** - Use when the user wants isolated workspace management before execution
