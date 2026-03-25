# Using-Superpowers Session Bypass Implementation Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use `superpowers:subagent-driven-development` when isolated-agent workflows are available in the current platform/session; otherwise use `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** superpowers:executing-plans
**Source Spec:** `docs/superpowers/specs/2026-03-21-using-superpowers-bypass-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

**Goal:** Add a session-scoped opt-out gate to `using-superpowers` that asks once before normal Superpowers behavior, persists `enabled` or `bypassed` state for the session, supports explicit re-entry, and ships with deterministic contract and behavior-level regression coverage.

**Architecture:** Keep the change local to the existing generated-skill/runtime-doc surfaces. First, teach the generator about a dedicated `using-superpowers` bootstrap preamble that is smaller than the shared base preamble. Second, update the `using-superpowers` template and generated doc to encode the session decision-file contract and pre-Superpowers opt-out gate. Third, add behavior-level shell regression coverage for the decision-file state machine, then rerun the full targeted verification matrix and hand off to engineering review.

**Tech Stack:** Node-based skill-doc generation, Markdown skill templates, POSIX shell runtime/test scripts, shell and `node:test` contract coverage, Markdown product/runtime docs

---

## What Already Exists

- `scripts/gen-skill-docs.mjs` already owns generated preamble construction and `SKILL.md` rendering from `SKILL.md.tmpl`.
- `skills/using-superpowers/SKILL.md.tmpl` already owns the entry-router contract and artifact-state workflow-routing text.
- `skills/using-superpowers/SKILL.md` is generated and must not be edited by hand.
- `tests/codex-runtime/gen-skill-docs.unit.test.mjs` already covers nontrivial generator behavior.
- `tests/codex-runtime/skill-doc-contracts.test.mjs` already asserts preamble and workflow wording contracts for generated skills.
- `tests/codex-runtime/test-runtime-instructions.sh` already pins key runtime-facing wording and generated artifact freshness.
- `README.md`, `docs/README.codex.md`, and `docs/README.copilot.md` currently describe `using-superpowers` as the unconditional entry router and will need wording alignment.

## Planned File Structure

- Modify: `scripts/gen-skill-docs.mjs`
  Add a dedicated `using-superpowers` bootstrap preamble/resolver that is intentionally narrower than the shared base preamble.
- Modify: `skills/using-superpowers/SKILL.md.tmpl`
  Add the top-level bypass gate, explicit decision-file contract, explicit re-entry handling, malformed-state handling, and the `_SESSIONS`/ELI16 exception for the opt-out question.
- Modify generated output: `skills/using-superpowers/SKILL.md`
  Regenerated skill doc reflecting the new bootstrap and bypass gate.
- Modify: `tests/codex-runtime/gen-skill-docs.unit.test.mjs`
  Cover the dedicated `using-superpowers` bootstrap generation path.
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
  Split the old shared-preamble assumptions from the new `using-superpowers`-specific bootstrap contract and assert the new decision-state wording.
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
  Assert the new bypass gate, decision-file path, explicit state values, and pre-Superpowers question exception wording.
- Create: `tests/codex-runtime/test-using-superpowers-bypass.sh`
  Behavior-level shell regression test for `enabled`/`bypassed` state transitions, malformed files, and re-entry write failure.
- Modify: `README.md`
- Modify: `docs/README.codex.md`
- Modify: `docs/README.copilot.md`
  Update entry-router descriptions so they no longer imply unconditional takeover and briefly document the session bypass.

## Not In Scope

- Adding a new helper binary for entry-session state.
- Extending the doc-driven `using-superpowers` routing eval matrix in this PR.
- Adding a repo-scoped or global remembered bypass preference.
- Changing downstream workflow-state routing semantics outside `using-superpowers`.
- Implementing the feature during plan authoring; this plan only prepares the implementation work.

## Implementation Notes

- Use `superpowers:test-driven-development` for each code slice: red test first, verify failure, implement the minimum change, verify pass, then commit.
- Keep the runtime contract conservative: accidental bypass is worse than an extra Superpowers question.
- Keep one executable source of truth for the bypass bootstrap contract. Do not let the new shell regression test hand-reimplement the state machine independently from the generator-owned contract.
- The opt-out question is intentionally a pre-Superpowers exception to the shared `_SESSIONS`/ELI16 rule. Do not “fix” that back into the shared base preamble.
- Preserve generated-doc discipline:
  - edit only `SKILL.md.tmpl` and `scripts/gen-skill-docs.mjs`
  - regenerate `skills/using-superpowers/SKILL.md` with `node scripts/gen-skill-docs.mjs`
- Prefer extracting small reusable builder helpers in `scripts/gen-skill-docs.mjs` for the `using-superpowers` bootstrap and bypass-gate contract so unit tests, generated docs, and shell regressions can all validate the same generated output shape.
- Keep the decision-file model explicit:
  - path: `~/.superpowers/session-flags/using-superpowers/$PPID`
  - values: `enabled` or `bypassed`
  - malformed content is invalid state, not a third mode
- Before final handoff, use `superpowers:verification-before-completion` and run the targeted verification commands listed below.

## Diagrams

### Runtime Flow

```text
user message
    |
    v
using-superpowers bootstrap
    |
    +--> decision = enabled?  ------> full shared stack
    |
    +--> decision = bypassed?
    |       |
    |       +--> explicit re-entry? -> try write enabled -> full shared stack
    |       |
    |       +--> otherwise ---------> stop before normal Superpowers behavior
    |
    +--> decision missing/malformed?
            |
            +--> ask opt-out question
                    |
                    +--> enabled   -> persist enabled   -> full shared stack
                    +--> bypassed  -> persist bypassed  -> stop
```

### Change Slices

```text
Task 1: generator/bootstrap foundation
   |
   v
Task 2: using-superpowers template + generated doc + user docs
   |
   v
Task 3: behavior-level regression test + final verification
```

## Failure Modes To Preserve

| Codepath | Failure to prevent | Guardrail |
| --- | --- | --- |
| bootstrap state load | accidental silent bypass on malformed/missing state | explicit `enabled`/`bypassed` contract and fail-closed wording/tests |
| explicit re-entry | stale `bypassed` state suppresses future turns after write failure | behavior-level regression test covering current-turn success with future-turn undecided state |
| generator changes | using-superpowers accidentally regains full shared preamble behavior | generator unit tests + skill-doc contract assertions |
| behavior-level regression | shell test drifts from the generated bypass contract | generator-owned builder helpers + shell test that validates generated output/state fixtures rather than a second handwritten state machine |
| runtime docs | docs still claim unconditional entry-router takeover | README/Codex/Copilot doc updates + runtime-instructions assertions |
| generated docs | manual drift between template and generated `SKILL.md` | `node scripts/gen-skill-docs.mjs` + `--check` freshness gate |

## Task 1: Add Dedicated `using-superpowers` Bootstrap Generation

**Files:**
- Modify: `scripts/gen-skill-docs.mjs`
- Modify: `tests/codex-runtime/gen-skill-docs.unit.test.mjs`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs`

- [x] **Step 1: Add red generator/unit assertions for the special bootstrap**
```js
test('using-superpowers gets a dedicated bootstrap preamble', () => {
  const content = readUtf8(getSkillPath('using-superpowers'));
  assert.match(content, /session-flags\/using-superpowers/);
  assert.doesNotMatch(content, /touch "\$_SP_STATE_DIR\/sessions\/\$PPID"/);
  assert.doesNotMatch(content, /_CONTRIB=/);
});
```

- [ ] **Step 1a: Add red unit coverage for reusable bypass-contract builders**
```js
test('using-superpowers bypass helpers render the decision-state contract', () => {
  assert.match(buildUsingSuperpowersShellLines().join('\n'), /session-flags\/using-superpowers/);
  assert.match(buildUsingSuperpowersBypassGateSection(), /enabled/);
  assert.match(buildUsingSuperpowersBypassGateSection(), /bypassed/);
});
```

- [x] **Step 2: Run the red tests**
Run: `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs`
Expected: FAIL because `using-superpowers` still uses the shared base preamble and does not yet expose the new bootstrap contract.

- [x] **Step 3: Implement the dedicated generator path and reusable bypass helpers**
```js
export function buildUsingSuperpowersShellLines() {
  return [
    ...buildRootDetection(),
    '_SP_STATE_DIR="${SUPERPOWERS_STATE_DIR:-$HOME/.superpowers}"',
    '_SP_USING_SUPERPOWERS_DECISION_DIR="$_SP_STATE_DIR/session-flags/using-superpowers"',
    '_SP_USING_SUPERPOWERS_DECISION_PATH="$_SP_USING_SUPERPOWERS_DECISION_DIR/$PPID"',
  ];
}

export function buildUsingSuperpowersBypassGateSection() {
  return `## Bypass Gate
...
`;
}
```

- [x] **Step 4: Wire the template resolver and render path**
Update `scripts/gen-skill-docs.mjs` so `using-superpowers` can resolve its preamble through a dedicated resolver instead of the shared `BASE_PREAMBLE`, while all other non-review skills keep the current base preamble.

- [x] **Step 5: Re-run the focused generator tests**
Run: `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs`
Expected: PASS for the dedicated bootstrap contract without regressing the shared preamble checks for other skills.

- [x] **Step 6: Commit the generator/bootstrap foundation**
```bash
git add scripts/gen-skill-docs.mjs tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs
git commit -m "feat: add using-superpowers bootstrap preamble"
```

## Task 2: Encode The Bypass Gate In The Skill Template And Runtime Docs

**Files:**
- Modify: `skills/using-superpowers/SKILL.md.tmpl`
- Modify generated output: `skills/using-superpowers/SKILL.md`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Modify: `README.md`
- Modify: `docs/README.codex.md`
- Modify: `docs/README.copilot.md`
- Test: `node scripts/gen-skill-docs.mjs`
- Test: `node scripts/gen-skill-docs.mjs --check`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`

- [x] **Step 1: Add red wording assertions for the bypass gate**
```bash
require_pattern skills/using-superpowers/SKILL.md "ask one interactive question before any normal Superpowers work happens"
require_pattern skills/using-superpowers/SKILL.md "~/.superpowers/session-flags/using-superpowers/\$PPID"
require_pattern skills/using-superpowers/SKILL.md "do not compute `_SESSIONS`"
require_pattern skills/using-superpowers/SKILL.md "If the session decision file exists but contains malformed content:"
```

- [x] **Step 2: Run the red runtime-instructions check**
Run: `bash tests/codex-runtime/test-runtime-instructions.sh`
Expected: FAIL because the current generated `using-superpowers` doc and docs do not yet describe the bypass gate or the pre-Superpowers question exception.

- [x] **Step 3: Update the `using-superpowers` template**
```markdown
## Bypass Gate

Before any normal Superpowers behavior:
- if session decision is `enabled`, continue
- if session decision is `bypassed` and no explicit re-entry is requested, stop
- if explicit re-entry is requested, rewrite decision to `enabled` and continue
- if no valid decision exists, ask the opt-out question and persist `enabled` or `bypassed`
```

- [x] **Step 4: Regenerate the generated skill doc**
Run: `node scripts/gen-skill-docs.mjs`
Expected: `skills/using-superpowers/SKILL.md` matches the updated template and dedicated bootstrap preamble.

- [x] **Step 5: Align runtime-facing docs**
Update `README.md`, `docs/README.codex.md`, and `docs/README.copilot.md` so they describe `using-superpowers` as the entry router with a session-scoped bypass gate rather than an unconditional takeover surface.

- [x] **Step 6: Re-run the doc freshness and wording checks**
Run: `node scripts/gen-skill-docs.mjs --check`
Expected: PASS

Run: `bash tests/codex-runtime/test-runtime-instructions.sh`
Expected: PASS with the new bypass-gate wording and no stale unconditional-router language.

- [x] **Step 7: Commit the skill-template and doc updates**
```bash
git add \
  skills/using-superpowers/SKILL.md.tmpl \
  skills/using-superpowers/SKILL.md \
  README.md \
  docs/README.codex.md \
  docs/README.copilot.md \
  tests/codex-runtime/skill-doc-contracts.test.mjs \
  tests/codex-runtime/test-runtime-instructions.sh
git commit -m "feat: add using-superpowers bypass gate contract"
```

## Task 3: Add Behavior-Level Regression Coverage And Run Final Verification

**Files:**
- Create: `tests/codex-runtime/test-using-superpowers-bypass.sh`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `bash tests/codex-runtime/test-using-superpowers-bypass.sh`
- Test: `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`
- Test: `node scripts/gen-skill-docs.mjs --check`

- [x] **Step 1: Write the new red shell regression scaffold**
```bash
#!/usr/bin/env bash
set -euo pipefail

STATE_DIR="$(mktemp -d)"
trap 'rm -rf "$STATE_DIR"' EXIT
export SUPERPOWERS_STATE_DIR="$STATE_DIR"

# Assert:
# - no decision file yet
# - enabled state skips re-prompt
# - bypassed state suppresses normal stack
# - malformed state is ignored
# - explicit re-entry write failure honors current turn only
```

- [x] **Step 2: Run the red behavior test**
Run: `bash tests/codex-runtime/test-using-superpowers-bypass.sh`
Expected: FAIL because the decision-file bootstrap behavior is not implemented yet.

- [x] **Step 3: Implement the minimum runtime assertions needed for the new test**
Add whatever minimal script/test helpers are needed so the shell regression can validate generated `using-superpowers` output and decision-file fixtures deterministically without introducing a new helper binary or a second handwritten copy of the state machine.

The shell test should:

- render or read the generated `skills/using-superpowers/SKILL.md`
- assert that the generated output contains the expected `enabled`/`bypassed` decision contract and failure-mode wording
- exercise temp-dir state fixtures only where the generated contract explicitly describes the behavior
- avoid embedding a parallel handwritten interpretation of the full bypass algorithm

- [x] **Step 4: Re-run the focused regression test**
Run: `bash tests/codex-runtime/test-using-superpowers-bypass.sh`
Expected: PASS for:
- `enabled`
- `bypassed`
- malformed decision file
- explicit re-entry
- explicit re-entry write failure

- [x] **Step 5: Run the combined verification matrix**
Run: `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs`
Expected: PASS

Run: `bash tests/codex-runtime/test-runtime-instructions.sh`
Expected: PASS

Run: `bash tests/codex-runtime/test-using-superpowers-bypass.sh`
Expected: PASS

Run: `node scripts/gen-skill-docs.mjs --check`
Expected: PASS

- [x] **Step 6: Use verification-before-completion and prepare the review handoff**
Invoke `superpowers:verification-before-completion`, capture the verification results above, and ensure the working tree contains only the intended changes for this plan slice.

- [x] **Step 7: Commit the regression coverage and verification updates**
```bash
git add tests/codex-runtime/test-using-superpowers-bypass.sh tests/codex-runtime/test-runtime-instructions.sh tests/codex-runtime/skill-doc-contracts.test.mjs
git commit -m "test: cover using-superpowers bypass state machine"
```

- [ ] **Step 8: Hand off to engineering review**
Invoke `superpowers:plan-eng-review` with this exact approved plan path:
`docs/superpowers/plans/2026-03-21-using-superpowers-bypass.md`
