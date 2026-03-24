# Superpowers Test Suite Enhancement Plan

Working plan derived from the current Superpowers suite, the `gstack` comparison, and the fixture decoupling fix that moved historical workflow examples into `tests/codex-runtime/fixtures/workflow-artifacts/`.

Historical note: this document is implementation-planning provenance, not the authoritative command list for current validation. The active deterministic suite and recommended commands now live in `docs/testing.md`. References below have been updated to the current Rust and Node contract gates so the plan does not point at removed shell harnesses as if they were still active.

Historical note: Task 5's original `using-superpowers` routing-eval shape was later superseded by the doc-driven routing gate in `tests/evals/using-superpowers-routing.orchestrator.md`, `tests/evals/using-superpowers-routing.scenarios.md`, `tests/evals/using-superpowers-routing.runner.md`, and `tests/evals/using-superpowers-routing.judge.md`. The retired `tests/evals/using-superpowers-routing.eval.mjs` file referenced below has been removed.

## Completed Precondition

- [x] Move historical workflow artifact examples out of `docs/superpowers/` and into `tests/codex-runtime/fixtures/workflow-artifacts/`
- [x] Update `tests/codex-runtime/test-workflow-sequencing.sh` to read the local fixtures
- [x] Document the fixture location in `docs/testing.md`

## Goal

Improve Superpowers test coverage for generated skill docs, template assertions, and broader workflow quality while keeping the active deterministic Rust and Node contract suites as the end-to-end contract layer.

## Constraints

- Prefer built-in tooling already present in the repo
- Keep deterministic tests separate from opt-in evals
- Avoid coupling tests to mutable repo-root docs when a local fixture is enough
- Preserve the current deterministic contract split: Rust integration suites for runtime behavior and Node tests for generated-doc and fixture contracts

## Task 1: Add Deterministic Node Tests For Generated Skill Docs

**Files:**
- Create: `tests/codex-runtime/skill-doc-generation.test.mjs`
- Create: `tests/codex-runtime/helpers/markdown-test-helpers.mjs`
- Modify: `docs/testing.md`

- [ ] **Step 1: Write a failing Node test for generator output structure**
- [x] **Step 1: Write a failing Node test for generator output structure**

Run: `node --test tests/codex-runtime/skill-doc-generation.test.mjs`

Expected: FAIL because the new test file does not exist yet.

- [ ] **Step 2: Implement minimal markdown helpers**
- [x] **Step 2: Implement minimal markdown helpers**

Add helpers that can:
- list skill directories under `skills/`
- read frontmatter fields from `SKILL.md`
- detect unresolved `{{PLACEHOLDER}}` tokens
- extract the generated header and named markdown sections

- [ ] **Step 3: Add deterministic assertions modeled on the strongest `gstack` checks**
- [x] **Step 3: Add deterministic assertions modeled on the strongest `gstack` checks**

Cover:
- every skill directory with `SKILL.md.tmpl` also has a generated `SKILL.md`
- every generated `SKILL.md` has valid frontmatter with `name` and `description`
- every generated `SKILL.md` has the auto-generated header and regenerate command
- no generated `SKILL.md` contains unresolved placeholders
- `node scripts/gen-skill-docs.mjs --check` exits `0`

- [ ] **Step 4: Verify the new deterministic layer and the existing shell gate both pass**
- [x] **Step 4: Verify the new deterministic layer and the existing shell gate both pass**

Run:
- `node --test tests/codex-runtime/skill-doc-generation.test.mjs`
- `cargo nextest run --test runtime_instruction_contracts`

Expected: PASS

## Task 2: Add Semantic Template And Skill Assertions

**Files:**
- Create: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`

- [ ] **Step 1: Write a failing Node test for semantic preamble contracts**
- [x] **Step 1: Write a failing Node test for semantic preamble contracts**

Run: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`

Expected: FAIL because the new semantic contract test does not exist yet.

- [ ] **Step 2: Add semantic assertions that replace the most brittle grep-only checks**
- [x] **Step 2: Add semantic assertions that replace the most brittle grep-only checks**

Cover:
- base vs review preamble usage derived from `SKILL.md.tmpl`
- generated preamble shell block contains `_IS_SUPERPOWERS_RUNTIME_ROOT`, `_SESSIONS`, and contributor-mode state
- review skills include `_TODOS_FORMAT` and `## Agent Grounding`
- interactive-question contract exists once per generated skill in normalized form
- fixture-backed workflow examples only validate header contracts, not full historical documents

- [ ] **Step 3: Trim legacy duplication where the Rust or Node tests are a better fit**
- [x] **Step 3: Trim legacy duplication where the Rust or Node tests are a better fit**

Keep shell coverage only for:
- helper binary behavior
- script exit codes
- doc references that are easiest to validate with `rg`

- [ ] **Step 4: Verify the semantic suite plus the sequencing contract**
- [x] **Step 4: Verify the semantic suite plus the sequencing contract**

Run:
- `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`
- `cargo nextest run --test runtime_instruction_contracts`

Expected: PASS

## Task 3: Add Generator-Focused Unit Coverage For `scripts/gen-skill-docs.mjs`

**Files:**
- Create: `tests/codex-runtime/gen-skill-docs.unit.test.mjs`
- Modify: `scripts/gen-skill-docs.mjs`

- [ ] **Step 1: Write a failing unit test around isolated generator behavior**
- [x] **Step 1: Write a failing unit test around isolated generator behavior**

Test cases:
- generated header inserts after YAML frontmatter
- unknown placeholders throw
- unresolved placeholders throw
- generated files end with a trailing newline

Run: `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs`

Expected: FAIL until the generator exposes a testable surface.

- [ ] **Step 2: Extract minimal pure helpers from `scripts/gen-skill-docs.mjs`**
- [x] **Step 2: Extract minimal pure helpers from `scripts/gen-skill-docs.mjs`**

Export only the pieces needed for unit tests, for example:
- `insertGeneratedHeader`
- `renderTemplate`
- preamble builders

Keep the CLI entrypoint behavior unchanged.

- [ ] **Step 3: Re-run the unit suite and the dry-run contract**
- [x] **Step 3: Re-run the unit suite and the dry-run contract**

Run:
- `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs`
- `node scripts/gen-skill-docs.mjs --check`

Expected: PASS

## Task 4: Add Fixture-Driven Regression Coverage For Historical Workflow Contracts

**Files:**
- Modify: `tests/codex-runtime/fixtures/workflow-artifacts/README.md`
- Create: `tests/codex-runtime/workflow-fixtures.test.mjs`

- [ ] **Step 1: Write a failing regression test for fixture completeness**
- [x] **Step 1: Write a failing regression test for fixture completeness**

Run: `node --test tests/codex-runtime/workflow-fixtures.test.mjs`

Expected: FAIL because the test file does not exist yet.

- [ ] **Step 2: Assert fixture intent explicitly**
- [x] **Step 2: Assert fixture intent explicitly**

Cover:
- all six fixture files exist
- each spec fixture includes the three required workflow headers
- each plan fixture includes the four required workflow headers
- the fixture README documents provenance from `108c0e8` / deletion in `ce106d0`

- [ ] **Step 3: Verify fixtures stay local to the test surface**
- [x] **Step 3: Verify fixtures stay local to the test surface**

Add an assertion that runtime sequencing coverage reads from `tests/codex-runtime/fixtures/workflow-artifacts/` instead of `docs/superpowers/`.

- [ ] **Step 4: Run the fixture regression suite and shell sequencing gate**
- [x] **Step 4: Run the fixture regression suite and shell sequencing gate**

Run:
- `node --test tests/codex-runtime/workflow-fixtures.test.mjs`
- `cargo nextest run --test runtime_instruction_contracts`

Expected: PASS

## Task 5: Add An Opt-In Eval Tier After Deterministic Coverage Is Stable

Historical note: the `using-superpowers` routing portion of this task was later replaced by the doc-driven routing gate described above. The remaining `.eval.mjs` work in this task still reflects the opt-in Node-based eval tier. Any file or focus bullet below that names `using-superpowers-routing.eval.mjs` is preserved as historical provenance, not as current implementation guidance.

**Files:**
- Historical: `tests/evals/using-superpowers-routing.eval.mjs` was the original planned routing-eval file before the doc-driven replacement
- Create: `tests/evals/interactive-question-format.eval.mjs`
- Create: `tests/evals/README.md`
- Modify: `docs/testing.md`

- [ ] **Step 1: Keep the Node-based eval tier opt-in and separate from CI-like local validation**
- [x] **Step 1: Keep the Node-based eval tier opt-in and separate from CI-like local validation**

Gate the remaining Node-based `.eval.mjs` tier on an env var such as `EVALS=1` plus required API credentials.

- [ ] **Step 2: Add a narrow first eval slice**
- [x] **Step 2: Add a narrow first eval slice**

Focus on high-risk prompt behavior:
- Historical routing target: `using-superpowers` routes to the earlier safe stage when artifacts are malformed
- interactive-question prompts preserve context, recommendation, and option formatting

- [ ] **Step 3: Add lightweight observability**
- [x] **Step 3: Add lightweight observability**

Record:
- prompt name
- pass/fail
- transcript or judge summary
- elapsed time
- approximate cost when available

- [ ] **Step 4: Document the Node-based eval contract separately from deterministic tests**
- [x] **Step 4: Document the Node-based eval contract separately from deterministic tests**

Run:
- deterministic suites by default from `docs/testing.md`
- Node-based `.eval.mjs` suites only when explicitly requested
- required change-specific routing coverage through the separate doc-driven routing gate when that surface is in scope

Expected: deterministic validation remains fast and stable; the remaining Node-based evals provide a second quality tier without blocking routine edits.

## Recommended Execution Order

1. Task 1
2. Task 2
3. Task 3
4. Task 4
5. Task 5

## Success Criteria

- A deleted documentation example can no longer silently break runtime tests
- Generated skill-doc coverage includes semantic assertions, not just string presence checks
- `scripts/gen-skill-docs.mjs` has direct unit coverage for its nontrivial logic
- Shell suites remain focused on true runtime-helper behavior
- Superpowers gains an optional higher-level eval tier similar in spirit to `gstack`, without making routine validation expensive
