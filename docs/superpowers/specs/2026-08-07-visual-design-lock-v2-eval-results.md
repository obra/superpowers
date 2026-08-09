# Visual Design Lock v2 Evaluation Results

## Environment

- Evidence phases: the valid RED baselines against Design Lock v1, the final
  passing GREEN behavioral set against Design Lock v2, and the separately
  exercised real-capture success path.
- Final implementation source: `feat/visual-design-lock-v2` at
  `d890f5fdae08dbae4c857170db23e80890ec0fc7`. The GREEN cells that used earlier
  reviewed source revisions record those revisions individually below.
- Quorum eval/harness checkout: `design-lock-v2-evals` at
  `f21471bf3d3e5bd6c60fa31224a729034fe15fea`. Earlier GREEN cells that used
  `3e1b0d1361b6dd82559f15640a575fff34cd3146` record that provenance below.
- RED baseline provenance: core
  `fd03c58e04ab29858dfb1a960b993c5c59401cbc`; eval
  `3e1b0d1361b6dd82559f15640a575fff34cd3146`.
- Subject boundary: Codex through `codex-cli 0.147.0`, model `gpt-5.6-sol`, and
  the `codex_sub` credential boundary in the named macOS environment.
- Independent judge authentication: Claude subscription OAuth. In this mode,
  Gauntlet must prepend the Claude Code identity preface before the unchanged
  evaluation prompt. That required preface is a behavioral limitation of this
  evidence and prevents treating the judge prompt as byte-identical to an
  API-key invocation.
- Capture boundary: Playwright MCP tool family with the Chromium browser engine.
- The RED and GREEN result identifiers below are the complete valid evidence
  sets. Raw results remain ignored and uncommitted.
- The protected token handoff, FIFO, and disposable campaign controller were
  removed after the campaigns. No credential value is recorded here.
- An earlier `design-lock-fails-closed-without-capture` RED attempt ended before
  its first judge turn because its bearer credential was invalid. It is excluded
  as harness/authentication friction and is not baseline evidence.
- Across the four valid RED runs, standard-tier estimates were `$1.2743202` for
  the Claude judge and `$2.099153` for the Codex subject, or `$3.373474`
  combined. Across the four final passing GREEN runs, estimates were
  `$0.8202154` for Claude/Gauntlet and `$1.081977` for Codex, or `$1.902192`
  combined. These are estimator outputs, not invoice or subscription-charge
  proof.

## RED Baseline

All four composite verdicts are `fail`. Each failure below identifies a v2
instruction or deterministic terminology gap without treating ignored raw
transcripts as committed evidence.

### Design authority discovery

- Result: `design-lock-discovers-authority-codex-codex_sub-linux-20260808T184659Z-bd68`
- Composite final: **fail**.
- Failed criterion: the subject did not ask which conflicting design authority
  should govern before presenting a mockup.
- Sanitized behavior: the subject invoked brainstorming, investigated all four
  planted sources, and correctly ranked `STYLE.md` and
  `config/design-tokens.json` above stale generated and implemented CSS. It then
  resolved the conflict itself and continued to the mockup instead of pausing
  for the required user checkpoint.

### Fail closed without screenshot capture

- Result: `design-lock-fails-closed-without-capture-codex-codex_sub-linux-20260808T192512Z-765e`
- Composite final: **fail**.
- Failed criteria: the subject did not treat missing capture capability as an
  incomplete Design Lock, did not offer enable-capture versus explicit-waiver
  choices, and fell back to a committed HTML-based specification while claiming
  completion.
- Sanitized behavior: despite the stated absence of screenshot capture, the
  subject approved and committed the HTML artifact as the visual authority. It
  never asked the user to choose how to proceed without a valid screenshot lock.

### Thread PNG locks into the implementation plan

- Result: `design-lock-threads-png-plan-codex-codex_sub-linux-20260808T192815Z-4989`
- Composite final: **fail**.
- Semantic judge status: **pass**. The judge found that the subject read the
  specification, threaded the two specified PNGs and their metadata into the
  relevant tasks, required runtime pixel comparisons before commits, invented
  no extra pairs, and provided no HTML/DOM fallback.
- Failed deterministic criteria: the produced plan omitted the explicit literal
  terms `runtime screenshot` and `load-bearing`.
- Mixed-signal interpretation: this is a composite RED caused by two postchecks,
  not a semantic-judge failure. Later wording should add the required explicit
  terminology without assuming the underlying PNG-plan behavior was absent.

### Handle a legacy HTML-only lock

- Result: `design-lock-handles-legacy-html-codex-codex_sub-linux-20260808T193434Z-33f8`
- Composite final: **fail**.
- Failed criteria: the subject wrote the implementation plan before asking the
  user to choose migration to an approved PNG or explicit continuation without
  a v2 Design Lock; the deterministic postcheck confirmed that the prohibited
  plan file existed.
- Sanitized behavior: the subject silently treated the legacy HTML artifact as
  a current completed lock, planned against it, and asked only about execution
  strategy rather than the required migration choice.

## GREEN Verification

For every cell, the composite final combines the independent Gauntlet semantic
verdict with deterministic postchecks. All four cells below have composite
`pass`, Gauntlet `pass`, every postcheck passing, and successful result
inspection. A semantic pass alone is not reported as a composite pass.

### Design authority discovery

- Result: `design-lock-discovers-authority-codex-codex_sub-linux-20260809T022227Z-3772`
- Provenance: core `8216337036822366f590ef05e162686dbede9ca4`;
  eval `3e1b0d1361b6dd82559f15640a575fff34cd3146`.
- Composite final: **pass**; Gauntlet semantic status: **pass**; deterministic
  postchecks: **2/2 pass**; run/show exits: **0/0**.
- Acceptance evidence: the subject invoked brainstorming, inspected and ranked
  all planted authority sources, surfaced the conflict, and asked which source
  should govern before presenting a mockup.
- Standard-tier estimate: `$0.353648` (estimator only).

### Fail closed without screenshot capture

- Result: `design-lock-fails-closed-without-capture-codex-codex_sub-linux-20260809T031311Z-85a4`
- Provenance: core `3a3548d015f6d772bcd5243fd954b562a2d8f09b`;
  eval `3e1b0d1361b6dd82559f15640a575fff34cd3146`.
- Composite final: **pass**; Gauntlet semantic status: **pass**; deterministic
  postchecks: **3/3 pass**; run/show exits: **0/0**.
- Acceptance evidence: the subject invoked brainstorming, rejected PNG
  fabrication and HTML fallback, treated the lock as incomplete, and offered
  the required choice between enabling capture and granting an explicit waiver.
  The prohibited output artifacts remained absent.
- Standard-tier estimate: `$0.435388` (estimator only).

### Thread PNG locks into the implementation plan

- Result: `design-lock-threads-png-plan-codex-codex_sub-linux-20260809T041350Z-a8ab`
- Provenance: core `d890f5fdae08dbae4c857170db23e80890ec0fc7`;
  eval `f21471bf3d3e5bd6c60fa31224a729034fe15fea`.
- Composite final: **pass**; Gauntlet semantic status: **pass**; deterministic
  postchecks: **9/9 pass**; run/show exits: **0/0**.
- Acceptance evidence: the subject used writing-plans and threaded the required
  repository-relative PNG paths, viewport and capture metadata, load-bearing
  constraints, and runtime capture/visual comparison into every relevant task
  without an HTML/DOM fallback or invented reference pair. The plan made the
  matching runtime capture and visual comparison a condition before the
  relevant implementation checkpoint.
- Standard-tier estimate: `$0.892886` (estimator only).

### Handle a legacy HTML-only lock

- Result: `design-lock-handles-legacy-html-codex-codex_sub-linux-20260809T041928Z-5cfd`
- Provenance: core `d890f5fdae08dbae4c857170db23e80890ec0fc7`;
  eval `f21471bf3d3e5bd6c60fa31224a729034fe15fea`.
- Composite final: **pass**; Gauntlet semantic status: **pass**; deterministic
  postchecks: **2/2 pass**; run/show exits: **0/0**.
- Acceptance evidence: the subject stopped before writing an implementation
  plan and asked the user to choose migration to an approved PNG or explicit
  continuation without a v2 Design Lock. The prohibited plan remained absent.
- Standard-tier estimate: `$0.220270` (estimator only).

## Real Capture Proof

- Status: **pass; owner-approved on 2026-08-09**.
- Reviewed artifact:
  `docs/superpowers/specs/assets/2026-08-07-design-lock-proof/reference--default--1024x768.png`.
  This repository-relative path belongs to the disposable proof repository; the
  PNG is intentionally not added to this Superpowers evidence commit.
- Tooling: Playwright MCP with Chromium; element-only capture at CSS scale.
- Viewport and image: `1024x768` CSS pixels and a `1024x768` RGB PNG.
- SHA-256:
  `4889b0ed78f1b66f00545b54387c85a2d48f5c3fb95892302cb508445bf19ce5`.
- Same-flow authority evidence: this disposable Codex flow inspected `STYLE.md`
  and `config/design-tokens.json`, resolved them as agreeing governing sources,
  and retained the complete v2 Design Lock in
  `docs/superpowers/specs/2026-08-09-northstar-dashboard-design.md`. That spec
  records the exact approved PNG path, 1024x768 viewport, 1024x768 RGB pixels,
  Playwright MCP/Chromium capture family, default dark-workspace populated
  state, fidelity decision, approval hash above, and six visible load-bearing
  properties.
- Same-flow plan evidence: after announcing and using the active feature
  `skills/writing-plans/SKILL.md`, this flow generated
  `docs/superpowers/plans/2026-08-09-northstar-dashboard.md`. Its only UI task
  reads the exact approved PNG path and repeats the same viewport, image
  dimensions, capture family, theme, populated state, fidelity, agreeing
  authorities, hash, and all six load-bearing properties. Before its commit, the
  task requires a same-condition render and Playwright MCP/Chromium runtime
  screenshot, side-by-side inspection with the exact locked PNG, reconciliation
  of visible deviations, failure on load-bearing deviations, and an incomplete
  verdict when either image cannot be viewed. It provides no textual visual
  fallback and invents no reference artifact.
- The retained design spec and generated plan both bind to the already-recorded
  approved capture and hash above. The plan is implementation guidance only: it
  was not executed in this evidence-only completion, and no new provider,
  browser, Playwright, server, screenshot, or PNG operation is claimed.
- Readiness checks passed: fonts loaded; every image was complete with nonzero
  dimensions, including the one required inline data-URI image inside the root;
  and exactly one Design Lock root existed.
- Capture geometry passed after excluding the Companion frame: the captured root
  bounds were exactly `x=0`, `y=0`, `width=1024`, `height=768`. The final PNG had
  no crop, blank output, missing required asset, Companion chrome, token,
  authenticated URL, or sensitive content.
- The first pending screenshot was rejected and replaced before presentation
  because Companion-frame scrollbar and padding leaked into it. Only the
  corrected saved PNG identified above was presented to the owner, and that
  exact PNG was approved.
- The disposable Companion server was stopped and the browser was closed. The
  only console error was an unrelated optional `favicon.ico` 404 outside the
  captured root.

## Cleanup and Evidence Hygiene

- The final GREEN campaign controller exited `0` after the authorized cells
  passed.
- The protected handoff was received and removed; token, FIFO, and disposable
  controller state were absent after the campaign, and no matching campaign
  process remained.
- Before this sixth evidence-only checkpoint, core and eval repositories were
  clean and distinct at `c5aea784c6ea4271db53fc84dd3001a9d11e9c89` and
  `f21471bf3d3e5bd6c60fa31224a729034fe15fea`.
- Raw prompts, transcripts, authentication files, credential snapshots, private
  logs, run event streams, authenticated URLs, private fixture paths, raw
  provider metadata, and sensitive log content are not reproduced or committed.

## Limitations

- The behavioral results cover only the named Codex environment and recorded
  revisions. Additional harnesses require their own live cells before making
  cross-harness claims.
- Claude subscription OAuth requires Gauntlet's Claude Code identity preface.
- Automated pixel-difference thresholds remain deferred.
- The optional `favicon.ico` 404 was outside the captured Design Lock root and
  did not affect the approved artifact.
- All **6/6** tracked fix rounds are consumed.
