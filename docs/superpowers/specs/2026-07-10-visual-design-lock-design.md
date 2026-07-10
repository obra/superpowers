# Visual Design Lock Design

Preserve the visual design selected in the brainstorming companion all the way
through spec, plan, and implementation — so what gets built looks like what the
user picked.

## Goal

Today the visual companion ends at selection. Mockups persist only in the
gitignored `.superpowers/brainstorm/` session directory (or `/tmp`, deleted on
stop), the spec written by brainstorming never references them, and no
downstream skill (`writing-plans`, `executing-plans`,
`subagent-driven-development`) mentions visual artifacts at all. Under
subagent-driven development the failure is structural: each implementer sees
only its own task text ("A task's implementer sees only their own task" —
`writing-plans/SKILL.md`), so the agent writing the CSS has never seen the
mockup and cannot drift *toward* it.

Observed failure mode (motivating problem): a design is mocked and selected in
the companion, the spec and plan are written, implementation runs
subagent-driven, and the shipped UI looks nothing like the selected mockup.

This design closes the chain at every break point:

1. Resolve design-system intent **before** mocking, so mockups are honest
   previews.
2. **Lock** the selected design into a durable, committed artifact.
3. Record the lock in the **spec** with a machine- and human-readable section.
4. Thread the artifact and a comparison obligation into every UI **plan task**,
   which is the only channel that reliably reaches a subagent implementer.

## Constraints

- **Zero dependencies.** No headless browser, no html2canvas, no vendored
  libraries (the project previously dropped vendoring Alpine.js for the
  companion on these grounds). Screenshots are therefore opportunistic, never
  required.
- **No changes to session-state persistence.** Moving `.superpowers/brainstorm/`
  out of the working tree (issue #975 / PR #977) was deferred upstream; this
  design exports artifacts out of the session dir rather than changing how the
  session dir works.
- **Upstream-shaped.** Built on this fork first, but scoped as a single problem
  with the eval obligations for behavior-shaping content documented (see
  Testing Strategy) so it can be proposed upstream later.

## Design

### 1. Design-System Discovery (visual-companion.md)

Before writing the first mockup in a project that already has a UI, the agent
inspects the codebase for design tokens: CSS custom properties, Tailwind or
similar config, theme files, component libraries. Then it asks the user one
question (terminal or browser, per the existing per-question test):

> "Should mockups follow your app's existing design system, or explore a new
> visual direction?"

- **Existing system** — mockups embed the app's real tokens via a scoped
  `<style>` block inside the content fragment. Fragments already support
  inline styles; no server change. What the user selects is what ships.
- **New direction** — mock freely; the lock (below) captures the new tokens as
  the design source of truth.
- **Greenfield project** — skip the question; the locked mockup seeds the
  design system.

This resolves "match the mockup vs. adapt to the existing design system"
before the user selects anything, instead of reconciling after the fact. If
discovery was skipped or the answer is ambiguous at lock time, the agent asks
the question then — lock time is the fallback checkpoint, not the primary one.

### 2. Design Lock and Export Script

When a visual choice is finalized — the selection that ends exploration for a
screen, not every click — the agent locks it:

1. **Final-design fragment.** The agent writes a confirmation screen to the
   session `screen_dir` containing only the winning design (no A/B/C chooser,
   no selection UI). This doubles as visual confirmation for the user in the
   browser.
2. **Deterministic export.** A new script,
   `skills/brainstorming/scripts/export-mockup.sh`, wraps that fragment with
   the frame template's CSS into a self-contained standalone HTML file:
   - Inlines the frame CSS exactly as the browser rendered it.
   - Omits `helper.js`, WebSocket/connection chrome, and any interactive
     infrastructure — the artifact is a static design document.
   - Usage: `export-mockup.sh <fragment-file> <output-file>`.
   - Fragments that are already full documents (`<!DOCTYPE`/`<html>`) are
     copied through unchanged.
   The split is deliberate: the agent selects content (it knows the winner);
   the script guarantees wrapping fidelity (code, not paraphrase).
3. **Destination.** `docs/superpowers/specs/assets/YYYY-MM-DD-<topic>/<screen>.html`,
   one file per locked screen. Committed together with the spec in the
   existing "commit the design document" step. (User preferences for spec
   location override this default, as with specs themselves.)
4. **Opportunistic screenshot.** If the harness has a browser screenshot tool
   (Playwright MCP, Chrome DevTools MCP, etc.), the agent also captures
   `<screen>.png` beside the HTML. It must never install tooling to get one;
   with no tool available, it silently skips. The HTML is the artifact of
   record; the PNG is a multimodal convenience.

### 3. "Design Lock" Section in the Spec (brainstorming/SKILL.md)

When the companion was used and designs were locked, the spec MUST include a
**Design Lock** section containing:

- **Artifact table** — screen name → committed path (HTML, plus PNG when
  captured).
- **Fidelity decision** — the discovery answer restated concretely: either
  "match the locked mockup as rendered" or "adapt: keep layout, hierarchy, and
  structure; restyle using the app's existing tokens," naming the actual token
  sources (e.g., `src/styles/tokens.css`, `tailwind.config.ts`).
- **Load-bearing properties** — 3–7 plain-language bullets per screen naming
  what must survive implementation (e.g., "sidebar navigation, fixed left,
  collapses below 768px"; "3-column card grid, image-top"). Plain text travels
  through every pipeline, including implementers that never render HTML.

The existing spec self-review gains one check: every artifact path cited in
the Design Lock exists on disk.

### 4. Plan Threading (writing-plans/SKILL.md)

A conditional rule — "If the spec contains a Design Lock section":

- **Global Constraints** copies the fidelity decision and artifact paths
  verbatim (riding the existing verbatim-copy rule for spec constraints).
- **Every task that implements UI covered by a locked design**:
  - adds the artifact to its **Files** block:
    `Read: docs/superpowers/specs/assets/<...>/<screen>.html (locked design)`
  - gains a verification step before its commit step: render the result and
    compare against the locked mockup — with browser tooling if available,
    otherwise by diffing DOM structure and styles against the mockup file.
    Deviations from the load-bearing properties are failures, not style
    choices.

Because plans are self-contained and each subagent receives its full task
text, this is the channel that fixes the observed drift.

### 5. Files Touched

- `skills/brainstorming/visual-companion.md` — new "Existing Design Systems"
  and "Locking a Design" sections.
- `skills/brainstorming/scripts/export-mockup.sh` — new export script.
- `skills/brainstorming/SKILL.md` — Design Lock spec requirement + self-review
  check (small, conditional additions).
- `skills/writing-plans/SKILL.md` — conditional Design Lock threading rule
  (small addition; carefully-tuned surrounding content left untouched).
- `tests/brainstorm-server/` — export script tests.

Explicitly **not** touched: `server.cjs` (no new endpoints),
`executing-plans`, `subagent-driven-development`,
`verification-before-completion` (the plan text carries the obligation),
session-state persistence.

## Testing Strategy

**Now (this fork):**

- Export script tests in `tests/brainstorm-server/`: fragment wrapped with
  frame CSS; output contains no `helper.js`/WebSocket code; full documents
  pass through unchanged; output renders standalone (structural assertions).
- Skill-content changes developed and pressure-tested via
  `superpowers:writing-skills`.

**Required before upstreaming (documented, not built in this round):**

- superpowers-evals scenarios:
  1. Existing-app session → agent asks the design-system question before the
     first mockup.
  2. Design selection → lock artifact exists at the committed path and the
     spec contains a Design Lock section.
  3. Plan generated from a spec with a Design Lock → UI tasks carry the Read
     pointer and comparison step.
- A real problem transcript demonstrating the drift, per upstream contribution
  requirements.
- Note: the `writing-plans` change touches behavior-shaping content; expect
  wording workshop upstream.

## Acceptance Criteria

- In an existing app, the companion resolves design-system intent before the
  first mockup is shown.
- Locking a design produces a committed, self-contained HTML artifact (and
  PNG when tooling allows) under `docs/superpowers/specs/assets/`.
- The spec's Design Lock section lists artifacts, fidelity decision, and
  load-bearing properties; self-review verifies paths exist.
- A plan written from such a spec includes the artifact in every relevant UI
  task's Files block and a mockup-comparison verification step.
- `export-mockup.sh` tests pass; no new runtime dependencies anywhere.

## Deferred Work

- Building the superpowers-evals scenarios (required for upstream, not for
  fork use).
- Any automated screenshot capture in core (blocked on zero-dependency
  constraint; revisit only if the project's stance changes).
- Automated visual diffing of built UI vs. mockup (harness-dependent; the
  plan-task comparison step covers this opportunistically).
