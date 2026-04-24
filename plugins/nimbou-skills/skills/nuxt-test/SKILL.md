---
name: nuxt-test
description: Stabilize and expand bounded Playwright E2E coverage for a Nuxt/Vuetify module while keeping frontend edits minimal and observable.
---

# Nuxt Test

Read `reference/test-conventions.md` before changing tests.

## Purpose

This skill owns module-bounded Playwright and E2E discipline for Nuxt/Vuetify work.

Map a bounded route, page, or feature slice, run only its relevant E2E coverage, stabilize selectors and waits, and add the smallest possible frontend hooks only when the UI does not expose a stable observable contract.

Use this skill when the main job is:
- make a flaky bounded suite trustworthy
- add coverage for a critical user flow
- turn approved Gherkin into bounded Playwright coverage
- separate test defects from product defects
- tighten auth, seed, reset, and wait assumptions

Do not use this skill as the default browser debugging workflow. Use `nimbou-skills:nuxt-debug` when the main job is to investigate a frontend bug live in the browser before deciding how to test it.

## Gherkin-Driven Coverage

When `docs/domain/<domain>/*.feature` exists and is approved, treat it as the canonical source for missing or stale Playwright coverage.

- convert each approved `Scenario` into one bounded Playwright test or one explicit gap report
- do not invent scenarios outside the approved `.feature` files
- keep selectors, waits, auth setup, and visible assertions aligned with the existing `nuxt-test` rules

## Workflow

1. Map one bounded user flow or module slice:
   - target route or page
   - critical user-visible claim
   - nearby components, composables, stores, and auth/setup dependencies
2. Run only the relevant Playwright tests.
3. Build a small QA checklist for that flow:
   - critical happy path
   - at least one meaningful non-happy-path state
   - the meaningful loading, empty, error, or success feedback that the route should expose
   - controls and text that prove the flow worked
   - whether keyboard navigation or focus behavior is part of the user-visible claim
   - whether any visual claim actually matters
4. Diagnose whether each failure belongs to the test, the frontend, the environment/setup, or more than one of these.
5. Fix selectors and waits first when the bug is test-side.
6. Fix auth, seed, reset, or helper drift when the environment is the real problem.
7. Fix product code only when the test exposed a real user-visible defect.
8. Add the missing tests for the bounded flow and rerun only that slice.

## Execution Rules

- Prefer semantic selectors and observable conditions over framework structure.
- Prefer one critical path plus one adjacent meaningful state over broad but shallow coverage.
- Keep viewport or visual assertions only when the claim is visual or the bug was visual.
- Keep frontend edits minimal, but allow small hooks when they create a stable contract the UI otherwise lacks.
- Do not turn a module-bounded update into a suite-wide cleanup pass.
- Prefer observable inline feedback, empty states, and explicit form semantics over implementation-detail assertions.

## Stable Observable Contracts

Acceptable sources of truth:
- roles and accessible names
- labels and explicit form semantics
- stable visible text that is part of the contract
- `data-testid` only when semantics are insufficient

Unacceptable defaults:
- internal Vuetify classes
- timing-based sleeps as primary synchronization
- selectors tied to incidental DOM nesting
- assertions that only prove implementation details

## Boundary With `nuxt-debug`

- `nuxt-debug` investigates the live browser first and finds the owning layer
- `nuxt-test` codifies that understanding into stable bounded Playwright coverage
- if the first question is "what is actually broken in runtime?", start with `nuxt-debug`
