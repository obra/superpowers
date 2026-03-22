---
name: using-superpowers
description: Use when starting any conversation or deciding which skill or workflow stage applies before any response, clarification, or action
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: node scripts/gen-skill-docs.mjs -->

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>

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
_SP_STATE_DIR="${SUPERPOWERS_STATE_DIR:-$HOME/.superpowers}"
_SP_USING_SUPERPOWERS_DECISION_DIR="$_SP_STATE_DIR/session-flags/using-superpowers"
_SP_USING_SUPERPOWERS_DECISION_PATH="$_SP_USING_SUPERPOWERS_DECISION_DIR/$PPID"
```

## Bypass Gate

The first-turn session-entry bootstrap is owned by the runtime helper `$_SUPERPOWERS_ROOT/bin/superpowers-session-entry` (or `bin/superpowers-session-entry.ps1` on Windows), not by `using-superpowers` prose alone.

This skill documents the supported-entry contract:

- session-entry bootstrap ownership is runtime-owned
- missing or malformed decision state fails closed
- supported entry paths must ask the bypass question on `needs_user_choice` before the normal stack starts

The session decision file lives at `~/.superpowers/session-flags/using-superpowers/$PPID`.

If no valid session decision exists yet, ask one interactive question before any normal Superpowers work happens.

The first-turn opt-out question is a pre-Superpowers gate:

- do not compute `_SESSIONS`
- do not apply the shared ELI16 multi-session grounding rule
- use the normal context / recommendation / option structure, but treat this question as the gate into the Superpowers stack rather than a normal in-stack Superpowers interactive question

Supported entry paths must resolve `superpowers-session-entry resolve --message-file <path>` before any normal Superpowers behavior:

- if the session decision is `enabled`, continue into the normal stack
- if the session decision is `bypassed` and the user did not explicitly request Superpowers, stop and bypass the rest of this skill
- if the user explicitly requests Superpowers or explicitly names a Superpowers skill, rewrite the session decision to `enabled` and continue on the same turn
- if the helper returns `needs_user_choice`, ask the opt-out question and persist either `enabled` or `bypassed`
- if the helper returns `runtime_failure`, surface that failure instead of pretending the gate was resolved

If the session decision file exists but contains malformed content:

- do not treat it as `enabled`
- do not treat it as `bypassed`
- ask the opt-out question again before any normal Superpowers work happens
- only rewrite the file after a fresh explicit choice
- `superpowers-session-entry resolve` should surface `outcome` `needs_user_choice` with `failure_class` `MalformedDecisionState`

If the session decision is missing:

- ask the opt-out question before any normal Superpowers work happens
- persist the user's explicit `enabled` or `bypassed` choice for later turns
- `superpowers-session-entry resolve` should surface `outcome` `needs_user_choice` with `decision_source` `missing`

If the user explicitly requests re-entry but the bootstrap cannot rewrite the session decision to `enabled`:

- honor the explicit re-entry request for the current turn
- continue through the normal Superpowers stack on that turn
- do not pretend persistence succeeded
- treat future turns as undecided until a later write succeeds
- `superpowers-session-entry resolve` should surface `decision_source` `explicit_reentry_unpersisted`


This skill documents the helper-owned session-entry contract and the post-gate routing stack. It does not replace the runtime-owned bootstrap itself.

## Normal Superpowers Stack

If the bypass gate resolves to `enabled` for this turn, run the normal shared Superpowers stack before any further Superpowers behavior:

```bash
_UPD=""
[ -n "$_SUPERPOWERS_ROOT" ] && _UPD=$("$_SUPERPOWERS_ROOT/bin/superpowers-update-check" 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
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


<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. This is not optional. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>

## Instruction Priority

Superpowers skills override default system prompt behavior, but **user instructions always take precedence**:

1. **User's explicit instructions** (`AGENTS.md`, `AGENTS.override.md`, `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md`, direct requests) — highest priority
2. **Superpowers skills** — override default system behavior where they conflict
3. **Default system prompt** — lowest priority

If `AGENTS.md`, `AGENTS.override.md`, or a Copilot instruction file says "don't use TDD" and a skill says "always use TDD," follow the user's instructions. The user is in control.

## How to Access Skills

**In Codex:** Skills are discovered natively from `~/.agents/skills/`.

**In GitHub Copilot local installs:** Skills are discovered natively from `~/.copilot/skills/`.

Load the relevant skill and follow it directly.

Legacy Claude, Cursor, and OpenCode-specific loading flows are intentionally unsupported in this runtime package.

## Platform Adaptation

These skills are written for Codex and GitHub Copilot local installs. See `references/codex-tools.md` for platform-native primitives used in the workflow.

# Using Skills

## The Rule

**Invoke relevant or requested skills BEFORE any response or action.** Even a 1% chance a skill might apply means that you should invoke the skill to check. If an invoked skill turns out to be wrong for the situation, you don't need to use it.

```dot
digraph skill_flow {
    "User message received" [shape=doublecircle];
    "About to EnterPlanMode?" [shape=doublecircle];
    "Already brainstormed?" [shape=diamond];
    "Invoke brainstorming skill" [shape=box];
    "Might any skill apply?" [shape=diamond];
    "Load relevant skill" [shape=box];
    "Announce: 'Using [skill] to [purpose]'" [shape=box];
    "Has checklist?" [shape=diamond];
    "Create task-tracking item per checklist entry" [shape=box];
    "Follow skill exactly" [shape=box];
    "Respond (including clarifications)" [shape=doublecircle];

    "About to EnterPlanMode?" -> "Already brainstormed?";
    "Already brainstormed?" -> "Invoke brainstorming skill" [label="no"];
    "Already brainstormed?" -> "Might any skill apply?" [label="yes"];
    "Invoke brainstorming skill" -> "Might any skill apply?";

    "User message received" -> "Might any skill apply?";
    "Might any skill apply?" -> "Load relevant skill" [label="yes, even 1%"];
    "Might any skill apply?" -> "Respond (including clarifications)" [label="definitely not"];
    "Load relevant skill" -> "Announce: 'Using [skill] to [purpose]'";
    "Announce: 'Using [skill] to [purpose]'" -> "Has checklist?";
    "Has checklist?" -> "Create task-tracking item per checklist entry" [label="yes"];
    "Has checklist?" -> "Follow skill exactly" [label="no"];
    "Create task-tracking item per checklist entry" -> "Follow skill exactly";
}
```

## Red Flags

These thoughts mean STOP—you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "I can check git/files quickly" | Files lack conversation context. Check for skills. |
| "Let me gather information first" | Skills tell you HOW to gather information. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "I remember this skill" | Skills evolve. Read current version. |
| "This doesn't count as a task" | Action = task. Check for skills. |
| "The skill is overkill" | Simple things become complex. Use it. |
| "I'll just do this one thing first" | Check BEFORE doing anything. |
| "This feels productive" | Undisciplined action wastes time. Skills prevent this. |
| "I know what that means" | Knowing the concept ≠ using the skill. Invoke it. |

## Skill Priority

When multiple skills could apply, use this order:

1. **Process skills first** (brainstorming, debugging) - these determine HOW to approach the task
2. **Workflow-stage skills second** (review, planning, execution) - these own the required handoffs once their prerequisites are satisfied
3. **Domain-specific implementation skills last** - only after the active workflow stage allows them

"Let's build X" → brainstorming first, then follow the artifact-state workflow: plan-ceo-review -> writing-plans -> plan-eng-review -> execution.
"Fix this bug" → debugging first, then if it changes Superpowers product or workflow behavior follow the artifact-state workflow; otherwise continue to the appropriate implementation skill.

## Skill Types

**Rigid** (TDD, debugging): Follow exactly. Don't adapt away discipline.

**Flexible** (patterns): Adapt principles to context.

The skill itself tells you which.

## Superpowers Workflow Router

For feature requests, bugfixes that materially change Superpowers product or workflow behavior, product requests, or workflow-change requests inside a Superpowers project, route by artifact state instead of skipping ahead based on the user's wording alone.

Do NOT jump from brainstorming straight to implementation. For workflow-routed work, every stage owns the handoff into the next one.

### Helper-first routing

First, if `$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status` is available, call `$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status status --refresh`.

- If the JSON result contains a non-empty `next_skill`, use that route.
- If the JSON result reports `status` `implementation_ready`, proceed to the normal execution handoff using the exact approved plan path. Choose between `superpowers:subagent-driven-development` and `superpowers:executing-plans` through the helper-backed execution recommendation contract, not a top-level isolated-agent shortcut.
- Only fall back to manual artifact inspection if the helper itself is unavailable or fails.

When the helper succeeds, route using its JSON result and do not re-derive state manually.

### Manual fallback routing

If the helper is unavailable or fails, inspect artifacts manually using the rules below.

Inspect `docs/superpowers/specs/` and `docs/superpowers/plans/` for the newest relevant artifacts, then parse these exact-match header lines:

- Spec state: `^\*\*Workflow State:\*\* (Draft|CEO Approved)$`
- Spec revision: `^\*\*Spec Revision:\*\* ([0-9]+)$`
- Spec reviewer: `^\*\*Last Reviewed By:\*\* (brainstorming|plan-ceo-review)$`
- Plan state: `^\*\*Workflow State:\*\* (Draft|Engineering Approved)$`
- Plan source: `^\*\*Source Spec:\*\* (.+)$`
- Plan source revision: `^\*\*Source Spec Revision:\*\* ([0-9]+)$`
- Plan reviewer: `^\*\*Last Reviewed By:\*\* (writing-plans|plan-eng-review)$`

Routing rules:

1. No relevant spec artifact: invoke `superpowers:brainstorming`.
2. Spec exists but is `Draft` or malformed: invoke `superpowers:plan-ceo-review`.
3. Spec is `CEO Approved` and no relevant plan exists: invoke `superpowers:writing-plans`.
4. Plan exists but is `Draft` or malformed: invoke `superpowers:plan-eng-review`.
5. Plan is `Engineering Approved` but its `Source Spec:` path or `Source Spec Revision:` does not match the latest approved spec: invoke `superpowers:writing-plans`.
6. Plan is `Engineering Approved` and its `Source Spec:` path plus `Source Spec Revision:` match the latest approved spec: proceed to implementation through the normal execution handoff for that approved plan path.
7. If artifacts are ambiguous or incomplete, route to the earlier safe stage instead of skipping ahead.

## User Instructions

Instructions say WHAT, not HOW. "Add X" or "Fix Y" doesn't mean skip workflows.
