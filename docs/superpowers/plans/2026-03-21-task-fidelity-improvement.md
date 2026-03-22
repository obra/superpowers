# Task-Fidelity Improvement Implementation Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use `superpowers:subagent-driven-development` when isolated-agent workflows are available in the current platform/session; otherwise use `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** superpowers:executing-plans
**Source Spec:** `docs/superpowers/specs/2026-03-21-task-fidelity-improvement-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

**Goal:** Add a derived plan-contract helper and tighten the planning, execution, and review workflow so Superpowers enforces semantic task fidelity from approved spec through final review while keeping markdown artifacts authoritative.

**Architecture:** Implement the change in five slices. First, add red fixture-driven coverage for the new traceability contract. Second, implement `superpowers-plan-contract` and wrapper parity. Third, tighten plan authoring, engineering review, and `superpowers-plan-execution` interop around the canonical task contract. Fourth, switch execution and review consumers from controller-curated context to task-packet-backed dispatch. Fifth, align runtime docs, release notes, and verification so the new helper-backed contract is visible and durable.

**Tech Stack:** POSIX shell helpers, PowerShell wrapper parity, Markdown skill templates plus generated `SKILL.md` outputs, repo docs, shell regression tests, Node contract tests

---

## What Already Exists

- `bin/superpowers-plan-execution` already owns execution-state truth for approved plans and paired execution evidence.
- `bin/superpowers-runtime-common.sh` and `bin/superpowers-pwsh-common.ps1` already centralize repo-relative path, whitespace, and identifier normalization that new helper surfaces should reuse instead of re-implementing.
- `skills/writing-plans/SKILL.md.tmpl` and `skills/plan-eng-review/SKILL.md.tmpl` already own the authoring and approval path for implementation plans.
- `skills/executing-plans/`, `skills/subagent-driven-development/`, and `skills/requesting-code-review/` already own execution and review consumption of approved plan artifacts.
- `superpowers-repo-safety` already guards repo-writing workflow stages on protected branches, so template edits in this project must preserve those preflights rather than weakening them.
- `tests/codex-runtime/test-superpowers-plan-execution.sh`, `tests/codex-runtime/test-workflow-sequencing.sh`, `tests/codex-runtime/test-workflow-enhancements.sh`, `tests/codex-runtime/test-runtime-instructions.sh`, and `tests/codex-runtime/skill-doc-contracts.test.mjs` already pin much of the workflow wording and helper behavior this change must preserve.
- `README.md`, `docs/README.codex.md`, `docs/README.copilot.md`, and `docs/testing.md` already describe the current runtime authority model and test surfaces.

## Planned File Structure

- Create: `bin/superpowers-plan-contract`
- Create: `bin/superpowers-plan-structure-common`
- Create: `bin/superpowers-plan-contract.ps1`
- Create: `tests/codex-runtime/test-superpowers-plan-contract.sh`
- Create: `tests/codex-runtime/fixtures/plan-contract/valid-spec.md`
- Create: `tests/codex-runtime/fixtures/plan-contract/valid-plan.md`
- Create: `tests/codex-runtime/fixtures/plan-contract/invalid-missing-index-spec.md`
- Create: `tests/codex-runtime/fixtures/plan-contract/invalid-missing-coverage-plan.md`
- Create: `tests/codex-runtime/fixtures/plan-contract/invalid-unknown-id-plan.md`
- Create: `tests/codex-runtime/fixtures/plan-contract/invalid-ambiguous-wording-plan.md`
- Create: `tests/codex-runtime/fixtures/plan-contract/invalid-requirement-weakening-plan.md`
- Create: `tests/codex-runtime/fixtures/plan-contract/invalid-open-questions-plan.md`
- Create: `tests/codex-runtime/fixtures/plan-contract/invalid-malformed-files-plan.md`
- Create: `tests/codex-runtime/fixtures/plan-contract/invalid-malformed-task-structure-plan.md`
- Create: `tests/codex-runtime/fixtures/plan-contract/invalid-path-traversal-plan.md`
- Modify: `bin/superpowers-plan-execution`
- Modify: `skills/writing-plans/SKILL.md.tmpl`
- Modify generated output: `skills/writing-plans/SKILL.md`
- Modify: `skills/plan-eng-review/SKILL.md.tmpl`
- Modify generated output: `skills/plan-eng-review/SKILL.md`
- Modify: `skills/executing-plans/SKILL.md.tmpl`
- Modify generated output: `skills/executing-plans/SKILL.md`
- Modify: `skills/subagent-driven-development/SKILL.md.tmpl`
- Modify generated output: `skills/subagent-driven-development/SKILL.md`
- Modify: `skills/subagent-driven-development/implementer-prompt.md`
- Modify: `skills/subagent-driven-development/spec-reviewer-prompt.md`
- Modify: `skills/subagent-driven-development/code-quality-reviewer-prompt.md`
- Modify: `skills/requesting-code-review/SKILL.md.tmpl`
- Modify generated output: `skills/requesting-code-review/SKILL.md`
- Modify: `skills/requesting-code-review/code-reviewer.md`
- Modify: `README.md`
- Modify: `docs/README.codex.md`
- Modify: `docs/README.copilot.md`
- Modify: `docs/testing.md`
- Modify: `RELEASE-NOTES.md`
- Modify: `tests/codex-runtime/test-superpowers-plan-execution.sh`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Modify: `tests/codex-runtime/test-workflow-enhancements.sh`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Modify: `tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: `tests/codex-runtime/fixtures/workflow-artifacts/README.md`

## Preconditions

- Work from the `task-fidelity-improvement` branch, not `main`.
- Treat `docs/superpowers/specs/2026-03-21-task-fidelity-improvement-design.md` revision `1` as the exact source contract.
- Keep markdown authoritative throughout; no helper may become a second approval authority.
- Treat persisted task packets as helper-private cache only; execution and review flows must call `superpowers-plan-contract build-task-packet` rather than reading packet files directly.
- Edit `SKILL.md.tmpl` files and regenerate `SKILL.md`; do not hand-edit generated skill docs.

## Not In Scope

- Rewriting historical approved specs, plans, or execution-evidence artifacts only to normalize them.
- Expanding `superpowers-workflow` into a mutating or authoritative CLI surface.
- Introducing a database, daemon, or hidden local workflow state store.
- Reopening the approved architecture to remove the derived helper model.

## Execution Strategy

1. Lock the new contract in red with fixture-backed tests before changing runtime behavior.
2. Implement `superpowers-plan-contract` as the semantic compiler for spec and plan traceability, with PowerShell wrapper parity.
3. Tighten authoring and approval surfaces so new plans must satisfy the contract before `Engineering Approved`.
4. Switch execution and review consumers to packet-backed dispatch and packet-backed review.
5. Align docs, runtime instructions, and release notes, then run the full targeted verification set.

## Evidence Expectations

- Each task must leave passing targeted tests proving the newly added or tightened contract.
- Helper tasks must leave fixture-backed proof for both happy-path and fail-closed cases.
- Skill/prompt tasks must leave regenerated `SKILL.md` output plus passing contract tests.
- Final verification must leave a clean targeted test matrix demonstrating helper behavior, cross-skill wording, and runtime-doc alignment.

## Validation Strategy

At minimum, this plan must finish with these passing commands:

```bash
node scripts/gen-skill-docs.mjs --check
node --test tests/codex-runtime/*.test.mjs
bash tests/codex-runtime/test-superpowers-plan-contract.sh
bash tests/codex-runtime/test-superpowers-plan-execution.sh
bash tests/codex-runtime/test-workflow-sequencing.sh
bash tests/codex-runtime/test-workflow-enhancements.sh
bash tests/codex-runtime/test-runtime-instructions.sh
bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh
```

## Documentation Update Expectations

- Document the new internal helper and packet-backed workflow behavior in `README.md`, `docs/README.codex.md`, and `docs/README.copilot.md`.
- Update `docs/testing.md` so the new helper suite and packet-contract coverage are discoverable.
- Add a release-note entry summarizing the new semantic traceability layer and stricter plan/dispatch/review contracts.
- Update `tests/codex-runtime/fixtures/workflow-artifacts/README.md` if fixture structure or expectations expand.

## Rollout Plan

- Land the helper, wrappers, and red-to-green contract tests first.
- Land skill and prompt changes only once helper behavior is concrete.
- Land doc and runtime-instruction updates after the helper and skill contracts stabilize.
- Keep the change fail-closed throughout: new or materially revised planning and review flows should reject invalid contracts immediately once the full slice lands.

## Rollback Plan

- Revert the helper, wrapper, skill, prompt, doc, and test changes together.
- Stop calling `superpowers-plan-contract` from planning, review, and execution skills.
- Leave approved markdown artifacts and historical execution evidence untouched.
- Because packets are derived local artifacts only, no repo migration is needed during rollback.

## Risks And Mitigations

- Risk: the helper grows into a shadow authority.
  Mitigation: keep source markdown authoritative and require packets to preserve exact source statements rather than paraphrase them.
- Risk: contract drift between authoring docs, helper parsing, and execution parsing.
  Mitigation: pin one canonical task syntax in fixtures, helper tests, skill docs, and `superpowers-plan-execution`.
- Risk: packet persistence creates noisy or stale local state.
  Mitigation: persist by default only for workflow-owned flows, keep manual invocations ephemeral by default, and treat stale packets as regenerate-or-block.
- Risk: this slice touches many files and becomes hard to review.
  Mitigation: keep helper, authoring/review, execution/review, and docs/verification work in separate tasks with disjoint primary ownership.

## Diagrams

### Change Surface

```text
Task 1: red contract coverage + fixtures
    |
    v
Task 2: plan-contract helper + wrapper parity
    |
    v
Task 3: plan authoring/review + plan-execution interop
    |
    v
Task 4: execution/review packet consumption
    |
    v
Task 5: docs, release notes, and full verification
```

### Runtime Boundary

```text
approved spec markdown ----+
                           |
approved plan markdown ----+--> superpowers-plan-contract --> task packets
                           |
                           +--> superpowers-plan-execution --> execution evidence

Authority stays in markdown.
Helpers enforce and compile; they do not approve.
```

## Requirement Coverage Matrix

- REQ-001 -> Task 3
- REQ-002 -> Task 3
- REQ-003 -> Task 1, Task 3, Task 5
- REQ-004 -> Task 1, Task 2
- REQ-005 -> Task 1, Task 2, Task 3
- REQ-006 -> Task 4
- REQ-007 -> Task 4
- REQ-008 -> Task 4
- REQ-009 -> Task 2, Task 5
- REQ-010 -> Task 5
- REQ-011 -> Task 3
- REQ-012 -> Task 1, Task 3
- REQ-013 -> Task 5
- REQ-014 -> Task 2, Task 4
- NONGOAL-001 -> Task 2, Task 5
- NONGOAL-002 -> Task 3, Task 4
- NONGOAL-003 -> Task 2
- VERIFY-001 -> Task 1, Task 5

## Task 1: Add Red Contract Coverage And Plan-Contract Fixtures

**Spec Coverage:** REQ-003, REQ-004, REQ-005, REQ-012, VERIFY-001
**Task Outcome:** The repo has red tests and fixture pairs that pin the new traceability contract, canonical task syntax, helper wrapper presence, and packet-oriented workflow wording before implementation starts.
**Plan Constraints:**
- Keep this task test-first; do not implement the helper here.
- Add fixture pairs that exercise both valid and fail-closed behavior.
- Do not modify historical approved plans or execution-evidence docs as examples.
**Open Questions:** none

**Files:**
- Create: `tests/codex-runtime/test-superpowers-plan-contract.sh`
- Create: `tests/codex-runtime/fixtures/plan-contract/valid-spec.md`
- Create: `tests/codex-runtime/fixtures/plan-contract/valid-plan.md`
- Create: `tests/codex-runtime/fixtures/plan-contract/invalid-missing-index-spec.md`
- Create: `tests/codex-runtime/fixtures/plan-contract/invalid-missing-coverage-plan.md`
- Create: `tests/codex-runtime/fixtures/plan-contract/invalid-unknown-id-plan.md`
- Create: `tests/codex-runtime/fixtures/plan-contract/invalid-ambiguous-wording-plan.md`
- Create: `tests/codex-runtime/fixtures/plan-contract/invalid-requirement-weakening-plan.md`
- Create: `tests/codex-runtime/fixtures/plan-contract/invalid-open-questions-plan.md`
- Create: `tests/codex-runtime/fixtures/plan-contract/invalid-malformed-files-plan.md`
- Create: `tests/codex-runtime/fixtures/plan-contract/invalid-malformed-task-structure-plan.md`
- Create: `tests/codex-runtime/fixtures/plan-contract/invalid-path-traversal-plan.md`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Modify: `tests/codex-runtime/test-workflow-enhancements.sh`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Modify: `tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `bash tests/codex-runtime/test-superpowers-plan-contract.sh`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`
- Test: `bash tests/codex-runtime/test-workflow-enhancements.sh`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`
- Test: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- Test: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`

- [x] **Step 1: Add a red shell harness for the new helper contract**
  Create `tests/codex-runtime/test-superpowers-plan-contract.sh` with temp-repo setup, fixture loading, and helper-invocation helpers following the existing `test-superpowers-plan-execution.sh` style.

- [x] **Step 2: Add valid and invalid spec/plan fixture pairs**
  Write the new fixture markdown files so the harness can cover valid Requirement Index and Coverage Matrix cases plus missing index, missing coverage, unknown IDs, ambiguity wording, requirement weakening, malformed `Files:` blocks, malformed task structure, path-traversal rejection, and unresolved open-question failures.

- [x] **Step 3: Add red assertions for canonical plan-contract wording**
  Extend `tests/codex-runtime/test-workflow-sequencing.sh`, `tests/codex-runtime/test-workflow-enhancements.sh`, and `tests/codex-runtime/skill-doc-contracts.test.mjs` so they expect `Requirement Index`, `Requirement Coverage Matrix`, `Spec Coverage`, `Open Questions`, task-packet usage, and fail-closed lint gates in the relevant skills and prompts.

- [x] **Step 4: Add red runtime-surface and wrapper assertions**
  Extend `tests/codex-runtime/test-runtime-instructions.sh` and `tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh` so they expect the new helper binary, wrapper, and runtime-doc references.

- [x] **Step 5: Add red stale-packet scenarios to the harness**
  Make `tests/codex-runtime/test-superpowers-plan-contract.sh` build from valid fixtures, then mutate plan or spec revision/fingerprint inputs so stale-packet regeneration and stale-cache rejection are covered explicitly without relying on incidental implementation details.

- [x] **Step 6: Run the new and tightened tests to confirm they fail red**
  Run the listed test commands and confirm failures point at the missing helper surface and missing workflow wording rather than unrelated repo state.

- [x] **Step 7: Commit the red contract scaffold**
  Run:
  ```bash
  git add \
    tests/codex-runtime/test-superpowers-plan-contract.sh \
    tests/codex-runtime/fixtures/plan-contract/valid-spec.md \
    tests/codex-runtime/fixtures/plan-contract/valid-plan.md \
    tests/codex-runtime/fixtures/plan-contract/invalid-missing-index-spec.md \
    tests/codex-runtime/fixtures/plan-contract/invalid-missing-coverage-plan.md \
    tests/codex-runtime/fixtures/plan-contract/invalid-unknown-id-plan.md \
    tests/codex-runtime/fixtures/plan-contract/invalid-ambiguous-wording-plan.md \
    tests/codex-runtime/fixtures/plan-contract/invalid-requirement-weakening-plan.md \
    tests/codex-runtime/fixtures/plan-contract/invalid-open-questions-plan.md \
    tests/codex-runtime/fixtures/plan-contract/invalid-malformed-files-plan.md \
    tests/codex-runtime/fixtures/plan-contract/invalid-malformed-task-structure-plan.md \
    tests/codex-runtime/fixtures/plan-contract/invalid-path-traversal-plan.md \
    tests/codex-runtime/test-workflow-sequencing.sh \
    tests/codex-runtime/test-workflow-enhancements.sh \
    tests/codex-runtime/test-runtime-instructions.sh \
    tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh \
    tests/codex-runtime/skill-doc-contracts.test.mjs
  git commit -m "test: add red coverage for plan-contract workflow"
  ```

## Task 2: Implement `superpowers-plan-contract` And Wrapper Parity

**Spec Coverage:** REQ-004, REQ-005, REQ-009, REQ-014, NONGOAL-001, NONGOAL-003
**Task Outcome:** Superpowers ships a derived helper and PowerShell wrapper that can lint traceability contracts and build canonical task packets without becoming an approval authority.
**Plan Constraints:**
- Keep helper scope narrow: parse, lint, packet-build, and fail closed.
- Preserve exact source statements inside packets; do not paraphrase requirements.
- Keep packet persistence bounded and derived-only.
- Keep persisted packets helper-private so stale detection, reuse, and regeneration stay centralized in `superpowers-plan-contract`.
- Put canonical task-heading and `Files:` parsing in one small shared shell module rather than duplicating structural parser logic across helpers.
- Reuse the shared normalization primitives already shipped in `bin/superpowers-runtime-common.sh` and `bin/superpowers-pwsh-common.ps1` instead of adding parallel helper-specific path, whitespace, or identifier normalization.
- Implement bounded retention as helper behavior, not just a documented policy.
**Open Questions:** none

**Files:**
- Create: `bin/superpowers-plan-contract`
- Create: `bin/superpowers-plan-structure-common`
- Create: `bin/superpowers-plan-contract.ps1`
- Modify: `tests/codex-runtime/test-superpowers-plan-contract.sh`
- Modify: `tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- Test: `bash tests/codex-runtime/test-superpowers-plan-contract.sh`
- Test: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`

- [x] **Step 1: Implement the shell helper skeleton with explicit subcommands**
  Add `lint` and `build-task-packet` dispatch plus JSON/error emitters in `bin/superpowers-plan-contract`, and wire the helper to reuse the shared runtime/common normalization primitives instead of re-implementing them locally.

- [x] **Step 2: Implement spec and plan parsing for the new contract**
  Add parsing for `Requirement Index`, `Requirement Coverage Matrix`, `Spec Coverage`, `Task Outcome`, `Plan Constraints`, and `Open Questions`, and put canonical `## Task N:` plus `Files:` parsing in `bin/superpowers-plan-structure-common` so both helpers share one structural contract.

- [x] **Step 3: Implement fail-closed lint output**
  Add coverage validation, unknown-ID detection, open-question enforcement, ambiguity-phrase checks, weakening/widening detection, and JSON failure reporting that matches the approved failure classes.

- [x] **Step 4: Implement canonical packet generation, stale detection, and retention pruning**
  Build packet output with exact task block, exact covered requirements, fingerprints, revisions, optional persistence, helper-owned stale-packet rejection or regeneration behavior, and bounded cache pruning so downstream flows never read cached packet files directly and packet storage cannot grow without limit.

- [x] **Step 5: Add PowerShell wrapper parity**
  Implement `bin/superpowers-plan-contract.ps1` using the existing wrapper pattern so Windows callers can invoke the Bash helper with argument and exit-code parity.

- [x] **Step 6: Make the helper and retention tests pass**
  Run:
  ```bash
  bash tests/codex-runtime/test-superpowers-plan-contract.sh
  bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh
  ```
  Expected: both pass with the new helper, wrapper, stale-packet handling, and bounded-retention behavior present.

- [x] **Step 7: Commit the helper slice**
  Run:
  ```bash
  git add \
    bin/superpowers-plan-contract \
    bin/superpowers-plan-structure-common \
    bin/superpowers-plan-contract.ps1 \
    tests/codex-runtime/test-superpowers-plan-contract.sh \
    tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh
  git commit -m "feat: add plan contract helper"
  ```

## Task 3: Tighten Plan Authoring, ENG Review, And Execution-Parser Interop

**Spec Coverage:** REQ-001, REQ-002, REQ-003, REQ-005, REQ-011, REQ-012, NONGOAL-002
**Task Outcome:** New or revised execution plans must use the new traceability contract, engineering review must lint them before approval, and `superpowers-plan-execution` must parse the same canonical task structure.
**Plan Constraints:**
- Edit `SKILL.md.tmpl` files and regenerate checked-in `SKILL.md` outputs.
- Keep `superpowers-plan-execution` focused on execution-state truth; do not move semantic mapping into it.
- Do not silently preserve `### Task N:` in authoring examples or parser assumptions.
- Reuse the shared structural parser module rather than introducing a second canonical-task parser.
- Preserve the existing `superpowers-repo-safety` `plan-artifact-write` and `approval-header-write` preflights while tightening `writing-plans` and `plan-eng-review`.
**Open Questions:** none

**Files:**
- Modify: `bin/superpowers-plan-structure-common`
- Modify: `skills/writing-plans/SKILL.md.tmpl`
- Modify: `skills/writing-plans/SKILL.md`
- Modify: `skills/plan-eng-review/SKILL.md.tmpl`
- Modify: `skills/plan-eng-review/SKILL.md`
- Modify: `bin/superpowers-plan-execution`
- Modify: `tests/codex-runtime/test-superpowers-plan-execution.sh`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Modify: `tests/codex-runtime/test-workflow-enhancements.sh`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `node scripts/gen-skill-docs.mjs`
- Test: `node scripts/gen-skill-docs.mjs --check`
- Test: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`
- Test: `bash tests/codex-runtime/test-workflow-enhancements.sh`
- Test: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`

- [x] **Step 1: Update the writing-plans template to require the new contract**
  Change the plan template and guidance to require `Requirement Coverage Matrix`, canonical `## Task N:` headings, `Spec Coverage`, `Task Outcome`, `Plan Constraints`, `Open Questions`, and a pre-handoff `superpowers-plan-contract lint` self-check without weakening the existing protected-branch repo-safety gate.

- [x] **Step 2: Update the plan-eng-review template to gate approval on lint**
  Add the required lint invocation, fail-closed conditions, and explicit review questions around coverage, decisions, non-goals, and file-scope drift while preserving the existing protected-branch approval-header repo-safety preflight.

- [x] **Step 3: Regenerate the generated skill docs**
  Run `node scripts/gen-skill-docs.mjs` so the checked-in `SKILL.md` files match the template changes.

- [x] **Step 4: Align `superpowers-plan-execution` with the canonical task structure**
  Make `superpowers-plan-execution` consume `bin/superpowers-plan-structure-common`, reject malformed canonical structure earlier, and surface enough task metadata for downstream review correlation without taking over semantic mapping.

- [x] **Step 5: Update parser and wording tests**
  Extend `tests/codex-runtime/test-superpowers-plan-execution.sh`, `tests/codex-runtime/test-workflow-sequencing.sh`, `tests/codex-runtime/test-workflow-enhancements.sh`, and `tests/codex-runtime/skill-doc-contracts.test.mjs` so they pin the new authoring/review and parser interop contract.

- [x] **Step 6: Run the focused verification**
  Run:
  ```bash
  node scripts/gen-skill-docs.mjs --check
  bash tests/codex-runtime/test-superpowers-plan-execution.sh
  bash tests/codex-runtime/test-workflow-sequencing.sh
  bash tests/codex-runtime/test-workflow-enhancements.sh
  node --test tests/codex-runtime/skill-doc-contracts.test.mjs
  ```
  Expected: all pass with canonical task syntax and lint-gated plan approval behavior.

- [x] **Step 7: Commit the planning and parser-interoperability slice**
  Run:
  ```bash
  git add \
    skills/writing-plans/SKILL.md.tmpl \
    skills/writing-plans/SKILL.md \
    skills/plan-eng-review/SKILL.md.tmpl \
    skills/plan-eng-review/SKILL.md \
    bin/superpowers-plan-structure-common \
    bin/superpowers-plan-execution \
    tests/codex-runtime/test-superpowers-plan-execution.sh \
    tests/codex-runtime/test-workflow-sequencing.sh \
    tests/codex-runtime/test-workflow-enhancements.sh \
    tests/codex-runtime/skill-doc-contracts.test.mjs
  git commit -m "feat: enforce plan traceability contracts"
  ```

## Task 4: Switch Execution And Review Consumers To Task Packets

**Spec Coverage:** REQ-006, REQ-007, REQ-008, REQ-014, NONGOAL-002
**Task Outcome:** Execution and review surfaces consume canonical task packets instead of controller-curated semantic context, and they escalate ambiguity instead of inventing answers.
**Plan Constraints:**
- Preserve same-session and isolated-agent execution paths; change the contract they consume, not the workflow stage ownership.
- Keep reviewer prompts explicit about plan deviation versus ordinary correctness gaps.
- Do not let controllers fall back to freeform semantic summaries when packets are insufficient.
- Require execution and review consumers to invoke `superpowers-plan-contract build-task-packet` every time; helper-managed cache reuse is allowed, direct packet-file reads are not.
- Preserve the existing `superpowers-repo-safety` `execution-task-slice` preflights and protected-branch guarantees while changing execution guidance and reviewer prompts.
**Open Questions:** none

**Files:**
- Modify: `skills/executing-plans/SKILL.md.tmpl`
- Modify: `skills/executing-plans/SKILL.md`
- Modify: `skills/subagent-driven-development/SKILL.md.tmpl`
- Modify: `skills/subagent-driven-development/SKILL.md`
- Modify: `skills/subagent-driven-development/implementer-prompt.md`
- Modify: `skills/subagent-driven-development/spec-reviewer-prompt.md`
- Modify: `skills/subagent-driven-development/code-quality-reviewer-prompt.md`
- Modify: `skills/requesting-code-review/SKILL.md.tmpl`
- Modify: `skills/requesting-code-review/SKILL.md`
- Modify: `skills/requesting-code-review/code-reviewer.md`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Modify: `tests/codex-runtime/test-workflow-enhancements.sh`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `node scripts/gen-skill-docs.mjs`
- Test: `node scripts/gen-skill-docs.mjs --check`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`
- Test: `bash tests/codex-runtime/test-workflow-enhancements.sh`
- Test: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`

- [x] **Step 1: Update same-session execution guidance**
  Teach `executing-plans` to invoke `superpowers-plan-contract build-task-packet` before each task, treat the returned packet as the exact execution contract for that slice, rely on the helper for any cache reuse or regeneration, and keep the protected-branch repo-safety checks intact.

- [x] **Step 2: Update subagent-driven-development guidance**
  Replace task-text-plus-context dispatch with helper-built packet-backed dispatch, packet-backed answers to subagent questions, and explicit escalation when the packet does not resolve ambiguity, without weakening the existing execution-task-slice repo-safety contract.

- [x] **Step 3: Tighten implementer and reviewer prompts**
  Rewrite `implementer-prompt.md`, `spec-reviewer-prompt.md`, `code-quality-reviewer-prompt.md`, and `skills/requesting-code-review/code-reviewer.md` so they consume task packets, check file-scope and requirement-scope drift, and distinguish `PLAN_DEVIATION_FOUND` from ordinary gaps.

- [x] **Step 4: Update requesting-code-review for packet-backed final review**
  Add plan-contract lint preflight, helper-built packet context requirements, and fail-closed handling for invalid approved artifacts or stale packet-cache state.

- [x] **Step 5: Regenerate generated skill docs and update contract tests**
  Run `node scripts/gen-skill-docs.mjs`, then extend `tests/codex-runtime/test-workflow-sequencing.sh`, `tests/codex-runtime/test-workflow-enhancements.sh`, and `tests/codex-runtime/skill-doc-contracts.test.mjs` to pin packet-backed execution and review wording.

- [x] **Step 6: Run the focused verification**
  Run:
  ```bash
  node scripts/gen-skill-docs.mjs --check
  bash tests/codex-runtime/test-workflow-sequencing.sh
  bash tests/codex-runtime/test-workflow-enhancements.sh
  node --test tests/codex-runtime/skill-doc-contracts.test.mjs
  ```
  Expected: packet-backed execution and review contracts are present and pass.

- [x] **Step 7: Commit the execution and review consumption slice**
  Run:
  ```bash
  git add \
    skills/executing-plans/SKILL.md.tmpl \
    skills/executing-plans/SKILL.md \
    skills/subagent-driven-development/SKILL.md.tmpl \
    skills/subagent-driven-development/SKILL.md \
    skills/subagent-driven-development/implementer-prompt.md \
    skills/subagent-driven-development/spec-reviewer-prompt.md \
    skills/subagent-driven-development/code-quality-reviewer-prompt.md \
    skills/requesting-code-review/SKILL.md.tmpl \
    skills/requesting-code-review/SKILL.md \
    skills/requesting-code-review/code-reviewer.md \
    tests/codex-runtime/test-workflow-sequencing.sh \
    tests/codex-runtime/test-workflow-enhancements.sh \
    tests/codex-runtime/skill-doc-contracts.test.mjs
  git commit -m "feat: route execution and review through task packets"
  ```

## Task 5: Align Runtime Docs, Release Notes, And Full Verification

**Spec Coverage:** REQ-003, REQ-009, REQ-010, REQ-013, NONGOAL-001, VERIFY-001
**Task Outcome:** The repo’s runtime docs, release notes, fixture guidance, and final verification matrix all describe the new helper-backed semantic traceability contract without rewriting historical artifacts.
**Plan Constraints:**
- Update current runtime docs and fixture guidance, not historical approved plans or execution evidence.
- Keep the public workflow CLI explicitly read-only and non-authoritative in the docs.
- Include the new helper in runtime-surface validation and release notes.
- Document the new helper alongside the existing session-entry and repo-safety runtime layers rather than describing it as a replacement for them.
**Open Questions:** none

**Files:**
- Modify: `README.md`
- Modify: `docs/README.codex.md`
- Modify: `docs/README.copilot.md`
- Modify: `docs/testing.md`
- Modify: `RELEASE-NOTES.md`
- Modify: `tests/codex-runtime/test-workflow-enhancements.sh`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Modify: `tests/codex-runtime/fixtures/workflow-artifacts/README.md`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`
- Test: `bash tests/codex-runtime/test-superpowers-plan-contract.sh`
- Test: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`
- Test: `bash tests/codex-runtime/test-workflow-enhancements.sh`
- Test: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- Test: `node scripts/gen-skill-docs.mjs --check`
- Test: `node --test tests/codex-runtime/*.test.mjs`

- [x] **Step 1: Update README and platform docs for the new helper contract**
  Document `superpowers-plan-contract` as an internal runtime helper, explain packet-backed planning and review behavior, restate that `superpowers-workflow` remains the only supported public read-only workflow CLI, and keep the existing `superpowers-session-entry` plus `superpowers-repo-safety` layers visible in the runtime architecture narrative.

- [x] **Step 2: Update testing and fixture guidance**
  Update `docs/testing.md`, `tests/codex-runtime/test-workflow-enhancements.sh`, `tests/codex-runtime/test-runtime-instructions.sh`, and `tests/codex-runtime/fixtures/workflow-artifacts/README.md` so the new helper suite, packet-backed reviewer wording, fixture family, and runtime-doc references are pinned.

- [x] **Step 3: Add a release-note entry**
  Summarize the new semantic traceability layer, task-packet-backed execution/review flow, and stricter plan-authoring and engineering-review contracts in `RELEASE-NOTES.md`.

- [x] **Step 4: Run the full targeted verification matrix**
  Run:
  ```bash
  node scripts/gen-skill-docs.mjs --check
  node --test tests/codex-runtime/*.test.mjs
  bash tests/codex-runtime/test-superpowers-plan-contract.sh
  bash tests/codex-runtime/test-superpowers-plan-execution.sh
  bash tests/codex-runtime/test-workflow-sequencing.sh
  bash tests/codex-runtime/test-workflow-enhancements.sh
  bash tests/codex-runtime/test-runtime-instructions.sh
  bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh
  ```
  Expected: all pass and reflect the new helper-backed contract.

- [x] **Step 5: Commit the docs and verification slice**
  Run:
  ```bash
  git add \
    README.md \
    docs/README.codex.md \
    docs/README.copilot.md \
    docs/testing.md \
    RELEASE-NOTES.md \
    tests/codex-runtime/test-workflow-enhancements.sh \
    tests/codex-runtime/test-runtime-instructions.sh \
    tests/codex-runtime/fixtures/workflow-artifacts/README.md
  git commit -m "docs: describe task fidelity workflow contract"
  ```
