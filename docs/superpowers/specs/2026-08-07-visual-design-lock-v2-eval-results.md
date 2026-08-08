# Visual Design Lock v2 Evaluation Results

## Environment

- Evidence phase: RED baselines against the unchanged Design Lock v1 skills.
  No GREEN or real-capture evidence is claimed here.
- Core worktree baseline: `feat/visual-design-lock-v2` at
  `fd03c58e04ab29858dfb1a960b993c5c59401cbc`.
- Eval definitions: `design-lock-v2-evals` at
  `3e1b0d1361b6dd82559f15640a575fff34cd3146`.
- Subject: Codex through the `codex_sub` credential boundary.
- Independent judge authentication: Claude subscription OAuth. In this mode,
  Gauntlet must prepend the Claude Code identity preface before the unchanged
  evaluation prompt. That preface is a behavioral limitation of this evidence.
- The four recorded result directories below are the complete valid baseline
  set. Raw results remain ignored and uncommitted.
- The protected token handoff, FIFO, and disposable controller were removed
  after the campaign. No credential value is recorded here.
- An earlier `design-lock-fails-closed-without-capture` attempt ended before its
  first judge turn because its bearer credential was invalid. It is excluded as
  harness/authentication friction and is not baseline evidence.
- Across the four valid runs, standard-tier estimates were $1.2743202 for the
  Claude judge and $2.099153 for the Codex subject, or $3.373474 combined.
  These are estimator outputs, not invoice or subscription-charge proof.

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

## Evidence boundary

- These results establish only the RED baseline against v1.
- The valid verdict files were used for sanitized final verdicts, criteria,
  rationalizations, and aggregate estimates. Raw prompts, transcripts,
  authentication files, credential snapshots, private logs, run event streams,
  authenticated URLs, and provider metadata are not reproduced here.
- GREEN behavior and real screenshot-capture proof remain future, separately
  authorized evidence.
