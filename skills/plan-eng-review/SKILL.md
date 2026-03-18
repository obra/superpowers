---
name: plan-eng-review
description: Use when a Superpowers implementation plan from a CEO-approved spec has been written and needs engineering review before execution
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
_TODOS_FORMAT=""
[ -n "$_SUPERPOWERS_ROOT" ] && [ -f "$_SUPERPOWERS_ROOT/review/TODOS-format.md" ] && _TODOS_FORMAT="$_SUPERPOWERS_ROOT/review/TODOS-format.md"
[ -z "$_TODOS_FORMAT" ] && [ -f "$_REPO_ROOT/review/TODOS-format.md" ] && _TODOS_FORMAT="$_REPO_ROOT/review/TODOS-format.md"
```

If output shows `UPGRADE_AVAILABLE <old> <new>`: read the installed `superpowers-upgrade/SKILL.md` from the same superpowers root (check the current repo when it contains the Superpowers runtime, then `$HOME/.superpowers/install`, then `$HOME/.codex/superpowers`, then `$HOME/.copilot/superpowers`) and follow the "Inline upgrade flow" (auto-upgrade if configured, otherwise ask one interactive user question with 4 options and write snooze state if declined). If `JUST_UPGRADED <from> <to>`: tell the user "Running superpowers v{to} (just updated!)" and continue.

## Agent Grounding

Honor the active repo instruction chain from `AGENTS.md`, `AGENTS.override.md`, `.github/copilot-instructions.md`, and `.github/instructions/*.instructions.md`, including nested `AGENTS.md` and `AGENTS.override.md` files closer to the current working directory.

These review skills are public Superpowers skills for Codex and GitHub Copilot local installs.

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


# Superpowers Artifact Contract

- Review the written plan artifact in `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`.
- If the user names a specific plan path, use that path. Otherwise, inspect `docs/superpowers/plans/` and review the newest matching plan doc.
- Review the full written plan after completion. Do not do chunk-by-chunk embedded review here.
- If no current plan exists, stop and direct the agent back to `superpowers:writing-plans`.
- The plan must include these exact header lines immediately below the title:

```markdown
**Workflow State:** Draft | Engineering Approved
**Plan Revision:** <integer>
**Execution Mode:** none | superpowers:executing-plans | superpowers:subagent-driven-development
**Source Spec:** <path>
**Source Spec Revision:** <integer>
**Last Reviewed By:** writing-plans | plan-eng-review
```

- If any header line is missing or malformed, normalize the plan to this contract before continuing and treat it as `Draft`.
- Read the source spec named in `**Source Spec:**` and confirm it is the latest approved spec revision before approving execution.
- When review decisions change the written plan, update the plan document before continuing.
- Keep the plan in `Draft` while review issues remain open or while the source spec revision is stale.
- Only write `**Workflow State:** Engineering Approved` as the last step of a successful review, and set `**Last Reviewed By:** plan-eng-review` at the same time.
- When the review is resolved and the written plan is approved, present the normal execution handoff.
- `superpowers:subagent-driven-development` and `superpowers:executing-plans` own implementation. Do not start implementation inside `plan-eng-review`.

**The terminal state is presenting the execution handoff with the approved plan path.**

# Plan Review Mode

Review this plan thoroughly before making any code changes. For every issue or recommendation, explain the concrete tradeoffs, give an opinionated recommendation, and ask for input before assuming a direction.

## Accelerated Review Activation

Accelerated review is available only when the user explicitly requests `accelerated` or `accelerator` mode for the current engineering review.

Do not activate accelerated review from heuristics, vague wording like "make this fast", saved preferences, or agent-only judgment.

If the user does not explicitly request accelerated review, run the normal engineering review flow and keep the standard Step 0 scope choice and approval gate unchanged.

Use the existing ENG review sections defined in this skill as the canonical section boundaries. Accelerated review does not invent a separate section model or a separate workflow stage.

Use `skills/plan-eng-review/accelerated-reviewer-prompt.md` when briefing the accelerated engineering reviewer subagent.

That reviewer prompt, together with `review/review-accelerator-packet-contract.md`, defines the required section-packet schema and keeps the reviewer limited to draft-only output.

## Accelerated ENG Section Flow

Accelerated engineering review must process one canonical ENG section at a time through a section packet and explicit human section approval.

Accelerated ENG `SMALL CHANGE` review must still limit the reviewer to one primary issue per canonical section and may not collapse into one bundled approval round.

In accelerated review, keep routine issues bundled inside the section packet. Break out only escalated high-judgment issues into direct human questions before section approval.

Persist accelerated engineering section packets under `~/.superpowers/projects/<slug>/...`.

Resume accelerated engineering review only from the last approved-and-applied section boundary.

If the source artifact fingerprint changes, treat saved accelerated ENG packets as stale and regenerate them before reuse.

Accelerator artifacts must use bounded retention rather than accumulate indefinitely.

Accelerated engineering review must preserve QA handoff generation, TODO flow, failure-mode output, and the normal execution handoff.

Only the main review agent may write authoritative artifacts, apply approved patches, or change approval headers in accelerated engineering review.

Final explicit human approval remains unchanged. Accelerated review may speed up section handling, but it may not bypass approval authority or the normal execution handoff boundary.

## Priority hierarchy

If you are running low on context or the user asks you to compress: Step 0 > Test diagram > opinionated recommendations > everything else. Never skip Step 0 or the test diagram.

## Engineering Preferences

Use these to guide recommendations:

* DRY is important. Flag repetition aggressively.
* Well-tested code is non-negotiable.
* Favor code that's engineered enough, not fragile and not overbuilt.
* Err on the side of handling more edge cases.
* Bias toward explicit over clever.
* Prefer a minimal diff: achieve the goal with the fewest new abstractions and files touched.

## Documentation and diagrams

* Use ASCII diagrams liberally for data flow, state machines, dependency graphs, processing pipelines, and decision trees.
* For particularly complex designs or behaviors, embed ASCII diagrams directly in code comments in the relevant files.
* Diagram maintenance is part of the change. If a touched file already has an ASCII diagram nearby, review whether it is still accurate.

## BEFORE YOU START

### Step 0: Scope Challenge

Before reviewing anything, answer these questions:

1. **What existing code already partially or fully solves each sub-problem?** Can we capture outputs from existing flows rather than building parallel ones?
2. **What is the minimum set of changes that achieves the stated goal?** Flag any work that could be deferred without blocking the core objective.
3. **Complexity check:** If the plan touches more than 8 files or introduces more than 2 new classes or services, treat that as a smell and challenge whether the same goal can be achieved with fewer moving parts.
4. **TODOS cross-reference:** Read `TODOS.md` if it exists. Are any deferred items blocking this plan? Can any deferred items be bundled into this PR without expanding scope? Does this plan create new work that should be captured as a TODO?

Then ask whether the user wants one of three options:

1. **SCOPE REDUCTION:** The plan is overbuilt. Propose a minimal version that achieves the core goal, then review that.
2. **BIG CHANGE:** Work through interactively, one section at a time: architecture, code quality, tests, performance.
3. **SMALL CHANGE:** In normal non-accelerated review, use a compressed review. Step 0 plus one combined pass covering all 4 sections. For each section, pick the single most important issue.

In accelerated review, `SMALL CHANGE` still uses canonical section packets and per-section approvals; only reviewer depth stays compressed.

Critical: If the user does not select SCOPE REDUCTION, respect that decision fully. Your job becomes making the chosen plan succeed, not continuing to lobby for a smaller plan.

### Approval Gate

Before moving into the review sections:

1. Read `**Source Spec:**` and confirm the file exists.
2. Read that spec's `**Workflow State:**` and `**Spec Revision:**`.
3. If the spec is not `CEO Approved`, stop and direct the agent back to `superpowers:plan-ceo-review`.
4. If the plan's `**Source Spec Revision:**` does not match the latest approved spec revision, stop and direct the agent back to `superpowers:writing-plans`.
5. If you make plan edits during this review, keep `**Workflow State:** Draft` until every review issue is resolved.

## Review Sections

### 1. Architecture review

Evaluate:

* Overall system design and component boundaries
* Dependency graph and coupling concerns
* Data flow patterns and potential bottlenecks
* Scaling characteristics and single points of failure
* Security architecture: auth, data access, API boundaries
* Whether key flows deserve ASCII diagrams in the plan or in code comments
* For each new codepath or integration point, one realistic production failure scenario and whether the plan accounts for it

**STOP.** In normal review, use one interactive user question per issue. In accelerated review, keep routine issues in the section packet and break out only escalated high-judgment issues as direct human questions. Present options, state your recommendation, explain WHY. Do NOT batch escalated issues into one interactive user question. Only proceed to the next section after the current section is resolved.

### 2. Code quality review

Evaluate:

* Code organization and module structure
* DRY violations
* Error handling patterns and missing edge cases
* Technical debt hotspots
* Areas that are over-engineered or under-engineered relative to the preferences above
* Existing ASCII diagrams in touched files. Are they still accurate after this change?

**STOP.** In normal review, use one interactive user question per issue. In accelerated review, keep routine issues in the section packet and break out only escalated high-judgment issues as direct human questions. Present options, state your recommendation, explain WHY. Do NOT batch escalated issues into one interactive user question. Only proceed to the next section after the current section is resolved.

### 3. Test review

Make a diagram of all new UX, new data flow, new codepaths, and new branching if statements or outcomes. For each, note what is new about the features discussed in this branch and plan. Then, for each new item in the diagram, make sure there is a project-native automated test.

For LLM or prompt changes, check the repo's prompt or evaluation docs. If this plan touches those patterns, state which eval suites must be run, which cases should be added, and what baselines to compare against. Then use one interactive user question to confirm the eval scope with the user.

**STOP.** In normal review, use one interactive user question per issue. In accelerated review, keep routine issues in the section packet and break out only escalated high-judgment issues as direct human questions. Present options, state your recommendation, explain WHY. Do NOT batch escalated issues into one interactive user question. Only proceed to the next section after the current section is resolved.

### Test Plan Artifact

After producing the test diagram, write a QA handoff artifact for cross-session reuse:

```bash
REMOTE_URL=$(git remote get-url origin 2>/dev/null || true)
SLUG=$(printf '%s\n' "$REMOTE_URL" | sed 's|.*[:/]\([^/]*/[^/]*\)\.git$|\1|;s|.*[:/]\([^/]*/[^/]*\)$|\1|' | tr '/' '-')
[ -n "$SLUG" ] || SLUG=$(basename "$_REPO_ROOT")
BRANCH=$(git rev-parse --abbrev-ref HEAD)
SAFE_BRANCH=$(printf '%s\n' "$BRANCH" | sed 's/[^[:alnum:]._-]/-/g')
USER=$(whoami)
DATETIME=$(date +%Y%m%d-%H%M%S)
mkdir -p "$_SP_STATE_DIR/projects/$SLUG"
```

Write to `$_SP_STATE_DIR/projects/$SLUG/{user}-{safe-branch}-test-plan-{datetime}.md` with:

```markdown
# Test Plan
Generated by superpowers:plan-eng-review on {date}
Branch: {branch}
Repo: {slug}

## Affected Pages / Routes
- {route} — {what to verify and why}

## Key Interactions
- {interaction} on {page}

## Edge Cases
- {edge case} on {page}

## Critical Paths
- {end-to-end flow}
```

This file is consumed by `superpowers:qa-only` as the primary QA handoff. Include only tester-facing guidance: what to test, where to test it, and why it matters.

### 4. Performance review

Evaluate:

* N+1 queries and repeated fetch patterns
* Memory-usage concerns
* Caching opportunities
* Slow or high-complexity code paths

**STOP.** In normal review, use one interactive user question per issue. In accelerated review, keep routine issues in the section packet and break out only escalated high-judgment issues as direct human questions. Present options, state your recommendation, explain WHY. Do NOT batch escalated issues into one interactive user question. Only proceed to the next section after the current section is resolved.

## CRITICAL RULE — How to ask questions

Follow the Interactive User Question format above. Additional rules for plan reviews:

* **Normal review:** one issue = one interactive user question. In accelerated review, this rule applies only to escalated high-judgment issues; routine issues may stay in the section packet.
* Describe the problem concretely, with file and line references when relevant.
* Present 2-3 options, including "do nothing" where reasonable.
* For each option, specify in one line: effort, risk, and maintenance burden.
* Map the reasoning to the engineering preferences above.
* Label with issue NUMBER + option LETTER, for example `3A`.
* **Escape hatch:** If a section has no issues, say so and move on. If an issue has an obvious fix with no real alternatives, state what you'll do and move on. Only use an interactive user question when there is a genuine decision with meaningful tradeoffs.
* **Exception:** In normal non-accelerated `SMALL CHANGE` mode, batch one issue per section into a single interactive user question round at the end, but each issue in that batch still requires its own recommendation, WHY, and lettered options. Accelerated `SMALL CHANGE` does not use this bundled round.

## Required outputs

### "NOT in scope" section

Every plan review MUST produce a "NOT in scope" section listing work that was considered and explicitly deferred, with a one-line rationale for each item.

### "What already exists" section

List existing code or flows that already partially solve sub-problems in this plan, and whether the plan reuses them or unnecessarily rebuilds them.

### TODOS.md updates

After all review sections are complete, present each potential TODO as its own individual interactive user question. Never batch TODOs.

For each TODO, describe:

* **What:** one-line description of the work
* **Why:** the concrete problem it solves or value it unlocks
* **Pros:** what you gain by doing this work
* **Cons:** cost, complexity, or risks
* **Context:** enough detail that someone picking this up later understands the motivation, the current state, and where to start
* **Depends on / blocked by:** prerequisites or ordering constraints

Then present options: **A)** Add to `TODOS.md` **B)** Skip **C)** Build it now in this PR instead of deferring.

### Diagrams

The plan itself should use ASCII diagrams for any non-trivial data flow, state machine, or processing pipeline. Additionally, identify which implementation files should get inline ASCII diagram comments.

### Failure modes

For each new codepath identified in the test review diagram, list one realistic way it could fail in production and whether:

1. A test covers that failure
2. Error handling exists for it
3. The user would see a clear error or a silent failure

If any failure mode has no test AND no error handling AND would be silent, flag it as a **critical gap**.

### Completion summary

At the end of the review, fill in and display this summary:

* Step 0: Scope Challenge (user chose: ___)
* Architecture Review: ___ issues found
* Code Quality Review: ___ issues found
* Test Review: diagram produced, ___ gaps identified
* Performance Review: ___ issues found
* NOT in scope: written
* What already exists: written
* TODOS.md updates: ___ items proposed to user
* Failure modes: ___ critical gaps flagged

## Retrospective learning

Check the git log for this branch. If there are prior commits suggesting a previous review cycle, note what changed and whether the current plan touches the same areas. Be more aggressive reviewing areas that were previously problematic.

## Execution handoff

Before presenting the final execution handoff, if `$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status` is available, call `$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status status --refresh`.

- If the helper returns a non-empty `next_skill`, use that route instead of re-deriving state manually.
- If the helper returns `status` `implementation_ready`, present the normal execution handoff below.
- Only fall back to manual artifact inspection if the helper is unavailable or fails.

When the review is resolved and the written plan is approved, present the normal execution handoff.

During that handoff, call `superpowers-plan-execution recommend --plan <approved-plan-path>` and present the helper's recommended skill first.

The handoff must include the exact approved plan path and must remind the execution skill to reject draft or stale plans.

* Present the helper-recommended execution skill as the default path with the approved plan path.
* If isolated-agent workflows are available in the current platform/session, show the other valid execution skill as an explicit override.
* If isolated-agent workflows are unavailable, do not present `superpowers:subagent-driven-development` as an available override.

Do not start implementation before the review is satisfied.

## Formatting rules

* NUMBER issues and LETTER options.
* Label with NUMBER + LETTER, for example `3A`.
* One sentence max per option.
* After each review section, pause and ask for feedback before moving on.

## Unresolved decisions

If the user does not respond to an interactive user question or interrupts to move on, note which decisions were left unresolved. At the end of the review, list these as "Unresolved decisions that may bite you later". Never silently default.
