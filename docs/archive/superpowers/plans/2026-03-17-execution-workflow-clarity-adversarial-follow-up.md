# Execution Workflow Clarity Adversarial Follow-Up Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use `superpowers:subagent-driven-development` when isolated-agent workflows are available in the current platform/session; otherwise use `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** superpowers:executing-plans
**Source Spec:** `docs/superpowers/specs/2026-03-17-execution-workflow-clarity-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

**Goal:** Correct the adversarial-review gaps in `superpowers-plan-execution` without reopening the broader execution-workflow project.

**Architecture:** Keep the existing helper contract and repair only the two confirmed follow-up areas: mutation-input hardening and execution-routing consistency. Treat the helper as the source of truth for execution-state writes, then align the top-level workflow routing docs/tests so they do not bypass that contract.

**Tech Stack:** POSIX shell helper, generated `SKILL.md` docs from `SKILL.md.tmpl`, shell regression tests, Node skill-doc contract tests

---

## What Already Exists

Historical note: this section captures the draft-time repo state before the plan was executed. For the current shipped state, use the repo contents plus `docs/superpowers/execution-evidence/2026-03-17-execution-workflow-clarity-adversarial-follow-up-r1-evidence.md`.

- `bin/superpowers-plan-execution` already implements the read/write execution-state contract and has a dedicated regression harness in `tests/codex-runtime/test-superpowers-plan-execution.sh`.
- `skills/plan-eng-review/` already routes execution handoff through `superpowers-plan-execution recommend`.
- `skills/using-superpowers/` plus `tests/codex-runtime/test-workflow-sequencing.sh` and `tests/codex-runtime/skill-doc-contracts.test.mjs` still encode the older execution-skill routing shortcut.

## Not In Scope

- Reworking the approved execution-state model.
- Replacing the helper’s bounded JSON schemas.
- Expanding this follow-up into a new workflow-state runtime project.
- Reopening the helper's `tasks_independent` recommendation policy in this follow-up. That remains a separate design clarification and already maps to the existing `Execution Handoff Recommendation Flow` TODO.

## Task 1: Lock In The Adversarial Repros As Red Tests

**Files:**
- Modify: `tests/codex-runtime/test-superpowers-plan-execution.sh`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Test: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`
- Test: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`

- [x] **Step 1: Add a failing regression for whitespace-only `note --message`**
```text
Prove the current bug:
- `note --message '   '` exits nonzero
- but still leaves a malformed blank execution note in the plan

Target behavior:
- reject the command up front as `InvalidCommandInput`
- leave the plan untouched
```

- [ ] **Step 2: Add failing regressions for whitespace-only `reopen --reason` and `complete --claim`**
```text
Prove both current bugs:
- `reopen --reason '   '` leaves an empty invalidation reason in evidence
- `complete --claim '   '` leaves an empty claim in evidence

Target behavior:
- reject both commands before any write
- leave plan/evidence unchanged
```

- [ ] **Step 3: Add the matching transfer/manual-summary coverage while the helper is under test**
```text
Cover the same normalized-empty class for:
- `transfer --reason`
- `complete --manual-verify-summary`

The goal is one bounded rule for required text fields, not a patchwork fix.
```

- [ ] **Step 4: Add failing routing-contract coverage for the stale handoff shortcut**
```text
Replace the old assertion that hard-codes:
- isolated agents available => `superpowers:subagent-driven-development`

with red assertions that:
- `using-superpowers` defers execution-skill selection to the helper-backed handoff contract
- runtime-facing docs no longer describe the old isolated-agent shortcut as the canonical rule
```

- [ ] **Step 5: Run the red regression set and capture expected failures**
Run: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`
Expected: FAIL on the new whitespace-only mutation cases

Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`
Expected: FAIL on the stale `using-superpowers` routing text

Run: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`
Expected: FAIL on the stale routing contract assertion

Run: `bash tests/codex-runtime/test-runtime-instructions.sh`
Expected: FAIL on the stale runtime-facing routing language

- [ ] **Step 6: Commit the red follow-up coverage**
```bash
git add tests/codex-runtime/test-superpowers-plan-execution.sh tests/codex-runtime/test-workflow-sequencing.sh tests/codex-runtime/skill-doc-contracts.test.mjs tests/codex-runtime/test-runtime-instructions.sh
git commit -m "test: capture adversarial follow-up regressions"
```

## Task 2: Harden Mutation Validation So Failed Commands Cannot Corrupt State

**Files:**
- Modify: `bin/superpowers-plan-execution`
- Modify: `tests/codex-runtime/test-superpowers-plan-execution.sh`
- Test: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`

- [ ] **Step 1: Add one shared validator for required normalized text fields**
```text
Create a helper that:
- normalizes whitespace
- rejects the field when the normalized value is empty
- optionally enforces the existing 120-character cap where applicable

Use it for:
- note summaries
- reopen reasons
- transfer reasons
- completion claims
- manual verification summaries
```

- [ ] **Step 2: Validate every required text input before any plan or evidence mutation**
```text
Apply the validator before:
- `STEP_NOTE_*` changes
- `append_attempt`
- `invalidate_attempt`
- any commit helper call
```

- [ ] **Step 3: Keep the error class stable and fail before writes**
```text
Return:
- `InvalidCommandInput`

Do not let malformed user input fall through into:
- committed invalid plan notes
- committed invalid evidence entries
- post-write `MalformedExecutionState` surprises
```

- [ ] **Step 4: Re-run the helper suite until the new corruption regressions pass**
Run: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`
Expected: PASS for the whitespace-only mutation cases and all existing helper coverage

- [ ] **Step 5: Commit the validation hardening**
```bash
git add bin/superpowers-plan-execution tests/codex-runtime/test-superpowers-plan-execution.sh
git commit -m "fix: reject empty normalized execution mutation text"
```

## Task 3: Repair The Execution-Routing Contract And Remove The Stale Shortcut

**Files:**
- Modify: `skills/using-superpowers/SKILL.md.tmpl`
- Modify: `skills/using-superpowers/SKILL.md`
- Modify: `README.md`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Test: `node scripts/gen-skill-docs.mjs`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`
- Test: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`

- [ ] **Step 1: Remove the stale top-level execution-skill shortcut**
```text
Update `using-superpowers` so `implementation_ready` no longer says:
- isolated agents available => `superpowers:subagent-driven-development`

Update the workflow/router prose so the normal execution handoff defers execution-skill
selection to the helper-backed recommendation path when an approved plan is in hand.
Also update `README.md` so runtime-facing docs do not teach the stale shortcut.
```

- [ ] **Step 2: Regenerate the skill docs from the template**
Run: `node scripts/gen-skill-docs.mjs`
Expected: `skills/using-superpowers/SKILL.md` matches the new template language

- [ ] **Step 3: Update the workflow/doc contract tests to match the new handoff language**
```text
The tests should enforce:
- no hard-coded isolated-agent => SDD routing shortcut in `using-superpowers`
- helper-owned recommendation/handoff language instead
- no stale runtime-facing README assertion that still teaches the old shortcut
```

- [ ] **Step 4: Run the routing/doc checks to green**
Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`
Expected: PASS with the stale shortcut removed

Run: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`
Expected: PASS with the regenerated contract text

Run: `bash tests/codex-runtime/test-runtime-instructions.sh`
Expected: PASS with the runtime-facing routing text updated

- [ ] **Step 5: Commit the routing-contract cleanup**
```bash
git add skills/using-superpowers/SKILL.md.tmpl skills/using-superpowers/SKILL.md README.md tests/codex-runtime/test-workflow-sequencing.sh tests/codex-runtime/skill-doc-contracts.test.mjs tests/codex-runtime/test-runtime-instructions.sh
git commit -m "docs: align execution routing with helper handoff"
```

## Task 4: Final Verification And Review Handoff

- [ ] **Step 1: Run the combined follow-up verification**
Run: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`
Expected: PASS

Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`
Expected: PASS

Run: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`
Expected: PASS

Run: `bash tests/codex-runtime/test-runtime-instructions.sh`
Expected: PASS

Run: `node scripts/gen-skill-docs.mjs --check`
Expected: PASS with generated skill docs up to date

- [ ] **Step 2: Request code review before any merge or branch-finish flow**
```text
Use `superpowers:requesting-code-review` after the follow-up fixes land and verification is green.
```
