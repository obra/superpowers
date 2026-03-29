---
name: plan-eng-review
description: Use when a written FeatureForge implementation plan from a CEO-approved spec needs engineering review before execution or needs a late refresh-test-plan regeneration before finish gating
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
_TODOS_FORMAT=""
[ -n "$_FEATUREFORGE_ROOT" ] && [ -f "$_FEATUREFORGE_ROOT/review/TODOS-format.md" ] && _TODOS_FORMAT="$_FEATUREFORGE_ROOT/review/TODOS-format.md"
[ -z "$_TODOS_FORMAT" ] && [ -f "$_REPO_ROOT/review/TODOS-format.md" ] && _TODOS_FORMAT="$_REPO_ROOT/review/TODOS-format.md"
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

## Agent Grounding

Honor the active repo instruction chain from `AGENTS.md`, `AGENTS.override.md`, `.github/copilot-instructions.md`, and `.github/instructions/*.instructions.md`, including nested `AGENTS.md` and `AGENTS.override.md` files closer to the current working directory.

These review skills are public FeatureForge skills for Codex and GitHub Copilot local installs.

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


# FeatureForge Artifact Contract

- Review the written plan artifact in `docs/featureforge/plans/YYYY-MM-DD-<feature-name>.md`.
- If the user names a specific plan path, use that path. Otherwise, inspect `docs/featureforge/plans/` and review the newest matching plan doc.
- Review the full written plan after completion. Do not do chunk-by-chunk embedded review here.
- If no current plan exists, stop and direct the agent back to `featureforge:writing-plans`.
- The plan must include these exact header lines immediately below the title:

```markdown
**Workflow State:** Draft | Engineering Approved
**Plan Revision:** <integer>
**Execution Mode:** none | featureforge:executing-plans | featureforge:subagent-driven-development
**Source Spec:** <path>
**Source Spec Revision:** <integer>
**Last Reviewed By:** writing-plans | plan-eng-review
```

- If any header line is missing or malformed, normalize the plan to this contract before continuing and treat it as `Draft`.
- `writing-plans` is only valid while the plan remains `Draft`. An `Engineering Approved` plan must end with `**Last Reviewed By:** plan-eng-review`.
- Read the source spec named in `**Source Spec:**` and confirm both the path and revision match the latest approved spec before approving execution.
- Treat `Requirement Index`, `Requirement Coverage Matrix`, canonical `## Task N:` headings, `Spec Coverage`, `Task Outcome`, `Plan Constraints`, `Open Questions`, and `Files:` blocks as required plan contract surface for engineering approval.
- When review decisions change the written plan, update the plan document before continuing.
- **Protected-Branch Repo-Write Gate:**
- Before editing the plan body or changing approval headers on disk, run the shared repo-safety preflight for the exact review-write scope:

```bash
featureforge repo-safety check --intent write --stage featureforge:plan-eng-review --task-id <current-plan-review> --path docs/featureforge/plans/YYYY-MM-DD-<feature-name>.md --write-target plan-artifact-write
```

- When the mutation is specifically an approval-header edit, use the same command shape with `--write-target approval-header-write`.
- If the helper returns `blocked`, name the branch, the stage, and the blocking `failure_class`, then route to either a feature branch / `featureforge:using-git-worktrees` or explicit user approval for this exact review scope.
- If the user explicitly approves the protected-branch review write, run:

```bash
featureforge repo-safety approve --stage featureforge:plan-eng-review --task-id <current-plan-review> --reason "<explicit user approval>" --path docs/featureforge/plans/YYYY-MM-DD-<feature-name>.md --write-target plan-artifact-write
featureforge repo-safety check --intent write --stage featureforge:plan-eng-review --task-id <current-plan-review> --path docs/featureforge/plans/YYYY-MM-DD-<feature-name>.md --write-target plan-artifact-write
```

- Repeat the same approve -> re-check pattern for `approval-header-write` before flipping `**Workflow State:**` or any other approval header on a protected branch.
- Keep the plan in `Draft` while review issues remain open or while the source spec path or revision is stale.
- Only write `**Workflow State:** Engineering Approved` as the last step of a successful review, and set `**Last Reviewed By:** plan-eng-review` at the same time.
- When the review is resolved and the written plan is approved, present the normal execution preflight handoff.
- `featureforge:subagent-driven-development` and `featureforge:executing-plans` own implementation. Do not start implementation inside `plan-eng-review`.

**The terminal state is presenting the execution preflight handoff with the approved plan path.**

plan-eng-review also owns the late refresh-test-plan lane when finish readiness reports `test_plan_artifact_missing` or `test_plan_artifact_stale` for the current approved plan revision.

In that late-stage lane, the terminal state is returning to the finish-gate flow with a regenerated current-branch test-plan artifact, not reopening execution preflight.

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

Persist accelerated engineering section packets under `~/.featureforge/projects/<slug>/...`.

Resume accelerated engineering review only from the last approved-and-applied section boundary.

If the source artifact fingerprint changes, treat saved accelerated ENG packets as stale and regenerate them before reuse.

Accelerator artifacts must use bounded retention rather than accumulate indefinitely.

Accelerated engineering review must preserve QA handoff generation, TODO flow, failure-mode output, and the normal execution preflight handoff.

Only the main review agent may write authoritative artifacts, apply approved patches, or change approval headers in accelerated engineering review.

Final explicit human approval remains unchanged. Accelerated review may speed up section handling, but it may not bypass approval authority or the normal execution preflight boundary.

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

### Step 0.4: Search Check

Run this check when the plan introduces a new or custom:

- auth, session, or token flow
- cache layer
- queue, scheduler, or background job mechanism
- concurrency primitive
- search or indexing subsystem
- browser or platform API workaround
- wrapper around a framework capability
- infrastructure dependency
- unfamiliar integration pattern

For each triggered area, ask:

1. Does the framework, runtime, or platform already provide a built-in?
2. Is the chosen pattern still considered current best practice?
3. What are the known footguns or failure modes?

If a robust built-in exists, treat that as a scope reduction or simplification opportunity.

Annotate relevant review points with provenance tags:

- `[Layer 1]`
- `[Layer 2]`
- `[Layer 3]`
- `[EUREKA]`

These tags belong in review prose and recommendation language, not in plan headers.

Then ask whether the user wants one of three options:

1. **SCOPE REDUCTION:** The plan is overbuilt. Propose a minimal version that achieves the core goal, then review that.
2. **BIG CHANGE:** Work through interactively, one section at a time: architecture, code quality, tests, performance.
3. **SMALL CHANGE:** In normal non-accelerated review, use a compressed review. Step 0 plus one combined pass covering all 4 sections. For each section, pick the single most important issue.

In accelerated review, `SMALL CHANGE` still uses canonical section packets and per-section approvals; only reviewer depth stays compressed.

Critical: If the user does not select SCOPE REDUCTION, respect that decision fully. Your job becomes making the chosen plan succeed, not continuing to lobby for a smaller plan.

### Approval Gate

Before moving into the review sections:

1. Read `**Source Spec:**` and confirm the file exists.
2. Read that spec's `**Workflow State:**`, `**Spec Revision:**`, and `**Last Reviewed By:**`.
3. If the spec is not workflow-valid `CEO Approved` with `**Last Reviewed By:** plan-ceo-review`, stop and direct the agent back to `featureforge:plan-ceo-review`.
4. If the plan's `**Source Spec:**` path or `**Source Spec Revision:**` does not match the latest approved spec, stop and direct the agent back to `featureforge:writing-plans`.
5. Before starting engineering review, require a matching runtime-owned plan-fidelity receipt in pass state for the current plan revision and approved spec revision.
6. Do not start engineering review until workflow routing returns the current draft plan to `featureforge:plan-eng-review` with a matching pass plan-fidelity receipt.
7. If the matching plan-fidelity receipt is missing, stale, malformed, or not pass, stop and hand control back to `featureforge:writing-plans`.
8. Do not look for a markdown `## Plan Fidelity Review Receipt` block in the plan. The authoritative evidence is the runtime-owned receipt surfaced by workflow routing and `plan contract analyze-plan`.
9. If you make plan edits during this review, keep `**Workflow State:** Draft` until every review issue is resolved.

### Plan-Contract Gate

Before `**Workflow State:** Engineering Approved`, run:

```bash
PLAN_ANALYSIS_JSON="$("$_FEATUREFORGE_BIN" plan contract analyze-plan \
  --spec <source-spec-path> \
  --plan <plan-path> \
  --format json)"
```

Engineering approval must fail closed unless `contract_state == valid` and `packet_buildable_tasks == task_count`.

Engineering approval must also fail closed unless `plan_fidelity_receipt.state == pass`.

Engineering approval must also fail closed unless `execution_strategy_present`, `dependency_diagram_present`, `execution_topology_valid`, `serial_hazards_resolved`, `parallel_lane_ownership_valid`, and `parallel_workspace_isolation_valid` are all `true`.

Treat `reason_codes` and `diagnostics` from `analyze-plan` as the authoritative contract feedback for approval law.

Engineering approval must fail closed when `analyze-plan` reports:

- missing or malformed `Requirement Index`
- missing or malformed `Requirement Coverage Matrix`
- missing or malformed `Execution Strategy`
- missing or malformed `Dependency Diagram`
- unknown requirement IDs
- uncovered requirement IDs
- tasks without `Spec Coverage`
- tasks with `Open Questions` not equal to `none`
- ambiguous wording
- requirement weakening or widening
- invalid task heading structure
- invalid `Files:` block structure
- serial execution without an explicit hazard or reintegration reason
- parallel lanes that do not declare owned task responsibility
- parallel lanes that do not declare exact isolated workspace truth for the whole batch
- fake-parallel hotspot files or unordered overlapping write scopes

If `coverage_complete`, `open_questions_resolved`, `task_structure_valid`, `files_blocks_valid`, `execution_strategy_present`, `dependency_diagram_present`, `execution_topology_valid`, `serial_hazards_resolved`, `parallel_lane_ownership_valid`, or `parallel_workspace_isolation_valid` is not `true`, keep the plan in `Draft` and continue review or route back to `featureforge:writing-plans`.

In the review itself, answer these questions explicitly before approval:

- Does the `Requirement Coverage Matrix` cover every approved requirement without orphaned or over-broad tasks?
- Do task-level `Spec Coverage` entries preserve approved decisions and constraints rather than reopening them?
- Do the planned tasks preserve the approved non-goals and avoid widening scope into behavior the spec explicitly excluded?
- Do `Files:` blocks stay within the minimum file scope needed for the covered requirements, or do they signal file-scope drift that should be split or reapproved?
- Does `Execution Strategy` assign every task exactly once with explicit serial reasoning or explicit parallel worktree ownership?
- Do parallel worktree batches declare exact isolation, either through one isolated worktree per task or an explicit matching worktree count, with no shared-worktree ambiguity?
- Does `Dependency Diagram` match the claimed task ordering, merge-back seams, and reintegration points?
- Are any parallel lanes only parallel on paper because they still share hotspot files without an explicit later serial seam?

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
* rollout and rollback thinking where the change affects delivery or operations
* explicit risks where the planned change introduces operational, architectural, or delivery risk

**STOP.** In normal review, use one interactive user question per issue. In accelerated review, keep routine issues in the section packet and break out only escalated high-judgment issues as direct human questions. Present options, state your recommendation, explain WHY. Do NOT batch escalated issues into one interactive user question. Exception: in normal non-accelerated `SMALL CHANGE` mode, collect one issue per section and use the bundled end-of-review round instead of pausing here. Only proceed to the next section after the current section is resolved.

### 2. Code quality review

Evaluate:

* Code organization and module structure
* DRY violations
* Error handling patterns and missing edge cases
* Technical debt hotspots
* Areas that are over-engineered or under-engineered relative to the preferences above
* Existing ASCII diagrams in touched files. Are they still accurate after this change?
* ordered implementation steps: can an engineer execute the plan without inventing missing structure?
* documentation update expectations: does the plan say what contributor or operator docs must move with the change?
* evidence expectations: does the plan say what proof each meaningful slice must leave behind?

Apply domain overlays when relevant so review questions stay concrete rather than generic:

* web/UI: user flow, navigation impact, empty/loading/error states, accessibility impact, responsive behavior, browser and flow validation
* API/service/backend: request/response contracts, backward compatibility, error semantics, timeouts/retries/rate limits, contract tests, compatibility checks
* data/ETL: schema evolution, source/sink compatibility, data quality expectations, backfill or reprocessing needs, downstream compatibility
* infrastructure/IaC: blast radius, environment impact, security or policy impact, drift implications, rollback practicality, preview or post-change verification
* library/SDK: public API changes, semantic-versioning impact, consumer migration impact, breaking changes, compatibility and packaging validation

**STOP.** In normal review, use one interactive user question per issue. In accelerated review, keep routine issues in the section packet and break out only escalated high-judgment issues as direct human questions. Present options, state your recommendation, explain WHY. Do NOT batch escalated issues into one interactive user question. Exception: in normal non-accelerated `SMALL CHANGE` mode, collect one issue per section and use the bundled end-of-review round instead of pausing here. Only proceed to the next section after the current section is resolved.

### 3. Test review

Make a coverage graph of all new UX, new data flow, new codepaths, and new branching if statements or outcomes. For each meaningful path, classify it as:

* automated
* manual QA
* explicitly not required, with written justification

Before approving the plan, also verify:

* preconditions are explicit where setup, environment, or migration state matters
* validation strategy covers the planned change surface
* browser-visible flows include explicit browser-edge checks for loading, empty, error, success, partial, navigation, responsive, and accessibility-critical states where relevant
* non-browser paths include explicit contract checks for compatibility, retry/timeout semantics, replay or backfill behavior, and rollback or migration verification where relevant
* require `qa-only` when the approved plan, branch-specific test-plan artifact, or change surface clearly indicates browser-facing behavior or browser interaction
* do not turn `qa-only` into a universal workflow gate for all change types

Also produce an `E2E Test Decision Matrix` for browser-visible or multi-step interaction flows:

```text
FLOW | REQUIRED? | WHY | COVERAGE
```

**REGRESSION RULE:** every new meaningful path or branch outcome must land in exactly one of `automated`, `manual QA`, or `not required` with written justification before approval.

For LLM or prompt changes, check the repo's prompt or evaluation docs. If this plan touches those patterns, state which eval suites must be run, which cases should be added, and what baselines to compare against. Then use one interactive user question to confirm the eval scope with the user.

**STOP.** In normal review, use one interactive user question per issue. In accelerated review, keep routine issues in the section packet and break out only escalated high-judgment issues as direct human questions. Present options, state your recommendation, explain WHY. Do NOT batch escalated issues into one interactive user question. Exception: in normal non-accelerated `SMALL CHANGE` mode, collect one issue per section and use the bundled end-of-review round instead of pausing here. Only proceed to the next section after the current section is resolved.

### Test Plan Artifact

After producing the coverage graph, write a QA handoff artifact for cross-session reuse:

```bash
_SLUG_ENV=$("$_FEATUREFORGE_BIN" repo slug 2>/dev/null || true)
if [ -n "$_SLUG_ENV" ]; then
  eval "$_SLUG_ENV"
fi
unset _SLUG_ENV
USER=$(whoami)
DATETIME=$(date +%Y%m%d-%H%M%S)
mkdir -p "$_SP_STATE_DIR/projects/$SLUG"
```

Write to `$_SP_STATE_DIR/projects/$SLUG/{user}-{safe-branch}-test-plan-{datetime}.md` with:

```markdown
# Test Plan
**Source Plan:** `docs/featureforge/plans/...`
**Source Plan Revision:** 3
**Branch:** {branch}
**Repo:** {slug}
**Head SHA:** {current-head}
**Browser QA Required:** yes
**Generated By:** featureforge:plan-eng-review
**Generated At:** 2026-03-22T14:30:00Z

## Affected Pages / Routes
- {route} — {what to verify and why}

## Key Interactions
- {interaction} on {page or route}

## Edge Cases
- {edge case} on {page or route}

## Critical Paths
- {end-to-end flow}

## Coverage Graph
- {path or flow} -> automated | manual QA | not required ({why})

## E2E Test Decision Matrix
- {flow} -> required yes|no ({why}) -> {coverage}

## Browser Matrix
- {browser/device} — {flow or route}

## Non-Browser Contract Checks
- {suite or command} — {what it proves}

## Regression Risks
- {risk} — {why it matters}

## Manual QA Notes
- {tester-facing note}

## Engineering Review Summary
- Review outcome captured separately in the source plan.
```

This file is consumed by `featureforge:qa-only` as the primary QA handoff. Include only tester-facing guidance: what to test, where to test it, and why it matters. Preserve the current core sections (`Affected Pages / Routes`, `Key Interactions`, `Edge Cases`, `Critical Paths`) and treat the richer sections as additive context; finish-gate freshness still depends on the existing required headers.

Set `**Browser QA Required:** yes` when the approved plan, branch-specific routes, or interaction surface make browser QA part of the normal finish gate. Otherwise write `no`.
Set `**Head SHA:**` to the current `git rev-parse HEAD` for the branch state that this test-plan artifact covers.

### 4. Performance review

Evaluate:

* N+1 queries and repeated fetch patterns
* Memory-usage concerns
* Caching opportunities
* Slow or high-complexity code paths

**STOP.** In normal review, use one interactive user question per issue. In accelerated review, keep routine issues in the section packet and break out only escalated high-judgment issues as direct human questions. Present options, state your recommendation, explain WHY. Do NOT batch escalated issues into one interactive user question. Exception: in normal non-accelerated `SMALL CHANGE` mode, collect one issue per section and use the bundled end-of-review round instead of pausing here. Only proceed to the next section after the current section is resolved.

## Outside Voice — Independent Plan Challenge (optional, recommended)

After all review sections are complete, optionally get an outside voice. This is informative by default. It becomes actionable only if the main reviewer explicitly adopts a finding and patches the authoritative plan body.

Use `skills/plan-eng-review/outside-voice-prompt.md` when briefing the outside voice.

Tool order:

1. Prefer `codex exec` when available.
2. Label the source as `cross-model` only when the outside voice definitely uses a different model/provider than the main reviewer.
3. If model provenance is the same, unknown, or only a fresh-context rerun of the same reviewer family, label the source as `fresh-context-subagent`.
4. If the transport truncates or summarizes the outside-voice output, disclose that limitation plainly in review prose instead of overstating independence.
5. If `codex exec` is unavailable, use a fresh-context reviewer path and label the source as `fresh-context-subagent`.
6. If neither path is available, record `Outside Voice: unavailable`.

Outside voice rules:

* Review only the supplied plan and QA-handoff context.
* Do not mutate plan or artifacts directly.
* Report disagreements as candidate findings for the main reviewer to adopt or reject.
* Present findings truthfully labeled by source.
* If the outside voice is skipped, record `Outside Voice: skipped`.

## Engineering Review Summary Writeback

After review decisions are applied to the authoritative plan body, write or replace a single trailing summary block at the end of the plan:

```markdown
## Engineering Review Summary

**Review Status:** clear | issues_open
**Reviewed At:** <ISO-8601 UTC>
**Review Mode:** big_change | small_change | scope_reduction
**Reviewed Plan Revision:** <integer>
**Critical Gaps:** <integer>
**Browser QA Required:** yes | no
**Test Plan Artifact:** `<artifact path>`
**Outside Voice:** skipped | unavailable | cross-model | fresh-context-subagent
```

Summary write rules:

* Accepted review findings must patch the authoritative plan body before approval. The summary is descriptive only.
* Run the plan-artifact-write gate before editing the summary body.
* Run the approval-header-write gate separately before flipping approval headers.
* If an `## Engineering Review Summary` section already exists, replace from that heading through the next `## ` heading or EOF, whichever comes first.
* Always move the summary to the end of the file. Do not leave an older copy in the middle.
* If the write fails because the plan changed concurrently, re-read the file and retry once. If freshness cannot be re-established, leave the plan in `Draft`.

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
* Test Review: coverage graph produced, ___ automated gaps identified, browser QA required: yes/no
* Performance Review: ___ issues found
* NOT in scope: written
* What already exists: written
* TODOS.md updates: ___ items proposed to user
* Failure modes: ___ critical gaps flagged
* Test Plan Artifact: `<artifact path>`
* Outside Voice: skipped / unavailable / cross-model / fresh-context-subagent
* Engineering Review Summary: written

## Retrospective learning

Check the git log for this branch. If there are prior commits suggesting a previous review cycle, note what changed and whether the current plan touches the same areas. Be more aggressive reviewing areas that were previously problematic.

## Execution handoff

Before presenting the final execution preflight handoff, if `$_FEATUREFORGE_BIN` is available, call `$_FEATUREFORGE_BIN workflow status --refresh`.

- If the helper returns a non-empty `next_skill`, use that route instead of re-deriving state manually.
- If the helper returns `status` `implementation_ready`, immediately call `$_FEATUREFORGE_BIN workflow handoff` before presenting any handoff text.
- If that handoff returns `phase` `execution_preflight`, present the normal execution preflight handoff below.
- If that handoff returns a later phase such as `review_blocked`, `qa_pending`, `document_release_pending`, or `ready_for_branch_completion`, follow that reported phase and `next_action` instead of reopening execution preflight.
- Only fall back to manual artifact inspection if the helper is unavailable or fails.

When the review is resolved and the written plan is approved, present the normal execution preflight handoff.

During that handoff, call `featureforge plan execution recommend --plan <approved-plan-path>` and present the helper's recommended skill first.

The handoff must include the exact approved plan path and must remind the execution skill to reject draft or stale plans.

The handoff must name the exact approved plan path and approved plan revision.

If any task packet is missing, stale, or non-buildable for the approved plan revision, stop and route back to review instead of handing off execution.

* Present the helper-recommended execution skill as the default path with the approved plan path.
* If isolated-agent workflows are available in the current platform/session, show the other valid execution skill as an explicit override.
* If isolated-agent workflows are unavailable, do not present `featureforge:subagent-driven-development` as an available override.

Do not start implementation before the review is satisfied.

## Formatting rules

* NUMBER issues and LETTER options.
* Label with NUMBER + LETTER, for example `3A`.
* One sentence max per option.
* After each review section, pause and ask for feedback before moving on unless normal non-accelerated `SMALL CHANGE` mode is using the bundled end-of-review round.

## Unresolved decisions

If the user does not respond to an interactive user question or interrupts to move on, note which decisions were left unresolved. At the end of the review, list these as "Unresolved decisions that may bite you later". Never silently default.
