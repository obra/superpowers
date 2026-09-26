---
name: agentic-end-to-end-testing
description: Use when verifying a running application end-to-end through its real interface (web UI, CLI/TUI, or desktop app), when asked to prove a feature works with evidence — "test it end to end", "prove it actually works", "make me a movie showing it off" — or after a change touches a user-facing surface that unit tests can't cover. Not for unit tests, code review, or API-only checks.
---

# Agentic End-to-End Testing

## Overview

Write a durable, falsifiable scenario; have an agent drive the live application through its real interface the way a user would; end with evidence that cannot be faked. The unit of work is a **scenario card** — a short markdown test written for an agent to execute, high-level enough that a small UI shuffle doesn't invalidate it, precise enough that two agents running it reach the same verdict. The run's product is a per-assertion pass/fail report backed by that evidence.

Two disciplines govern everything here. **Unfakeable evidence:** choose evidence a model cannot fabricate — a movie whose frames you extract and look at, an HTTP 401 that proves the server actually answered, a live third-party round-trip, a hash-sealed bundle. **Honest failure:** when the interface or evidence path breaks, report it, escalate, or pivot. NEVER weaken, skip, or reinterpret an assertion to make it pass.

## When to Use

- A feature touches a user-facing surface (button, palette command, status indicator, keybinding, rendered message) and you want proof it works live.
- The user asks to "test it end to end", "prove it actually works", or wants a demo they can watch.
- You changed a layer (projection, capability gate, renderer) whose effect is only observable in the assembled application.

A green unit test proves the wiring in isolation. A scenario proves the wiring *as assembled and rendered*. They catch different bugs — write the card even when the unit tests pass.

Don't use this for logic with no user-facing surface (unit-test that), or when a production gate makes the live path unreachable (see the over-specification trap below).

## The Scenario Card

One card = one `.md` file in `test/scenarios/`. Keep these sections; collapse any to one line when the scenario is simple. Don't pad.

```markdown
# <area>-<behavior>: one-line title

**What this covers**: the feature + the specific commits/IDs it exercises.
If something else breaks this, it should be caught here.

## Pre-state
What must be true before starting: a freshly built instance running, auth/creds
in place, a clean workdir. Give the exact commands to reach it.

## Steps
Numbered actions described by **intent**, each with the concrete command or
tool call and a real UI label (prefer labels the user sees over brittle
selectors like `#nav > li:nth-child(3)`).

## Expected
For each step, what you should observe — and the **falsification condition**:
"if you see X instead, the test fails." Silence is not success.

## Cleanup
Idempotent teardown so reruns are hermetic. Never touch state you didn't create.

## Sharp edges
Footguns, timing/ordering caveats, nondeterminism noted while recording.
```

When a design spec exists, cards derive from it — see [authoring-cards-from-a-spec.md](authoring-cards-from-a-spec.md); if the spec has an "E2E scenario cards" table, its falsification lines are verbatim contracts.

## The Run Loop

1. **Preflight.** Build fresh from the code under test — the most common mistake is testing a stale binary. Rebuild every layer your change touches and confirm the running instance is the new one, not a process someone left up yesterday. Isolate hermetically: give the test instance its own HOME, port, and state directory so it can neither collide with nor pollute a real instance. Check credentials and models are in place. Run a minimal smoke check first — one where even a `401` is informative, because it means the server answered.
2. **Write or select the card.** New behavior gets a new card; a regression check reuses an existing one.
3. **Dispatch a disposable runner subagent** using [runner-prompt.md](runner-prompt.md). This is the default: a fresh context has no sunk-cost incentive to fudge the verdict. Running a card yourself in-session is the exception, reserved for a quick single-card check.
4. **Capture evidence** (see Pick Your Evidence below).
5. **Verify the evidence itself.** Extract a frame from the movie and read it. Re-read the capture file. Cross-check every rendered claim against on-disk ground truth — the UI can lie or lag; the log, database, or file is authoritative. Evidence you didn't inspect is evidence you don't have.
6. **Clean up, idempotently.** Shut down what you spawned, remove scratch dirs, leave pre-existing instances running and untouched. Never touch state you didn't create.
7. **Report per-assertion pass/fail with the concrete observation** (or PASS-WITH-NOTE for a pre-declared tolerance — see [runner-prompt.md](runner-prompt.md)) — the rendered text, the on-disk value, the exit code. A vague "looks fine" is a failed report.

## Pick Your Interface

| Surface | Recipe |
| --- | --- |
| Web UI (browser) | [driving-web-browser.md](driving-web-browser.md) |
| CLI / TUI (terminal) | [driving-cli-tui.md](driving-cli-tui.md) |
| Desktop app | [driving-computer-use.md](driving-computer-use.md) |

## Pick Your Evidence

Ask one question: **what would be impossible to fabricate here?** Then capture that.

| Evidence | When to choose it |
| --- | --- |
| Captured real output / screenshot bundle | The cheap default: a terminal transcript or screenshots of the actual run, saved to files. |
| HTTP status / live third-party round-trip | When the claim is "the other end answered" — a real status code or a real external service response proves it. |
| Recorded movie | When the user wants to *watch* it work. See [recording-a-proof-movie.md](recording-a-proof-movie.md). |
| Rendered captioned demo | When the deliverable is a narrated showcase built from verified stills. See [rendering-a-demo-movie.md](rendering-a-demo-movie.md). |
| Hash-sealed bundle | When the artifact must not drift from the log it documents — seal both together. |

## Hard-Won Principles

- **Falsification, always.** Every assertion states what failure looks like. A step that can't fail proves nothing — make sure your check would fire on the failure path, not just the happy path.
- **Verify the right surface.** The same concept often exists at several layers: an internal capability vs. its REST projection, a model field vs. the rendered chip. Confirm your assertion reads the surface that carries the signal — a "missing" value is often present one layer over.
- **Present but not visible ≠ absent.** Scrollable bodies, virtualized lists, and auto-scroll-to-bottom routinely push a real element out of the capture window. Scroll or expand to where it should be before concluding it didn't render; confirm via a sibling read of the same state.
- **Executing the card tests the card.** Expect to find bugs in your own scenario — a wrong selector, a wrong layer, a vacuous assertion. Fix the card as you go; a card that passes because its check was vacuous is worse than none.
- **The over-specification trap.** A card can describe a path that production gating prevents (a keybind that's a no-op in the current mode). Confirm the gate in the source rather than fighting it through the UI; verify the underlying behavior with a unit test and note the gate in the card.
- **Cleanup is part of the test.** A half-shutdown fleet makes the next run's polling return false positives. Make teardown idempotent and scoped to what you created.

## Common Rationalizations

| Excuse | Reality |
| --- | --- |
| "The unit tests pass, so it works" | Unit tests prove the wiring in isolation; the bug class this skill exists for lives in the assembly. |
| "I read the code; the feature is clearly correct" | Reading is not running. Drive the real interface or report that you didn't. |
| "Screen recording is blocked, I'll ship what I have" | A blank or fabricated artifact is worse than none; pivot to evidence from the real run and say what you did. |
| "The assertion is too strict, I'll adjust it" | NEVER weaken, skip, or reinterpret an assertion to make it pass. |
| "I proved the backend, so the feature works" | Different claim. Say exactly what you exercised, then drive the real interface — or state that you didn't. |
| "My check passed" | A check that would also pass with the feature broken proves nothing — a broken detector and a clean run are indistinguishable. |

**Red flags.** Stop the moment any of these is true mid-run:

- You are about to report a verdict and never launched the app.
- You wrote an evidence file you never re-read.
- You edited an assertion after the run started.
- You produced a movie whose frames you haven't looked at.
- An attempt failed — a blocked recorder, a crashed capture — and your report doesn't mention it.

All of these mean: stop, run the real thing, look at the real output.

## Integration

- Runs after superpowers:subagent-driven-development completes a feature — which can end with spec-derived cards authored and run (see authoring-cards-from-a-spec.md) — and before superpowers:finishing-a-development-branch decides how the work lands.
- Complements superpowers:verification-before-completion: that skill gates any success claim on having run the checks; this one defines what counts as proof when the behavior under test is user-facing.
