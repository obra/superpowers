# Subagent-Driven Test Development — Design Spec

**Date:** 2026-03-28
**Status:** Draft
**Author:** doc_pk
**PRD:** [prd-scenario-driven-testing.md](../ideas/prd-scenario-driven-testing.md)
**Phase 1:** [writing-test-scenario-specs-design.md](2026-03-28-writing-test-scenario-specs-design.md)

## 1. Problem

Phase 1 (`writing-test-scenario-specs`) produces a human-authored scenario spec — structured acceptance criteria in markdown tables. But the spec is not code. Translating scenario rows into test functions by hand is tedious, error-prone, and inconsistent. Humans skip data-driven expansions, forget test categories, and drift from the spec's intent.

The gap: a validated scenario spec exists, but no automated bridge turns it into RED tests that enforce the spec as executable acceptance criteria.

## 2. Solution

A new skill (`subagent-driven-test-development`) that translates an approved scenario spec into RED test functions via a Translator subagent, validates 1:1 coverage via a Mapping Reviewer subagent, and commits failing tests. The human approves generated code before anything is written.

The skill produces RED tests — not GREEN. Implementation is a separate concern handled by `subagent-driven-development`.

## 3. Goals

- Every scenario row becomes an executable, failing test function
- 1:1 traceability between spec rows and test functions
- Human reviews and approves generated code before commit
- Tests follow project conventions (categories, fixtures, style) automatically
- Skill is portable — adapts to any language and test framework by reading project conventions at activation time

## 4. Non-Goals

- Implementing production code to make tests GREEN (that's `subagent-driven-development`)
- Modifying the scenario spec (go back to Phase 1 for spec changes)
- Re-validating the spec against design doc or implementation plan (Phase 1 already did this)
- Replacing existing unit/integration tests
- Inventing tests beyond what the spec describes

## 5. Workflow Position

```
brainstorming → writing-plans → writing-test-scenario-specs → **subagent-driven-test-development** → subagent-driven-development → finishing-a-development-branch
```

### Integration with existing skills

| Skill | Change |
|-------|--------|
| `writing-test-scenario-specs` | Add to handoff message: "Next: generate RED tests with `superpowers:subagent-driven-test-development`" |
| `subagent-driven-development` | Already has soft precondition check for scenario spec — no change needed |
| `test-driven-development` | No change — this skill replaces TDD's RED phase when a scenario spec exists. Standalone TDD skill remains for ad-hoc work without specs. |
| `writing-plans` | No change |
| `brainstorming` | No change |

### Linkage pattern

Follows the existing convention: each skill names its successor in its output text. The human explicitly invokes the next skill. No programmatic coupling between skills.

## 6. Project Detection

At activation time (Step 1), the skill detects the project's language and test framework by reading:

- `CLAUDE.md` / project configuration files
- Build/dependency files (`pyproject.toml`, `package.json`, `pom.xml`, `build.gradle`, `Cargo.toml`, `go.mod`, etc.)
- Test framework configuration (pytest config, Jest config, JUnit setup, Go test conventions, etc.)
- Existing test directory structure and naming patterns

This detection informs all downstream decisions: test file naming, directory structure, import style, assertion syntax, test categorization mechanism, data-driven test expansion syntax, and shared setup/fixture patterns.

**Examples of framework-specific adaptation:**

| Concept | Python (pytest) | JavaScript (Jest) | Java (JUnit 5) | Go (testing) |
|---------|-----------------|-------------------|----------------|--------------|
| Test function naming | `test_<name>` | `test("name", ...)` or `it("name", ...)` | `@Test void name()` | `func TestName(t *testing.T)` |
| Test categorization | `@pytest.mark.unit` | `describe` blocks / tags | `@Tag("unit")` | Build tags |
| Data-driven expansion | `@pytest.mark.parametrize` | `test.each` | `@ParameterizedTest` | Table-driven tests |
| Shared setup | `conftest.py` fixtures | `beforeAll`/`beforeEach` | `@BeforeAll`/`@BeforeEach` | `TestMain` / helper functions |
| Unresolved import failure | `ImportError` | `Cannot find module` | `ClassNotFoundException` | Compile error |
| File naming | `test_<unit>.py` | `<unit>.test.ts` | `<Unit>Test.java` | `<unit>_test.go` |

The skill MUST NOT hard-code any framework-specific patterns. All framework-specific behavior flows from what is detected in Step 1.

## 7. Skill Flow

### Step 1 — Collect inputs

Check if scenario spec path and implementation plan path are available from prior handoff. If yes, confirm with the human. If no (skill invoked in a fresh session), ask the human for the paths. Read the project's `CLAUDE.md`, build/dependency files, test framework configuration, and existing test structure to detect language, framework, and conventions.

### Step 2 — Generate test code

Dispatch the **Spec-to-Test Translator** subagent with: scenario spec content (full text, not file path), implementation plan content (for deriving test file paths), and detected project conventions (language, framework, naming patterns, categorization mechanism, directory structure). Translator returns all generated test files as a single output.

### Step 3 — Coarse approval

Present the generated test code in the conversation as fenced code blocks, organized by file. Human says "change X, move Y, expand data-driven cases for Z." Iterate until the human says it looks right.

### Step 4 — Write test files

Write approved test files to the derived paths (confirmed by human in Step 3). Create any needed shared setup files (e.g., `conftest.py`, test utilities, shared fixtures) from the Test Data section (1.0). Create any framework-required boilerplate files for new test directories.

### Step 5 — Mapping review

Dispatch the **Spec ↔ Test Mapping Reviewer** subagent with: scenario spec file content + generated test file contents. Reviewer validates 1:1 coverage — every scenario row has a test, every test traces to a scenario row. Present findings to human. If gaps found: human accepts/modifies/rejects suggestions → update files → re-dispatch reviewer (max 3 iterations, then surface to human).

### Step 6 — Commit & handoff

Run the test suite (or compiler for compiled languages) to confirm all new tests are RED (failing). Commit all test files (including shared setup files and boilerplate created in Step 4). Announce next step: invoke `subagent-driven-development` to implement GREEN.

## 8. Spec-to-Test Translator Subagent

**Purpose:** Read the scenario spec and generate RED test code for all scenario rows, adapted to the project's language and test framework.

**Inputs:**
- Scenario spec content (full text — sections 1.0 through 1.4)
- Implementation plan content (for deriving module paths and test file locations)
- Detected project conventions (language, test framework, naming patterns, categorization mechanism, file structure, style rules)

**Behavior:**

1. Parse the spec metadata (Feature, Design ref, Plan ref) for traceability comments
2. Parse Test Data section (1.0) → generate shared setup/fixtures in the framework's convention (e.g., `conftest.py` for pytest, `beforeAll` blocks for Jest, `@BeforeAll` methods for JUnit)
3. Parse scenario rows (1.1–1.4) → group by Service/Unit column → one test file per service/unit
4. For each scenario row, generate a test function:
   - **Name:** Framework-appropriate test name derived from Scenario Name column (e.g., `test_<snake_case>` for Python, `camelCase` for Java, `TestPascalCase` for Go)
   - **Category:** Map scenario section to test category using the framework's mechanism: sections 1.1–1.3 → unit category, section 1.4 → sanity/smoke category. Use integration category if Preconditions imply external dependencies.
   - **Description:** One-line description from Scenario Name (docstring, comment, or display name per framework convention)
   - **Body:** Translate Preconditions → arrange, Steps → act, Expected Result → assert. **Note:** Sanity Scenarios (1.4) use different columns (`Steps`, `Assertions`) — translate Steps → act, Assertions → assert (no Preconditions/arrange step).
   - **Imports/References:** Real imports derived from Reference Models column and Service/Unit column, using module paths from the implementation plan
5. Where a scenario implies multiple inputs (e.g., "invalid types: None, empty string, numeric"), generate data-driven test expansions using the framework's mechanism (e.g., `@pytest.mark.parametrize`, `test.each`, `@ParameterizedTest`, table-driven tests) with concrete values expanded inline
6. For Sanity Scenarios (1.4), generate integration-style tests with the appropriate smoke/sanity category. These rows have `Steps` and `Assertions` columns (not the full 7-column format of 1.1–1.3).

**Constraints:**
- Only translate what the spec describes — do not invent tests
- Imports/references must be real (from the planned module structure), not mocked
- Tests must be RED — no implementation code, no stubs, no skips
- Follow project conventions (style rules, linter config, naming patterns)
- Each test function must be traceable to its scenario row via name and description
- An unresolved import/reference is a valid RED failure — do not work around it

**Output:** All generated test files with their target paths, returned to the main skill for presentation.

## 9. Spec ↔ Test Mapping Reviewer Subagent

**Purpose:** Validate that the generated tests have 1:1 coverage with the scenario spec. No gaps, no orphans.

**Inputs:**
- Scenario spec file content
- Generated test file contents (all files)

**Behavior:**

1. Extract all scenario rows from the spec (sections 1.1–1.4), building a checklist of scenario names
2. Extract all test functions from the generated files, mapping each to its scenario via function name and description
3. Cross-reference to produce a report

**Report format:**

| Category | Description |
|----------|-------------|
| **Mapped** | Scenario rows with a matching test function (brief summary) |
| **Gaps** | Scenario rows with no matching test — includes draft test code the human can accept/modify/reject |
| **Orphans** | Test functions that don't trace to any scenario row — recommend removal unless human justifies |
| **Assertion check** | For each mapped pair: does the test's assertions cover the Expected Result column? Flag weak assertions (e.g., `assert result is not None` when the spec says "returns `GuardrailResult(passed=True)`") |

**Constraints:**
- Approve only if: zero gaps AND zero orphans AND no weak assertions
- Gaps must include draft test code in the same style as the translator output
- Orphans are flagged for removal, not silently deleted
- Stylistic feedback is not grounds for rejection

**Loop:** Main skill presents findings → human accepts/modifies/rejects → update test files → re-dispatch reviewer → repeat until approved (max 3 iterations, then surface to human).

## 10. Test File Organization

### Grouping strategy

Test files are grouped by **Service/Unit** (the column in scenario rows), not by scenario section. Each service/unit gets one test file containing its positive, negative, and edge case tests.

### File naming

Framework-appropriate naming derived from the Service/Unit column:
- Python: `test_<snake_case_service_unit>.py`
- JavaScript/TypeScript: `<service-unit>.test.ts`
- Java: `<ServiceUnit>Test.java`
- Go: `<service_unit>_test.go`
- Other: detected from existing test files in the project

### Path derivation

1. Read the implementation plan to identify planned module paths
2. Mirror into the test tree using the project's existing test directory structure
3. Present proposed paths to the human for confirmation before writing
4. If the plan doesn't specify module paths, ask the human

### Shared setup

Test Data section (1.0) generates shared setup in the framework's convention, placed according to the project's test directory structure. Named fixtures/data sets map to Data Set Name column entries.

## 11. TDD Discipline

This skill enforces strict TDD RED phase:

- **Tests are literal translations** of the scenario spec — real imports, real method calls, real assertions
- **Unresolved imports are the first valid failure** — they drive the implementer to create modules (e.g., `ImportError` in Python, compile error in Go/Java, `Cannot find module` in JS)
- **No stubs, no mocks, no skips** — tests reference the planned production API as-is
- **No implementation code** — the skill never writes production code or module skeletons
- **Verified RED before commit** — Step 6 runs the test suite to confirm all new tests fail

The GREEN phase is handled by `subagent-driven-development`, which takes the committed RED tests and implements production code to make them pass.

**Note on compiled languages:** In Go, Java, and other compiled languages, RED means the code does not compile because the referenced types/functions don't exist yet. This is the equivalent of Python's `ImportError` — it's the first valid failure that drives implementation. The skill commits the test files even though they don't compile; the implementation phase creates the production code to make them compile and pass.

## 12. Anti-Patterns

Rationalizations the skill must counter:

| Rationalization | Counter |
|-----------------|---------|
| "The spec is clear enough, skip the translator" | The translator enforces consistent structure, naming, and traceability. Human-written tests drift from the spec. |
| "Let me write the implementation too so tests go GREEN" | This skill produces RED tests only. GREEN is `subagent-driven-development`'s job. |
| "These tests are trivial, no need for mapping review" | Trivial tests are where gaps hide. Run the reviewer. |
| "I'll add a few extra tests the spec didn't mention" | No invention. If tests are missing, the spec has a gap — go back to Phase 1. |
| "Unresolved import isn't a real test failure" | It is. TDD starts with the first failure. Unresolved imports drive module creation. |
| "Let me stub out the modules so tests fail on assertions instead" | Stubs pre-decide structure. Let the tests drive the implementation. |
| "Skip the coarse approval, just write the files" | Human must see generated code before it's written. Non-negotiable. |
| "The design doc says X but the spec doesn't cover it" | Spec is the source of truth. If coverage is missing, fix the spec in Phase 1. |

## 13. Skill Directory Structure

```
~/.claude/skills/subagent-driven-test-development/
├── SKILL.md                              # Main skill — flow, gates, human interaction
├── spec-to-test-prompt.md                # Subagent: scenario spec → RED test code
└── spec-test-mapping-reviewer-prompt.md  # Subagent: validate 1:1 spec ↔ test coverage
```

**Frontmatter:**
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

**Test file output location:** Project's test directory, mirroring the planned module structure. Paths confirmed by human before writing.

## 14. Success Criteria

| Metric | Target |
|--------|--------|
| Every scenario row has a matching test function | 100% |
| Every test function traces to a scenario row | 100% (no orphans) |
| Test names derived from scenario names | 100% |
| Expected Results appear as real assertions | 100% (no weak assertions) |
| Tests follow project conventions | 100% (categories, fixtures, style) |
| All tests RED before commit | 100% (verified by running test suite) |
| Human approves generated code before file write | Always |
| Skill works across languages and test frameworks | Yes (detects conventions at activation) |

## 15. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Language support | Framework-agnostic — detect at activation | Skill concepts (RED tests, 1:1 mapping, grouping by unit) are universal; only syntax varies |
| Translation approach | Literal — real imports, real calls, real assertions | TDD best practice: test defines the API, unresolved import is the first valid failure |
| File grouping | By Service/Unit column | Matches how most test suites organize tests; one file per unit under test |
| Data-driven expansion | Expanded inline by translator using framework's mechanism, human reviews in coarse approval | No separate approval step — spec already encodes the intent, human reviews full output |
| Subagent count | One translator for the whole spec | Scenario specs are compact enough for single context; avoids repeating shared Test Data across multiple subagents |
| Test path derivation | From implementation plan, confirmed by human | Plan is source of truth for module structure; human confirms before write |
| Design/plan re-validation | No — trust Phase 1 | Scenario spec is the contract; re-validation undermines spec authority and duplicates Phase 1 |
| Mapping review scope | Spec ↔ tests only | Spec already validated against design+plan in Phase 1; transitive coverage |
| Review loop | Max 3 iterations, then surface to human | Matches Phase 1 pattern; prevents infinite loops |
| Compiled language handling | Commit non-compiling test files | Unresolved references ARE the RED state; implementation phase makes them compile and pass |

## Revision History

| Version | Date       | Author | Changes       |
| ------- | ---------- | ------ | ------------- |
| 1.0     | 2026-03-28 | doc_pk | Initial draft |
| 1.1     | 2026-03-28 | doc_pk | Generalized from Python/pytest to language-agnostic design |
