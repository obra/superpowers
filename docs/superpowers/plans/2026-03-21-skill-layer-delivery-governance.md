# Skill-Layer Delivery Governance Implementation Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use `superpowers:subagent-driven-development` when isolated-agent workflows are available in the current platform/session; otherwise use `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** superpowers:executing-plans
**Source Spec:** `docs/superpowers/specs/2026-03-21-skill-layer-delivery-governance-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

**Goal:** Raise Superpowers' workflow quality bar through stronger skill-layer spec/plan/release criteria, conditional QA policy, and a modeled checklist surface while preserving the current helper-owned authority model.

**Architecture:** Keep the change entirely in the skill/doc/test layer. First, strengthen the authoring and review skill contracts for specs and plans, then add the release/completion/checklist changes that translate Gate E and Gate F into existing workflow surfaces. Finish by regenerating generated skill docs and running the targeted contract suites that pin workflow wording and review/checklist behavior.

**Tech Stack:** Markdown skill templates, generated skill docs, README/review checklist docs, POSIX shell regression tests, Node-based skill-doc generation

---

## What Already Exists

- `skills/brainstorming/SKILL.md.tmpl` and `skills/plan-ceo-review/SKILL.md.tmpl` already define the current spec-authoring and CEO-review contracts.
- `skills/writing-plans/SKILL.md.tmpl` and `skills/plan-eng-review/SKILL.md.tmpl` already define the current plan-authoring and engineering-review contracts.
- `skills/document-release/SKILL.md.tmpl` and `skills/finishing-a-development-branch/SKILL.md.tmpl` already own post-implementation doc/release and branch-completion behavior.
- `review/checklist.md` is already the shared review-facing checklist surface used by code review flows.
- `README.md` already describes the current runtime authority model and end-to-end workflow.
- `scripts/gen-skill-docs.mjs` already regenerates `SKILL.md` from `SKILL.md.tmpl`, and `tests/codex-runtime/test-runtime-instructions.sh` already checks generated freshness.
- `tests/codex-runtime/test-workflow-sequencing.sh` and `tests/codex-runtime/test-workflow-enhancements.sh` already pin workflow wording and review/checklist contracts.

## Planned File Structure

- Modify: `skills/brainstorming/SKILL.md.tmpl`
- Modify generated output: `skills/brainstorming/SKILL.md`
  Add stronger draft-spec content expectations derived from the approved spec.
- Modify: `skills/plan-ceo-review/SKILL.md.tmpl`
- Modify generated output: `skills/plan-ceo-review/SKILL.md`
  Make Gate A-style delivery content approval-blocking for CEO review.
- Modify: `skills/writing-plans/SKILL.md.tmpl`
- Modify generated output: `skills/writing-plans/SKILL.md`
  Add stronger plan content requirements derived from Gate B.
- Modify: `skills/plan-eng-review/SKILL.md.tmpl`
- Modify generated output: `skills/plan-eng-review/SKILL.md`
  Add Gate B review criteria, concrete overlays, and the conditional Gate E QA policy.
- Modify: `skills/document-release/SKILL.md.tmpl`
- Modify generated output: `skills/document-release/SKILL.md`
  Add the required Phase 7 / Gate F-style release-readiness pass.
- Modify: `skills/finishing-a-development-branch/SKILL.md.tmpl`
- Modify generated output: `skills/finishing-a-development-branch/SKILL.md`
  Require the `document-release` handoff for workflow-routed work and add the short Gate F confirmation.
- Modify: `review/checklist.md`
  Model the new governance standard in the shared review-facing checklist surface.
- Modify: `README.md`
  Explain the richer workflow expectations while preserving the same runtime authority model.
- Modify: `docs/README.codex.md`
  Keep the Codex-specific workflow guide aligned with the stronger release and QA expectations.
- Modify: `docs/README.copilot.md`
  Keep the Copilot-specific workflow guide aligned with the stronger release and QA expectations.
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
  Pin the new skill-contract wording and fail-closed workflow expectations.
- Modify: `tests/codex-runtime/test-workflow-enhancements.sh`
  Pin the checklist/document-release/branch-finish behavior changes.
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
  Keep generated docs and runtime-facing docs aligned after regeneration.

## Not In Scope

- Any change to `bin/superpowers-workflow-status`, `bin/superpowers-plan-execution`, or the `implementation_ready` execution boundary.
- Any new authoritative artifact classes under `docs/superpowers/`.
- Retroactive edits to already implemented approved specs or plans for example purposes.
- A required PR template or PR-body artifact in this first pass.

## Implementation Notes

- Edit only `SKILL.md.tmpl` files for workflow skills, then regenerate the corresponding `SKILL.md` outputs with `node scripts/gen-skill-docs.mjs`.
- Treat `review/checklist.md` as the primary dedicated modeled governance surface for the first pass; do not invent separate example spec/plan artifacts.
- Preserve the distinction between:
  - review-enforced freeform content requirements
  - parser-enforced exact approval headers
- Preserve the current runtime authority model in docs and tests:
  - helper-owned truth stays spec headers, plan headers, and execution evidence
  - new Gate A/B/E/F logic stays in skills, docs, and review/checklist surfaces
- Use red-test-first workflow for each slice:
  - add wording/contract assertions
  - run them to see them fail
  - update templates/docs
  - regenerate generated docs
  - re-run tests and commit

## Diagrams

### Change Surface

```text
Task 1: spec + plan authoring/review contracts
    |
    +--> brainstorming
    +--> plan-ceo-review
    +--> writing-plans
    +--> plan-eng-review
    +--> generated skill docs
    +--> workflow sequencing tests

Task 2: release, completion, and checklist surfaces
    |
    +--> document-release
    +--> finishing-a-development-branch
    +--> review/checklist.md
    +--> README.md
    +--> workflow enhancement tests

Task 3: regeneration, final contract verification, and review handoff
    |
    +--> generated skill docs fresh
    +--> sequencing/enhancement/runtime instruction suites pass
    +--> plan ready for engineering review
```

### Policy Boundary

```text
task.md governance detail
    |
    +--> Gate A / spec template ------> brainstorming + plan-ceo-review
    +--> Gate B / plan template ------> writing-plans + plan-eng-review
    +--> Gate E / QA readiness --------> plan-eng-review + finishing-a-development-branch
    +--> Gate F / release readiness ---> document-release + finishing-a-development-branch
    |
    +--> helper/runtime ownership -----X unchanged
```

## Failure Modes To Prevent

| Codepath | Failure to prevent | Guardrail |
| --- | --- | --- |
| spec-authoring/review skills | richer delivery expectations stay advisory or vague | wording-level shell assertions that require the new approval-blocking criteria |
| plan-authoring/review skills | Gate B concepts land only as broad prose, not real review gates | red tests that require specific plan-readiness expectations in the relevant skills |
| QA flow | `qa-only` becomes universal or stays optional for browser-facing work | explicit conditional wording in `plan-eng-review` and `finishing-a-development-branch`, pinned by tests |
| release/completion flow | `document-release` stays optional and Gate F never becomes real | explicit required handoff plus short completion confirmation, pinned by tests |
| modeled reference surface | historical approved artifacts get repurposed as examples | update `review/checklist.md` instead of touching old approved plans/specs |
| generated docs | template/output drift after skill edits | `node scripts/gen-skill-docs.mjs` plus `--check` freshness gate |

## Task 1: Strengthen Spec And Plan Authoring/Review Contracts

**Files:**
- Modify: `skills/brainstorming/SKILL.md.tmpl`
- Modify generated output: `skills/brainstorming/SKILL.md`
- Modify: `skills/plan-ceo-review/SKILL.md.tmpl`
- Modify generated output: `skills/plan-ceo-review/SKILL.md`
- Modify: `skills/writing-plans/SKILL.md.tmpl`
- Modify generated output: `skills/writing-plans/SKILL.md`
- Modify: `skills/plan-eng-review/SKILL.md.tmpl`
- Modify generated output: `skills/plan-eng-review/SKILL.md`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`
- Test: `node scripts/gen-skill-docs.mjs`
- Test: `node scripts/gen-skill-docs.mjs --check`

- [x] **Step 1: Add red sequencing assertions for Gate A and Gate B skill contracts**
```bash
require_pattern skills/brainstorming/SKILL.md "problem statement"
require_pattern skills/brainstorming/SKILL.md "failure and edge-case behavior"
require_pattern skills/brainstorming/SKILL.md "observability expectations"
require_pattern skills/brainstorming/SKILL.md "rollout and rollback expectations"
require_pattern skills/brainstorming/SKILL.md "testable acceptance criteria"
require_pattern skills/plan-ceo-review/SKILL.md "Gate A checklist"
require_pattern skills/plan-ceo-review/SKILL.md "explicit failure-mode thinking"
require_pattern skills/plan-ceo-review/SKILL.md "rollout and rollback expectations"
require_pattern skills/plan-ceo-review/SKILL.md "testable acceptance criteria"
require_pattern skills/writing-plans/SKILL.md "preconditions"
require_pattern skills/writing-plans/SKILL.md "validation strategy"
require_pattern skills/writing-plans/SKILL.md "evidence expectations"
require_pattern skills/writing-plans/SKILL.md "rollout plan"
require_pattern skills/writing-plans/SKILL.md "rollback plan"
require_pattern skills/writing-plans/SKILL.md "risks and mitigations"
require_pattern skills/plan-eng-review/SKILL.md "ordered implementation steps"
require_pattern skills/plan-eng-review/SKILL.md "documentation update expectations"
require_pattern skills/plan-eng-review/SKILL.md "evidence expectations"
require_pattern skills/plan-eng-review/SKILL.md "explicit risks"
```

- [x] **Step 2: Run the red sequencing check**
Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`
Expected: FAIL because the current skill docs do not yet encode the richer Gate A/B contract.

- [x] **Step 3: Update the spec-authoring templates and regenerate**
```markdown
Update `skills/brainstorming/SKILL.md.tmpl` so draft specs explicitly cover:
- problem statement / desired outcome / why it matters
- scope, interfaces, dependencies, data/contracts
- failure behavior, observability, rollout/rollback, risks, acceptance criteria
```

- [x] **Step 4: Update the spec-review and plan-authoring/review templates and regenerate**
```markdown
Update the relevant templates so:
- `plan-ceo-review` blocks approval on materially missing Gate A content
- `writing-plans` requires Gate B plan content
- `plan-eng-review` blocks approval on materially missing Gate B content and carries the concrete domain overlays plus conditional Gate E QA policy
```

- [x] **Step 5: Regenerate generated skill docs**
Run: `node scripts/gen-skill-docs.mjs`
Expected: the generated `SKILL.md` files reflect the updated template contracts.

- [x] **Step 6: Re-run the focused verification**
Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`
Expected: PASS

Run: `node scripts/gen-skill-docs.mjs --check`
Expected: PASS

- [x] **Step 7: Commit the authoring/review contract slice**
```bash
git add \
  skills/brainstorming/SKILL.md.tmpl \
  skills/brainstorming/SKILL.md \
  skills/plan-ceo-review/SKILL.md.tmpl \
  skills/plan-ceo-review/SKILL.md \
  skills/writing-plans/SKILL.md.tmpl \
  skills/writing-plans/SKILL.md \
  skills/plan-eng-review/SKILL.md.tmpl \
  skills/plan-eng-review/SKILL.md \
  tests/codex-runtime/test-workflow-sequencing.sh
git commit -m "feat: strengthen workflow authoring and review gates"
```

## Task 2: Add Release-Readiness And Checklist Governance Surfaces

**Files:**
- Modify: `skills/document-release/SKILL.md.tmpl`
- Modify generated output: `skills/document-release/SKILL.md`
- Modify: `skills/finishing-a-development-branch/SKILL.md.tmpl`
- Modify generated output: `skills/finishing-a-development-branch/SKILL.md`
- Modify: `review/checklist.md`
- Modify: `README.md`
- Modify: `docs/README.codex.md`
- Modify: `docs/README.copilot.md`
- Modify: `tests/codex-runtime/test-workflow-enhancements.sh`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Test: `bash tests/codex-runtime/test-workflow-enhancements.sh`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`
- Test: `node scripts/gen-skill-docs.mjs`
- Test: `node scripts/gen-skill-docs.mjs --check`

- [x] **Step 1: Add red enhancement assertions for required release/doc gating**
```bash
require_pattern skills/document-release/SKILL.md "release-readiness"
require_pattern skills/document-release/SKILL.md "rollout notes"
require_pattern skills/document-release/SKILL.md "rollback notes"
require_pattern skills/document-release/SKILL.md "known risks or operator-facing caveats"
require_pattern skills/document-release/SKILL.md "monitoring or verification expectations"
require_pattern skills/finishing-a-development-branch/SKILL.md "required `document-release` pass"
require_pattern skills/finishing-a-development-branch/SKILL.md "Gate F-style"
require_pattern skills/finishing-a-development-branch/SKILL.md "documentation has been refreshed"
require_pattern skills/finishing-a-development-branch/SKILL.md "release notes or equivalent release-history updates are ready"
require_pattern skills/finishing-a-development-branch/SKILL.md "require the existing QA handoff when the change type or test-plan artifact clearly warrants browser QA"
require_pattern review/checklist.md "Release Readiness"
require_pattern review/checklist.md "Spec / Plan Delivery Content"
require_pattern README.md "required `document-release` handoff"
require_pattern README.md "conditional `qa-only` handoff for browser-facing work"
require_pattern docs/README.codex.md "document-release"
require_pattern docs/README.codex.md "qa-only"
require_pattern docs/README.copilot.md "document-release"
require_pattern docs/README.copilot.md "qa-only"
```

- [x] **Step 2: Run the red enhancement/runtime checks**
Run: `bash tests/codex-runtime/test-workflow-enhancements.sh`
Expected: FAIL because release-readiness is still optional and the checklist surface does not yet model the new governance standard.

Run: `bash tests/codex-runtime/test-runtime-instructions.sh`
Expected: FAIL once the new runtime-facing wording assertions are added.

- [x] **Step 3: Update `document-release` and `finishing-a-development-branch` templates**
```markdown
Update the templates so:
- `document-release` is required before completion for workflow-routed work
- `document-release` owns the substantive Phase 7 / Gate F pass
- `finishing-a-development-branch` performs the short Gate F-style confirmation and enforces conditional `qa-only`
```

- [x] **Step 4: Update the modeled checklist and contributor-facing docs**
```markdown
Update `review/checklist.md` so it reflects the new governance surfaces without becoming a second workflow state machine.

Update `README.md`, `docs/README.codex.md`, and `docs/README.copilot.md` so they explain:
- same helper-owned authority model
- stronger spec/plan expectations
- required `document-release` handoff
- conditional `qa-only` handoff for browser-facing work
```

- [x] **Step 5: Regenerate generated skill docs**
Run: `node scripts/gen-skill-docs.mjs`
Expected: generated outputs for `document-release` and `finishing-a-development-branch` match the updated templates.

- [x] **Step 6: Re-run the focused verification**
Run: `bash tests/codex-runtime/test-workflow-enhancements.sh`
Expected: PASS

Run: `bash tests/codex-runtime/test-runtime-instructions.sh`
Expected: PASS

Run: `node scripts/gen-skill-docs.mjs --check`
Expected: PASS

- [x] **Step 7: Commit the release/checklist slice**
```bash
git add \
  skills/document-release/SKILL.md.tmpl \
  skills/document-release/SKILL.md \
  skills/finishing-a-development-branch/SKILL.md.tmpl \
  skills/finishing-a-development-branch/SKILL.md \
  review/checklist.md \
  README.md \
  docs/README.codex.md \
  docs/README.copilot.md \
  tests/codex-runtime/test-workflow-enhancements.sh \
  tests/codex-runtime/test-runtime-instructions.sh
git commit -m "feat: add release-readiness workflow gates"
```

## Task 3: Final Verification And Review Handoff

**Files:**
- Modify: `docs/superpowers/specs/2026-03-21-skill-layer-delivery-governance-design.md`
- Modify: `docs/superpowers/plans/2026-03-21-skill-layer-delivery-governance.md`
- Test: `node scripts/gen-skill-docs.mjs --check`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`
- Test: `bash tests/codex-runtime/test-workflow-enhancements.sh`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`

- [x] **Step 1: Verify the approved spec and written plan still match the intended scope**
Run a manual diff pass against:
- `docs/superpowers/specs/2026-03-21-skill-layer-delivery-governance-design.md`
- `docs/superpowers/plans/2026-03-21-skill-layer-delivery-governance.md`

Expected: the plan still implements the approved narrow skill-layer-only governance change and has not drifted into helper/runtime expansion.

- [x] **Step 2: Run the full targeted verification matrix**
Run: `node scripts/gen-skill-docs.mjs --check`
Expected: PASS

Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`
Expected: PASS

Run: `bash tests/codex-runtime/test-workflow-enhancements.sh`
Expected: PASS

Run: `bash tests/codex-runtime/test-runtime-instructions.sh`
Expected: PASS

- [x] **Step 3: Use verification-before-completion for the planning slice**
Invoke `superpowers:verification-before-completion`, capture the verification results above, and confirm the working tree contains only the intended spec/plan/skill/doc/test changes plus plan-execution bookkeeping.

- [x] **Step 4: Commit the approved spec header change and written plan**
```bash
git add \
  docs/superpowers/specs/2026-03-21-skill-layer-delivery-governance-design.md \
  docs/superpowers/plans/2026-03-21-skill-layer-delivery-governance.md
git commit -m "docs: approve delivery governance spec and add plan"
```

- [x] **Step 5: Hand off to engineering review**
Invoke `superpowers:plan-eng-review` with this exact approved plan path:
`docs/superpowers/plans/2026-03-21-skill-layer-delivery-governance.md`
