# SDD plan-scoped workspace — design

- **Date:** 2026-07-06
- **Status:** approved direction (Jesse, 2026-07-06); this spec captures the investigation's recommended fix
- **Problem owner:** subagent-driven-development skill (`skills/subagent-driven-development/`)

## Problem

SDD's durable-progress workspace (`.superpowers/sdd/`, introduced v6.0.0/v6.0.3) has
no plan identity and no end-of-life. Every artifact is keyed by bare task number
(`progress.md`, `task-N-brief.md`, `task-N-report.md`), and SKILL.md instructs a
starting controller to treat whatever ledger it finds as its own progress:

> At skill start, check for a ledger:
> `cat "$(git rev-parse --show-toplevel)/.superpowers/sdd/progress.md"`. Tasks listed there
> as complete are DONE — do not re-dispatch them; resume at the first task
> not marked complete.

A fresh session executing a **follow-up plan** in the same worktree reads the
previous plan's ledger as its own. A straight-line reading of the skill tells it
to skip tasks. Nothing ever deletes the workspace, so the stale state persists
indefinitely and accumulates.

### Observed failures (serf repo, 2026-06-22 → 2026-07-05)

- **Cross-plan collisions, worked around ad hoc:** `cc-plugin-marketplaces`
  worktree accumulated 68 files across three plans. The P2 controller had to
  invent `progress-p2.md` and `p2-task-N-report.md` to dodge P1's ledger; P2's
  briefs silently overwrote P1's at the default paths; an abandoned
  `progress-p3.md` stub remains.
- **Git contamination, three times over:** SDD scratch was committed and needed
  two cleanup commits (`8305e340d`, `c966261a5`); three artifacts are tracked on
  serf main today, including a report authored on a different machine that now
  materializes in every fresh worktree. A follow-up plan's task-1 report
  overwrote an unrelated tracked one, leaving permanent `git status` noise.
- The self-ignoring `.gitignore` is written only when a script runs. Controllers
  that hand-append the ledger (observed) never create it, and gitignore is
  powerless once a file is tracked.

### Root cause

Identity lives nowhere in the data; correctness relies on cleanup that has no
trigger. Any fix that relies on end-of-plan cleanup alone fails exactly in the
crash/compaction cases the ledger exists to survive. Identity must be
structural.

## Design

### 1. Per-plan workspace directory (structural identity)

The workspace becomes `.superpowers/sdd/<plan-slug>/`, where `<plan-slug>` is
the plan file's basename without its `.md` extension (plan filenames are
already dated kebab-case, e.g. `2026-07-04-plugin-marketplaces-p1-backend-core`).
Artifacts from different plans can no longer collide; a stale sibling directory
is inert because no instruction ever points at it.

Script interface (all in `skills/subagent-driven-development/scripts/`):

- `sdd-workspace PLAN_FILE` — resolves and creates
  `<repo-root>/.superpowers/sdd/<plan-slug>/`, maintains the self-ignoring
  `.gitignore` at `.superpowers/sdd/.gitignore` (parent level, content `*`),
  prints the plan directory's absolute path. Errors (exit 2) on missing
  argument or nonexistent plan file. Slug must be non-empty after stripping.
- `task-brief PLAN_FILE N [OUTFILE]` — signature unchanged; default OUTFILE
  moves to `<workspace>/task-N-brief.md` via `sdd-workspace PLAN_FILE`.
- `review-package PLAN_FILE BASE HEAD [OUTFILE]` — gains PLAN_FILE as first
  argument; default OUTFILE moves to `<workspace>/review-<base7>..<head7>.diff`.

No compatibility path for the old flat layout: the scripts and SKILL.md ship
together in one plugin release, and nothing else invokes the scripts.
(Explicitly confirmed: no backward-compatibility handling.)

### 2. Ledger names its plan (belt for hand-rolled ledgers)

The ledger stays `<workspace>/progress.md`. When created, its first line MUST
be:

```
# SDD ledger — plan: docs/superpowers/plans/<plan-file>.md
```

SKILL.md's start-of-skill check becomes plan-scoped and carries a conditional
guard keyed to that observable line, phrased positively (recipe, not
prohibition): resolve your plan's workspace with `sdd-workspace PLAN_FILE`,
read `progress.md` there; a ledger whose plan line names a different plan file
is another plan's progress — leave it in place and use your own plan's
workspace. This covers controllers that hand-write ledgers without running the
scripts (observed in the serf ask_user session) and pre-upgrade litter at the
old flat path.

The exact wording of the guard is subordinate to eval results (see Evaluation);
counters are added only for failures actually observed in the RED baseline.

### 3. Workspace end-of-life (hygiene, not correctness)

When the final whole-branch review is clean and its fix wave (if any) is
merged — immediately before handing off to
`superpowers:finishing-a-development-branch` — the controller deletes its
plan's workspace directory (`rm -rf "$WORKSPACE"`). The record of the work is
the git history; the ledger's job (mid-plan compaction recovery) is over.
Sibling directories are never touched: crashed or parallel plans own their own
dirs, and deliberately parked cross-plan artifacts (observed pattern:
`WAVE1-HANDOFF.md`) live directly under `.superpowers/sdd/` untouched by any
plan's cleanup.

### 4. SKILL.md touch points

- **Durable Progress** section: workspace resolution via `sdd-workspace
  PLAN_FILE`; ledger check scoped to the plan's own workspace; ledger-creation
  format including the plan line; the mismatch guard; completion deletion; the
  `git clean -fdx` hazard note updated to the new path.
- **Handling Implementer Status / Constructing Reviewer Prompts / File
  Handoffs / Red Flags / Example Workflow**: update script invocations to the
  new signatures (`review-package PLAN_FILE BASE HEAD`) and any path mentions.
  `implementer-prompt.md` and `task-reviewer-prompt.md` contain no workspace
  paths (verified) and need no changes.
- Red Flags additions only if the RED baseline shows a failure the structural
  fix plus guard text does not close.

## Out of scope (deliberate)

- No changes to `finishing-a-development-branch` or any other skill.
- No git-level guards against committing `.superpowers/` beyond the existing
  parent `.gitignore`.
- No retroactive cleanup of the serf repo (separate follow-up).
- No legacy-layout migration or fallback reads.

## Testing

### Deterministic shell tests (`tests/claude-code/test-sdd-workspace.sh`, extended)

- `sdd-workspace PLAN` prints `<root>/.superpowers/sdd/<slug>` and creates it;
  errors without a plan arg; errors on missing plan file.
- Two different plan files resolve to two distinct directories; artifacts
  written via `task-brief` land in their own plan's directory.
- `review-package PLAN BASE HEAD` writes under the plan's directory.
- Parent `.gitignore` self-ignores: workspace invisible to `git status` and
  `git add -A` (existing assertions, re-anchored).
- Linked-worktree distinctness (existing assertion, re-anchored).
- Existing suites `test-subagent-driven-development.sh` /
  `-integration.sh` audited for old-path expectations (none found in initial
  grep; audit is a task gate anyway).

### Evaluation (writing-skills RED → GREEN, re-scoped 2026-07-06)

Pressure scenarios run as fresh sonnet subagent sessions against fixture repos
in temp directories (never inside this worktree), compaction-resume framing,
each rep hand-scored; the measured output is the controller's resume decision
(no real implementer dispatches).

**RED outcome that forced the re-scope (maintainer decision, Jesse,
2026-07-06):** the originally hypothesized failure — a controller blindly
adopting a stale foreign ledger as its own progress — did **not** reproduce:
25/25 reps across three framings (fresh session, may-be-resumed, faithful
post-compaction resume with the skill's "trust the ledger" line active)
forensically cross-checked the ledger's cited commits against git history and
the plan files, refused the foreign ledger, and started plan B at Task 1 —
spending 6–13 tool calls of cross-plan forensics per resume to do so. Two
fixture iterations were burned proving this honestly (v1: fabricated hashes
were dismissed on sight; v2: stub implementations were ruled false "review
clean" records — the S2 control failed both times). Full record in the
committed eval docs.

**Re-scoped claims and gates:**

- The change ships on the structural record (collisions, improvised side-band
  names, overwritten briefs, git contamination — serf repo) plus the measured
  disambiguation tax, with explicit maintainer sign-off standing in for the
  writing-skills failing-baseline requirement on the SKILL.md text.
- **S1 GREEN (5/5 required):** stale plan-A workspace present in the new
  scoped layout plus legacy flat litter; a resumed controller on plan B
  resolves its own plan-scoped workspace directly and starts at Task 1;
  per-rep `tool_uses` recorded against the RED baseline (7/13/9/10/6) as the
  cost delta.
- **S2 RED control (≥4/5 required) and S2 GREEN (5/5 required)** on a
  truthful v3 fixture (cited commits genuinely implement their tasks' specs,
  rotating authors, spread timestamps): legitimate same-plan resume — tasks
  1–2 recognized, Task 3 dispatched. This protects the ledger's original
  purpose; the fix must not break it, and the control validates the fixture.

Results land in `docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-results.md`
and are summarized in the PR.

## Risks

- **Slug collisions between distinct plans with identical basenames** in
  different directories: accepted; plan filenames are date-prefixed by
  convention, and same-basename means same plan in practice (resume is then the
  desired behavior).
- **Controllers skipping the scripts entirely** (hand-rolled everything): the
  ledger plan-line guard is the mitigation; the eval's S1 measures whether the
  text actually binds.
- **Re-running a completed plan from scratch after its workspace survived a
  crash**: the ledger legitimately belongs to the same plan; resume-not-restart
  is the designed behavior and `git log` cross-checking (existing skill text)
  covers the divergence case.
