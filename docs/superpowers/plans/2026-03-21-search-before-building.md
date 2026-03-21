# Search Before Building Implementation Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use `superpowers:subagent-driven-development` when isolated-agent workflows are available in the current platform/session; otherwise use `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Engineering Approved
**Plan Revision:** 4
**Execution Mode:** superpowers:executing-plans
**Source Spec:** `docs/superpowers/specs/2026-03-21-search-before-building-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

**Goal:** Integrate Search-Before-Building into Superpowers' shared reference, generated preambles, workflow skills, reviewer/checklist surfaces, and user docs without changing workflow-helper authority or artifact header contracts.

**Architecture:** Implement this in six slices. First, add the shared operational reference and generator-owned preamble contract. Second, update the early workflow stages (`brainstorming`, `plan-ceo-review`). Third, carry the behavior into planning and ENG review. Fourth, update the workflow-owned debugging, review, reception, and QA skills. Fifth, update the reviewer/checklist surfaces and regenerate reviewer artifacts. Sixth, update public docs and run the full regeneration and verification gate.

**Tech Stack:** Markdown skill templates, Node-based doc generators, generated markdown agent docs, shell-based workflow/runtime tests, repo documentation

---

## What Already Exists

- `scripts/gen-skill-docs.mjs` already owns the shared generated preamble for non-router skills and special-cases `using-superpowers`.
- `skills/*/SKILL.md.tmpl` already define the workflow-stage behavior that this feature needs to modify.
- `agents/code-reviewer.instructions.md` is already the source of truth for the generated reviewer agents.
- `review/checklist.md` already provides the shared code-review taxonomy and pass structure.
- `README.md`, `docs/README.codex.md`, and `docs/README.copilot.md` already document workflow behavior and runtime boundaries.
- `tests/codex-runtime/gen-skill-docs.unit.test.mjs`, `tests/codex-runtime/skill-doc-contracts.test.mjs`, `tests/codex-runtime/test-runtime-instructions.sh`, and `tests/codex-runtime/test-workflow-sequencing.sh` already pin the generator, skill-doc, runtime, and sequencing contracts most likely to regress.
- `bin/superpowers-workflow-status` and `bin/superpowers-plan-execution` already own workflow and execution state. This plan must not expand or modify those authorities.

## Planned File Structure

- Create: `references/search-before-building.md`
  Shared operational reference for the three-layer model, trigger heuristics, privacy rules, fallback language, and worked examples.
- Modify: `scripts/gen-skill-docs.mjs`
  Add the shared generated Search-Before-Building section to non-router skill preambles only.
- Modify: `skills/brainstorming/SKILL.md.tmpl`
  Add Landscape Awareness, the sensitive/stealthy permission exception, and `Landscape Snapshot` guidance.
- Modify: `skills/plan-ceo-review/SKILL.md.tmpl`
  Add Pre-Step 0 Landscape Check and the write-back rule when refreshed landscape reasoning materially changes approval rationale.
- Modify: `skills/writing-plans/SKILL.md.tmpl`
  Add reuse/footgun carry-through guidance from approved specs into implementation plans.
- Modify: `skills/plan-eng-review/SKILL.md.tmpl`
  Add Step 0.4 Search Check, provenance tagging, and built-in/footgun review prompts.
- Modify: `skills/systematic-debugging/SKILL.md.tmpl`
  Add bounded sanitized external-pattern search hooks.
- Modify: `skills/requesting-code-review/SKILL.md.tmpl`
  Add built-in-before-bespoke review reminders for unfamiliar patterns.
- Modify: `skills/requesting-code-review/code-reviewer.md`
  Keep the dispatched reviewer prompt aligned with the custom reviewer agent on Search-Before-Building review logic.
- Modify: `skills/receiving-code-review/SKILL.md.tmpl`
  Add the verification hook for unfamiliar “best practice” feedback.
- Modify: `skills/qa-only/SKILL.md.tmpl`
  Add the optional known-ecosystem-issue lookup behavior.
- Modify: `agents/code-reviewer.instructions.md`
  Add bounded primary-source-first external review checks.
- Modify: `review/checklist.md`
  Add the Built-in Before Bespoke / Known Pattern Footguns category.
- Modify: `README.md`
- Modify: `docs/README.codex.md`
- Modify: `docs/README.copilot.md`
  Document Search-Before-Building behavior, privacy rules, and optional internet use.
- Regenerate: `skills/*/SKILL.md`
  Generated outputs after template/generator changes; do not edit by hand.
- Regenerate: `agents/code-reviewer.md`
- Regenerate: `.codex/agents/code-reviewer.toml`
  Generated outputs after reviewer-instruction changes; do not edit by hand.
- Modify: `tests/codex-runtime/gen-skill-docs.unit.test.mjs`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Modify: `tests/codex-runtime/test-workflow-enhancements.sh`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
  Extend the existing contract tests to cover the new behavior.
- Create: `tests/evals/search-before-building-contract.orchestrator.md`
- Create: `tests/evals/search-before-building-contract.scenarios.md`
- Create: `tests/evals/search-before-building-contract.runner.md`
- Create: `tests/evals/search-before-building-contract.judge.md`
  Doc-driven runner/judge contract gate for a bounded representative set of generated non-router skills plus both reviewer prompt surfaces.
- Modify: `tests/evals/README.md`
  Document the new Search-Before-Building eval and how to run it.
- Modify: `docs/testing.md`
  Document the deterministic-first validation matrix plus the change-specific doc-driven gate.

## Preconditions

- The approved source spec is `docs/superpowers/specs/2026-03-21-search-before-building-design.md` at `Spec Revision: 1`.
- Keep exact spec and plan headers unchanged beyond the normal approval fields.
- Do not modify `bin/superpowers-workflow-status` or `bin/superpowers-plan-execution`.
- Do not add a new workflow stage, new runtime-helper surface, telemetry prerequisite, or mandatory internet dependency.
- Keep `using-superpowers` exempt from the shared Search-Before-Building preamble section.
- Preserve the sensitive/stealthy permission gate only for `brainstorming`; all other bounded searches stay sanitization-first without a broad extra consent stage.
- Keep Layer 2 non-authoritative and primary-source-first for technical tasks.

## Execution Strategy

Implement in this order:

1. Shared reference plus generator/preamble contract
2. Early workflow stages (`brainstorming`, `plan-ceo-review`)
3. Planning and ENG review stages (`writing-plans`, `plan-eng-review`)
4. Workflow-owned debugging, review, reception, and QA skills
5. Reviewer/checklist surfaces and reviewer artifact regeneration
6. Public docs and full verification gate

This ordering keeps the shared foundation first, the workflow handoff stages second, and the broader supporting surfaces after the core spec/plan behavior is stable.

## Evidence Expectations

- Each task must leave behind passing focused verification for the files it changes.
- Generator or template changes must be accompanied by regenerated outputs in the same task slice.
- Reviewer-instruction changes must be accompanied by regenerated agent outputs in the same task slice.
- The final slice must run the approved minimum verification gate from the spec before this plan is considered execution-complete.

## Validation Strategy

Focused validation after each task:

- generator and shared preamble work:
  `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs`
- workflow-stage wording and routing/approval behavior:
  `bash tests/codex-runtime/test-workflow-sequencing.sh`
- workflow enhancement and review/checklist contract work:
  `bash tests/codex-runtime/test-workflow-enhancements.sh`
- runtime guidance/regeneration contract:
  `bash tests/codex-runtime/test-runtime-instructions.sh`
- change-specific doc-driven contract coverage after all Search-Before-Building prompt surfaces land:
  Run the checked-in flow defined by:
  - `tests/evals/search-before-building-contract.orchestrator.md`
  - `tests/evals/search-before-building-contract.scenarios.md`
  - `tests/evals/search-before-building-contract.runner.md`
  - `tests/evals/search-before-building-contract.judge.md`
  Scope it to 2-3 representative generated non-router skills plus both reviewer prompt surfaces. If isolated subagent execution is unavailable, skip explicitly and record that the doc-driven gate could not be run in the current environment.

Final verification gate:

- `node scripts/gen-skill-docs.mjs`
- `node scripts/gen-skill-docs.mjs --check`
- `node scripts/gen-agent-docs.mjs`
- `node scripts/gen-agent-docs.mjs --check`
- `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs`
- `bash tests/codex-runtime/test-runtime-instructions.sh`
- `bash tests/codex-runtime/test-workflow-sequencing.sh`

Additional change-specific coverage for this plan:

- `bash tests/codex-runtime/test-workflow-enhancements.sh`
- the checked-in doc-driven Search-Before-Building gate:
  - `tests/evals/search-before-building-contract.orchestrator.md`
  - `tests/evals/search-before-building-contract.scenarios.md`
  - `tests/evals/search-before-building-contract.runner.md`
  - `tests/evals/search-before-building-contract.judge.md`
  If isolated subagent execution is unavailable, explicitly record that the doc-driven gate was skipped.

## Documentation Update Expectations

- `references/search-before-building.md` must be written as the durable operational guide.
- `README.md`, `docs/README.codex.md`, and `docs/README.copilot.md` must explain:
  - when Search-Before-Building applies
  - that internet access is optional, not mandatory
  - the privacy/sanitization rules
  - the sensitive/stealthy `brainstorming` permission exception

## Rollout Plan

- Ship as one repo change covering reference, templates, reviewer/checklist, docs, generated outputs, and tests.
- No migration or manifest rewrite is required because helper-owned workflow state does not change.
- Regenerated artifacts must land in the same change so the repo is immediately self-consistent.

## Rollback Plan

- Revert the generator, template, reviewer/checklist, and docs changes.
- Delete `references/search-before-building.md`.
- Regenerate artifacts back to the previous state.
- Existing approved specs/plans remain valid because no new parser-visible headers were introduced.

## Risks And Mitigations

- Risk: shared preamble drift affects every generated skill.
  Mitigation: land generator tests first, regenerate immediately, and keep `using-superpowers` explicitly exempt.
- Risk: wording drift across stages creates conflicting search rules.
  Mitigation: implement shared policy first, then update workflow-owned stages in sequence, and pin the exact contract in sequencing tests.
- Risk: review/debugging guidance becomes too loose and cargo-culty.
  Mitigation: keep Layer 2 non-authoritative and primary-source-first in reviewer and debugging instructions.
- Risk: privacy rules become inconsistent between product ideation and technical debugging.
  Mitigation: encode the `brainstorming` permission exception plus the general sanitization-first rules explicitly in the affected templates and docs.
- Risk: implementation expands into runtime authority changes.
  Mitigation: keep all changes inside the files listed above and do not touch workflow/execution helpers.

## Not In Scope

- New workflow stages
- Changes to `bin/superpowers-workflow-status`
- Changes to `bin/superpowers-plan-execution`
- New runtime helper binaries or stateful helper surfaces
- Required new spec or plan header fields
- Mandatory internet access
- Telemetry or Eureka logging in v1
- Broad QA report-template changes unless implementation later proves the optional QA lookup should become standard report structure

## Diagrams

### Slice Order

```text
Task 1: reference + generator + shared tests
   |
   v
Task 2: brainstorming + CEO review
   |
   v
Task 3: writing-plans + ENG review
   |
   v
Task 4: debugging + review + QA skills
   |
   v
Task 5: reviewer + checklist
   |
   v
Task 6: docs + full regeneration + verification
```

### Ownership Boundary

```text
reference + generator + templates + reviewer/checklist + docs
                     |
                     v
           generated skill / agent outputs

workflow helpers stay unchanged and authoritative
spec/plan headers stay unchanged and authoritative
```

## Failure Modes To Preserve

| Area | Failure to prevent | Guardrail |
| --- | --- | --- |
| shared preamble | `using-superpowers` accidentally gets the new section | generator tests and contract assertions |
| artifact authority | optional body sections turn into parser contracts | no helper changes and explicit header-regression checks |
| brainstorming privacy | sensitive/stealthy ideation searches happen without the explicit permission question | sequencing assertions for the `brainstorming` template |
| reviewer looseness | secondary sources override repo truth or primary sources | reviewer-instruction wording plus checklist review guidance |
| runtime drift | generated outputs or runtime docs fall out of sync | regeneration plus `test-runtime-instructions.sh` |

## Task 1: Add The Shared Reference And Generator-Owned Preamble Contract

**Files:**
- Create: `references/search-before-building.md`
- Modify: `scripts/gen-skill-docs.mjs`
- Modify: `tests/codex-runtime/gen-skill-docs.unit.test.mjs`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Regenerate: `skills/*/SKILL.md`
- Test: `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs`

- [x] **Step 1: Add red generator/contract assertions for the shared Search-Before-Building section**
Run: `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs`
Expected: FAIL once the new assertions are added, because the section does not exist yet.

- [x] **Step 2: Write `references/search-before-building.md`**
Write the new reference with:
- the three layers
- trigger heuristics
- privacy/sanitization rules
- fallback language
- examples for product design, plan review, debugging, code review, and QA

- [x] **Step 3: Implement the shared generator section**
Update `scripts/gen-skill-docs.mjs` to add a `Search Before Building` section in `generatePreamble({ review })` only, and keep `generateUsingSuperpowersPreamble()` unchanged.

- [x] **Step 4: Regenerate all skill docs**
Run: `node scripts/gen-skill-docs.mjs`
Expected: all generated `skills/*/SKILL.md` files refresh, and only non-router skills gain the new shared section.

- [x] **Step 5: Re-run the focused generator/contract tests**
Run: `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs`
Expected: PASS with the new shared section present exactly where intended.

- [x] **Step 6: Commit the shared foundation**
```bash
git add \
  references/search-before-building.md \
  scripts/gen-skill-docs.mjs \
  tests/codex-runtime/gen-skill-docs.unit.test.mjs \
  tests/codex-runtime/skill-doc-contracts.test.mjs \
  skills
git commit -m "feat: add search-before-building foundation"
```

## Task 2: Add Landscape Awareness To `brainstorming` And `plan-ceo-review`

**Files:**
- Modify: `skills/brainstorming/SKILL.md.tmpl`
- Modify: `skills/plan-ceo-review/SKILL.md.tmpl`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Regenerate: `skills/brainstorming/SKILL.md`
- Regenerate: `skills/plan-ceo-review/SKILL.md`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`

- [x] **Step 1: Add red sequencing assertions for the early-stage workflow behavior**
Add assertions for:
- `Landscape Awareness` in `brainstorming`
- the sensitive/stealthy permission question in `brainstorming`
- the optional `Landscape Snapshot`
- `Pre-Step 0: Landscape Check` in `plan-ceo-review`
- the write-back requirement when refreshed landscape reasoning materially changes approval rationale

- [x] **Step 2: Run the sequencing test to confirm the current gap**
Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`
Expected: FAIL on the new assertions before the template updates are made.

- [x] **Step 3: Update `skills/brainstorming/SKILL.md.tmpl`**
Implement:
- the new checklist item
- process-flow updates
- sensitive/stealthy permission behavior
- optional `Landscape Snapshot` guidance

- [x] **Step 4: Update `skills/plan-ceo-review/SKILL.md.tmpl`**
Implement:
- `Pre-Step 0: Landscape Check`
- reuse/refresh rules
- write-back-to-spec rule when the refreshed reasoning materially changes approval rationale

- [x] **Step 5: Regenerate skill docs**
Run: `node scripts/gen-skill-docs.mjs`
Expected: regenerated `brainstorming` and `plan-ceo-review` docs reflect the new behavior.

- [x] **Step 6: Re-run the sequencing test**
Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`
Expected: PASS for the new early-stage assertions.

- [x] **Step 7: Commit the early workflow changes**
```bash
git add \
  skills/brainstorming/SKILL.md.tmpl \
  skills/plan-ceo-review/SKILL.md.tmpl \
  skills/brainstorming/SKILL.md \
  skills/plan-ceo-review/SKILL.md \
  tests/codex-runtime/test-workflow-sequencing.sh
git commit -m "feat: add search-before-building to design review stages"
```

## Task 3: Carry Search-Before-Building Into Planning And ENG Review

**Files:**
- Modify: `skills/writing-plans/SKILL.md.tmpl`
- Modify: `skills/plan-eng-review/SKILL.md.tmpl`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Regenerate: `skills/writing-plans/SKILL.md`
- Regenerate: `skills/plan-eng-review/SKILL.md`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`

- [x] **Step 1: Add red sequencing assertions for planning and ENG-review behavior**
Add assertions for:
- `## Existing Capabilities / Built-ins to Reuse`
- `## Known Footguns / Constraints`
- `Step 0.4: Search Check`
- built-in/current-best-practice/footgun prompts
- `[Layer 1]`, `[Layer 2]`, `[Layer 3]`, and `[EUREKA]` provenance tagging guidance

- [x] **Step 2: Run the sequencing test to confirm the current gap**
Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`
Expected: FAIL on the new assertions before the template updates are made.

- [x] **Step 3: Update `skills/writing-plans/SKILL.md.tmpl`**
Implement:
- the carry-through rule from approved `Landscape Snapshot`
- the plan-body reuse/footgun guidance
- the “do not rerun search by default” constraint

- [x] **Step 4: Update `skills/plan-eng-review/SKILL.md.tmpl`**
Implement:
- `Step 0.4: Search Check`
- trigger classes
- built-in/current-best-practice/footgun prompts
- provenance-tag guidance in review output

- [x] **Step 5: Regenerate skill docs**
Run: `node scripts/gen-skill-docs.mjs`
Expected: regenerated `writing-plans` and `plan-eng-review` docs reflect the new planning/review behavior.

- [x] **Step 6: Re-run the sequencing test**
Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`
Expected: PASS for the new planning/ENG-review assertions.

- [x] **Step 7: Commit the planning-stage changes**
```bash
git add \
  skills/writing-plans/SKILL.md.tmpl \
  skills/plan-eng-review/SKILL.md.tmpl \
  skills/writing-plans/SKILL.md \
  skills/plan-eng-review/SKILL.md \
  tests/codex-runtime/test-workflow-sequencing.sh
git commit -m "feat: add search-before-building to plan stages"
```

## Task 4: Update Debugging, Review, Reception, And QA Skill Surfaces

**Files:**
- Modify: `skills/systematic-debugging/SKILL.md.tmpl`
- Modify: `skills/requesting-code-review/SKILL.md.tmpl`
- Modify: `skills/receiving-code-review/SKILL.md.tmpl`
- Modify: `skills/qa-only/SKILL.md.tmpl`
- Modify: `tests/codex-runtime/test-workflow-enhancements.sh`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Regenerate: `skills/systematic-debugging/SKILL.md`
- Regenerate: `skills/requesting-code-review/SKILL.md`
- Regenerate: `skills/receiving-code-review/SKILL.md`
- Regenerate: `skills/qa-only/SKILL.md`
- Test: `bash tests/codex-runtime/test-workflow-enhancements.sh`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`

- [x] **Step 1: Add red assertions for the remaining workflow-owned text contracts**
Add sequencing/workflow-enhancement assertions for:
- `Phase 2.5` / `Phase 3.2b` in `systematic-debugging`
- built-in-before-bespoke review reminders in `requesting-code-review`
- the verification hook in `receiving-code-review`
- the optional known-ecosystem-issue lookup in `qa-only`

- [x] **Step 2: Run the sequencing test to confirm the current gap**
Run:
- `bash tests/codex-runtime/test-workflow-sequencing.sh`
- `bash tests/codex-runtime/test-workflow-enhancements.sh`
Expected: FAIL on the new assertions before the template updates are made.

- [x] **Step 3: Update the remaining skill templates**
Implement:
- debugging hooks in `systematic-debugging`
- review reminder in `requesting-code-review`
- verification hook in `receiving-code-review`
- optional known-issue lookup in `qa-only`

- [x] **Step 4: Regenerate the affected skill docs**
Run: `node scripts/gen-skill-docs.mjs`
Expected: regenerated debugging/review/QA skills reflect the new behavior without manual edits.

- [x] **Step 5: Re-run the focused verification**
Run:
- `bash tests/codex-runtime/test-workflow-sequencing.sh`
- `bash tests/codex-runtime/test-workflow-enhancements.sh`
Expected: PASS on the new debugging/review/QA skill assertions.

- [x] **Step 6: Commit the workflow-owned debugging/review/QA slice**
```bash
git add \
  skills/systematic-debugging/SKILL.md.tmpl \
  skills/requesting-code-review/SKILL.md.tmpl \
  skills/receiving-code-review/SKILL.md.tmpl \
  skills/qa-only/SKILL.md.tmpl \
  skills/systematic-debugging/SKILL.md \
  skills/requesting-code-review/SKILL.md \
  skills/receiving-code-review/SKILL.md \
  skills/qa-only/SKILL.md \
  tests/codex-runtime/test-workflow-enhancements.sh \
  tests/codex-runtime/test-workflow-sequencing.sh
git commit -m "feat: add search-before-building to debugging and QA skills"
```

## Task 5: Update Reviewer And Checklist Surfaces

**Files:**
- Modify: `agents/code-reviewer.instructions.md`
- Modify: `skills/requesting-code-review/code-reviewer.md`
- Modify: `review/checklist.md`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Modify: `tests/codex-runtime/test-workflow-enhancements.sh`
- Regenerate: `agents/code-reviewer.md`
- Regenerate: `.codex/agents/code-reviewer.toml`
- Test: `node scripts/gen-agent-docs.mjs --check`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`
- Test: `bash tests/codex-runtime/test-workflow-enhancements.sh`

- [x] **Step 1: Add red deterministic assertions for reviewer/checklist contract coverage**
Add runtime/workflow-enhancement assertions for:
- the new checklist category and examples
- Search-Before-Building review logic in the custom reviewer agent path
- matching Search-Before-Building review logic in `skills/requesting-code-review/code-reviewer.md`

- [x] **Step 2: Update `review/checklist.md`**
Add the `Built-in Before Bespoke / Known Pattern Footguns` category and examples.

- [x] **Step 3: Update `agents/code-reviewer.instructions.md`**
Implement the bounded external review pass:
- primary-source-first
- 1-2 targeted checks only
- findings anchored in the diff and `file:line`
- no new severity taxonomy

- [x] **Step 4: Update `skills/requesting-code-review/code-reviewer.md`**
Mirror the same built-in-before-bespoke / known-footgun review logic in the dispatched reviewer prompt so the `requesting-code-review` flow and the custom reviewer agent stay behaviorally aligned.

- [x] **Step 5: Regenerate reviewer artifacts**
Run: `node scripts/gen-agent-docs.mjs`
Expected: generated reviewer outputs refresh without manual edits.

- [x] **Step 6: Re-run the focused verification**
Run:
- `node scripts/gen-agent-docs.mjs --check`
- `bash tests/codex-runtime/test-runtime-instructions.sh`
- `bash tests/codex-runtime/test-workflow-enhancements.sh`
Expected: PASS with reviewer artifacts in sync and the updated reviewer/checklist assertions satisfied.

- [x] **Step 7: Commit the reviewer/checklist slice**
```bash
git add \
  agents/code-reviewer.instructions.md \
  agents/code-reviewer.md \
  .codex/agents/code-reviewer.toml \
  skills/requesting-code-review/code-reviewer.md \
  review/checklist.md \
  tests/codex-runtime/test-runtime-instructions.sh \
  tests/codex-runtime/test-workflow-enhancements.sh
git commit -m "feat: add search-before-building review guidance"
```

## Task 6: Update Public Docs And Run The Full Verification Gate

**Files:**
- Modify: `README.md`
- Modify: `docs/testing.md`
- Modify: `docs/README.codex.md`
- Modify: `docs/README.copilot.md`
- Create: `tests/evals/search-before-building-contract.orchestrator.md`
- Create: `tests/evals/search-before-building-contract.scenarios.md`
- Create: `tests/evals/search-before-building-contract.runner.md`
- Create: `tests/evals/search-before-building-contract.judge.md`
- Modify: `tests/evals/README.md`
- Test: `node scripts/gen-skill-docs.mjs`
- Test: `node scripts/gen-skill-docs.mjs --check`
- Test: `node scripts/gen-agent-docs.mjs`
- Test: `node scripts/gen-agent-docs.mjs --check`
- Test: `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`
- Test: `bash tests/codex-runtime/test-workflow-enhancements.sh`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`

**Execution Note:** During execution, the user explicitly redirected this slice away from the earlier `.eval.mjs` idea and onto the repo's existing doc-driven runner/judge eval shape. Task 6 is therefore normalized here to the executed `orchestrator/scenarios/runner/judge` surface rather than the retired Node/OpenAI eval shape.

- [x] **Step 1: Update the repo-level docs**
Document:
- what Search-Before-Building is
- where it applies
- that internet access is optional
- the privacy/sanitization rules
- the sensitive/stealthy `brainstorming` permission exception
- the deterministic-first validation story in `docs/testing.md`
- the opt-in Search-Before-Building eval in `tests/evals/README.md`

- [x] **Step 2: Add the doc-driven Search-Before-Building prompt-contract gate**
Create:
- `tests/evals/search-before-building-contract.orchestrator.md`
- `tests/evals/search-before-building-contract.scenarios.md`
- `tests/evals/search-before-building-contract.runner.md`
- `tests/evals/search-before-building-contract.judge.md`

Use the repo's existing judge-test pattern so one fresh runner subagent evaluates a selected scenario and one fresh judge subagent scores that raw runner evidence. The checked-in scenario matrix should judge whether this branch's representative generated Search-Before-Building preamble contract and both reviewer prompt surfaces clearly enforce:
- Layer 2 as input, not authority
- sanitization/privacy boundaries
- fallback language when search is unavailable or unsafe
- built-in-before-bespoke / known-footgun review behavior

Representative generated-skill inputs should cover a small number of non-router skills that exercise materially different contexts, such as:
- one early-stage design skill
- one review-stage skill
- one debugging or QA skill

Also include both reviewer prompt surfaces. Do not stuff every generated non-router skill into the gate; deterministic suites already own universal coverage.

- [x] **Step 3: Regenerate generated outputs one final time**
Run:
- `node scripts/gen-skill-docs.mjs`
- `node scripts/gen-agent-docs.mjs`
Expected: no unplanned generator drift after the doc-adjacent changes.

- [x] **Step 4: Run the full approved verification gate plus change-specific deterministic coverage**
Run:
```bash
node scripts/gen-skill-docs.mjs
node scripts/gen-skill-docs.mjs --check
node scripts/gen-agent-docs.mjs
node scripts/gen-agent-docs.mjs --check
node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs
bash tests/codex-runtime/test-runtime-instructions.sh
bash tests/codex-runtime/test-workflow-enhancements.sh
bash tests/codex-runtime/test-workflow-sequencing.sh
```
Expected: all commands PASS.

- [x] **Step 5: Run the doc-driven prompt-contract gate and capture local evidence**
Run the checked-in flow defined by:
- `tests/evals/search-before-building-contract.orchestrator.md`
- `tests/evals/search-before-building-contract.scenarios.md`
- `tests/evals/search-before-building-contract.runner.md`
- `tests/evals/search-before-building-contract.judge.md`

Expected: PASS only when every required scenario in the checked-in matrix passes without ambiguity. Record the per-scenario local evidence bundle under `~/.superpowers/projects/<slug>/search-before-building-contract-<revision>/...`.

- [x] **Step 6: Fix any last failing contract on the touched generator/skill/reviewer/doc/test surfaces**
If anything fails, fix only the touched surfaces above and re-run the relevant deterministic suites plus the doc-driven runner/judge gate until they pass cleanly.

- [x] **Step 7: Commit the docs, eval, and verified final state**
```bash
git add \
  README.md \
  docs/testing.md \
  docs/README.codex.md \
  docs/README.copilot.md \
  tests/evals/search-before-building-contract.orchestrator.md \
  tests/evals/search-before-building-contract.scenarios.md \
  tests/evals/search-before-building-contract.runner.md \
  tests/evals/search-before-building-contract.judge.md \
  tests/evals/README.md \
  skills \
  agents \
  .codex/agents \
  review \
  tests/codex-runtime \
  references/search-before-building.md \
  scripts/gen-skill-docs.mjs
git commit -m "feat: document and verify search-before-building"
```
