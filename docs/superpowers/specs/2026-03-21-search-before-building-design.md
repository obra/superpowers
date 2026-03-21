# Search Before Building

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Summary

Add a shared Search-Before-Building method to Superpowers so agents check existing built-ins, repo-native solutions, and current ecosystem guidance before inventing bespoke patterns, while keeping Superpowers' current workflow authority model intact.

This feature is intentionally skill-layer-first:

- add one durable operational reference under `references/`
- inject a compact shared policy into generated non-router skill preambles
- teach the owning workflow skills, reviewer agent, and checklist where lightweight external awareness improves outcomes
- keep exact artifact headers, helper-owned workflow state, and repo-visible approval authority unchanged

In v1, Search-Before-Building is a disciplined behavior contract, not a new workflow stage, not a new helper-owned state machine, not a manifesto import, and not a mandatory internet dependency.

## Problem

Superpowers already excels at workflow discipline:

- `using-superpowers` routes conservatively
- `superpowers-workflow-status` derives the safest next stage from repo truth
- specs and plans use exact header contracts
- execution truth stays in the approved plan checklist plus execution evidence
- review and debugging skills already emphasize rigor over guesswork

What is missing is an explicit, cross-cutting rule for when the agent should briefly look outward before designing, reviewing, debugging, or endorsing a new pattern.

Today that gap creates four recurring risks:

1. the agent may design or recommend a custom implementation even when the framework, runtime, or repo already has a better answer
2. early product and architecture choices may stay too inward-looking when lightweight category awareness would materially improve the spec
3. debugging and review can stall when the local repo does not contain enough evidence to identify known ecosystem failure modes or footguns
4. search behavior, when it happens, is inconsistent, weakly documented, and insufficiently explicit about privacy and sanitization

The goal is to close that gap without weakening the parts of Superpowers that already work well: exact artifact headers, conservative routing, helper-owned workflow derivation, and repo-visible approval truth.

## Goals

- Reduce needless bespoke implementations when the repo, framework, platform, or runtime already provides a robust solution.
- Improve early product and design choices with lightweight landscape awareness when category or platform context matters.
- Strengthen debugging and code review with external pattern knowledge when local evidence is insufficient.
- Preserve Superpowers' existing state-machine design, exact artifact headers, and repo-visible-authority model.

## Not In Scope

- Adding a new workflow stage.
- Changing `bin/superpowers-workflow-status` behavior in v1.
- Changing `bin/superpowers-plan-execution` behavior in v1.
- Turning Search-Before-Building into a mandatory internet-first policy.
- Importing `gstack`'s broader product philosophy or manifesto language wholesale.
- Making telemetry or local logging a prerequisite for rollout.
- Adding new required spec or plan header fields.
- Introducing a new authoritative artifact class for landscape data, search logs, or research notes.
- Rewriting historical specs or plans so they all include the new optional body sections.

## Architecture Boundary

Search-Before-Building must live at the same ownership layers that already govern similar behavior in Superpowers:

- shared operational guidance belongs in `references/`
- repeated prompt policy belongs in `scripts/gen-skill-docs.mjs`
- workflow-stage behavior belongs in the owning `SKILL.md.tmpl` files
- review behavior belongs in the reviewer instructions plus the shared review checklist
- user-facing expectations belong in `README.md`, `docs/README.codex.md`, and `docs/README.copilot.md`

It must not create a second authority path around the workflow helpers.

```text
user request
   |
   v
using-superpowers
   |
   v
owning skill ------------------------------+
   |                                       |
   | applies Search-Before-Building rules  |
   | when trigger heuristics say it helps  |
   v                                       |
repo-visible artifacts                     |
   |                                       |
   +--> spec / plan body sections          |
   +--> review output provenance tags      |
                                           |
workflow helpers remain authority ---------+
spec headers, plan headers, and execution evidence stay authoritative
```

The core rule is:

- Search-Before-Building may improve reasoning quality.
- It may not become approval authority.
- Layer 2 research never outranks repo truth, exact headers, or approved artifact state.

## Existing Context

The current repo already has the correct extension points for this feature:

- `scripts/gen-skill-docs.mjs` centrally generates shared preambles for templated skills and explicitly special-cases `using-superpowers`
- `skills/*/SKILL.md.tmpl` files already define workflow-stage behavior and exact artifact contracts
- `agents/code-reviewer.instructions.md` is the single source for generated reviewer agents
- `review/checklist.md` already defines shared review passes and severity semantics
- `README.md`, `docs/README.codex.md`, and `docs/README.copilot.md` already document workflow, runtime state, and helper boundaries
- runtime tests already assert generated-doc contracts, workflow sequencing, and helper-owned authority boundaries

That means this feature can be implemented without inventing a new subsystem. The work is primarily generator, skill, reviewer, checklist, reference, and documentation changes.

## Design Principles

### Local First, Then Landscape, Then Judgment

Search-Before-Building is not internet-before-thinking.

It always uses three layers:

- Layer 1: existing repo-native solutions, standard library or framework built-ins, official guidance, and already-proven local patterns
- Layer 2: current external practice, emerging patterns, and known ecosystem footguns
- Layer 3: first-principles reasoning for this repo, this user, and this problem

Layer 1 should usually come first, because the cheapest safe reuse is almost always local or built-in.

### Layer 2 Is Input, Not Authority

External search can sharpen decisions, but it does not override:

- exact spec and plan headers
- approved repo artifacts
- the current codebase's actual constraints
- explicit user instructions
- helper-owned workflow progression

The agent must synthesize, not cargo-cult.

### Triggered, Not Universal

The feature should activate when it materially improves the outcome, not as ceremony:

- new product/category decisions
- unfamiliar platform capabilities
- bespoke wrappers around framework/runtime behavior
- debugging dead ends
- review of unfamiliar patterns or newly introduced dependencies
- browser or ecosystem-specific QA anomalies

It should stay quiet when local evidence is already sufficient.

### Privacy Before Curiosity

External search is only useful if it is safe.

The v1 design must make sanitization rules explicit, require generalized queries for sensitive work, and prefer skipping search over leaking internal detail.

V1 does not add a broad consent stage for ordinary bounded search. The one explicit exception is `brainstorming`: when brainstorming work is sensitive or stealthy, ask one explicit permission question before any external search. Outside that narrow case, when a skill's trigger heuristics say search is useful, the skill may search only if it can safely generalize the query. If the available details cannot be sanitized safely, the skill must skip search and continue with Layer 1 plus Layer 3 reasoning.

### No New Parser Contracts

The value of this feature comes from behavior and prose structure, not new headers. Optional body sections are allowed. Exact-match artifact headers stay unchanged.

### Accelerated Review Compatibility

Search-Before-Building must fit inside the current accelerated review model:

- no new stage
- no new packet authority
- no bypass of human section approval
- no expansion of helper-owned routing

## Proposed Changes

### 1. Add A Shared Operational Reference

Create `references/search-before-building.md` as the durable reference for the method.

This file should be operational and narrow, not philosophical. It should not copy `gstack`'s broader `ETHOS.md` language. Superpowers already has its own philosophy and workflow story; this reference should only explain the borrowed method and its guardrails.

### Required contents

The reference should define:

- the three-layer model
- the rule that Layer 2 is input, not authority
- trigger heuristics for when search is worth doing
- source-quality guidance by task type
- privacy and sanitization rules
- fallback language when search is unavailable, disallowed, or unsafe
- examples for product design, plan review, debugging, code review, and QA

### Recommended structure

```markdown
# Search Before Building

## Purpose
## The Three Layers
### Layer 1: Built-ins, standards, and repo-native solutions
### Layer 2: Current external practice and known footguns
### Layer 3: First-principles reasoning for this repo
## When To Trigger A Search Pass
## Source Quality Rules
## Privacy And Sanitization Rules
## Fallback Language
## Worked Examples
```

### Required semantic rules

- Layer 1 explicitly includes existing repo-native solutions before external browsing.
- Layer 2 may include official docs, issue trackers, high-signal framework references, and reputable current practice, but must stay bounded.
- Layer 3 is mandatory whenever Layer 2 is used; the agent must decide what fits this repo rather than merely reporting search results.
- The reference must explain that search is optional and best-effort, not a required prerequisite for productive use of Superpowers.

Privacy and sanitization should be centralized in the shared reference plus generated skill/reviewer guidance, rather than expanding v1 with a new executable runtime helper.

### 2. Inject A Shared Generated Section Into Non-Router Skill Preambles

Add a shared Search-Before-Building section to generated preambles by extending `scripts/gen-skill-docs.mjs`.

### Generator change

Add a helper such as `buildSearchBeforeBuildingSection()` and append it inside `generatePreamble({ review })`.

Do not inject this section into `generateUsingSuperpowersPreamble()`.

That preserves the current router boundary:

- `using-superpowers` decides which skill owns the turn
- the owning skill decides whether Search-Before-Building is relevant

### Required insertion contract

- every generated non-router skill gets the section once
- review skills also get it
- `using-superpowers` does not get it
- the section stays compact and points to the full reference file
- it does not execute shell commands or add new helper dependencies

### Intended generated text

The exact wording can vary slightly, but it should stay close to this operational contract:

```md
## Search Before Building
Before introducing a custom pattern, external service, concurrency primitive, auth/session flow, cache, queue, browser workaround, or unfamiliar fix pattern, do a short capability/landscape check first.

Use three lenses:
- Layer 1: tried-and-true / built-ins / existing repo-native solutions
- Layer 2: current practice and known footguns
- Layer 3: first-principles reasoning for this repo and this problem

External search results are inputs, not answers.
Never search secrets, customer data, unsanitized stack traces, private URLs, or internal codenames.
If search is unavailable, say so and proceed with repo-local evidence and in-distribution knowledge.
See `$_SUPERPOWERS_ROOT/references/search-before-building.md`.
```

### Test expectations

The generator and contract tests should prove:

- the section exists exactly once in generated non-router skills
- `using-superpowers` remains exempt
- the reference path is present
- the privacy line is present

### 3. Integrate Search-Before-Building Into `brainstorming`

`brainstorming` is the highest-leverage place to add landscape awareness because it shapes the spec before downstream stages harden around it.

### New step

Add **Landscape Awareness** between:

- `Ask clarifying questions`
- `Propose 2-3 approaches`

### Trigger heuristics

Run Landscape Awareness only when one or more of these are true:

- the task involves product or category choice
- the task introduces a new architectural direction
- the task depends on unfamiliar runtime, framework, or platform capability
- the user is likely to benefit from knowing current conventional approaches or failure modes

Do not force it for every brainstorm.

### Required behavior

- if the work is sensitive or stealthy, ask one explicit permission question before any external search
- if search is allowed, use safely generalized category language only
- search with generalized category terms only
- do not search product codenames, customer names, private feature names, or internal URLs
- cap the pass to 2-3 high-signal sources
- synthesize the result through the three-layer model before proposing approaches
- if search is unavailable, disallowed, or unsafe, say so plainly and continue with Layer 1 plus Layer 3 reasoning

### Written spec output

Allow the written draft spec to include an optional body section:

```markdown
## Landscape Snapshot
### Layer 1
### Layer 2
### Layer 3
### Eureka (optional)
### Decision impact
```

This section is optional prose, not a new approval header.

However, when Layer 2 research materially influences the selected approach, simplification, warning, or rejection of an alternative, the spec must include this section so that the reasoning is preserved in repo-visible artifact truth rather than transient session context.

### Skill-template changes

Update `skills/brainstorming/SKILL.md.tmpl` to:

- add the new checklist item
- update the process-flow graph
- describe the trigger heuristics and source cap
- explain the optional `Landscape Snapshot` spec section

### 4. Integrate Search-Before-Building Into `plan-ceo-review`

`plan-ceo-review` already performs a system audit and then a heavy Step 0 scope challenge. Search-Before-Building should sharpen that stage, not replace it.

### New pre-step

Add **Pre-Step 0: Landscape Check** after the system audit and before `Step 0: Nuclear Scope Challenge + Mode Selection`.

### Required behavior

- reuse the spec's `Landscape Snapshot` when it exists and is still relevant
- refresh only when the spec lacks it or the review introduces materially new market, category, or architecture assumptions
- keep the pass short and decision-oriented
- if the refreshed Landscape Check materially changes the approved reasoning, update the spec's `Landscape Snapshot` and `Decision impact` before approval so the final reasoning lives in the repo-visible artifact
- feed the result into:
  - `0A. Premise Challenge`
  - `0B. Existing Code Leverage`
  - `0C. Dream State Mapping`
  - `0F. Mode Selection`

### Required synthesis output

The review should explicitly surface:

- what incumbents or standard approaches usually do
- where those approaches fail or become overbuilt
- whether the spec is reinventing a solved problem
- whether a Layer 3 insight creates a simplification or differentiation opportunity

### Accelerated review compatibility

In accelerated CEO review, this content belongs inside the existing Step 0 packet. It does not create a new packet type or a separate approval boundary.

### 5. Integrate Search-Before-Building Into `writing-plans`

`writing-plans` should mostly consume prior landscape work, not redo it.

### Core rule

Do not make fresh search the default here.

The planner should translate approved design-level conclusions into concrete implementation guidance.

### New optional plan sections

Allow the written plan to include:

```markdown
## Existing Capabilities / Built-ins to Reuse
## Known Footguns / Constraints
```

### Required behavior

- pull from the approved spec's `Landscape Snapshot` when present
- if Layer 2 materially affected reuse guidance, simplification advice, or footgun warnings, the plan should capture that outcome in `## Existing Capabilities / Built-ins to Reuse` and/or `## Known Footguns / Constraints`
- if the spec says to prefer built-in `X` over custom `Y`, the plan must reflect that in task structure, file paths, and implementation steps
- if the approved spec is silent but the plan introduces an unfamiliar runtime or framework capability, a targeted capability check is allowed only to close a concrete implementation gap
- if the planner materially changes the approved design choice, it must not silently drift; either align the plan to the approved spec or surface the mismatch for review

### Why this matters

This is the stage where "interesting idea" becomes "touch these files, use this primitive, avoid this trap." Search-before-building only helps if that reuse guidance survives into the execution plan.

### 6. Integrate Search-Before-Building Into `plan-eng-review`

This is the strongest direct port because `plan-eng-review` already asks what exists, whether the plan is minimal, and whether the plan is overbuilt.

### New Step 0 sub-step

Add **Step 0.4: Search Check** inside the existing Scope Challenge.

### Trigger classes

Run the search check when the plan introduces a new or custom:

- auth, session, or token flow
- cache layer
- queue, scheduler, or background job mechanism
- concurrency primitive
- search or indexing subsystem
- browser or platform API workaround
- wrapper around a framework capability
- infrastructure dependency
- unfamiliar integration pattern

### Required questions

For each triggered area, ask:

1. Does the framework, runtime, or platform already provide a built-in?
2. Is the chosen pattern still considered current best practice?
3. What are the known footguns or failure modes?

### Review output rules

Annotate relevant review points with provenance tags:

- `[Layer 1]`
- `[Layer 2]`
- `[Layer 3]`
- `[EUREKA]`

These tags belong in review prose and recommendation language, not in plan headers.

### Relationship to existing outputs

- the existing `"What already exists"` section remains required
- the search check expands it beyond repo-local code into framework/runtime capability and current ecosystem pitfalls
- if a custom solution duplicates a robust built-in, the review should flag it as a scope-reduction or simplification opportunity

### Accelerated review compatibility

In accelerated ENG review, this work stays inside the existing Step 0 packet and normal review sections. No new workflow stage, packet type, or approval authority is introduced.

### 7. Integrate Search-Before-Building Into `systematic-debugging`

Debugging should stay evidence-first. Search is allowed only as a bounded way to generate better hypotheses when local evidence stalls.

### New hook: Phase 2.5

Add **Phase 2.5: External Pattern Search** after local pattern analysis and before hypothesis formation when:

- the bug does not match a known local pattern
- the issue can be safely generalized
- external pattern knowledge is likely to improve the next hypothesis

### New hook: Phase 3.2b

Add **Search Escalation on failed hypothesis**:

- when a tested hypothesis fails
- and the issue can be generalized safely
- do one targeted external pattern check before choosing the next hypothesis

### Required debugging rules

- sanitize first
- search generic error class plus framework or library context
- skip entirely if safe sanitization is not possible
- treat results as candidate hypotheses, not conclusions
- keep the Iron Law intact: no fixes before root cause investigation

### Example

- bad query: `db-prod-3.internal timeout in /srv/acme/payments SELECT * FROM customers`
- acceptable query: `postgres client timeout during connection handshake`

### 8. Integrate Search-Before-Building Into Code Review

This behavior belongs mostly in the reviewer and the checklist, not in dispatch alone.

### `review/checklist.md`

Add a new Important-pass category:

`Built-in Before Bespoke / Known Pattern Footguns`

This category should catch cases such as:

- custom auth or session handling that bypasses framework protections
- custom retry, debounce, cache, queue, or state logic where the platform already offers a stable primitive
- a newly introduced pattern with well-known failure modes in the current ecosystem

### `agents/code-reviewer.instructions.md`

Extend the reviewer instructions so that when the diff introduces a new or unfamiliar framework, API, dependency, or pattern and external search is available, the reviewer may do 1-2 targeted checks against:

- official documentation
- issue trackers or maintainer guidance
- release notes, standards, or other primary-source technical references

Only fall back to secondary technical references when primary sources are absent or clearly insufficient for the specific question being reviewed.

Required constraints:

- every finding must still be anchored in the actual diff
- findings must still cite concrete `file:line` evidence
- the existing `Critical / Important / Minor` taxonomy stays unchanged
- external knowledge may strengthen a finding, not replace diff-grounded reasoning

### `skills/requesting-code-review/SKILL.md.tmpl`

Add a lightweight reminder that review should consider built-in-before-bespoke and known ecosystem footguns when the implementation introduces unfamiliar patterns.

Optional behavior:

- if the plan already called out a likely external-pattern target, the dispatcher may pass that context into reviewer briefing

This is non-essential in v1. The core value is in reviewer behavior and checklist coverage, not in a new dispatch schema.

### Generated-agent implications

Because the reviewer agent is generated from `agents/code-reviewer.instructions.md`, v1 must continue to use `node scripts/gen-agent-docs.mjs` as the regeneration path rather than hand-editing generated agent outputs.

### 9. Integrate Search-Before-Building Into `receiving-code-review`

`receiving-code-review` already says "verify before implementing." Search-Before-Building should reinforce that posture, not create a new research ceremony.

Add a small rule:

- if review feedback asks for a novel rewrite, unfamiliar framework pattern, or vague "best practice" that does not match repo reality, do a quick capability or landscape check before implementing it

This should remain a short verification hook, not a new stage.

### 10. Integrate Search-Before-Building Into `qa-only`

QA should remain report-only and evidence-driven. Search is only useful here when the bug strongly smells ecosystem-specific.

### New optional report section

Allow:

`Known ecosystem issue lookup (optional)`

### Trigger heuristics

Run it only when a reproduced issue looks likely to be:

- browser-version specific
- framework-version specific
- Playwright or tooling specific
- platform-environment specific

### Required rules

- label the result as a hypothesis, not a fix
- do not block the report if search is unavailable
- preserve `qa-only`'s report-only posture

### Template implication

If maintainers want this to appear in the standard report shape, update `qa/templates/qa-report-template.md` with an optional section or placeholder. If not, keep it as optional prose produced by the skill.

## Artifact Model

Superpowers' exact artifact headers stay unchanged.

### Specs

Allowed optional body section:

```markdown
## Landscape Snapshot
### Layer 1
### Layer 2
### Layer 3
### Eureka (optional)
### Decision impact
```

This section stays optional structurally, but it becomes required whenever Layer 2 materially influenced the approved design direction, simplification, or warning set.

If `plan-ceo-review` refreshes that Layer 2 reasoning and the refreshed result materially changes the approved rationale, the section must be updated before the spec is approved.

### Plans

Allowed optional body sections:

```markdown
## Existing Capabilities / Built-ins to Reuse
## Known Footguns / Constraints
```

These sections stay optional structurally, but they become required whenever Layer 2 materially influenced the implementation guidance carried forward from the approved spec or any targeted capability check performed during planning.

### Review output

Allowed provenance markers in prose:

- `[Layer 1]`
- `[Layer 2]`
- `[Layer 3]`
- `[EUREKA]`

### Non-negotiable rule

These additions are optional body content only. They must not become required headers, parser inputs, or helper-owned state.

## Privacy And Sanitization Policy

Privacy rules must ship in v1, not later.

### Never search

- secrets
- customer data
- private URLs
- internal hostnames
- repo-specific codenames
- raw SQL with data payloads
- raw log lines with sensitive values
- unsanitized stack traces that expose internal detail

### Product/design queries

- use generalized category terms only
- in `brainstorming`, if the work is sensitive or stealthy, ask before external search
- avoid product names that are not already safe to disclose externally

### Debugging queries

- reduce the problem to generic error type plus framework, library, or component context
- strip hostnames, IPs, usernames, filesystem paths, SQL fragments, and internal-only text
- skip search if safe sanitization is not possible

### Review and QA queries

- search for the general pattern or issue class, not repo-specific identifiers
- prefer official docs and issue trackers over broad web searching

### Required fallback language

Skills should be able to say a short equivalent of:

- search unavailable, proceeding with repo-local evidence and in-distribution knowledge
- search skipped because the available details could not be sanitized safely
- external search disabled by user or environment; continuing with Layer 1 plus Layer 3 reasoning

## Source Quality Rules

Search-Before-Building should improve signal quality, not increase noise.

### Primary-source bias for technical work

For technical tasks such as plan review, code review, debugging, and capability checks, use primary sources first:

- official documentation
- maintainer guidance
- issue trackers
- release notes
- standards or platform/vendor references

Use secondary technical references only as fallback when primary sources are unavailable or clearly insufficient.

### Preferred by task

- brainstorming and CEO review:
  official docs, category overviews, high-signal incumbent or maintainer sources
- writing-plans and ENG review:
  official framework or runtime docs first, issue trackers, maintainer guidance, release notes, or standards second
- debugging:
  official docs, issue trackers, maintainer discussions, release notes, and only then narrowly targeted secondary technical references
- code review:
  official docs, maintainer guidance, issue trackers, and release notes first; use secondary sources sparingly and only as fallback
- QA:
  release notes, issue trackers, browser or framework compatibility references

### Avoid by default

- low-signal SEO tutorials
- anonymous cargo-cult snippets
- broad result dumping without synthesis

### Boundedness rules

- use short search passes
- prefer 1-2 targeted checks in review and debugging
- prefer 2-3 high-signal sources in brainstorming and CEO review
- stop once the decision or hypothesis is sufficiently informed

## File Ownership And Change Surface

The implementation should stay within the surfaces that already own the relevant behavior today.

### New file

- `references/search-before-building.md`
  shared operational reference for the method

### Modified source files

- `scripts/gen-skill-docs.mjs`
  inject shared Search-Before-Building guidance into generated non-router skill preambles
- `skills/brainstorming/SKILL.md.tmpl`
  add Landscape Awareness behavior and optional spec-body guidance
- `skills/plan-ceo-review/SKILL.md.tmpl`
  add Pre-Step 0 Landscape Check
- `skills/writing-plans/SKILL.md.tmpl`
  convert approved landscape conclusions into reusable implementation guidance
- `skills/plan-eng-review/SKILL.md.tmpl`
  add Step 0.4 Search Check and provenance-tag guidance
- `skills/systematic-debugging/SKILL.md.tmpl`
  add sanitized external pattern-search hooks
- `skills/requesting-code-review/SKILL.md.tmpl`
  reinforce built-in-before-bespoke review posture
- `skills/receiving-code-review/SKILL.md.tmpl`
  add quick verification hook for unfamiliar review suggestions
- `skills/qa-only/SKILL.md.tmpl`
  add optional known-issue lookup behavior
- `agents/code-reviewer.instructions.md`
  teach the generated reviewer how to use bounded external pattern checks
- `review/checklist.md`
  add built-in-before-bespoke / known-footguns review coverage
- `README.md`
  document the feature at the repo level
- `docs/README.codex.md`
  document behavior, optionality, and privacy expectations for Codex users
- `docs/README.copilot.md`
  document behavior, optionality, and privacy expectations for Copilot users

### Generated artifacts that will change after regeneration

- generated `skills/*/SKILL.md` files touched by the template and generator edits
- `agents/code-reviewer.md`
- `.codex/agents/code-reviewer.toml`

These remain generated outputs, not manually maintained sources.

## Validation And Testing

The implementation must prove both behavior and non-regression.

### Required regeneration commands

- `node scripts/gen-skill-docs.mjs`
- `node scripts/gen-skill-docs.mjs --check`
- `node scripts/gen-agent-docs.mjs`
- `node scripts/gen-agent-docs.mjs --check`

### Required test updates

Update existing tests so they prove:

- generated non-router skills include the shared Search-Before-Building section
- `using-superpowers` does not include it
- the updated templates contain the new stage-specific instructions
- review-agent generation still reflects the source instructions
- workflow sequencing expectations still match the same artifact-state model

### Minimum verification gate

The implementation plan and final verification pass must include at least this baseline command set:

- `node scripts/gen-skill-docs.mjs`
- `node scripts/gen-skill-docs.mjs --check`
- `node scripts/gen-agent-docs.mjs`
- `node scripts/gen-agent-docs.mjs --check`
- `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs`
- `bash tests/codex-runtime/test-runtime-instructions.sh`
- `bash tests/codex-runtime/test-workflow-sequencing.sh`

### Existing test surfaces likely to change

- `tests/codex-runtime/gen-skill-docs.unit.test.mjs`
- `tests/codex-runtime/skill-doc-contracts.test.mjs`
- `tests/codex-runtime/test-runtime-instructions.sh`
- `tests/codex-runtime/test-workflow-sequencing.sh`

### Regression boundary

The validation matrix must show that:

- exact artifact headers are unchanged
- workflow helpers still parse the same header contracts
- no new workflow stage appears
- no helper-owned manifest semantics change

## Rollout And Rollback

### Rollout

Ship Search-Before-Building as a skill/doc/reference improvement in one release:

1. shared reference
2. generator and template updates
3. reviewer and checklist updates
4. repo and platform docs updates
5. regenerated artifacts plus tests

Because v1 does not alter helper-owned workflow state or header parsing, rollout does not require migration.

### Rollback

Rollback is straightforward:

- remove the generator insertion
- revert the template, reviewer, checklist, and docs changes
- delete the new reference file

Existing specs or plans that happened to include optional body sections remain valid prose and do not break helper parsing.

## Risks And Mitigations

### Risk: search overuse slows or bloats the workflow

Mitigation:

- trigger heuristics instead of universal behavior
- short source caps
- no router integration
- planner consumes prior research instead of re-running it

### Risk: privacy leakage during search

Mitigation:

- explicit forbidden-query rules
- generalized query language
- narrow the permission gate to sensitive or stealthy `brainstorming` only; otherwise generalize safely or skip
- skip search when sanitization is unsafe

### Risk: agents cargo-cult external answers

Mitigation:

- Layer 2 is explicitly non-authoritative
- Layer 3 reasoning is required
- review and debugging stay diff- and evidence-grounded

### Risk: feature drifts into a new workflow stage

Mitigation:

- no workflow-helper or new runtime-helper changes in v1
- no new stage in docs or templates
- Search-Before-Building integrated only inside existing owning stages

### Risk: generated-doc drift

Mitigation:

- central generator injection
- source-of-truth reviewer instructions
- required regeneration commands
- updated generator and workflow contract tests

### Risk: optional sections accidentally become required parser contracts

Mitigation:

- exact artifact headers remain unchanged
- body sections are documented as optional prose only
- helper regression tests remain part of the release gate

## Deferred Follow-Ups

These are explicitly not required for v1:

- local-only Eureka logging under `SUPERPOWERS_STATE_DIR` or `~/.superpowers/`
- retro or summary skills that consume Eureka logs
- helper-backed search telemetry or search-state manifests
- broader dispatcher schema changes for reviewer search targets

If maintainers later add local-only logging, it should:

- be optional
- use the existing Superpowers state root conventions
- not become a rollout prerequisite for the rest of the feature

## Acceptance Criteria

- A new `references/search-before-building.md` exists and documents layers, triggers, privacy rules, fallback language, and worked examples.
- `scripts/gen-skill-docs.mjs` injects a compact Search-Before-Building section into generated non-router skill preambles and leaves `using-superpowers` unchanged.
- `brainstorming` includes a Landscape Awareness step and supports a `Landscape Snapshot` section that becomes required when Layer 2 materially influences the chosen design.
- `plan-ceo-review` includes a Pre-Step 0 Landscape Check that informs Step 0 without creating a new approval stage.
- when `plan-ceo-review` materially refreshes landscape reasoning, the approved spec records that updated reasoning in `Landscape Snapshot` and `Decision impact` before approval.
- `writing-plans` translates approved landscape conclusions into concrete reuse and footgun guidance without making fresh search mandatory, and records material Layer 2 implementation guidance in the plan body.
- `plan-eng-review` includes a trigger-based Search Check in Step 0 and uses layer provenance tags in review output.
- `systematic-debugging` adds sanitized external-pattern search only as a bounded hypothesis aid.
- `review/checklist.md` and the generated code-reviewer agent catch built-in-before-bespoke and known-pattern-footgun issues.
- `receiving-code-review` and `qa-only` gain the lightweight verification hooks described above.
- `README.md`, `docs/README.codex.md`, and `docs/README.copilot.md` document optionality, privacy expectations, and the fact that internet access is not mandatory.
- `node scripts/gen-skill-docs.mjs`, `node scripts/gen-skill-docs.mjs --check`, `node scripts/gen-agent-docs.mjs`, and `node scripts/gen-agent-docs.mjs --check` succeed after implementation.
- `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs`, `bash tests/codex-runtime/test-runtime-instructions.sh`, and `bash tests/codex-runtime/test-workflow-sequencing.sh` succeed after implementation, along with any newly added focused tests on the edited generator/skill/reviewer surfaces.
- Updated tests prove the new behavior without changing exact artifact header contracts or helper-owned workflow authority.
- `bin/superpowers-workflow-status` and `bin/superpowers-plan-execution` do not need v1 behavior changes to support this feature.
