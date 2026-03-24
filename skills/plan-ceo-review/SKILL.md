---
name: plan-ceo-review
description: Use when a written Superpowers design or architecture spec needs CEO or founder review before implementation planning, including scope expansion, selective expansion, hold-scope rigor, or scope reduction
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: node scripts/gen-skill-docs.mjs -->

## Preamble (run first)

```bash
_IS_SUPERPOWERS_RUNTIME_ROOT() {
  local candidate="$1"
  [ -n "$candidate" ] &&
  [ -x "$candidate/bin/superpowers" ] &&
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
[ -n "$_SUPERPOWERS_ROOT" ] && _UPD=$("$_SUPERPOWERS_ROOT/bin/superpowers" update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
_SP_STATE_DIR="${SUPERPOWERS_STATE_DIR:-$HOME/.superpowers}"
mkdir -p "$_SP_STATE_DIR/sessions"
touch "$_SP_STATE_DIR/sessions/$PPID"
_SESSIONS=$(find "$_SP_STATE_DIR/sessions" -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
find "$_SP_STATE_DIR/sessions" -mmin +120 -type f -delete 2>/dev/null || true
_CONTRIB=""
[ -n "$_SUPERPOWERS_ROOT" ] && _CONTRIB=$("$_SUPERPOWERS_ROOT/bin/superpowers" config get superpowers_contributor 2>/dev/null || true)
_TODOS_FORMAT=""
[ -n "$_SUPERPOWERS_ROOT" ] && [ -f "$_SUPERPOWERS_ROOT/review/TODOS-format.md" ] && _TODOS_FORMAT="$_SUPERPOWERS_ROOT/review/TODOS-format.md"
[ -z "$_TODOS_FORMAT" ] && [ -f "$_REPO_ROOT/review/TODOS-format.md" ] && _TODOS_FORMAT="$_REPO_ROOT/review/TODOS-format.md"
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

- Review the written spec artifact in `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.
- If the user names a specific spec path, use that path. Otherwise, inspect `docs/superpowers/specs/` and review the newest matching design doc.
- If no current spec exists, stop and direct the agent back to `superpowers:brainstorming`.
- The spec must include these exact header lines immediately below the title:

```markdown
**Workflow State:** Draft | CEO Approved
**Spec Revision:** <integer>
**Last Reviewed By:** brainstorming | plan-ceo-review
```

- If any header line is missing or malformed, normalize the spec to this contract before continuing and treat it as `Draft`.
- `brainstorming` is only valid while the spec remains `Draft`. A `CEO Approved` spec must end with `**Last Reviewed By:** plan-ceo-review`.
- When review decisions change the written spec, update the spec document before continuing.
- After each spec edit (including final approval edits), runs `sync --artifact spec` for the spec path:

```bash
"$_SUPERPOWERS_ROOT/bin/superpowers" workflow sync --artifact spec --path docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md
```

**Protected-Branch Repo-Write Gate:**

- Before editing the spec body or changing approval headers on disk, run the shared repo-safety preflight for the exact review-write scope:

```bash
superpowers repo-safety check --intent write --stage superpowers:plan-ceo-review --task-id <current-spec-review> --path docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md --write-target repo-file-write
```

- When the mutation is specifically an approval-header edit, use the same command shape with `--write-target approval-header-write`.
- If the helper returns `blocked`, name the branch, the stage, and the blocking `failure_class`, then route to either a feature branch / `superpowers:using-git-worktrees` or explicit user approval for this exact review scope.
- If the user explicitly approves the protected-branch review write, run:

```bash
superpowers repo-safety approve --stage superpowers:plan-ceo-review --task-id <current-spec-review> --reason "<explicit user approval>" --path docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md --write-target repo-file-write
superpowers repo-safety check --intent write --stage superpowers:plan-ceo-review --task-id <current-spec-review> --path docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md --write-target repo-file-write
```

- Repeat the same approve -> re-check pattern for `approval-header-write` before flipping `**Workflow State:**` or any other approval header on a protected branch.
- Keep the spec in `Draft` until the review is fully resolved.
- When approving the written spec, set `**Workflow State:** CEO Approved` and `**Last Reviewed By:** plan-ceo-review`.
- `**Spec Revision:**` starts at `1`. If this review materially changes a previously approved spec, increment the revision and reset the spec to `Draft` until it is re-approved.
- When the review is resolved and the written spec is approved, invoke `superpowers:writing-plans`.
- `superpowers:writing-plans` owns plan creation after approval. Do not draft a plan or offer implementation options from `plan-ceo-review`.

**The terminal state is invoking writing-plans.**

# Spec Review Mode

## Accelerated Review Activation

Accelerated review is available only when the user explicitly requests `accelerated` or `accelerator` mode for the current CEO review.

Do not activate accelerated review from heuristics, vague wording like "make this fast", saved preferences, or agent-only judgment.

If the user does not explicitly request accelerated review, run the normal CEO review flow and keep the standard Step 0 mode selection unchanged.

## Accelerated CEO Section Flow

Accelerated CEO review must process one canonical CEO section at a time through a section packet and explicit human section approval.

Use the existing CEO review sections defined in this skill as the canonical section boundaries. Accelerated review does not invent a separate section model or a separate workflow stage.

Use `skills/plan-ceo-review/accelerated-reviewer-prompt.md` when briefing the accelerated CEO reviewer subagent.

That reviewer prompt, together with `review/review-accelerator-packet-contract.md`, defines the required section-packet schema and keeps the reviewer limited to draft-only output.

In accelerated review, keep routine issues bundled inside the section packet. Break out only escalated high-judgment issues into direct human questions before section approval.

Persist accelerated CEO section packets under `~/.superpowers/projects/<slug>/...`.

Resume accelerated CEO review only from the last approved-and-applied section boundary.

If the source artifact fingerprint changes, treat saved accelerated CEO packets as stale and regenerate them before reuse.

Accelerator artifacts must use bounded retention rather than accumulate indefinitely.

Final explicit human approval remains unchanged. Accelerated review may speed up section handling, but it may not bypass the final approval gate for the written spec.

Accelerated CEO review must preserve required review outputs, including individual TODO and delight questions when they must remain human-owned.

Only the main review agent may write authoritative artifacts, apply approved patches, or change approval headers in accelerated CEO review.

## Philosophy

You are not here to rubber-stamp this spec. You are here to make it extraordinary, catch every landmine before it explodes, and ensure that when this moves into planning, it does so at the highest possible standard.

But your posture depends on what the user needs:

* SCOPE EXPANSION: You are building a cathedral. Envision the platonic ideal. Push scope UP. Ask "what would make this 10x better for 2x the effort?" You have permission to dream, and to recommend enthusiastically. But every expansion is the user's decision. Present each scope-expanding idea as its own interactive user question.
* SELECTIVE EXPANSION: You are a rigorous reviewer who also has taste. Hold the current scope as your baseline and make it bulletproof. But separately, surface every expansion opportunity you see and present each one individually so the user can cherry-pick. Neutral recommendation posture: present the opportunity, state effort and risk, and let the user decide. Accepted expansions become part of the scope for the remaining sections. Rejected ones go to "NOT in scope."
* HOLD SCOPE: You are a rigorous reviewer. The spec's scope is accepted. Your job is to make it bulletproof: catch every failure mode, test every edge case, ensure observability, map every error path. Do not silently reduce OR expand.
* SCOPE REDUCTION: You are a surgeon. Find the minimum viable version that achieves the core outcome. Cut everything else. Be ruthless.

Critical rule: In ALL modes, the user is 100% in control. Every scope change is an explicit opt-in via an interactive user question. Never silently add or remove scope. Once the user selects a mode, COMMIT to it. Do not silently drift toward a different mode. If EXPANSION is selected, do not argue for less work during later sections. If SELECTIVE EXPANSION is selected, surface expansions as individual decisions and do not silently include or exclude them. If REDUCTION is selected, do not sneak scope back in. Raise concerns once in Step 0. After that, execute the chosen mode faithfully.

Do NOT make any code changes. Do NOT start implementation. Your only job right now is to review the written spec with maximum rigor and the appropriate level of ambition.

## Prime Directives

1. Zero silent failures. Every failure mode must be visible to the system, to the team, and to the user. If a failure can happen silently, that is a critical defect in the spec.
2. Every error has a name. Don't say "handle errors." Name the specific exception class, what triggers it, what rescues it, what the user sees, and whether it's tested. `rescue StandardError` is a code smell. Call it out.
3. Data flows have shadow paths. Every data flow has a happy path and three shadow paths: nil input, empty or zero-length input, and upstream error. Trace all four for every new flow.
4. Interactions have edge cases. Every user-visible interaction has edge cases: double-click, navigate-away-mid-action, slow connection, stale state, back button. Map them.
5. Observability is scope, not afterthought. New dashboards, alerts, and runbooks are first-class deliverables, not post-launch cleanup items.
6. Diagrams are mandatory. No non-trivial flow goes undiagrammed. ASCII art for every new data flow, state machine, processing pipeline, dependency graph, and decision tree.
7. Everything deferred must be written down. Vague intentions are lies. `TODOS.md` or it doesn't exist.
8. Optimize for the 6-month future, not just today. If this spec solves today's problem but creates next quarter's nightmare, say so explicitly.
9. You have permission to say "scrap it and do this instead." If there's a fundamentally better approach, table it. Better now than during implementation.

## Engineering Preferences

Use these to guide every recommendation:

* DRY is important. Flag repetition aggressively.
* Well-tested code is non-negotiable. Too many tests is better than too few.
* Favor code that's engineered enough: not fragile and not overbuilt.
* Err on the side of handling more edge cases, not fewer.
* Bias toward explicit over clever.
* Prefer a minimal diff: achieve the goal with the fewest new abstractions and files touched.
* Observability is not optional. New codepaths need logs, metrics, or traces.
* Security is not optional. New codepaths need threat modeling.
* Deployments are not atomic. Plan for partial states, rollbacks, and feature flags.
* ASCII diagrams in code comments for complex designs: models, services, controllers, concerns, and tests with non-obvious setup.
* Diagram maintenance is part of the change. Stale diagrams are worse than none.

## Priority Hierarchy Under Context Pressure

Step 0 > system audit > error/rescue map > test diagram > failure modes > opinionated recommendations > everything else.

Never skip Step 0, the system audit, the error/rescue map, or the failure modes section. These are the highest-leverage outputs.

## Gate A checklist

CEO approval is blocked when the written spec materially lacks any of these delivery-floor items:

* clear problem statement and desired outcome
* clear scope boundaries
* key interfaces, constraints, or dependencies when they matter
* explicit failure-mode thinking
* observability expectations when new behavior or operations are introduced
* rollout and rollback expectations
* credible risks
* testable acceptance criteria

Treat this Gate A checklist as the approval floor while keeping the exact header contract unchanged and the prose shape flexible.

## PRE-REVIEW SYSTEM AUDIT

Before doing anything else, run a system audit. This is not the spec review. It is the context you need to review the spec intelligently.

Run repo-appropriate commands such as:

```bash
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)
BASE_BRANCH=""
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
  echo "Could not determine the base branch for the review audit. Stop and resolve it before continuing."
  exit 1
fi
git fetch origin "$BASE_BRANCH" --quiet 2>/dev/null || true
git log --oneline -30
git diff --stat "origin/$BASE_BRANCH...HEAD" 2>/dev/null || git diff --stat "$BASE_BRANCH...HEAD" 2>/dev/null || git diff --stat
git stash list
rg -l "TODO|FIXME|HACK|XXX"
find . -type f -not -path "*/.git/*" | head -20
```

Do not use PR metadata or repo default-branch APIs as a fallback; keep the system audit aligned with `document-release`, `requesting-code-review`, and `gate-finish`.

Then read `AGENTS.md`, `AGENTS.override.md`, `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md`, `TODOS.md`, and any existing architecture docs. If this repo stores prompt, eval, or workflow conventions in project docs, read those too.

When reading `TODOS.md`, specifically:

* Note any TODOs this spec touches, blocks, or unlocks.
* Check whether deferred work from prior reviews relates to this spec.
* Flag dependencies: does this spec enable or depend on deferred items?
* Map known pain points from `TODOS.md` to this spec's scope.

Map:

* What is the current system state?
* What is already in flight: other open PRs, branches, stashed changes?
* What are the existing known pain points most relevant to this spec?
* Are there any `FIXME` or `TODO` comments in files this spec is likely to touch?

### Retrospective Check

Check the git log for this branch. If there are prior commits suggesting a previous review cycle, note what changed and whether the current spec re-touches those areas. Be more aggressive reviewing areas that were previously problematic. Recurring problem areas are architectural smells. Surface them.

### Taste Calibration (EXPANSION and SELECTIVE EXPANSION modes)

Identify 2-3 files or patterns in the existing codebase that are particularly well-designed. Note them as style references for the review. Also note 1-2 patterns that are frustrating or poorly designed. These are anti-patterns to avoid repeating.

### UI Scope Detection

Analyze the spec. If it involves ANY of: new UI screens or pages, changes to existing UI components, user-facing interaction flows, frontend framework changes, user-visible state changes, mobile or responsive behavior, or design-system changes, note `UI_SCOPE` for Section 11.

If no UI scope is detected, say so explicitly and skip Section 11 later.

Report findings before proceeding to Step 0.

## Pre-Step 0: Landscape Check

Run this after the system audit and before `Step 0: Nuclear Scope Challenge + Mode Selection`.

- reuse the spec's `Landscape Snapshot` when it exists and is still relevant
- refresh only when the spec lacks it or the review introduces materially new market, category, or architecture assumptions
- keep the pass short and decision-oriented
- explicitly surface what incumbents or standard approaches usually do, where they fail or become overbuilt, whether the spec is reinventing a solved problem, and whether a Layer 3 insight creates a simplification or differentiation opportunity
- If the refreshed Landscape Check materially changes the approved reasoning, update the spec's `Landscape Snapshot` and `Decision impact` before approval
- feed the result into `0A. Premise Challenge`, `0B. Existing Code Leverage`, `0C. Dream State Mapping`, and `0F. Mode Selection`
- if search is unavailable, disallowed, or unsafe, say so plainly and continue with Layer 1 plus Layer 3 reasoning

In accelerated CEO review, keep this content inside the existing Step 0 packet. It does not create a new packet type or a separate approval boundary.

## Step 0: Nuclear Scope Challenge + Mode Selection

### 0A. Premise Challenge

1. Is this the right problem to solve? Could a different framing yield a dramatically simpler or more impactful solution?
2. What is the actual user or business outcome? Is this spec the most direct path to that outcome, or is it solving a proxy problem?
3. What would happen if we did nothing? Real pain point or hypothetical one?

### 0B. Existing Code Leverage

1. What existing code already partially or fully solves each sub-problem? Map every sub-problem to existing code. Can we capture outputs from existing flows rather than building parallel ones?
2. Is this spec rebuilding anything that already exists? If yes, explain why rebuilding is better than refactoring.

### 0C. Dream State Mapping

Describe the ideal end state of this system 12 months from now. Does this spec move toward that state or away from it?

```text
CURRENT STATE                  THIS SPEC                   12-MONTH IDEAL
[describe]          --->       [describe delta]    --->    [describe target]
```

### 0D. Mode-Specific Analysis

**For SCOPE EXPANSION** run all three:

1. 10x check: What's the version that's 10x more ambitious and delivers 10x more value for 2x the effort? Describe it concretely.
2. Platonic ideal: If the best engineer in the world had unlimited time and perfect taste, what would this system look like? What would the user feel when using it? Start from experience, not architecture.
3. Delight opportunities: What adjacent 30-minute improvements would make this feature sing? Things where a user would think "oh nice, they thought of that." List at least 5.

**For SELECTIVE EXPANSION** run the HOLD SCOPE analysis first, then surface expansions:

1. Complexity check: If the spec touches more than 8 files or introduces more than 2 new classes or services, treat that as a smell and challenge whether the same goal can be achieved with fewer moving parts.
2. What is the minimum set of changes that achieves the stated goal? Flag any work that could be deferred without blocking the core objective.
3. Then run the expansion scan, but do NOT add anything to scope yet. Surface:
   - 10x check: What's the version that's 10x more ambitious? Describe it concretely.
   - Delight opportunities: What adjacent 30-minute improvements would make this feature sing? List at least 5.
   - Platform potential: Would any expansion turn this feature into infrastructure other features can build on?
4. Cherry-pick ceremony: Present each expansion opportunity as its own individual interactive user question. Neutral recommendation posture: present the opportunity, state effort and risk, and let the user decide. Options: **A)** Add to this spec's scope **B)** Defer to `TODOS.md` **C)** Skip. Accepted items become spec scope for all remaining review sections. Rejected items go to "NOT in scope."

**For HOLD SCOPE** run this:

1. Complexity check: If the spec touches more than 8 files or introduces more than 2 new classes or services, treat that as a smell and challenge whether the same goal can be achieved with fewer moving parts.
2. What is the minimum set of changes that achieves the stated goal? Flag any work that could be deferred without blocking the core objective.

**For SCOPE REDUCTION** run this:

1. Ruthless cut: What is the absolute minimum that ships value to a user? Everything else is deferred. No exceptions.
2. What can be a follow-up PR? Separate "must ship together" from "nice to ship together."

### 0E. Temporal Interrogation

For EXPANSION, SELECTIVE EXPANSION, and HOLD modes, think ahead to implementation. What decisions will need to be made during implementation that should be resolved NOW in the spec?

```text
HOUR 1 (foundations):     What does the implementer need to know?
HOUR 2-3 (core logic):    What ambiguities will they hit?
HOUR 4-5 (integration):   What will surprise them?
HOUR 6+ (polish/tests):   What will they wish they'd planned for?
```

Surface these as questions for the user NOW, not as "figure it out later."

### 0F. Mode Selection

Present four options:

1. **SCOPE EXPANSION:** The spec is good but could be great. Propose the ambitious version, then review that. Push scope up. Build the cathedral.
2. **SELECTIVE EXPANSION:** The current scope is the baseline, but you want to see what else is possible. Every expansion opportunity is presented individually so the user can cherry-pick the ones worth doing.
3. **HOLD SCOPE:** The spec's scope is right. Review it with maximum rigor: architecture, security, edge cases, observability, deployment. Make it bulletproof.
4. **SCOPE REDUCTION:** The spec is overbuilt or wrong-headed. Propose a minimal version that achieves the core goal, then review that.

Context-dependent defaults:

* Greenfield feature -> default EXPANSION
* Feature enhancement or iteration on an existing system -> default SELECTIVE EXPANSION
* Bug fix or hotfix -> default HOLD SCOPE
* Refactor -> default HOLD SCOPE
* Spec touching more than 15 files -> suggest REDUCTION unless the user pushes back
* User says "go big", "ambitious", or "cathedral" -> EXPANSION without asking
* User says "hold scope but tempt me", "show me options", or "cherry-pick" -> SELECTIVE EXPANSION without asking

Once selected, commit fully. Do not silently drift.

**STOP.** In normal review, use one interactive user question per issue. In accelerated review, keep routine issues in the section packet and break out only escalated high-judgment issues as direct human questions. Do NOT batch escalated issues. Recommend + WHY. If no issues or the fix is obvious, state what you'll do and move on. Do NOT proceed until the current section is resolved.

## Review Sections

### Section 1: Architecture Review

Evaluate and diagram:

* Overall system design and component boundaries. Draw the dependency graph.
* Data flow: all four paths. For every new data flow, ASCII diagram the happy path, nil path, empty path, and error path.
* State machines. ASCII diagram every new stateful object. Include impossible or invalid transitions and what prevents them.
* Coupling concerns. Which components are now coupled that weren't before? Is that coupling justified? Draw the before and after dependency graph.
* Scaling characteristics. What breaks first under 10x load? Under 100x?
* Single points of failure. Map them.
* Security architecture. Auth boundaries, data access patterns, API surfaces. For each new endpoint or data mutation: who can call it, what do they get, what can they change?
* Production failure scenarios. For each new integration point, describe one realistic production failure and whether the spec accounts for it.
* Rollback posture. If this ships and immediately breaks, what's the rollback procedure?

**EXPANSION and SELECTIVE EXPANSION additions:**

* What would make this architecture beautiful, not just correct?
* What infrastructure would make this feature a platform that other features can build on?

**SELECTIVE EXPANSION:** If any accepted cherry-picks from Step 0D affect the architecture, evaluate their architectural fit here. Flag any that create coupling concerns or do not integrate cleanly.

Required ASCII diagram: full system architecture showing new components and their relationships to existing ones.

**STOP.** In normal review, use one interactive user question per issue. In accelerated review, keep routine issues in the section packet and break out only escalated high-judgment issues as direct human questions. Do NOT batch escalated issues. Recommend + WHY. If no issues or the fix is obvious, state what you'll do and move on. Do NOT proceed until the current section is resolved.

### Section 2: Error & Rescue Map

This is the section that catches silent failures. It is not optional.

For every new method, service, or codepath that can fail, fill in this table:

```text
METHOD/CODEPATH          | WHAT CAN GO WRONG           | EXCEPTION CLASS
-------------------------|-----------------------------|-----------------
ExampleService#call      | API timeout                 | TimeoutError
                         | API returns 429             | RateLimitError
                         | API returns malformed JSON  | JSON::ParserError
                         | DB connection pool exhausted| ConnectionTimeoutError
                         | Record not found            | RecordNotFound
-------------------------|-----------------------------|-----------------

EXCEPTION CLASS          | RESCUED?  | RESCUE ACTION          | USER SEES
-------------------------|-----------|------------------------|------------------
TimeoutError             | Y         | Retry 2x, then raise   | "Service temporarily unavailable"
RateLimitError           | Y         | Backoff + retry        | Nothing (transparent)
JSON::ParserError        | N <- GAP  | --                     | 500 error <- BAD
ConnectionTimeoutError   | N <- GAP  | --                     | 500 error <- BAD
RecordNotFound           | Y         | Return nil, log warning| "Not found" message
```

Rules for this section:

* `rescue StandardError` is ALWAYS a smell. Name the specific exceptions.
* `rescue => e` with only `logger.error(e.message)` is insufficient. Log the full context: what was being attempted, with what arguments, and for which user or request.
* Every rescued error must either retry with backoff, degrade gracefully with a user-visible message, or re-raise with added context. "Swallow and continue" is almost never acceptable.
* For each GAP, specify the rescue action and what the user should see.
* For LLM or AI service calls specifically: what happens when the response is malformed, empty, a refusal, or invalid JSON? Each of these is a distinct failure mode.

**STOP.** In normal review, use one interactive user question per issue. In accelerated review, keep routine issues in the section packet and break out only escalated high-judgment issues as direct human questions. Do NOT batch escalated issues. Recommend + WHY. If no issues or the fix is obvious, state what you'll do and move on. Do NOT proceed until the current section is resolved.

### Section 3: Security & Threat Model

Security is not a sub-bullet of architecture. It gets its own section.

Evaluate:

* Attack surface expansion. What new attack vectors does this spec introduce?
* Input validation. For every new user input: is it validated, sanitized, and rejected loudly on failure?
* Authorization. For every new data access: is it scoped to the right user or role?
* Secrets and credentials. New secrets? In env vars, not hardcoded? Rotatable?
* Dependency risk. New packages? Security track record?
* Data classification. PII, payment data, credentials? Handling consistent with existing patterns?
* Injection vectors. SQL, command, template, and prompt injection. Check all.
* Audit logging. For sensitive operations: is there an audit trail?

For each finding: threat, likelihood, impact, and whether the spec mitigates it.

**STOP.** In normal review, use one interactive user question per issue. In accelerated review, keep routine issues in the section packet and break out only escalated high-judgment issues as direct human questions. Do NOT batch escalated issues. Recommend + WHY. If no issues or the fix is obvious, state what you'll do and move on. Do NOT proceed until the current section is resolved.

### Section 4: Data Flow & Interaction Edge Cases

Trace data through the system and interactions through the UX with adversarial thoroughness.

**Data Flow Tracing:** For every new data flow, produce an ASCII diagram showing:

```text
INPUT -> VALIDATION -> TRANSFORM -> PERSIST -> OUTPUT
  |         |             |            |         |
  v         v             v            v         v
[nil?]  [invalid?]   [exception?] [conflict?] [stale?]
[empty?][too long?]  [timeout?]   [dup key?]  [partial?]
[wrong  [wrong type?][OOM?]       [locked?]   [encoding?]
 type?]
```

For each node: what happens on each shadow path? Is it tested?

**Interaction Edge Cases:** For every new user-visible interaction, evaluate:

```text
INTERACTION          | EDGE CASE              | HANDLED? | HOW?
---------------------|------------------------|----------|--------
Form submission      | Double-click submit    | ?        |
                     | Submit with stale CSRF | ?        |
                     | Submit during deploy   | ?        |
Async operation      | User navigates away    | ?        |
                     | Operation times out    | ?        |
                     | Retry while in-flight  | ?        |
List/table view      | Zero results           | ?        |
                     | 10,000 results         | ?        |
                     | Results change mid-page| ?        |
Background job       | Job fails after 3 of   | ?        |
                     | 10 items processed     |          |
                     | Job runs twice         | ?        |
                     | Queue backs up 2 hours | ?        |
```

Flag any unhandled edge case as a gap. For each gap, specify the fix.

**STOP.** In normal review, use one interactive user question per issue. In accelerated review, keep routine issues in the section packet and break out only escalated high-judgment issues as direct human questions. Do NOT batch escalated issues. Recommend + WHY. If no issues or the fix is obvious, state what you'll do and move on. Do NOT proceed until the current section is resolved.

### Section 5: Code Quality Review

Evaluate:

* Code organization and module structure.
* DRY violations. Be aggressive.
* Naming quality. Are new classes, methods, and variables named for what they do?
* Error handling patterns. Cross-reference Section 2.
* Missing edge cases. List them explicitly.
* Over-engineering check.
* Under-engineering check.
* Cyclomatic complexity. Flag any new method that branches more than 5 times.

**STOP.** In normal review, use one interactive user question per issue. In accelerated review, keep routine issues in the section packet and break out only escalated high-judgment issues as direct human questions. Do NOT batch escalated issues. Recommend + WHY. If no issues or the fix is obvious, state what you'll do and move on. Do NOT proceed until the current section is resolved.

### Section 6: Test Review

Make a complete diagram of every new thing this spec introduces:

```text
NEW UX FLOWS:
  [list each new user-visible interaction]

NEW DATA FLOWS:
  [list each new path data takes through the system]

NEW CODEPATHS:
  [list each new branch, condition, or execution path]

NEW BACKGROUND JOBS / ASYNC WORK:
  [list each]

NEW INTEGRATIONS / EXTERNAL CALLS:
  [list each]

NEW ERROR/RESCUE PATHS:
  [list each - cross-reference Section 2]
```

For each item in the diagram:

* What type of test covers it? Unit, integration, system, or end-to-end?
* Does a test for it exist in the spec? If not, write the test spec header.
* What is the happy path test?
* What is the failure path test?
* What is the edge case test: nil, empty, boundary value, or concurrent access?

Test ambition check for all modes:

* What's the test that would make you confident shipping at 2am on a Friday?
* What's the test a hostile QA engineer would write to break this?
* What's the chaos test?

Test pyramid check: many unit, fewer integration, few end-to-end. Or inverted?

Flakiness risk: flag any test depending on time, randomness, external services, or ordering.

Load and stress test requirements: for any new codepath called frequently or processing significant data.

For LLM or prompt changes, check the repo's prompt or evaluation docs. If this spec touches those patterns, state which eval suites must run, which cases should be added, and what baselines to compare against.

**STOP.** In normal review, use one interactive user question per issue. In accelerated review, keep routine issues in the section packet and break out only escalated high-judgment issues as direct human questions. Do NOT batch escalated issues. Recommend + WHY. If no issues or the fix is obvious, state what you'll do and move on. Do NOT proceed until the current section is resolved.

### Section 7: Performance Review

Evaluate:

* N+1 queries or repeated fetch patterns.
* Memory usage.
* Database indexes or equivalent lookup support.
* Caching opportunities.
* Background job sizing.
* Slow paths.
* Connection pool pressure.

**STOP.** In normal review, use one interactive user question per issue. In accelerated review, keep routine issues in the section packet and break out only escalated high-judgment issues as direct human questions. Do NOT batch escalated issues. Recommend + WHY. If no issues or the fix is obvious, state what you'll do and move on. Do NOT proceed until the current section is resolved.

### Section 8: Observability & Debuggability Review

New systems break. This section ensures you can see why.

Evaluate:

* Logging
* Metrics
* Tracing
* Alerting
* Dashboards
* Debuggability
* Admin tooling
* Runbooks

**EXPANSION and SELECTIVE EXPANSION addition:** What observability would make this feature a joy to operate? For SELECTIVE EXPANSION, include observability for any accepted cherry-picks.

**STOP.** In normal review, use one interactive user question per issue. In accelerated review, keep routine issues in the section packet and break out only escalated high-judgment issues as direct human questions. Do NOT batch escalated issues. Recommend + WHY. If no issues or the fix is obvious, state what you'll do and move on. Do NOT proceed until the current section is resolved.

### Section 9: Deployment & Rollout Review

Evaluate:

* Migration safety
* Feature flags
* Rollout order
* Rollback plan
* Deploy-time risk window
* Environment parity
* Post-deploy verification checklist
* Smoke tests

**EXPANSION and SELECTIVE EXPANSION addition:** What deploy infrastructure would make shipping this feature routine? For SELECTIVE EXPANSION, assess whether accepted cherry-picks change the deployment risk profile.

**STOP.** In normal review, use one interactive user question per issue. In accelerated review, keep routine issues in the section packet and break out only escalated high-judgment issues as direct human questions. Do NOT batch escalated issues. Recommend + WHY. If no issues or the fix is obvious, state what you'll do and move on. Do NOT proceed until the current section is resolved.

### Section 10: Long-Term Trajectory Review

Evaluate:

* Technical debt introduced
* Path dependency
* Knowledge concentration
* Reversibility
* Ecosystem fit with the repo's primary language and tooling direction
* The 1-year question: read this spec as a new engineer in 12 months. Is it obvious?

**EXPANSION and SELECTIVE EXPANSION additions:**

* What comes after this ships? Phase 2? Phase 3? Does the architecture support that trajectory?
* Platform potential. Does this create capabilities other features can leverage?
* SELECTIVE EXPANSION only: Were the right cherry-picks accepted? Did any rejected expansions turn out to be load-bearing for the accepted ones?

**STOP.** In normal review, use one interactive user question per issue. In accelerated review, keep routine issues in the section packet and break out only escalated high-judgment issues as direct human questions. Do NOT batch escalated issues. Recommend + WHY. If no issues or the fix is obvious, state what you'll do and move on. Do NOT proceed until the current section is resolved.

### Section 11: Design & UX Review (skip if no UI scope detected)

This is the embedded design-intent pass. It is not a separate workflow stage.

Evaluate:

* Information architecture: what does the user see first, second, and third?
* Interaction state coverage map:

```text
FEATURE | LOADING | EMPTY | ERROR | SUCCESS | PARTIAL
```

* User journey coherence
* Responsive intent: is mobile or responsive behavior described explicitly?
* Accessibility basics: keyboard navigation, screen readers, contrast, and touch targets
* AI slop risk: does the spec describe generic UI patterns instead of intentional product decisions?

Required ASCII diagram: user flow showing screens, states, and transitions.

**EXPANSION and SELECTIVE EXPANSION additions:**

* What would make this UI feel inevitable?
* What 30-minute UI touches would make users think "oh nice, they thought of that"?

**STOP.** In normal review, use one interactive user question per issue. In accelerated review, keep routine issues in the section packet and break out only escalated high-judgment issues as direct human questions. Do NOT batch escalated issues. Recommend + WHY. If no issues or the fix is obvious, state what you'll do and move on. Do NOT proceed until the current section is resolved.

## Outside Voice — Independent Spec Challenge (optional, recommended)

After all review sections are complete, optionally get an outside voice. This is informative by default. It becomes actionable only if the main reviewer explicitly adopts a finding and patches the authoritative spec body.

Use `skills/plan-ceo-review/outside-voice-prompt.md` when briefing the outside voice.

Tool order:

1. Prefer `codex exec` when available.
2. Label the source as `cross-model` only when the outside voice definitely uses a different model/provider than the main reviewer.
3. If model provenance is the same, unknown, or only a fresh-context rerun of the same reviewer family, label the source as `fresh-context-subagent`.
4. If the transport truncates or summarizes the outside-voice output, disclose that limitation plainly in review prose instead of overstating independence.
5. If `codex exec` is unavailable, use a fresh-context reviewer path and label the source as `fresh-context-subagent`.
6. If neither path is available, record `Outside Voice: unavailable`.

Outside voice rules:

* Review only the supplied spec content.
* Do not mutate files directly.
* Surface blind spots, tensions, feasibility risks, or strategic miscalibration.
* Present findings truthfully labeled by source.
* If the outside voice is skipped, record `Outside Voice: skipped`.

## CEO Review Summary Writeback

After review decisions are applied to the authoritative spec body, write or replace a single trailing summary block at the end of the spec:

```markdown
## CEO Review Summary

**Review Status:** clear | issues_open
**Reviewed At:** <ISO-8601 UTC>
**Review Mode:** hold_scope | selective_expansion | expansion | scope_reduction
**Reviewed Spec Revision:** <integer>
**Critical Gaps:** <integer>
**UI Design Intent Required:** yes | no
**Outside Voice:** skipped | unavailable | cross-model | fresh-context-subagent
```

Summary write rules:

* Accepted selective-expansion candidates must patch the authoritative spec body before approval. The summary is descriptive only.
* Run the repo-file-write gate before editing the summary body.
* Run the approval-header-write gate separately before flipping approval headers.
* If a `## CEO Review Summary` section already exists, replace from that heading through the next `## ` heading or EOF, whichever comes first.
* Always move the summary to the end of the file. Do not leave an older copy in the middle.
* If the write fails because the spec changed concurrently, re-read the file and retry once. If freshness cannot be re-established, leave the spec in `Draft`.

## CRITICAL RULE — How to ask questions

Follow the Interactive User Question format above. Additional rules for spec reviews:

* **Normal review:** one issue = one interactive user question. In accelerated review, this rule applies only to escalated high-judgment issues; routine issues may stay in the section packet.
* Describe the problem concretely, with file and line references when relevant.
* Present 2-3 options, including "do nothing" where reasonable.
* For each option: effort, risk, and maintenance burden in one line.
* Map the reasoning to the engineering preferences above.
* Label with issue NUMBER + option LETTER, for example `3A`.
* **Escape hatch:** If a section has no issues, say so and move on. If an issue has an obvious fix with no real alternatives, state what you'll do and move on. Only use an interactive user question when there is a genuine decision with meaningful tradeoffs.

## Required Outputs

### "NOT in scope" section

List work considered and explicitly deferred, with one-line rationale each.

### "What already exists" section

List existing code or flows that partially solve sub-problems and whether this spec reuses them.

### "Dream state delta" section

Where this spec leaves the system relative to the 12-month ideal.

### Error & Rescue Registry

Complete table of every method that can fail, every exception class, rescued status, rescue action, and user impact.

### Failure Modes Registry

```text
CODEPATH | FAILURE MODE | RESCUED? | TEST? | USER SEES? | LOGGED?
---------|--------------|----------|-------|------------|--------
```

Any row with `RESCUED=N`, `TEST=N`, and `USER SEES=Silent` is a **CRITICAL GAP**.

### TODOS.md updates

Present each potential TODO as its own individual interactive user question. Never batch TODOs.

For each TODO, describe:

* **What:** one-line description of the work
* **Why:** the concrete problem it solves or value it unlocks
* **Pros:** what you gain by doing this work
* **Cons:** cost, complexity, or risks
* **Context:** enough detail that someone picking this up later understands the motivation, the current state, and where to start
* **Effort estimate:** S/M/L/XL
* **Priority:** P1/P2/P3
* **Depends on / blocked by:** prerequisites or ordering constraints

Then present options: **A)** Add to `TODOS.md` **B)** Skip **C)** Build it now in this PR instead of deferring.

### Delight Opportunities (EXPANSION and SELECTIVE EXPANSION modes)

Identify at least 5 bonus-chunk opportunities under 30 minutes each that would make users think "oh nice, they thought of that." In SELECTIVE EXPANSION mode, present each one as a cherry-pick candidate. Never batch them.

### Diagrams

Produce all that apply:

1. System architecture
2. Data flow, including shadow paths
3. State machine
4. Error flow
5. Deployment sequence
6. Rollback flowchart

### Stale Diagram Audit

List every ASCII diagram in files this spec touches. Are they still accurate?

### Completion Summary

```text
+====================================================================+
|            MEGA PLAN REVIEW — COMPLETION SUMMARY                   |
+====================================================================+
| Mode selected        | EXPANSION / SELECTIVE / HOLD / REDUCTION    |
| System Audit         | [key findings]                              |
| Step 0               | [mode + key decisions]                      |
| Section 1  (Arch)    | ___ issues found                            |
| Section 2  (Errors)  | ___ error paths mapped, ___ GAPS            |
| Section 3  (Security)| ___ issues found, ___ High severity         |
| Section 4  (Data/UX) | ___ edge cases mapped, ___ unhandled        |
| Section 5  (Quality) | ___ issues found                            |
| Section 6  (Tests)   | Diagram produced, ___ gaps                  |
| Section 7  (Perf)    | ___ issues found                            |
| Section 8  (Observ)  | ___ gaps found                              |
| Section 9  (Deploy)  | ___ risks flagged                           |
| Section 10 (Future)  | Reversibility: _/5, debt items: ___         |
| Section 11 (Design)  | ___ issues / SKIPPED (no UI scope)          |
+--------------------------------------------------------------------+
| NOT in scope         | written (___ items)                         |
| What already exists  | written                                     |
| Dream state delta    | written                                     |
| Error/rescue registry| ___ methods, ___ CRITICAL GAPS              |
| Failure modes        | ___ total, ___ CRITICAL GAPS                |
| TODOS.md updates     | ___ items proposed                          |
| Scope proposals      | ___ proposed, ___ accepted, ___ deferred    |
| Delight opportunities| ___ identified                              |
| Outside voice        | skipped / unavailable / cross-model / fresh-context-subagent |
| CEO review summary   | written                                     |
| Diagrams produced    | ___ (list types)                            |
| Stale diagrams found | ___                                         |
| Unresolved decisions | ___ (listed below)                          |
+====================================================================+
```

### Unresolved Decisions

If any interactive user question goes unanswered, note it here. Never silently default.

## Formatting Rules

* NUMBER issues and LETTER options.
* Label with NUMBER + LETTER, for example `3A`.
* One sentence max per option.
* After each section, pause and wait for feedback.
* Use **CRITICAL GAP**, **WARNING**, and **OK** for scannability.

## Mode Quick Reference

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│                            MODE COMPARISON                                     │
├─────────────┬──────────────┬──────────────┬──────────────┬────────────────────┤
│             │  EXPANSION   │  SELECTIVE   │  HOLD SCOPE  │  REDUCTION         │
├─────────────┼──────────────┼──────────────┼──────────────┼────────────────────┤
│ Scope       │ Push UP      │ Hold + offer │ Maintain     │ Push DOWN          │
│ Recommend   │ Enthusiastic │ Neutral      │ N/A          │ N/A                │
│ posture     │              │              │              │                    │
│ 10x check   │ Mandatory    │ Cherry-pick  │ Optional     │ Skip               │
│ Platonic    │ Yes          │ No           │ No           │ No                 │
│ ideal       │              │              │              │                    │
│ Delight     │ Opt-in       │ Cherry-pick  │ Note if seen │ Skip               │
│ opps        │ ceremony     │ ceremony     │              │                    │
│ Complexity  │ "Is it big   │ "Is it right │ "Is it too   │ "Is it the bare    │
│ question    │  enough?"    │  + what else │  complex?"   │  minimum?"         │
│             │              │  is tempting"│              │                    │
│ Taste       │ Yes          │ Yes          │ No           │ No                 │
│ calibration │              │              │              │                    │
│ Temporal    │ Full (hr 1-6)│ Full (hr 1-6)│ Key decisions│ Skip               │
│ interrogate │              │              │ only         │                    │
│ Observ.     │ "Joy to      │ "Joy to      │ "Can we      │ "Can we see if     │
│ standard    │  operate"    │  operate"    │  debug it?"  │  it's broken?"     │
│ Deploy      │ Infra as     │ Safe deploy  │ Safe deploy  │ Simplest possible  │
│ standard    │ feature scope│ + cherry-pick│ + rollback   │ deploy             │
│ Error map   │ Full + chaos │ Full + chaos │ Full         │ Critical paths     │
│             │ scenarios    │ for accepted │              │ only               │
│ Phase 2/3   │ Map it       │ Map accepted │ Note it      │ Skip               │
│ planning    │              │ cherry-picks │              │                    │
│ Design      │ "Inevitable" │ If UI scope  │ If UI scope  │ Skip               │
│ (Sec 11)    │ UI review    │ detected     │ detected     │                    │
└─────────────┴──────────────┴──────────────┴──────────────┴────────────────────┘
```
