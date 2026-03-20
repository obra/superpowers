# Execution Workflow Clarity Parser Hardening Follow-Up Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use `superpowers:subagent-driven-development` when isolated-agent workflows are available in the current platform/session; otherwise use `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** superpowers:subagent-driven-development
**Source Spec:** `docs/superpowers/specs/2026-03-17-execution-workflow-clarity-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

**Goal:** Close the remaining deep-review gaps in `superpowers-plan-execution` so `status` fail-closes on malformed approved-plan headers and malformed persisted execution artifacts, not just malformed mutation inputs.

**Architecture:** Keep the helper contract and runtime surface unchanged. Tighten parse-time validation in the helper so repo-edited plans and evidence files are validated against the same canonical rules that mutation commands already enforce, then lock those cases in with red regression coverage.

**Tech Stack:** POSIX shell helper, shell regression tests

---

## What Already Exists

Historical note: this section captures the draft-time repo state before the plan was executed. For the current shipped state, use the repo contents plus `docs/superpowers/execution-evidence/2026-03-17-execution-workflow-clarity-parser-hardening-follow-up-r1-evidence.md`.

- `bin/superpowers-plan-execution` already blocks whitespace-only required mutation inputs on write.
- `tests/codex-runtime/test-superpowers-plan-execution.sh` already covers the mutation-path regressions for blank `note`, `reopen`, `transfer`, `complete --claim`, and `complete --manual-verify-summary`.
- The approved spec already says execution-note summaries are whitespace-normalized, evidence fields are non-empty and canonical, `**Files:**` entries must be normalized repo-relative paths inside the repo root, and the approved plan header contract includes `**Last Reviewed By:**`.

## Not In Scope

- Reopening the execution recommendation policy or `tasks_independent`.
- Changing the bounded JSON schema or execution fingerprint model.
- Reworking review/finish gate behavior beyond the helper parse defects found in deep review.
- Expanding this into another workflow-state architecture project.

## Task 1: Capture The Remaining Deep-Review Gaps As Red Regressions

**Files:**
- Modify: `tests/codex-runtime/test-superpowers-plan-execution.sh`
- Test: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`

- [x] **Step 1: Add a failing regression for whitespace-only execution-note summaries in repo-edited plans**
```text
Create a fixture plan with:
- `**Execution Note:** Blocked -   `

Target behavior:
- `status` fails closed as `MalformedExecutionState`
- the helper does not accept a note whose normalized summary is empty
```

- [x] **Step 2: Add failing regressions for whitespace-only persisted evidence fields**
```text
Create evidence fixtures where `status` currently succeeds even though:
- `**Claim:**` is whitespace-only
- the single `**Verification:**` bullet is whitespace-only
- `**Invalidation Reason:**` is whitespace-only on an invalidated attempt

Target behavior:
- each malformed evidence artifact fails closed as `MalformedExecutionState`
```

- [x] **Step 3: Add a failing regression for invalid persisted `**Files:**` bullets**
```text
Create evidence fixtures where `**Files:**` contains:
- a whitespace-only bullet
- a traversal path such as `../outside.md`

Target behavior:
- `status` rejects both as `MalformedExecutionState`
- persisted evidence must already be canonical repo-relative data
```

- [x] **Step 4: Add failing regressions for missing or malformed `**Last Reviewed By:**` headers**
```text
Cover both approval surfaces:
- approved plan missing `**Last Reviewed By:**`
- approved plan with malformed `**Last Reviewed By:**`
- CEO-approved source spec missing `**Last Reviewed By:**`
- CEO-approved source spec with malformed `**Last Reviewed By:**`

Target behavior:
- `status` fails closed as `PlanNotExecutionReady`
- the helper enforces the full approved artifact header contract, not a subset
```

- [x] **Step 5: Run the helper regression suite and capture the expected failures**
Run: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`
Expected: FAIL on the new malformed-state parser regressions

- [x] **Step 6: Commit the red regression coverage**
```bash
git add tests/codex-runtime/test-superpowers-plan-execution.sh
git commit -m "test: capture parser hardening regressions"
```

## Task 2: Harden Plan, Note, And Evidence Parsing

**Files:**
- Modify: `bin/superpowers-plan-execution`
- Modify: `tests/codex-runtime/test-superpowers-plan-execution.sh`
- Test: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`

- [x] **Step 1: Add shared parse-time validators for normalized text and persisted file paths**
```text
Add shared helpers for parse-time validation that:
- whitespace-normalizes candidate text
- rejects empty normalized values
- returns the normalized canonical value when valid

Use the text validator for:
- plan execution-note summaries
- persisted `**Claim:**`
- persisted `**Verification:**` bullet text
- persisted `**Invalidation Reason:**`

Use the file-path validator for persisted `**Files:**` bullets so read-time validation matches the existing canonical repo-relative path rules.
```

- [x] **Step 2: Enforce the full approved-plan header contract during load**
```text
`load_execution_state` should fail closed when:
- plan `**Last Reviewed By:**` is missing or malformed
- source spec `**Last Reviewed By:**` is missing or malformed

Validate against the existing bounded allowlists:
- plan: `writing-plans | plan-eng-review`
- spec: `brainstorming | plan-ceo-review`
```

- [x] **Step 3: Normalize and validate parsed execution notes before accepting them**
```text
`parse_plan_file` should reject:
- whitespace-only note summaries
- note summaries that only become empty after normalization

Keep the existing canonical `<State> - <summary>` rule and return `MalformedExecutionState`.
```

- [x] **Step 4: Normalize and reject blank persisted evidence text fields**
```text
During evidence parsing, validate that persisted:
- `**Claim:**`
- `**Verification:**` bullet text
- `**Invalidation Reason:**` when status is `Invalidated`

remain non-empty after whitespace normalization.
```

- [x] **Step 5: Validate persisted `**Files:**` bullets as canonical repo-relative paths**
```text
During evidence parsing, reject file bullets that:
- normalize to empty
- are absolute
- escape the repo root via traversal

Do not require current on-disk existence here; persisted history must allow deleted files and old paths, but the stored path syntax still has to be canonical and repo-relative.
```

- [x] **Step 6: Preserve the existing failure class and fail-closed behavior**
```text
Return:
- `MalformedExecutionState`

Do not silently normalize malformed persisted evidence on read.
```

- [x] **Step 7: Re-run the helper regression suite until all new parser regressions pass**
Run: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`
Expected: PASS for header, note, whitespace-only evidence, and invalid-path parser cases plus all existing helper coverage

- [x] **Step 8: Commit the parser hardening**
```bash
git add bin/superpowers-plan-execution tests/codex-runtime/test-superpowers-plan-execution.sh
git commit -m "fix: harden execution state parsing"
```

## Task 3: Final Verification And Review Handoff

Historical note: the `tests/evals/using-superpowers-routing.eval.mjs` command below predates the later doc-driven routing gate redesign. For current `using-superpowers` routing validation, use the repo-versioned markdown orchestrator/runner/judge flow under `tests/evals/using-superpowers-routing.*.md` instead of the removed `.eval.mjs` file.

**Files:**
- Modify: `bin/superpowers-plan-execution`
- Modify: `tests/codex-runtime/test-superpowers-plan-execution.sh`
- Test: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`
- Historical test: `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs tests/codex-runtime/skill-doc-generation.test.mjs tests/codex-runtime/workflow-fixtures.test.mjs tests/evals/using-superpowers-routing.eval.mjs tests/evals/interactive-question-format.eval.mjs`
- Test: `node --test tests/brainstorm-server/server.test.js tests/brainstorm-server/ws-protocol.test.js`
- Test: `bash tests/brainstorm-server/test-launch-wrappers.sh`
- Test: `node scripts/gen-skill-docs.mjs --check`
- Test: `node scripts/gen-agent-docs.mjs --check`
- Test: `git diff --check`

- [x] **Step 1: Run the full local verification suite**
Run: `bash -lc 'for test_script in tests/codex-runtime/test-*.sh; do bash "$test_script"; done'`
Expected: PASS

Historical run: `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs tests/codex-runtime/skill-doc-generation.test.mjs tests/codex-runtime/workflow-fixtures.test.mjs tests/evals/using-superpowers-routing.eval.mjs tests/evals/interactive-question-format.eval.mjs`
Historical expected: PASS at the time, with evals only skipping when their environment gate was intentionally unset

Run: `node --test tests/brainstorm-server/server.test.js tests/brainstorm-server/ws-protocol.test.js`
Expected: PASS

Run: `bash tests/brainstorm-server/test-launch-wrappers.sh`
Expected: PASS

Run: `node scripts/gen-skill-docs.mjs --check && node scripts/gen-agent-docs.mjs --check && git diff --check`
Expected: PASS

- [x] **Step 2: Request code review before any merge or branch-finish flow**
```text
Use `superpowers:requesting-code-review` after verification is green.
The review should specifically check:
- parser symmetry between mutation-time validation and status-time validation
- no accidental tightening that would reject valid deleted-file evidence history
- no stale header-contract mismatch between helper behavior and the approved spec
```
