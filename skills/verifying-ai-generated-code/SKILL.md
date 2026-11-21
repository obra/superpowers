---
name: verifying-ai-generated-code
description: Use when planning a change that users or callers will see, and when implementation is finished and about to be reported done, committed, or opened as a PR on the strength of tests the same agent wrote
---

# Verifying AI-Generated Code

## Overview

Tests written by the agent that wrote the code share that agent's misunderstanding. They pass, and the feature is still wrong. Different layers catch different failures, and the strongest evidence comes from outside the code you just wrote: a real dependency, a running app, a screenshot you actually looked at.

**Core principle:** Match the evidence to the change, then show it.

**REQUIRED BACKGROUND:** `superpowers:verification-before-completion`. It says no claim without fresh output. This skill says which output, from which layer.

**Announce at start:** "I'm using the verifying-ai-generated-code skill to verify this change in layers."

## The Gates

Run cheap gates first and stop at the first failure. Fix, then rerun from the failed gate.

1. **Static.** Typecheck, lint, format check. Use the commands the project already defines (package scripts, Makefile, CI config). If it has a SonarQube/SonarCloud setup, run the scanner or read the quality-gate result. Don't add a new tool to a project that lacks one without asking.
2. **Unit.** For logic with no I/O.
3. **Integration.** Wherever the code crosses a boundary (database, queue, HTTP, filesystem). Use the real dependency or the project's test container, not a mock of the thing under test.
4. **End-to-end.** Whatever a user or caller does, driven through the running app, with captured evidence (below). The test is written early, not at the end (see When the E2E Test Gets Written).

## Which Gates for Which Change

| Change | Gates |
|---|---|
| Config, docs, build files | Static |
| Pure logic, utilities | Static + unit |
| Touches DB, queue, external API, filesystem | + integration |
| User-visible flow (UI, API endpoint, CLI, job) | + end-to-end |
| Bug fix | A regression test at the lowest layer that reproduces it, seen failing before the fix. Add end-to-end if the bug was reported as something a user saw. |

When in doubt, go one layer up.

## Who Writes the Tests

A separate subagent writes the tests for each gate. It works from the design doc and, for unit and integration tests, from the interfaces the plan defines (names and signatures, not bodies). It never sees the implementation, so the tests encode what your human partner asked for and not what got built.

The agent that implements runs these tests but doesn't edit what they expect. If one looks wrong, tell your human partner why before changing it.

No subagent tool? Write the tests in a separate step before any implementation, from the design doc alone, and treat them as frozen afterward.

## End-to-End Evidence

Evidence means output a reader can check without trusting your summary: a screenshot at each key state, a video or trace of the whole flow, the real response of a running API.

**Which tool:** use the e2e framework the project already has. If it has none, ask your human partner which one they want. Don't pick one for them and don't install one unasked. Until they decide, drive the running app through a browser-automation tool in this session (check your tool list) and capture screenshots, or report e2e as not verified (below).

An existing suite that passes says nothing about a flow it doesn't cover. The new or changed flow needs its own scenario.

Start the app the way the project documents it (README, package scripts), against test data, never production. If you can't start it, that is "not verified", not a skip.

**Capture while it runs:** screenshots, video, and a trace, using the framework's own options. Check its docs for the exact flags or config rather than guessing them, and prefer a temporary config or flags over editing the committed config. Example for a project that uses Playwright, whose CLI has `--trace` and `--output` but no video or screenshot flag, so those go in a config that extends the project's:

```ts
// playwright.verify.config.ts (delete it afterwards)
import base from './playwright.config';
export default { ...base, use: { ...base.use, screenshot: 'on', video: 'on', trace: 'on' } };
```
```bash
npx playwright test --config=playwright.verify.config.ts --output=docs/superpowers/evidence/2026-11-20-checkout
```

Driving the app through a browser tool instead of a test framework? Capture screenshots at least, and say in the report if the tool can't record video or traces.

- Save under `docs/superpowers/evidence/<date>-<feature>/` and tell your human partner the paths. Add the directory to `.gitignore` unless the project commits artifacts, and attach files to the PR instead.
- **Look at what you captured.** Open each screenshot and check it against the acceptance criteria. An image nobody looked at is not evidence.
- No browser, no e2e framework, or no way to run the app? Say so (see below). Don't install heavy tooling into someone's project without asking.
- Non-UI flows: run the real thing (`curl` the endpoint, execute the CLI) and keep the command and its full output.

## Not Verified Is a Valid Answer

If a gate can't run (no tool, no environment, no credentials), report it as **not verified**, with the reason. Never fold it into "tests pass". A clear gap is something your human partner can act on. A hidden one ships.

## Shortcuts That Defeat the Gates

Don't make a gate green by weakening it:

- `skip`, `.only`, `xfail`, or deleting a failing test
- `eslint-disable`, `@ts-ignore`, `any`, or loosening a lint or type rule
- Lowering a coverage or quality-gate threshold
- Rerunning a flaky test until it passes and reporting only the pass

Fix the code. If the gate itself is wrong, say so and let your human partner decide.

Also check the diff itself: every new dependency was asked for and really exists with that exact name, and nothing was left behind that no task needed (debug code, unused files).

## When the E2E Test Gets Written

Not at the end, by the agent that just wrote the code: that test bends to fit the implementation and passes for the wrong reasons. Write it early, from the spec.

1. **Design.** The spec is the design doc from `superpowers:brainstorming`, and it doesn't require acceptance scenarios. For a user-visible feature, make sure it has them: who does what and what they see (Given/When/Then), one to three per feature, covering the main path and the failure that would hurt most. If it has none, draft them from the design and have your human partner confirm them before planning. They are the definition of done, so they are theirs to approve.
2. **Plan, first task.** Write the e2e test from those scenarios, in the project's e2e framework. Write it from the spec alone: a fresh subagent that gets the spec and not the implementation is the best author. Run it and confirm it fails because the feature is missing, not because of a typo, a bad locator, or broken setup.
3. **Plan, middle tasks.** Implement with unit and integration tests as usual. Leave the e2e test alone.
4. **Plan, final task.** Run the e2e test and capture evidence. Locators (selectors, routes, element names) are guesses until the UI exists, so fixing those and the setup is fine. Changing what the test expects is not: tell your human partner why first.

Skip this for changes with no user-visible flow (see the table). For a bug a user saw, the e2e reproduction is the first task.

When `superpowers:writing-plans` produces the plan, include these as tasks. Make the final task a layered verification: the gates that apply per the table, with the evidence directory named. Each task keeps its own tests. This task proves the whole feature works together.

## The Report

End with a table. One row per gate, including the ones that didn't run:

```
| Gate        | Command / action          | Result       | Evidence                  |
|-------------|---------------------------|--------------|---------------------------|
| Typecheck   | npx tsc --noEmit          | pass         | —                         |
| Lint        | npx eslint .              | pass         | —                         |
| Unit        | npm test                  | 48/48 pass   | —                         |
| Integration | npm run test:int          | pass         | —                         |
| E2E         | <project's e2e command>   | pass         | docs/superpowers/evidence/… |
| Sonar       | not verified              | no scanner configured | —               |
```

Then continue to `superpowers:finishing-a-development-branch`.
