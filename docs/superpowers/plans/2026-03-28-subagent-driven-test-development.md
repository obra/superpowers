# Subagent-Driven Test Development — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the `subagent-driven-test-development` superpowers skill — a workflow that translates approved scenario specs into RED test functions (any language/framework), validates 1:1 mapping, and commits failing tests before handing off to `subagent-driven-development` for GREEN implementation.

**Architecture:** A single SKILL.md drives a 6-step flow with two subagent prompts (Spec-to-Test Translator, Spec ↔ Test Mapping Reviewer). The skill detects language and test framework at activation time for portability. No framework-specific patterns are hard-coded.

**Tech Stack:** Superpowers skill system (SKILL.md + supporting markdown files), Claude Code Agent tool for subagent dispatch.

**Spec:** `docs/superpowers/specs/2026-03-28-subagent-driven-test-development-design.md`

**Phase 1 reference:** `docs/superpowers/plans/2026-03-28-writing-test-scenario-specs.md` (structural analog — same skill pattern)

**Worked example:** `docs/superpowers/ideas/guardrails-test-scenario-spec.md` (sample scenario spec the translator would consume)

---

## File Structure

All files live in `~/.claude/skills/subagent-driven-test-development/`:

| File | Responsibility |
|------|---------------|
| `SKILL.md` | Main skill — frontmatter, 6-step flow, hard gates, project detection, anti-pattern counters, human interaction logic |
| `spec-to-test-prompt.md` | Subagent dispatch template — reads scenario spec, generates RED test code adapted to detected framework |
| `spec-test-mapping-reviewer-prompt.md` | Subagent dispatch template — validates 1:1 coverage between spec rows and test functions |

Additionally, one existing skill needs a minor edit:

| File | Change |
|------|--------|
| `~/.claude/skills/writing-test-scenario-specs/SKILL.md` | Add handoff message naming this skill as next step (once Phase 1 skill exists) |

**Note:** The `writing-test-scenario-specs` skill may not exist yet (Phase 1 may still be in progress). If it doesn't exist, skip the handoff wiring task and document it as a follow-up.

---

## Task 1: Write the Spec-to-Test Translator subagent prompt

**Files:**
- Create: `~/.claude/skills/subagent-driven-test-development/spec-to-test-prompt.md`
- Reference: `~/.claude/skills/brainstorming/spec-document-reviewer-prompt.md` (dispatch template pattern)
- Reference: `~/.claude/skills/subagent-driven-development/implementer-prompt.md` (subagent prompt structure)
- Reference: Design spec Section 8 (Spec-to-Test Translator Subagent)

The translator reads a scenario spec and generates RED test code. It follows the dispatch template pattern — a markdown file with a prompt template containing placeholders. This is the most complex subagent prompt because it must be language-agnostic.

- [ ] **Step 1: Write the translator prompt file**

Create `~/.claude/skills/subagent-driven-test-development/spec-to-test-prompt.md`. The prompt must instruct the subagent to:

1. Read the scenario spec content (passed inline, not as a file path)
2. Read the implementation plan content (for deriving module paths and test file locations)
3. Read the detected project conventions (passed inline — language, test framework, naming patterns, categorization mechanism, directory structure, style rules)
4. Parse spec metadata (Feature, Design ref, Plan ref) for traceability comments in generated code
5. Parse Test Data section (1.0) → generate shared setup/fixtures in the framework's convention
6. Parse scenario rows (1.1–1.4) → group by Service/Unit column → one test file per service/unit
7. For each scenario row, generate a test function following these rules:
   - **Name:** Framework-appropriate test name derived from Scenario Name column
   - **Category:** Map scenario section to test category using the framework's mechanism (1.1–1.3 → unit, 1.4 → sanity/smoke, integration if Preconditions imply external deps)
   - **Description:** One-line from Scenario Name (docstring, comment, or display name per framework)
   - **Body:** Preconditions → arrange, Steps → act, Expected Result → assert. **Sanity Scenarios (1.4)** use different columns (Steps, Assertions) — translate Steps → act, Assertions → assert (no arrange step).
   - **Imports/References:** Real imports from planned module structure — not mocked
8. Where a scenario implies multiple inputs, generate data-driven test expansions using the framework's mechanism with concrete values expanded inline
9. For Sanity Scenarios (1.4), generate integration-style tests with smoke/sanity category

The prompt must include these constraints:
- Only translate what the spec describes — do not invent tests
- Imports/references must be real (from the planned module structure), not mocked
- Tests must be RED — no implementation code, no stubs, no skips
- Follow project conventions (style rules, linter config, naming patterns)
- Each test function must be traceable to its scenario row via name and description
- An unresolved import/reference is a valid RED failure — do not work around it

The prompt must include a framework adaptation guide showing how concepts map across languages:

| Concept | Python (pytest) | JavaScript (Jest) | Java (JUnit 5) | Go (testing) |
|---------|-----------------|-------------------|----------------|--------------|
| Test naming | `test_<name>` | `test("name", ...)` | `@Test void name()` | `func TestName(t *testing.T)` |
| Categorization | `@pytest.mark.unit` | `describe` blocks / tags | `@Tag("unit")` | Build tags |
| Data-driven | `@pytest.mark.parametrize` | `test.each` | `@ParameterizedTest` | Table-driven tests |
| Shared setup | `conftest.py` fixtures | `beforeAll`/`beforeEach` | `@BeforeAll`/`@BeforeEach` | `TestMain` / helpers |
| File naming | `test_<unit>.py` | `<unit>.test.ts` | `<Unit>Test.java` | `<unit>_test.go` |

Use the dispatch template pattern from `spec-document-reviewer-prompt.md`:

```markdown
# Spec-to-Test Translator Prompt Template

Use this template when dispatching a spec-to-test translator subagent.

**Purpose:** Read the scenario spec and generate RED test code for all scenario rows, adapted to the project's language and test framework.

**Dispatch during:** Step 2 of the subagent-driven-test-development skill flow.

Agent tool (general-purpose):
  description: "Translate scenario spec to RED tests"
  prompt: |
    You are a spec-to-test translator. Read the scenario spec and generate
    RED test functions that will fail until the production code is implemented.

    **Scenario spec:**
    [SCENARIO_SPEC_CONTENT — full text, not a file path]

    **Implementation plan:**
    [PLAN_CONTENT — full text, for deriving module paths]

    **Project conventions:**
    [CONVENTIONS — language, framework, naming, categorization, style rules]

    ## Your Task
    ...

    ## Framework Adaptation Guide
    [table above]

    ## Constraints
    ...

    ## Output Format

    Return all generated test files. For each file, include:
    1. Target file path (derived from plan's module structure, mirrored into test tree)
    2. Complete file content (ready to write as-is)

    Format as:
    ### File: `<target-path>`
    ```<language>
    <complete file content>
    ```
```

Include the full prompt text — the implementer should be able to use the file as-is.

- [ ] **Step 2: Validate against the guardrails example**

Read the guardrails worked example (`docs/superpowers/ideas/guardrails-test-scenario-spec.md`). Mentally trace through the translator prompt: if given the guardrails spec as input, would it produce well-structured RED test functions? Specifically check:
- Each of the 7 positive tests maps to a test function
- Each of the 6 negative tests maps to a test function
- Each of the 4 edge cases maps to a test function
- The 2 sanity scenarios use the different column format (Steps, Assertions)
- Test names are derived from Scenario Name column
- Imports reference planned module paths (not invented)
- Assertions match Expected Result column (not weaker)

- [ ] **Step 3: Commit**

```bash
git add ~/.claude/skills/subagent-driven-test-development/spec-to-test-prompt.md
git commit -m "feat: add spec-to-test translator subagent prompt"
```

---

## Task 2: Write the Spec ↔ Test Mapping Reviewer subagent prompt

**Files:**
- Create: `~/.claude/skills/subagent-driven-test-development/spec-test-mapping-reviewer-prompt.md`
- Reference: `~/.claude/skills/brainstorming/spec-document-reviewer-prompt.md` (dispatch template pattern)
- Reference: `~/.claude/skills/writing-test-scenario-specs/test-scenario-reviewer-prompt.md` (cross-reference review pattern, if it exists)
- Reference: Design spec Section 9 (Spec ↔ Test Mapping Reviewer Subagent)

The reviewer validates 1:1 coverage between scenario spec rows and generated test functions. It follows the dispatch template pattern.

- [ ] **Step 1: Write the reviewer prompt file**

Create `~/.claude/skills/subagent-driven-test-development/spec-test-mapping-reviewer-prompt.md`. The prompt must instruct the subagent to:

1. Read the scenario spec content
2. Read all generated test file contents
3. Extract all scenario rows from sections 1.1–1.4, building a checklist of scenario names
4. Extract all test functions from the generated files, mapping each to its scenario via function name and description
5. Cross-reference to produce a report with four categories:

| Category | Description |
|----------|-------------|
| **Mapped** | Scenario rows with a matching test function (brief summary) |
| **Gaps** | Scenario rows with no matching test — include draft test code in the same style as the translator output |
| **Orphans** | Test functions that don't trace to any scenario row — recommend removal |
| **Assertion check** | For each mapped pair: does the test's assertions cover the Expected Result column? Flag weak assertions |

The prompt must include these constraints:
- Approve only if: zero gaps AND zero orphans AND no weak assertions
- Gaps must include complete draft test code — not just "add a test for X"
- Orphans are flagged for removal, not silently deleted
- Stylistic feedback is not grounds for rejection

Use this output format:

```markdown
## Spec ↔ Test Mapping Review

**Status:** Approved | Issues Found

### Mapped
- [Scenario Name] → [test_function_name] in [file] ✓

### Gaps (if any)
- [Scenario Name]: no matching test found

  **Suggested test code:**
  ```<language>
  [complete test function in the same style as translator output]
  ```

### Orphans (if any)
- [test_function_name] in [file]: does not trace to any scenario row — recommend removal

### Assertion Check
- [test_function_name]: assertion covers Expected Result ✓
- [test_function_name]: ⚠️ weak assertion — spec says "[expected]" but test only checks `[weaker check]`

### Recommendations (advisory, do not block approval)
- [suggestions]
```

Include the full prompt text.

- [ ] **Step 2: Validate the review categories**

Re-read the design spec Section 9. Confirm the prompt covers all four report categories (Mapped, Gaps, Orphans, Assertion check) and that the gap format includes complete draft test code.

- [ ] **Step 3: Commit**

```bash
git add ~/.claude/skills/subagent-driven-test-development/spec-test-mapping-reviewer-prompt.md
git commit -m "feat: add spec-test mapping reviewer subagent prompt"
```

---

## Task 3: Write the main SKILL.md

**Files:**
- Create: `~/.claude/skills/subagent-driven-test-development/SKILL.md`
- Reference: `~/.claude/skills/subagent-driven-development/SKILL.md` (flow pattern with subagent dispatch + review loops)
- Reference: `~/.claude/skills/brainstorming/SKILL.md` (checklist + hard gate + flow diagram pattern)
- Reference: Design spec Sections 6, 7, 10, 11, 12 (project detection, flow, TDD discipline, anti-patterns)

This is the core file. It defines project detection, the 6-step flow, hard gates, anti-pattern counters, and subagent dispatch instructions.

- [ ] **Step 1: Write the SKILL.md skeleton with frontmatter and overview**

Create `~/.claude/skills/subagent-driven-test-development/SKILL.md` with:

```yaml
---
name: subagent-driven-test-development
description: >
  Use after writing-test-scenario-specs produces an approved scenario spec
  and BEFORE implementation begins. Translates scenario rows into RED test
  functions (any language/framework), validates 1:1 mapping, and commits
  failing tests. Hands off to subagent-driven-development for GREEN
  implementation.
---
```

Add an overview section explaining:
- What this skill does (translates scenario specs into RED test code, validates mapping, commits)
- Where it sits in the workflow (after writing-test-scenario-specs, before subagent-driven-development)
- What it produces (RED test files — not implementation code)

- [ ] **Step 2: Add the hard gate**

Add a `<HARD-GATE>` block:

```markdown
<HARD-GATE>
Do NOT write production/implementation code, invoke subagent-driven-development,
or make any test pass. This skill produces RED (failing) test functions only.
GREEN implementation is handled by subagent-driven-development after this skill
completes.
</HARD-GATE>
```

- [ ] **Step 3: Add the checklist**

Add a numbered checklist of the 6 steps (matches design spec Section 7):

1. Collect inputs — confirm or request spec and plan paths, detect project conventions
2. Generate test code — dispatch Spec-to-Test Translator subagent
3. Coarse approval — present generated tests in chat, iterate with human
4. Write test files — write to derived paths after human confirmation
5. Mapping review — dispatch Spec ↔ Test Mapping Reviewer, handle gaps
6. Commit & handoff — verify RED, commit, announce subagent-driven-development

- [ ] **Step 4: Add the project detection section**

Add the project detection logic from design spec Section 6. At activation (Step 1), the skill detects:
- Language and test framework (from build/dependency files)
- Test naming patterns (from existing test files)
- Test categorization mechanism (from framework config)
- Test directory structure (from existing layout)
- Style rules (from linter/formatter config)

Include the framework adaptation table from the design spec.

- [ ] **Step 5: Add the flow diagram**

Add a `dot` (graphviz) flow diagram showing the 6 steps with decision points:
- Step 1: "Paths from handoff?" → yes: confirm / no: ask human
- Step 2: Dispatch translator
- Step 3: "Human approves?" → no: iterate / yes: proceed
- Step 4: Write files
- Step 5: "Reviewer approves?" → issues found: present to human, loop / approved: proceed. "Max iterations?" → exceeded: surface to human
- Step 6: Verify RED → commit → announce handoff

- [ ] **Step 6: Add detailed step instructions**

Write detailed instructions for each of the 6 steps:

**Step 1 — Collect inputs:**
- Check if scenario spec and plan paths are in conversation context from prior handoff
- If yes, confirm: "I see the scenario spec at `<path>` and plan at `<path>`. Correct?"
- If no, ask the human for both paths
- Detect project conventions: read `CLAUDE.md`, build files, test framework config, existing test structure
- Summarize detected conventions to human: "Detected: [language] with [framework], tests in `[dir]`, naming pattern `[pattern]`"

**Step 2 — Generate test code:**
- Read the `spec-to-test-prompt.md` template
- Fill placeholders: scenario spec content (read and paste inline), plan content (read and paste inline), detected conventions
- Dispatch as Agent tool (general-purpose) subagent
- Receive generated test files

**Step 3 — Coarse approval:**
- Present each generated test file as a fenced code block with its target path
- Ask: "Review the generated tests. Change anything — names, assertions, data-driven expansions, file organization — or say 'looks good' to proceed."
- If human requests changes, apply them and re-present
- Iterate until human approves

**Step 4 — Write test files:**
- Confirm target paths with human one final time
- Write each test file to its target path
- Create shared setup files (fixtures, test data) from spec section 1.0
- Create any framework-required boilerplate files for new directories

**Step 5 — Mapping review:**
- Read the `spec-test-mapping-reviewer-prompt.md` template
- Fill placeholders: scenario spec content, all generated test file contents
- Dispatch as Agent tool (general-purpose) subagent
- If Approved: proceed to Step 6
- If Issues Found:
  - Present each issue (gap, orphan, weak assertion) to human
  - For gaps: show the reviewer's draft test code, ask human to accept/modify/reject
  - For orphans: ask human to confirm removal or justify keeping
  - For weak assertions: ask human to approve stronger assertion
  - Update test files with accepted changes
  - Re-dispatch reviewer (max 3 iterations)
  - If still issues after 3 rounds: surface to human with full report, let them decide

**Step 6 — Commit & handoff:**
- Run the test suite (or compiler for compiled languages) to verify all new tests are RED
- If any test passes unexpectedly: flag it — either the test is wrong or production code already exists
- Commit all test files (including shared setup and boilerplate)
- Announce: "RED tests committed. Next step: invoke `superpowers:subagent-driven-development` to implement GREEN."
- Include the scenario spec path and plan path in the handoff message

- [ ] **Step 7: Add the TDD discipline section**

Add the TDD discipline section from design spec Section 11:
- Tests are literal translations — real imports, real calls, real assertions
- Unresolved imports are the first valid failure
- No stubs, no mocks, no skips
- No implementation code
- Verified RED before commit
- Note on compiled languages: non-compiling code IS the RED state

- [ ] **Step 8: Add the anti-patterns table**

Add the anti-patterns from design spec Section 12:

| Rationalization | Counter |
|-----------------|---------|
| "The spec is clear enough, skip the translator" | Translator enforces consistent structure, naming, traceability. |
| "Let me write the implementation too so tests go GREEN" | RED tests only. GREEN is subagent-driven-development's job. |
| "These tests are trivial, no need for mapping review" | Trivial tests are where gaps hide. Run the reviewer. |
| "I'll add a few extra tests the spec didn't mention" | No invention. Spec gap → fix in Phase 1. |
| "Unresolved import isn't a real test failure" | It is. TDD starts with the first failure. |
| "Let me stub out the modules so tests fail on assertions instead" | Stubs pre-decide structure. Let tests drive implementation. |
| "Skip the coarse approval, just write the files" | Human must see code before it's written. Non-negotiable. |
| "The design doc says X but the spec doesn't cover it" | Spec is the source of truth. Fix gaps in Phase 1. |

- [ ] **Step 9: Verify SKILL.md completeness**

Read the completed SKILL.md end-to-end. Verify:
- Frontmatter has `name` and `description` only
- Description starts with "Use after..."
- Hard gate is present and prevents implementation code
- Project detection section covers language/framework detection
- All 6 steps are documented with subagent dispatch instructions
- Subagent prompt file names match the actual files created in Tasks 1 and 2 (`spec-to-test-prompt.md`, `spec-test-mapping-reviewer-prompt.md`)
- Anti-patterns table is present
- Flow diagram matches the step descriptions
- TDD discipline section covers compiled language handling
- No framework-specific patterns are hard-coded (everything flows from detection)

- [ ] **Step 10: Commit**

```bash
git add ~/.claude/skills/subagent-driven-test-development/SKILL.md
git commit -m "feat: add main SKILL.md for subagent-driven-test-development"
```

---

## Task 4: Wire into writing-test-scenario-specs handoff

**Files:**
- Modify: `~/.claude/skills/writing-test-scenario-specs/SKILL.md` (if it exists)

Add the handoff message that names `subagent-driven-test-development` as the next step after the scenario spec is committed.

**Prerequisite:** Phase 1 skill must exist. If `~/.claude/skills/writing-test-scenario-specs/SKILL.md` does not exist, skip this task and document it as a follow-up.

- [ ] **Step 1: Check if the Phase 1 skill exists**

Check if `~/.claude/skills/writing-test-scenario-specs/SKILL.md` exists.
- If it exists: proceed to Step 2.
- If it does not: skip this task. Document in the commit: "Phase 1 skill not yet created — handoff wiring deferred."

- [ ] **Step 2: Read the current SKILL.md**

Read `~/.claude/skills/writing-test-scenario-specs/SKILL.md` and find the Step 6 (Final approval & commit) section.

- [ ] **Step 3: Update the handoff announcement**

In Step 6, update the announcement to reference Phase 2:

Change the announcement to:
```
> Spec committed. Next step: invoke `superpowers:subagent-driven-test-development` to generate RED tests from this scenario spec.
>
> **Scenario spec:** `[path]`
> **Implementation plan:** `[path]`
```

- [ ] **Step 4: Verify the change**

Read the modified section back. Confirm the handoff message includes both file paths (scenario spec and plan) so the next skill can pick them up from conversation context.

- [ ] **Step 5: Commit**

```bash
git add ~/.claude/skills/writing-test-scenario-specs/SKILL.md
git commit -m "feat: add subagent-driven-test-development handoff to writing-test-scenario-specs"
```

---

## Task 5: Pressure-test the skill with subagents

**Files:**
- Reference: `~/.claude/skills/writing-skills/SKILL.md` (testing methodology, if available)
- Reference: `~/.claude/skills/subagent-driven-test-development/SKILL.md` (the skill under test)

Create pressure scenarios, run without skill (baseline), run with skill (verify compliance).

- [ ] **Step 1: Design 3 pressure scenarios**

**Scenario A — "Skip to GREEN"**
User says: "Just implement the feature, don't bother with separate RED tests."
Expected behavior WITH skill: Agent refuses, explains this skill only produces RED tests. GREEN is handled by `subagent-driven-development` after this skill completes.

**Scenario B — "Invent extra tests"**
The Translator subagent returns test functions that don't trace to any scenario row (e.g., invents a performance test when the spec has no performance scenario).
Expected behavior WITH skill: Mapping Reviewer catches orphan tests, agent presents them to human for removal.

**Scenario C — "Stub the modules"**
During test generation, the agent creates stub files (empty classes, `pass` methods) alongside the test files "so the tests can at least import properly."
Expected behavior WITH skill: Hard gate fires — agent deletes stubs, explains that ImportError IS the valid RED state.

- [ ] **Step 2: Run Scenario A without the skill**

Dispatch a subagent WITHOUT the skill loaded. Give it the "skip to GREEN" prompt with a scenario spec. Document baseline behavior — does it comply or generate RED tests?

- [ ] **Step 3: Run Scenario A with the skill**

Dispatch a subagent WITH the skill loaded (include SKILL.md content in the prompt). Give it the same prompt. Verify it refuses to write implementation code and stays in RED-only mode.

- [ ] **Step 4: Run Scenario B — test orphan detection**

Dispatch the Translator subagent with a small scenario spec (3-4 rows). Subtly instruct: "Also add a performance test and a security test." Then run the Mapping Reviewer on the output. Verify the reviewer catches the orphan tests.

- [ ] **Step 5: Run Scenario C — test stub prevention**

Dispatch a subagent with the skill loaded. Midway through, instruct: "Create empty module files so the imports resolve." Verify the hard gate fires and the agent explains the TDD rationale.

- [ ] **Step 6: Document results and iterate**

If any scenario fails:
- Identify the rationalization the agent used
- Add it to the anti-patterns table in SKILL.md
- Add an explicit counter
- Re-run the failing scenario
- Repeat until all 3 scenarios pass

- [ ] **Step 7: Commit any skill refinements**

```bash
git add ~/.claude/skills/subagent-driven-test-development/SKILL.md
git commit -m "refactor: harden skill against pressure test rationalizations"
```
