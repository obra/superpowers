# Visual Design Lock v2 Design

Status: Approved on 2026-08-07

This specification supersedes
`docs/superpowers/specs/2026-07-10-visual-design-lock-design.md` for new Design
Locks. The earlier specification and existing downstream artifacts remain
historical records; this revision does not rewrite or delete them.

## Goal

Make the visual artifact approved during brainstorming the artifact that humans
and implementation agents actually use for alignment. A completed Design Lock
must preserve the rendered appearance as an approved PNG screenshot, carry its
capture conditions into the specification and implementation plan, and fail
visibly when the screenshot cannot be produced or verified.

## Motivation

Design Lock v1 closed an important workflow gap: it carried a selected Visual
Companion design through the specification and plan to task-level implementers.
Its required artifact, however, was a standalone HTML export while screenshots
were optional. In practice:

- opening the HTML often did not provide a useful visual reference;
- the exporter described output as self-contained but preserved external
  references from fragments and full documents;
- nested or unresolved image references could render differently or fail;
- the frame template introduced recurring trailing-whitespace cleanup; and
- downstream comparison still depended on an agent reconstructing the visual
  result from markup.

The original design-system discovery instruction was also too narrow. It named
implementation tokens and component libraries but did not reliably require
inspection of style documentation, design-language guidance, Style Dictionary
sources, token files, or component catalogs.

## Decisions

1. **PNG is the only committed visual artifact for new Design Locks.** The
   standalone HTML exporter is removed rather than retained as a fallback.
2. **Screenshot capture is supplied by the active harness.** Codex can use its
   Playwright MCP capability; another harness may use an equivalent browser
   screenshot tool. Superpowers adds no browser package or executable discovery.
3. **Capture fails closed.** Missing screenshot capability, broken rendering, or
   lack of approval leaves the Design Lock incomplete. The user may enable a
   capable tool or explicitly proceed without a Design Lock.
4. **Capture only approved conditions.** Every lock requires the viewport that
   was approved. Additional captures are required only for responsive
   breakpoints whose behavior is explicitly load-bearing.
5. **The actual PNG is the approval surface.** Approval of the live mockup alone
   does not complete the lock; the saved screenshot itself must be presented
   and approved.
6. **Text remains part of the contract.** The fidelity decision, authoritative
   design sources, and load-bearing properties remain in the specification so
   the intent is accessible even when an agent cannot reason directly from an
   image.

## Design-System Discovery

Discovery happens before the first mockup in a project with an existing UI. It
is an ordered inspection, not a silent precedence rule.

### 1. Human-authored guidance

Inspect repository instructions and likely design sources, including:

- `STYLE.md`, `STYLEGUIDE.md`, `DESIGN_SYSTEM.md`, and similarly named files;
- brand, visual-language, or design-language documentation;
- accepted ADRs and product specifications that constrain the interface; and
- repository-local instructions that identify an authoritative design source.

### 2. Source tokens and generators

Inspect the source of the token system rather than relying only on generated
output:

- Style Dictionary configuration and package usage;
- source token JSON, YAML, JavaScript, or TypeScript files;
- semantic color, typography, spacing, radius, elevation, and motion tokens;
- theme-generation configuration; and
- mappings from semantic tokens to platform-specific output.

Generated CSS, Swift, Android, or other platform artifacts may corroborate the
source but do not silently replace it.

### 3. Component and theme surfaces

Inspect:

- Tailwind or equivalent framework configuration;
- CSS custom properties and theme modules;
- Storybook or another component catalog;
- shared component libraries; and
- the currently implemented screens most analogous to the proposed work.

### 4. Reconciliation

Compare documentation, source tokens, generated output, and live implementation.
If they materially disagree, describe the conflict and ask the user which source
should govern the mockup. Do not silently choose whichever file was found first.
Record the selected source paths and decision in the Design Lock fidelity
section. For a greenfield project, record that the approved lock seeds the new
design system.

## Harness Screenshot Capability Contract

The skill does not depend on a particular MCP name. A harness is screenshot
capable only if it can:

1. navigate to the authenticated Visual Companion URL;
2. set a deterministic viewport;
3. evaluate or otherwise confirm page readiness;
4. capture a selected design root as a PNG file;
5. save or copy that PNG into the repository; and
6. present the saved PNG for human approval.

Codex's Playwright MCP navigation, resize, evaluation, wait, and screenshot
operations satisfy this contract. Equivalent tools in other harnesses are
acceptable. OS-level manual screen crops are not equivalent because they do not
provide a deterministic viewport or reliable exclusion of terminal and browser
chrome.

## Capture Protocol

### Final rendering

When exploration ends for a screen, write a winner-only fragment with no option
chooser, selection handlers, or comparison chrome. Wrap the complete approved
screen in exactly one stable root:

```html
<main data-design-lock-root>
  <!-- approved screen -->
</main>
```

The user first validates the live rendering. That approval selects the design
but does not yet complete the lock.

### Deterministic capture

For each required state and viewport:

1. Navigate the harness browser to the tokenized URL returned by the running
   Visual Companion.
2. Set the approved viewport dimensions and the required theme and UI state.
3. Wait for `document.fonts.ready` or its tool-equivalent.
4. Verify that every required image reports complete loading and nonzero natural
   dimensions. Treat console or network evidence of a required asset failure as
   a rendering failure.
5. Verify that `[data-design-lock-root]` exists exactly once and has nonzero
   bounds.
6. Disable animations, transitions, and blinking carets for capture without
   changing layout or content.
7. Capture only the design root as a lossless PNG at CSS-pixel scale. This
   excludes Visual Companion branding, helper UI, and connection chrome while
   avoiding machine-specific device-pixel-ratio dimensions.
8. Verify that the saved file is a readable PNG, record its actual pixel
   dimensions, and confirm they are consistent with the selected design root
   and viewport.
9. Inspect the PNG for crop errors, blank regions, missing assets, or unintended
   sensitive content.
10. Present that exact PNG to the user and obtain explicit approval.

The authenticated URL and token are runtime-only values. They must never appear
in committed metadata, specifications, screenshots, or filenames.

### Responsive scope

Capture the viewport actually approved during design. Capture another viewport
only when the specification declares behavior at that breakpoint load-bearing.
Once declared, the additional screenshot becomes mandatory for a completed
lock. Do not generate desktop-and-mobile pairs mechanically when only one layout
was designed.

## Artifact Contract

### Location and naming

Store screenshots beside the specification under:

```text
docs/superpowers/specs/assets/YYYY-MM-DD-<topic>/
```

Use semantic filenames:

```text
<screen>--<state>--<width>x<height>.png
```

Example:

```text
dashboard--default--1440x900.png
dashboard--navigation-open--390x844.png
```

A pre-commit design revision may replace its pending screenshot, but it requires
fresh approval. A post-commit design revision creates a versioned artifact, such
as `dashboard--default--1440x900-v2.png`, and updates the specification rather
than silently replacing the historical lock.

### Specification section

When a Design Lock is completed, the specification contains a **Design Lock**
section with:

1. **Artifact table** — screen, state, theme, viewport, PNG pixel dimensions,
   path, and capture engine/tool family.
2. **Fidelity decision** — match the screenshot as rendered, or adapt only the
   explicitly named properties while using identified existing tokens.
3. **Authoritative sources** — repository paths and the resolution of any
   conflicts found during discovery.
4. **Load-bearing properties** — 3–7 plain-language properties per screenshot
   that define what must survive implementation.
5. **Approval statement** — confirmation that the saved PNG, not only the live
   page, was reviewed and approved.

No separate metadata sidecar is required. The specification is the durable
human- and machine-readable metadata record.

### Self-review

Before the specification is considered ready:

- every required PNG path exists;
- every PNG is readable and has the recorded dimensions;
- every declared load-bearing breakpoint has an artifact;
- every authoritative source path exists or is explicitly external;
- the artifact contains no accidental credentials, tokens, or private data;
- no HTML artifact is listed for a new v2 lock; and
- the approval statement refers to the actual saved screenshots.

## Plan Threading and Runtime Verification

If a specification contains a v2 Design Lock:

- copy the fidelity decision, authoritative sources, artifact paths, viewport,
  theme, state, and load-bearing properties into the plan's Global Constraints;
- add each relevant PNG to the UI task's **Files** block as a required visual
  reference; and
- add a pre-commit verification step that renders the implementation under the
  same viewport, theme, and state and captures a runtime screenshot.

The implementer compares the runtime screenshot with the locked PNG. Automated
pixel diffing is optional and cannot replace human or multimodal inspection.
Deviations from load-bearing properties are failures. Other visible deviations
must be reconciled according to the fidelity decision rather than dismissed as
implementation style choices.

An implementer that cannot view the locked screenshot or capture the runtime
surface cannot claim the comparison passed. It must obtain equivalent tooling
or report verification as incomplete. The textual properties improve
accessibility and planning clarity but are not a silent substitute for the
required visual comparison.

## Failure and Waiver Behavior

- **No capture-capable harness:** explain the missing capability. The user may
  enable one or explicitly proceed without a Design Lock.
- **Broken fonts or assets:** fix the rendering and recapture. Do not approve a
  partial screenshot.
- **Capture cannot be saved or presented:** the lock is incomplete.
- **Design changes before commit:** replace the pending image and obtain fresh
  approval.
- **Design changes after commit:** add a versioned image and update the
  specification with fresh approval.
- **Runtime comparison cannot be performed:** implementation verification is
  incomplete, not passed.
- **Intentional runtime deviation:** obtain approval and update the lock rather
  than treating the deviation as an implementation detail.

A waiver removes or clearly marks the Design Lock obligation; it does not allow
an incomplete lock to be described as complete.

## Legacy Design Locks

Existing HTML artifacts and specifications remain untouched. New sessions do
not create HTML Design Lock artifacts. When `writing-plans` encounters a legacy
HTML-only lock, it must identify it as legacy and ask for either:

1. migration to an approved PNG lock under this specification; or
2. explicit permission to proceed without a v2 Design Lock.

It must not silently reinterpret the legacy HTML as a completed screenshot lock,
and implementation must not bulk-delete historical artifacts from downstream
repositories.

## Files and Boundaries

### Modify

- `skills/brainstorming/visual-companion.md` — expanded discovery, capability
  contract, deterministic capture, approval, and lifecycle instructions.
- `skills/brainstorming/SKILL.md` — PNG-only Design Lock specification contract
  and self-review.
- `skills/writing-plans/SKILL.md` — PNG metadata threading and same-condition
  runtime comparison.
- `tests/brainstorm-server/package.json` — remove the exporter test command.

### Remove

- `skills/brainstorming/scripts/export-mockup.cjs`
- `skills/brainstorming/scripts/export-mockup.sh`
- `tests/brainstorm-server/export-mockup.test.js`

### Preserve

- `skills/brainstorming/scripts/server.cjs`
- Visual Companion session persistence and authenticated URL behavior
- `skills/brainstorming/scripts/frame-template.html`
- `executing-plans`, `subagent-driven-development`, and
  `verification-before-completion`
- zero new runtime dependencies

## Verification Strategy

### Repository regression checks

- Run the complete `tests/brainstorm-server` suite after removing the exporter
  test entry.
- Run repository shell lint and diff checks.
- Confirm packaging still includes the modified skills and no removed exporter
  reference remains.

### Real capture proof

Run one end-to-end Codex session using Playwright MCP and retain reviewed
evidence that:

- discovery inspected representative documentation and token sources;
- the browser used a deterministic viewport;
- fonts and images were ready;
- the PNG excluded Companion chrome;
- the viewport and PNG pixel dimensions matched the specification;
- the saved PNG was presented and approved; and
- a generated UI plan carried the correct path and comparison conditions.

### Behavioral evals

Behavior-shaping skill changes require before/after evaluation rather than only
static string assertions. Add scenarios covering:

1. `STYLE.md`, Style Dictionary, token, Storybook, and live-component discovery;
2. conflict between design documentation and implemented tokens;
3. successful screenshot locking and actual-PNG approval;
4. absent screenshot capability without a false success claim;
5. one approved viewport plus an explicitly load-bearing breakpoint;
6. legacy HTML-only lock handling; and
7. UI plan tasks receiving the PNG, capture metadata, and comparison obligation.

Static content assertions may protect key terminology, but they are not evidence
that agents follow the workflow.

## Acceptance Criteria

- New Design Locks contain approved PNG screenshots and no committed HTML visual
  artifacts.
- Discovery explicitly checks style documentation, source token systems,
  component catalogs, themes, and live implementation.
- Material conflicts between sources are surfaced and resolved rather than
  silently ignored.
- Capture uses a deterministic viewport and verifies fonts, images, root bounds,
  file type, image pixel dimensions, and commit safety.
- The user approves the actual saved PNG.
- Only approved and explicitly load-bearing viewports are required.
- Specifications record complete artifact metadata, fidelity, authoritative
  sources, and load-bearing properties.
- Relevant plan tasks receive the PNG and require same-condition runtime visual
  comparison.
- Missing tooling or incomplete rendering cannot produce a completed lock.
- The standalone HTML exporter and its test are removed with no Visual Companion
  regression.
- Behavioral evals and one real capture transcript demonstrate the workflow.

## Deferred Work

- Automated pixel-difference thresholds.
- A bundled browser or Playwright runtime dependency.
- Browser-executable discovery in core.
- Automatic migration or deletion of downstream legacy HTML artifacts.
- Changes to Visual Companion server endpoints or session persistence.
