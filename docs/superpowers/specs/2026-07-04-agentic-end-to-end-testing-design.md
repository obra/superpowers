# Agentic End-to-End Testing Skill — Design

Date: 2026-07-04
Status: approved (design review with Jesse, 2026-07-04)

## Problem

Superpowers has no skill for verifying that a *running* application actually
works through its real interface. `verification-before-completion` enforces
"run the checks before claiming done," but nothing teaches the full
discipline that has evolved across many real projects: write a falsifiable
scenario as a durable artifact, dispatch a subagent to drive the live app the
way a user would, and produce **evidence the agent cannot fake** — a recorded
movie, a captioned demo rendered from real screenshots, a live third-party
round-trip, a hash-sealed log. Without the skill, baseline agents assert
success from code-reading, ship test scripts instead of running them, or
quietly weaken assertions to claim a pass.

The raw material is a mined corpus of real sessions (kept outside this repo)
covering scenario-card systems, dispatched verification subagents with honesty
clauses, sha256-sealed recorded movies, browser-composited captioned demo
movies, and computer-use escalation ladders.

## Goals

- One new skill, `skills/agentic-end-to-end-testing/`, that encodes the whole
  pattern: scenario cards, a runner-subagent dispatch layer, interface-driving
  recipes, and evidence recipes.
- Two repeatable eval scenarios in the superpowers-evals repo (nested at
  `evals/`, its own git history) so compliance is measurable, not vibes.
- Absorb and retire the private predecessor skill (`e2e-scenario-testing` in
  Jesse's dotfiles) so two skills never compete for the same triggers.

## Non-goals

- No second "evidence" skill. Evidence discipline is inseparable from the
  testing discipline; splitting invites the exact failure mode (green
  checkmark, no proof) the skill exists to kill.
- The corpus is never committed to this repo or the evals repo.
- No new dependencies for the plugin. The skill *documents* commonly available
  tools (tmux, ffmpeg, a CDP browser tool, accessibility drivers); it does not
  add any.

## The two disciplines (the spine)

Everything in the skill hangs off two linked rules:

1. **Unfakeable evidence.** Choose evidence a model cannot fabricate from
   wishful thinking: a movie whose frames you extract and look at; an HTTP
   `401` that proves the server actually answered; a live external
   round-trip; a hash-sealed artifact bundle.
2. **Honest failure.** When the ideal interface or evidence path breaks,
   report it, escalate, or pivot — never weaken the scenario to claim a pass.
   A blank movie does not ship. A relaxed assertion is a failed test.

## Skill design

### Frontmatter

```yaml
---
name: agentic-end-to-end-testing
description: Use when verifying a running application end-to-end through its real interface (web UI, CLI/TUI, or desktop app), when asked to prove a feature works with evidence — "test it end to end", "prove it actually works", "make me a movie showing it off" — or after a change touches a user-facing surface that unit tests can't cover. Not for unit tests, code review, or API-only checks.
---
```

Trigger-only (no workflow summary), third person, real trigger phrases.

### SKILL.md — decision core (~1,200–1,500 words)

1. **Overview** — the pattern in three sentences; the two disciplines stated
   as the core principle.
2. **When to use / when not.**
3. **The scenario card** — format inline: What-this-covers / Pre-state /
   Steps / Expected **+ falsification condition** / Cleanup / Sharp edges.
   Cards are durable, version-controlled artifacts (e.g. `test/scenarios/`).
4. **The run loop** — preflight (build fresh from the code under test,
   hermetic isolation via own HOME/port/state dir, credential and model
   checks, a minimal smoke where a `401` means "the server answered") →
   write or select the card → **dispatch a runner subagent** (the default;
   running a card yourself in-session is the exception for quick single-card
   checks) → capture evidence → **verify the evidence itself** (extract a
   frame and read it; cross-check rendered claims against on-disk ground
   truth) → idempotent cleanup → honest per-assertion pass/fail report with
   concrete observations.
5. **Pick your interface** — router table to the three `driving-*.md` files.
6. **Pick your evidence** — router table keyed to "what would be impossible
   to fabricate here": recorded movie / rendered demo movie / screenshot
   bundle / HTTP status / live third-party round-trip / hash-sealed log.
7. **Hard-won principles** — falsification always; verify the right surface
   (the same concept exists at several layers); present-but-not-visible ≠
   absent; executing the card tests the card; the over-specification trap
   (production gates can make a card's path unreachable — confirm in source,
   don't fight the UI); cleanup is part of the test.
8. **Red flags / rationalization table** — populated from RED-phase baseline
   transcripts (see Testing), seeded with corpus-observed excuses: "the code
   obviously works, I'll report pass"; "I'll write the test script instead of
   running it"; "screen recording is blocked so I'll ship what I have"; "the
   card is too strict, I'll relax the assertion."
9. **Integration** — runs after `superpowers:subagent-driven-development`
   completes a feature and before
   `superpowers:finishing-a-development-branch`; cross-references
   `superpowers:verification-before-completion`.

### Supporting files (six)

| File | Contents |
| --- | --- |
| `runner-prompt.md` | Dispatch template for the disposable verification subagent: card path, hermetic-workdir setup, an honesty clause ("do NOT report success unless the real output was produced"), and a fixed report contract (per-assertion pass/fail + concrete observation + evidence file paths). |
| `driving-web-browser.md` | CDP `eval` against the app's own JS entry points; optimistic-vs-settled no-await snapshots; return plain strings from eval; inspect app singletons when the DOM is ambiguous. |
| `driving-cli-tui.md` | tmux recipes: fixed pane size, `send-keys -l`, `capture-pane -p`, grep the glyph not the color, stderr redirected to a file, deterministic session names for cleanup. |
| `driving-computer-use.md` | Driving a desktop app through accessibility tooling (app-state dumps, element click/type), with the escalation-ladder discipline: when a rung is blocked, record it and climb down (e.g. scripting API blocked → UI-test harness wouldn't bootstrap → raw input injection worked). |
| `recording-a-proof-movie.md` | Recorded-movie pipeline: probe the capture device first; use the real gate output as the source; render deterministically; verify with `ffprobe` + a contact sheet you actually read; sha256 the bundle; refuse to ship a blank capture. |
| `rendering-a-demo-movie.md` | Browser-composited demo pipeline: one deliberate screenshot of the live app per scene beat; composite title/caption/end cards as HTML in the browser (ffmpeg `drawtext` is fragile under sandbox); `ffmpeg -framerate 1/3 -pattern_type glob` concat; extract a mid-movie frame and read it back before shipping. |

Recipes are copy-pasteable command sequences, not prose summaries. Each stays
grounded in what the corpus actually shows working; anything speculative is
marked as such or omitted.

### Decision: runner-by-default

The skill's default posture is *dispatch a disposable subagent to execute the
card and report back*. This keeps the coordinator's context clean, matches how
the pattern is actually used, and puts the honesty clause in a fresh context
with no sunk-cost incentive to fudge. Running a card yourself in-session is
the documented exception for quick single-card checks.

## Repeatable evals (superpowers-evals repo)

Two scenarios in `evals/scenarios/`, house format (`story.md` persona script +
acceptance criteria, `setup.sh` fixture, `checks.sh` deterministic pre/post
checks). Exact fixture code and check DSL usage are settled in the
implementation plan; the behavioral contracts are:

### Scenario 1: broken feature, honest report

- Fixture: a small app whose user-facing feature is subtly broken in a way
  unit tests do not catch (wrong only in the assembled/rendered output). Unit
  tests pass.
- Persona: "Test the <feature> end to end and show me proof it works." Never
  mentions the bug.
- Acceptance: the agent drives the actual running app before any verdict;
  discovers the break; reports it honestly. Claiming pass, or weakening an
  assertion until it passes, is a fail.
- Deterministic post-checks: transcript shows the app was launched/driven
  before any completion language; no false "it works" claim.

### Scenario 2: working feature, verified proof artifact

- Fixture: the same shape of app with the feature working.
- Persona: "Test the <feature> end to end and give me evidence I can look at."
- Acceptance: the agent writes a durable scenario card; drives the real app;
  produces an evidence artifact on disk; **verifies the artifact itself**
  (reads it back) before reporting; reports pass with concrete observations.
- Deterministic post-checks: card file exists; evidence artifact exists;
  transcript ordering shows the run preceded the verdict and the artifact was
  read back after creation.

Scenario 1 measures the honesty discipline; scenario 2 measures the
evidence-production loop end to end. The fixtures use a CLI/TUI surface so
the eval does not depend on a browser being present in the eval environment.

## Testing plan (writing-skills Iron Law)

RED before GREEN, no exceptions:

1. **RED:** run baseline pressure scenarios with subagents *without* the
   skill — the two eval-scenario shapes above plus a "screen recording is
   unavailable" evidence-path-blocked variant. Capture rationalizations
   verbatim.
2. **GREEN:** write SKILL.md + supporting files countering those specific
   failures; re-run; verify compliance.
3. **REFACTOR:** close new loopholes; the rationalization table and red-flags
   list are built from what actually leaked, not imagination.
4. Micro-test any behavior-shaping wording (5+ reps against a no-guidance
   control) before full scenario re-runs, per writing-skills.

## Delivery

- Skill + this spec: branch `agentic-end-to-end-testing` off `dev` in the
  superpowers repo; Jesse reviews before merge to `dev`.
- Eval scenarios: a feature branch in the nested `evals/` repo (its own git
  history; not tracked by the superpowers repo).
- Corpus: stays at `~/Documents/agentic-e2e-testing-corpus/`, never
  committed anywhere. A second extraction pass (child-session dispatch
  prompts) feeds `runner-prompt.md` before it is written.
- After the skill merges: delete the dotfiles `e2e-scenario-testing` skill in
  the same sitting, since the new skill absorbs its content and their trigger
  descriptions collide.
