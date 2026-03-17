---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session
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


# Executing Plans

## Overview

Load plan, review critically, execute all tasks in a separate session, request final review, then report when complete.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

**Note:** Prefer `superpowers:subagent-driven-development` whenever isolated-agent support is available and you want same-session isolated-agent execution. Use this skill when implementation should happen in a separate session.

## The Process

### Step 1: Implementation Preflight
1. Require the exact approved plan path as input. If you are not given one, stop and ask for it or route back to `superpowers:plan-eng-review`.
2. Read the plan file first.
3. Verify these exact header lines exist and are current:
   - `**Workflow State:** Engineering Approved`
   - `**Source Spec:** <path>`
   - `**Source Spec Revision:** <integer>`
4. Read the source spec named in the plan and confirm it is still `CEO Approved` at the same revision.
5. Stop immediately and redirect:
   - to `superpowers:plan-eng-review` if the plan is draft or malformed
   - to `superpowers:writing-plans` if the source spec revision is stale
6. Verify workspace readiness before starting:
   - stop on `main` or `master` unless the user explicitly approves in-place execution
   - stop on detached HEAD
   - stop if merge conflicts, unresolved index entries, rebase, or cherry-pick state is present
   - if the working tree is dirty, stop and ask the user to confirm the workspace is intentionally prepared
7. Do not auto-clean the workspace and do not auto-create a worktree.
8. If preflight passes, review the plan critically for execution concerns and then track the work in your platform's task checklist.

### Step 2: Execute Tasks

For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed

### Step 3: Request Final Review

After all tasks complete and verified:
- Announce: "I'm using the requesting-code-review skill for the final review pass."
- **REQUIRED SUB-SKILL:** Use `superpowers:requesting-code-review`
- Resolve any Critical or Important findings before proceeding

### Step 4: Complete Development

After the final review is resolved:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch
- Follow that skill to verify tests, offer optional `superpowers:qa-only` when appropriate, present options, and execute the chosen completion path

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
- Never start implementation on main/master branch without explicit user consent
- Workspace preparation is the user's responsibility; `superpowers:using-git-worktrees` is optional, not automatic

## Integration

**Required workflow skills:**
- **superpowers:writing-plans** - Creates the plan this skill executes
- **superpowers:plan-eng-review** - Provides the approved plan and execution handoff
- **superpowers:requesting-code-review** - REQUIRED: Final review gate after execution completes
- **superpowers:finishing-a-development-branch** - Complete development after all tasks

**Optional manual prep:**
- **superpowers:using-git-worktrees** - Use when the user wants isolated workspace management before execution
