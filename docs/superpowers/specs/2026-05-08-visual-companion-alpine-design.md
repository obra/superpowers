# Visual Companion Alpine Support

**Date:** 2026-05-08
**Status:** Draft for maintainer review
**Linear:** SUP-215
**Scope:** `skills/brainstorming/scripts/`, `skills/brainstorming/visual-companion.md`, `tests/brainstorm-server/`, `scripts/sync-to-codex-plugin.sh`, `tests/codex-plugin-sync/test-sync-to-codex-plugin.sh`

## Problem

The visual companion can already show HTML mockups in a browser, but the
default workflow still treats most screens as static visuals with optional
choice clicks. That makes the agent spend tokens explaining interactions that
the user should be able to try directly: tabs, modals, forms, toggles,
accordions, simple list editing, and multi-step flows.

Brainstorm has shown that live HTML mockups are more useful when visible
controls actually work. Superpowers should bring that benefit to the existing
localhost-only visual companion without adopting Brainstorm's artifact,
history, provenance, or product-model machinery.

## Goals

- Upgrade the existing visual companion screen path so normal mockups can be
  interactive by default.
- Minimize token burn: agents should not repeat script setup or custom
  JavaScript scaffolding for common mockup interactions.
- Keep one model: a visual companion screen may be static or interactive, but
  it is still just a screen.
- Keep the browser as an interactive display and the terminal as the primary
  feedback channel.
- Preserve the current choice-click behavior for existing screens.
- Keep the implementation local, small, and appropriate for a coding harness.

## Non-Goals

- No Brainstorm-style artifact system, provenance map, sidebar, approval flow,
  database model, or git-backed product history.
- No separate "prototype mode" or second rendering path.
- No canned global sample data or generic fixture library.
- No Tailwind, Chart.js, D3, React, Vite, build step, or broader frontend stack.
- No Alpine helper/component library in the first version.
- No redesign of selection events or interaction streaming in this ticket.
- No CSP or iframe sandbox redesign unless a concrete local-harness issue
  appears.

## Design

### Core Acceptance and Third-Party Exception

Superpowers is a zero-dependency plugin by design. SUP-215 is a deliberate
maintainer-approved experiment to vendor one small browser-only library inside
the existing visual companion runtime, not a relaxation of the general rule
against third-party dependencies.

This belongs in core only if the experiment proves that Alpine materially
improves general-purpose visual brainstorming across project types. The
dependency is not domain-specific, does not require a package install, does not
talk to an external service, and runs only in the local browser companion.

Alternatives considered:

- **No library:** keeps the repo pure, but agents keep spending tokens writing
  custom JavaScript scaffolding for routine UI behavior.
- **Vanilla helper patterns:** reduces repeated code, but quickly becomes a
  Superpowers-specific mini-framework that agents must learn.
- **Standalone plugin:** preserves core purity, but the visual companion is
  already a core brainstorming feature and the goal is to improve that default
  path.
- **Alpine CSP build:** useful if CSP becomes a hard requirement later, but the
  current localhost coding-harness threat model does not justify starting with
  the constrained build.

The implementation PR should explicitly call out this exception. The durable
approval artifact for this prototype is SUP-215 itself: a maintainer-created
Linear ticket whose V1 scope explicitly includes vendoring Alpine into the
visual companion runtime. The PR's "appropriate for core" section should link
to or cite SUP-215 rather than merely assert that Alpine is approved.

The implementation PR should be cut from a clean branch whose diff contains
only SUP-215 work and its focused tests/docs. Targeting `dev` is acceptable if
`origin/dev..HEAD` contains only this work. Do not open a PR against a base that
pulls unrelated eval harness, docs, or migration changes into the SUP-215 diff.

### Core Model

The existing visual companion remains the only rendering path.

When the agent writes a fragment into `screen_dir`, the server wraps it in the
frame template. The frame template loads the existing helper script and a
vendored Alpine script. Agents can then use Alpine directives directly in
normal fragments:

```html
<div x-data="{ open: false }">
  <button @click="open = !open">Toggle details</button>
  <div x-show="open">Details...</div>
</div>
```

Static mockups remain valid. Alpine is passive unless a screen uses Alpine
directives.

### Vendored Alpine

Add one vendored browser artifact plus explicit provenance metadata:

```text
skills/brainstorming/scripts/vendor/alpine.js
skills/brainstorming/scripts/vendor/alpine.provenance.json
skills/brainstorming/scripts/vendor/THIRD_PARTY_NOTICES.md
```

The implementation must use Alpine 3.x, pin a specific version, and record
reproducible provenance. The initial vendored artifact should be the latest
stable Alpine 3.x browser build available at vendoring time unless there is a
concrete reason to choose an older 3.x release. `alpine.provenance.json` should
include:

- library name and version
- exact upstream artifact URL
- upstream tag or package version
- SHA256 hash of the vendored artifact
- vendoring date

`THIRD_PARTY_NOTICES.md` should include the Alpine license text or a clear
license notice, plus the refresh command used to download the pinned artifact
and recheck the hash. Do not hand-edit `alpine.js`.

Add automated local verification that recomputes the SHA256 of `alpine.js` and
checks it against `alpine.provenance.json`. Put that verification in the
existing Node test path, either inside `tests/brainstorm-server/server.test.js`
or in a sibling test that is run by `tests/brainstorm-server/package.json`. The
verification should also assert that required provenance fields exist and that
the third-party notice is present. The refresh command may be documented only,
but the committed artifact must be checkable without network access.

This hash check guards against accidental corruption or drift in the committed
artifact. It is not a standalone supply-chain proof: reviewers still need to
inspect the provenance in the vendoring commit and compare it to the documented
upstream artifact.

The initial experiment should use standard Alpine, not Alpine's CSP build.
Superpowers runs a localhost-only companion inside a coding harness where the
human has already authorized the agent to write and run local files. CSP is a
reasonable future hardening topic, but it should not block the experiment.

### Server Changes

`server.cjs` should serve vendored files from a narrow route, for example:

```text
GET /vendor/alpine.js
```

Only known vendored files should be served. Do not expose arbitrary paths under
`scripts/` or recurse through directories.

Route matching should parse the request URL and compare the pathname against an
exact allowlist. `GET /vendor/alpine.js` and
`GET /vendor/alpine.js?v=<anything>` should both return the vendored script.
Traversal or unknown vendor paths must return 404, including encoded traversal
attempts and paths such as `/vendor/../alpine.js`,
`/vendor/%2e%2e/alpine.js`, `/vendor/alpine.js/extra`, and
`/vendor/unknown.js`. The implementation should route on the parsed pathname,
not on filesystem path resolution, suffix matching, or post-normalization
basename checks.

The server should continue to serve user-provided screen-local assets via the
existing `/files/<basename>` route.

### Injection Order

Frame-wrapped fragments should load Alpine automatically. Agents should not add
an Alpine script tag themselves.

Implementation mechanism:

- Add `<script defer src="/vendor/alpine.js"></script>` to
  `frame-template.html`.
- Keep the existing helper server-injected from `server.cjs` into every served
  page, including waiting pages and full HTML documents.
- Do not automatically inject Alpine into waiting pages or full HTML documents.
  Full documents may include their own scripts, including `/vendor/alpine.js`,
  when they need complete control.
- Update the frame's default indicator copy from a selection-specific prompt to
  neutral language such as "Interact with the mockup, then return to the
  terminal." Preserve the helper's selected-choice update behavior when a
  deliberate `[data-choice]` is clicked.

Required runtime invariant:

- By the time `DOMContentLoaded` fires for a served frame-wrapped fragment,
  every `x-data` block in that fragment has been evaluated and `x-show` /
  `@click` directives are bound.
- The existing helper must still connect to the WebSocket server, reload on
  screen changes, and capture deliberate `[data-choice]` clicks.
- The helper must not depend on Alpine.

Expected served fragment order:

1. Page/frame HTML
2. Alpine script with `defer`
3. Existing helper injection

Because `defer` changes execution order, the implementation should test the
runtime behavior rather than only checking byte order in the served HTML.

V1 guarantees automatic Alpine support only for normal frame-wrapped fragments.
The common agent path should remain fragments; do not require robust
full-document Alpine injection in SUP-215.

### Codex Plugin Sync

The root sync script already uses anchored root-level excludes, so `/scripts/`
does not match nested skill-local paths like
`skills/brainstorming/scripts/vendor/alpine.js`. SUP-215 should preserve that
behavior rather than changing the exclusion model.

The sync script does need one user-visible change: generated Codex plugin PR
bodies should surface the vendored third-party code when the synced diff
includes `skills/brainstorming/scripts/vendor/alpine.js`. The PR body should
call out the approval artifact, license notice, and SHA256 provenance instead
of presenting the sync as an opaque tracked-file copy.

### Mockup Authoring Guidance

Update `visual-companion.md` so agents treat Alpine as available by default.

The key instruction:

> If a visual mockup includes something that looks clickable, editable, or
> selectable to a user, make it work only when that interaction is part of the
> current design question. Otherwise, render it visibly as passive non-control
> content or keep the behavior minimal and illustrative.

The guide should lead with an Alpine-backed interactive mockup example before
the existing selection-card examples. Existing `data-choice` examples should be
kept but clearly labeled as deliberate A/B choice affordances, not normal UI
controls.

Keep the guide compact. It should include one concise Alpine example and a
terse do/don't checklist, not a cookbook of separate snippets for every UI
pattern.

Common Alpine patterns the example or checklist may reference:

- tabs and sidebar navigation
- modal/dialog open and close
- accordion expand/collapse
- form input and lightweight validation
- multi-step wizard navigation
- toggle/switch state
- simple list add/remove/edit behavior
- toast or inline success feedback

Controls that should work when they are central to the current visual question:

- tabs and sidebar/nav items
- buttons that imply state changes
- toggles and switches
- form fields and submit buttons
- modal/dialog triggers
- accordion headers
- wizard next/back controls
- add/edit/delete list actions

Boundaries:

These are authoring rules enforced by agent discipline, skill guidance, human
review, and eval evidence. They are not enforced by the server, frame template,
or vendored Alpine in V1. If runtime enforcement becomes necessary, that should
be a follow-up hardening task, likely involving CSP and a revisit of the Alpine
CSP build.

- No fake backend calls.
- No network requests.
- No localStorage/sessionStorage persistence.
- No complex application logic beyond what the mockup needs to communicate.
- No interactivity that is not visually implied by the mockup.
- Do not build full add/edit/delete/search/wizard behavior merely because those
  controls appear in a realistic product screen. If the question is about visual
  hierarchy, surrounding app chrome can be passive.
- No script tags for Alpine; the frame provides it.
- Do not put exploratory Alpine controls inside `[data-choice]` containers
  unless the click is intended to select that choice. Use a separate choice
  affordance or `@click.stop` where appropriate.
- Replace existing network-positive guidance such as loading live Unsplash
  images. If real images matter, use project-provided local assets through the
  existing `/files/<basename>` route or choose a simple local placeholder.

### Sample Data Policy

Do not ship canned sample fixtures.

When a mockup represents data, the agent should create 2-5 compact, realistic,
domain-specific records. The records should match the product being discussed.
A family meal-planning tool should not show generic SaaS users; a workshop
scheduling app should show realistic sessions, facilitators, rooms, or dates.

Put records in Alpine `x-data` only when interaction needs state, such as
filtering, editing, adding, selecting, or stepping through records. If the data
is only presentational, render it directly as HTML.

This keeps mockups grounded in the user's idea and avoids every screen
collapsing into the same dashboard template.

### Feedback and Events

V1 keeps the current feedback model unchanged.

- The terminal remains the primary feedback channel.
- Existing `[data-choice]` click capture remains supported.
- Alpine interactions are for user understanding, not automatic telemetry.
- Default guide and frame language should say "try/interact with the mockup,
  then respond in the terminal," not "click an option" unless the screen is
  explicitly asking for an A/B/C choice.
- Use `data-choice` only when asking the user to choose among named options the
  agent should read on the next turn.
- Do not instrument ordinary tabs, forms, toggles, modals, or list interactions
  as choice events.
- Do not add broad interaction streaming in V1.
- Do not ask agents to wire new `brainstorm.feedback(...)` calls in V1.

This avoids expanding context with noisy interaction logs. The user can freely
poke at a mockup, then tell the agent what worked or did not work.

## V2 Follow-Up

After dogfooding Alpine-backed mockups, revisit the old selection-oriented
event model.

Possible V2 direction:

- Remove or de-emphasize the selection-specific helper code.
- Replace it with a general ephemeral interaction stream file.
- Keep that stream out of default context; agents should read it only when it is
  useful.
- Clear the stream when a new screen is pushed and/or when the server stops.

Do not implement this in SUP-215. The point of V1 is to learn whether Alpine
improves visual brainstorming before changing the feedback model.

## Security and Trust Boundary

Superpowers visual companion is not Brainstorm.

Brainstorm renders user-generated artifacts inside a multi-user web
application, so CSP and iframe sandboxing are product security boundaries.
Superpowers runs a local helper server inside the user's coding harness. The
server binds to `127.0.0.1` by default, and the user has already authorized the
agent to write local files and run local commands.

The relevant V1 guardrails are:

- keep the default bind host as localhost-only
- vendor Alpine instead of fetching it from a CDN at runtime
- serve only known vendored files
- prohibit network requests in generated mockups
- prohibit storage-based persistence in generated mockups

CSP and iframe sandboxing can be revisited if local usage reveals a concrete
need.

## Testing

Extend the existing brainstorm server tests.

Required coverage:

- `/vendor/alpine.js` returns the vendored Alpine script with a JavaScript
  content type.
- `/vendor/alpine.js?v=<anything>` returns the same vendored script.
- Unknown, nested, and traversal-ish vendor paths return 404, including encoded
  traversal attempts.
- Frame-wrapped fragments include the Alpine script automatically.
- Existing helper injection still occurs.
- Waiting pages and full HTML documents continue to receive helper injection
  and do not receive automatic Alpine injection.
- Existing `[data-choice]` click capture still writes `state/events`.
- A fragment containing Alpine attributes is served without stripping or
  escaping those attributes.
- Vendored Alpine provenance verification recomputes the SHA256 and checks the
  required metadata and notice files.

Do not pretend the existing `tests/brainstorm-server/server.test.js` harness can
prove Alpine runtime behavior. It is an HTTP/WebSocket test harness and does not
execute browser DOM events or Alpine directives. Runtime behaviors such as
`x-show`, `@click`, and `@click.stop` must be covered by a real browser test if
one is added, or by manual dogfood evidence in the PR.

Codex plugin sync coverage:

- Update `tests/codex-plugin-sync/test-sync-to-codex-plugin.sh` so the fixture
  includes the visual companion runtime files:
  `skills/brainstorming/scripts/server.cjs`,
  `skills/brainstorming/scripts/helper.js`,
  `skills/brainstorming/scripts/frame-template.html`,
  `skills/brainstorming/scripts/vendor/alpine.js`,
  `skills/brainstorming/scripts/vendor/alpine.provenance.json`, and
  `skills/brainstorming/scripts/vendor/THIRD_PARTY_NOTICES.md`.
- Assert that dry-run preview includes those nested skill-local runtime files.
- Assert that the no-op synced destination fixture contains those files, so the
  test proves root `/scripts/` exclusion does not remove
  `skills/brainstorming/scripts/`.
- If a positive changed-apply fixture is added, assert that the applied
  destination contains the vendored Alpine file and provenance files.
- Update `scripts/sync-to-codex-plugin.sh` PR body generation so any downstream
  Codex plugin PR carrying `skills/brainstorming/scripts/vendor/alpine.js`
  explicitly calls out the vendored third-party code, approval artifact,
  license notice, and SHA256 provenance.

Skill behavior coverage:

- Use `superpowers:writing-skills` for the `visual-companion.md` behavior
  change.
- Include adversarial pressure-test evidence in the implementation PR: initial
  prompt, environment, eval count, observed output, and whether the output met
  expectations.
- Cover at least this matrix:
  - Interactive mockup without `data-choice`: uses Alpine directives, omits an
    Alpine script tag, includes compact domain-specific sample data when useful,
    avoids backend/storage/network behavior, and asks the user to respond in the
    terminal.
  - Deliberate A/B choice: preserves `data-choice` for named options and keeps
    the choice semantics clear.
  - Static visual: uses no Alpine when interactivity is not useful.
  - Busy dashboard or app shell: limits interactivity to the design question and
    does not build a fake mini-application.
  - Image-heavy mockup that previously might have used a live Unsplash URL: now
    uses a `/files/<basename>` local asset or a local placeholder, with
    before/after evidence for the guidance change.

Manual dogfood check:

1. Start the visual companion with `scripts/start-server.sh --project-dir`.
2. Write a normal fragment that uses `x-data`, `@click`, and `x-show`.
3. Open the local URL.
4. Confirm Alpine initializes with no console errors.
5. Confirm `@click` changes state and `x-show` toggles visibility.
6. Confirm the interaction works without the agent adding an Alpine script tag.
7. Confirm a nested Alpine control using `@click.stop` near a `[data-choice]`
   surface does not produce an unintended extra choice event.
8. Confirm the terminal remains the feedback path.

If adding an automated browser dependency is too heavy for SUP-215, this
browser proof can be manual PR evidence rather than a new test dependency.

## Rollout

V1 is an experiment, but it should still ship cleanly:

- Keep changes contained to the brainstorming skill runtime, guide, and tests.
- Do not change the visual companion startup flow.
- Do not create a new mode in the user-facing language.
- Describe the behavior as "interactive mockups" or "Alpine-backed mockups,"
  not as a separate artifact/prototype system.
- Include the maintainer-approved dependency exception and third-party
  provenance in the PR.
- Include real browser dogfood evidence that Alpine initializes and runs.
- Include skill-behavior evidence that the updated guidance changes agent
  output, not just server bytes.
- Include the PR base in the review notes. The SUP-215 PR should show a focused
  diff against its chosen base.
- After dogfooding, decide whether SUP-215 should be followed by a V2 ticket
  for event-stream cleanup.
