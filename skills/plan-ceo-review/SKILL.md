---
name: plan-ceo-review
description: Use when a Superpowers design spec has been written and needs CEO or founder review before implementation planning
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
- When review decisions change the written spec, update the spec document before continuing.
- Keep the spec in `Draft` until the review is fully resolved.
- When approving the written spec, set `**Workflow State:** CEO Approved` and `**Last Reviewed By:** plan-ceo-review`.
- `**Spec Revision:**` starts at `1`. If this review materially changes a previously approved spec, increment the revision and reset the spec to `Draft` until it is re-approved.
- When the review is resolved and the written spec is approved, invoke `superpowers:writing-plans`.

# Spec Review Mode

## Philosophy

You are not here to rubber-stamp this spec. You are here to make it extraordinary, catch every landmine before it explodes, and ensure that when this moves into planning, it does so at the highest possible standard.

But your posture depends on what the user needs:

* SCOPE EXPANSION: You are building a cathedral. Envision the platonic ideal. Push scope UP. Ask "what would make this 10x better for 2x the effort?" The answer to "should we also build X?" is "yes, if it serves the vision." You have permission to dream.
* HOLD SCOPE: You are a rigorous reviewer. The spec's scope is accepted. Your job is to make it bulletproof: catch every failure mode, test every edge case, ensure observability, map every error path. Do not silently reduce OR expand.
* SCOPE REDUCTION: You are a surgeon. Find the minimum viable version that achieves the core outcome. Cut everything else. Be ruthless.

Critical rule: Once the user selects a mode, COMMIT to it. Do not silently drift toward a different mode. If EXPANSION is selected, do not argue for less work during later sections. If REDUCTION is selected, do not sneak scope back in. Raise concerns once in Step 0. After that, execute the chosen mode faithfully.

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

## PRE-REVIEW SYSTEM AUDIT

Before doing anything else, run a system audit. This is not the spec review. It is the context you need to review the spec intelligently.

Run repo-appropriate commands such as:

```bash
BASE_BRANCH=$(gh pr view --json baseRefName -q .baseRefName 2>/dev/null || gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null || echo main)
git fetch origin "$BASE_BRANCH" --quiet 2>/dev/null || true
git log --oneline -30
git diff --stat "origin/$BASE_BRANCH...HEAD" 2>/dev/null || git diff --stat "$BASE_BRANCH...HEAD" 2>/dev/null || git diff --stat
git stash list
rg -l "TODO|FIXME|HACK|XXX"
find . -type f -not -path "*/.git/*" | head -20
```

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

### Taste Calibration (EXPANSION mode only)

Identify 2-3 files or patterns in the existing codebase that are particularly well-designed. Note them as style references for the review. Also note 1-2 patterns that are frustrating or poorly designed. These are anti-patterns to avoid repeating.

Report findings before proceeding to Step 0.

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
3. Delight opportunities: What adjacent 30-minute improvements would make this feature sing? Things where a user would think "oh nice, they thought of that." List at least 3.

**For HOLD SCOPE** run this:

1. Complexity check: If the spec touches more than 8 files or introduces more than 2 new classes or services, treat that as a smell and challenge whether the same goal can be achieved with fewer moving parts.
2. What is the minimum set of changes that achieves the stated goal? Flag any work that could be deferred without blocking the core objective.

**For SCOPE REDUCTION** run this:

1. Ruthless cut: What is the absolute minimum that ships value to a user? Everything else is deferred. No exceptions.
2. What can be a follow-up PR? Separate "must ship together" from "nice to ship together."

### 0E. Temporal Interrogation

For EXPANSION and HOLD modes, think ahead to implementation. What decisions will need to be made during implementation that should be resolved NOW in the spec?

```text
HOUR 1 (foundations):     What does the implementer need to know?
HOUR 2-3 (core logic):    What ambiguities will they hit?
HOUR 4-5 (integration):   What will surprise them?
HOUR 6+ (polish/tests):   What will they wish they'd planned for?
```

Surface these as questions for the user NOW, not as "figure it out later."

### 0F. Mode Selection

Present three options:

1. **SCOPE EXPANSION:** The spec is good but could be great. Propose the ambitious version, then review that. Push scope up. Build the cathedral.
2. **HOLD SCOPE:** The spec's scope is right. Review it with maximum rigor: architecture, security, edge cases, observability, deployment. Make it bulletproof.
3. **SCOPE REDUCTION:** The spec is overbuilt or wrong-headed. Propose a minimal version that achieves the core goal, then review that.

Context-dependent defaults:

* Greenfield feature -> default EXPANSION
* Bug fix or hotfix -> default HOLD SCOPE
* Refactor -> default HOLD SCOPE
* Spec touching more than 15 files -> suggest REDUCTION unless the user pushes back
* User says "go big", "ambitious", or "cathedral" -> EXPANSION without asking

Once selected, commit fully. Do not silently drift.

**STOP.** Use one interactive user question per issue. Do NOT batch. Recommend + WHY. If no issues or the fix is obvious, state what you'll do and move on. Do NOT proceed until the user responds.

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

**EXPANSION mode additions:**

* What would make this architecture beautiful, not just correct?
* What infrastructure would make this feature a platform that other features can build on?

Required ASCII diagram: full system architecture showing new components and their relationships to existing ones.

**STOP.** Use one interactive user question per issue. Do NOT batch. Recommend + WHY. If no issues or the fix is obvious, state what you'll do and move on. Do NOT proceed until the user responds.

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

**STOP.** Use one interactive user question per issue. Do NOT batch. Recommend + WHY. If no issues or the fix is obvious, state what you'll do and move on. Do NOT proceed until the user responds.

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

**STOP.** Use one interactive user question per issue. Do NOT batch. Recommend + WHY. If no issues or the fix is obvious, state what you'll do and move on. Do NOT proceed until the user responds.

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

**STOP.** Use one interactive user question per issue. Do NOT batch. Recommend + WHY. If no issues or the fix is obvious, state what you'll do and move on. Do NOT proceed until the user responds.

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

**STOP.** Use one interactive user question per issue. Do NOT batch. Recommend + WHY. If no issues or the fix is obvious, state what you'll do and move on. Do NOT proceed until the user responds.

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

**STOP.** Use one interactive user question per issue. Do NOT batch. Recommend + WHY. If no issues or the fix is obvious, state what you'll do and move on. Do NOT proceed until the user responds.

### Section 7: Performance Review

Evaluate:

* N+1 queries or repeated fetch patterns.
* Memory usage.
* Database indexes or equivalent lookup support.
* Caching opportunities.
* Background job sizing.
* Slow paths.
* Connection pool pressure.

**STOP.** Use one interactive user question per issue. Do NOT batch. Recommend + WHY. If no issues or the fix is obvious, state what you'll do and move on. Do NOT proceed until the user responds.

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

**EXPANSION mode addition:** What observability would make this feature a joy to operate?

**STOP.** Use one interactive user question per issue. Do NOT batch. Recommend + WHY. If no issues or the fix is obvious, state what you'll do and move on. Do NOT proceed until the user responds.

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

**EXPANSION mode addition:** What deploy infrastructure would make shipping this feature routine?

**STOP.** Use one interactive user question per issue. Do NOT batch. Recommend + WHY. If no issues or the fix is obvious, state what you'll do and move on. Do NOT proceed until the user responds.

### Section 10: Long-Term Trajectory Review

Evaluate:

* Technical debt introduced
* Path dependency
* Knowledge concentration
* Reversibility
* Ecosystem fit with the repo's primary language and tooling direction
* The 1-year question: read this spec as a new engineer in 12 months. Is it obvious?

**EXPANSION mode additions:**

* What comes after this ships? Phase 2? Phase 3? Does the architecture support that trajectory?
* Platform potential. Does this create capabilities other features can leverage?

**STOP.** Use one interactive user question per issue. Do NOT batch. Recommend + WHY. If no issues or the fix is obvious, state what you'll do and move on. Do NOT proceed until the user responds.

## CRITICAL RULE — How to ask questions

Follow the Interactive User Question format above. Additional rules for plan reviews:

* **One issue = one interactive user question.** Never combine multiple issues into one question.
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

### Delight Opportunities (EXPANSION mode only)

Identify at least 5 bonus-chunk opportunities under 30 minutes each that would make users think "oh nice, they thought of that." Present each delight opportunity as its own interactive user question. Never batch them.

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
| Mode selected        | EXPANSION / HOLD / REDUCTION                |
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
+--------------------------------------------------------------------+
| NOT in scope         | written (___ items)                         |
| What already exists  | written                                     |
| Dream state delta    | written                                     |
| Error/rescue registry| ___ methods, ___ CRITICAL GAPS              |
| Failure modes        | ___ total, ___ CRITICAL GAPS                |
| TODOS.md updates     | ___ items proposed                          |
| Delight opportunities| ___ identified (EXPANSION only)             |
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
┌─────────────────────────────────────────────────────────────────┐
│                     MODE COMPARISON                             │
├─────────────┬──────────────┬──────────────┬────────────────────┤
│             │  EXPANSION   │  HOLD SCOPE  │  REDUCTION         │
├─────────────┼──────────────┼──────────────┼────────────────────┤
│ Scope       │ Push UP      │ Maintain     │ Push DOWN          │
│ 10x check   │ Mandatory    │ Optional     │ Skip               │
│ Platonic    │ Yes          │ No           │ No                 │
│ ideal       │              │              │                    │
│ Delight     │ 5+ items     │ Note if seen │ Skip               │
│ opps        │              │              │                    │
│ Complexity  │ "Is it big   │ "Is it too   │ "Is it the bare    │
│ question    │  enough?"    │  complex?"   │  minimum?"         │
│ Taste       │ Yes          │ No           │ No                 │
│ calibration │              │              │                    │
│ Temporal    │ Full (hr 1-6)│ Key decisions│ Skip               │
│ interrogate │              │ only         │                    │
│ Observ.     │ "Joy to      │ "Can we      │ "Can we see if     │
│ standard    │  operate"    │  debug it?"  │  it's broken?"     │
│ Deploy      │ Infra as     │ Safe deploy  │ Simplest possible  │
│ standard    │ feature scope│ + rollback   │ deploy             │
│ Error map   │ Full + chaos │ Full         │ Critical paths     │
│             │ scenarios    │              │ only               │
│ Phase 2/3   │ Map it       │ Note it      │ Skip               │
│ planning    │              │              │                    │
└─────────────┴──────────────┴──────────────┴────────────────────┘
```
