---
name: refactoring
description: >
  MUST USE when restructuring existing code without changing behavior: extracting
  functions/modules, inlining, simplifying, decoupling, reorganizing files, renaming
  across the codebase, or cleaning up code structure. Enforces behavior-locking tests
  before any structural change and incremental verification after each move. Distinct
  from brainstorming (which designs new behavior) and bug fixing (which changes behavior).
  Triggers on: "refactor", "restructure", "reorganize", "clean up this code", "extract
  into", "inline this", "simplify", "decouple", "modularize", "move these files", "split this module", "consolidate", "reduce complexity".
  Routed by using-superpowers, or invoke directly via /refactoring.
---

# Refactoring

Change structure without changing behavior. Prove it at every step.

## Why This Exists

Refactoring feels safe — "I'm just moving things around." That's exactly why it's dangerous. Without a behavior lock, structural changes silently break contracts, reorder side effects, or drop edge cases. This skill enforces the discipline that makes refactoring actually safe.

## Phase 1: Behavior Lock

Before touching any structure, lock the current behavior with tests.

1. **Run the existing test suite.** Detect the project's test runner (check `package.json` scripts, `Makefile`, `pytest.ini`, `Cargo.toml`, etc.) and run it. Every test must pass. If tests fail before you start, you're debugging, not refactoring — switch to `systematic-debugging`.

2. **Identify the refactoring surface** — which functions, modules, or files will be structurally changed.

3. **Audit test coverage on that surface.** For each function/module in scope:
   - Is there a test that exercises its public API or observable behavior?
   - If yes: verify it passes. That test is now your behavior lock.
   - If no: write a characterization test that captures current behavior. This test doesn't assert "correct" behavior — it asserts "current" behavior. The point is to detect unintended changes, not to validate design.
   
   **Writing characterization tests:** Call the function with representative inputs and assert on the exact output. For side-effectful code (writes files, sends requests, modifies state), wrap the side effect in a spy/mock and assert it was called with the expected arguments. For error cases, trigger the error and assert on the error type/message. If the function is too tightly coupled to test in isolation, that's useful information — note it as a reason the refactoring is needed, and test at the integration level (HTTP request → response, CLI input → output) instead.

4. **Confirm: all tests green.** This is your baseline. Any structural change that breaks a test has changed behavior — stop and investigate.

## Phase 2: Scope Definition

Explicitly state the refactoring boundary before writing any code.

1. **What changes:** List the specific structural moves (extract function X, move file Y to Z, inline helper W, rename A to B across the codebase).

2. **What stays the same:** List the public APIs, contracts, and behaviors that must not change. Be concrete — "the HTTP response shape stays identical" is better than "behavior stays the same."

3. **Boundary check:** For each structural move, ask:
   - Does this cross a module boundary? (Higher risk — more callers to update)
   - Does this change an import path that other packages depend on? (Requires coordinated update)
   - Does this affect serialization, persistence, or wire format? (Not a refactor — that's a migration)

If any answer reveals a behavior change is required, pause: that portion is not a refactor. Split it into a separate task that goes through `brainstorming` → `writing-plans`.

## Phase 3: Incremental Steps

One structural change at a time. Tests green after each.

For each move in the scope definition:

1. **Make exactly one structural change.** Examples:
   - Extract a function/class
   - Move a file and update all imports
   - Rename a symbol across the codebase
   - Inline a helper that adds indirection without value
   - Split a module into two

2. **Run the full test suite.** All tests must pass. If the suite takes more than 2 minutes, run the subset covering the modules in scope — but always run the full suite in Phase 4.

3. **If a test breaks:** The structural change altered behavior. Do not fix the test to match the new structure — that's adjusting the lock, not proving safety. Instead:
   - Revert the structural change.
   - Investigate why it changed behavior.
   - Either fix the structural move to preserve behavior, or acknowledge this is a behavior change and route it through TDD.

4. **Verify the passing state** before moving to the next structural change. If the user has asked for commits, commit each step independently so it's revertable. Otherwise, proceed to the next change — the test suite is the safety net.

Never batch multiple structural moves into one step. "Extract and rename and move" is three steps, not one. If one of them breaks behavior, you need to know which.

## Phase 4: Completion Gate

After all structural moves are done:

1. **Full test suite green** — no exceptions, no skipped tests, no "known failures."
2. **Behavioral equivalence confirmed** — the characterization tests from Phase 1 still pass with identical assertions.
3. **Import/reference audit** — for each renamed/moved symbol, run separate Grep searches for:
   - Direct calls and type references (the old function/class/variable name)
   - String literals containing old names (config keys, error messages, logs)
   - Dynamic imports and `require()` calls (string-based references the rename didn't catch)
   - Re-exports and barrel file entries (`export { OldName }`, `index.ts` files)
   - Test files and mocks (test helpers, fixture data, mock implementations)
   - Documentation and comments (inline references, JSDoc @see tags)
   
   A single Grep cannot prove absence — search each category separately.
4. **Code review** — if the refactoring touched 5+ files or crossed module boundaries, review for structural issues a test suite won't flag: circular dependencies, layering violations, naming inconsistencies. For large refactors, suggest the user invoke `requesting-code-review` for an independent second opinion.

## Rules

- A refactoring that changes behavior is not a refactoring — it's a feature change or bug fix. Route accordingly.
- Never weaken a test to make a refactoring pass. Tests are the lock. If the lock breaks, the change is wrong.
- If you discover a bug during refactoring, do not fix it in the same commit. Note it, finish the refactor, then fix the bug separately with TDD.
- If the refactoring scope grows beyond what was defined in Phase 2, stop and re-scope before continuing. Scope creep during refactoring is how "quick cleanup" becomes a multi-day yak shave.

## Related Skills

- `test-driven-development` — when the refactoring reveals missing test coverage
- `systematic-debugging` — when pre-refactoring tests are already failing
- `brainstorming` → `writing-plans` — when the "refactoring" actually requires behavior changes
- `verification-before-completion` — final gate after the refactoring is complete
