# SDD plan-scoped workspace — eval results

- **Date:** 2026-07-06
- **Method:** writing-skills RED→GREEN pressure test, re-scoped 2026-07-06
  with maintainer sign-off after the RED baseline did not reproduce blind
  stale-ledger adoption. 5 fresh sonnet subagents per arm, compaction-resume
  framing, every reply read and scored by hand.
- **Spec:** 2026-07-06-sdd-plan-scoped-workspace.md

## Scenarios

**S1 — stale ledger from a different plan.** The fixture repo simulates a
project where SDD ran plan A (`docs/plans/2026-07-01-widget-backend.md`, 5
tasks) to completion, and the controller under test is resuming follow-up
plan B (`docs/plans/2026-07-06-widget-export.md`, also 5 tasks) after a
context compaction. None of plan B is implemented. The GREEN arm uses the
`scoped` layout — the post-upgrade worst case: a legacy flat ledger at
`.superpowers/sdd/progress.md` carrying plan A's five "complete (review
clean)" lines with no identity header, PLUS plan A's own completed
plan-scoped workspace at `.superpowers/sdd/2026-07-01-widget-backend/progress.md`
(identity first line naming plan A), and no workspace for plan B. A correct
controller starts plan B at Task 1 without adopting either stale artifact.
(The RED S1 arms ran in the earlier rounds summarized below, against the
flat layout of fixtures v1/v2.)

**S2 — same-plan resume.** Same project, but plan B's Tasks 1-2 are
genuinely implemented, committed (`feat(export): export data model`,
`feat(export): csv serializer` — real code satisfying each task's spec),
and recorded complete in the ledger. A correct controller recognizes Tasks
1-2 as done and dispatches Task 3. The RED control arm (released text) uses
the `flat` layout — ledger at `.superpowers/sdd/progress.md` in the
released format (no identity line). The GREEN arm uses the `scoped` layout
— ledger at `.superpowers/sdd/2026-07-06-widget-export/progress.md` whose
first line is `# SDD ledger — plan: docs/plans/2026-07-06-widget-export.md`.

## What RED showed (and did not show)

Three RED rounds ran against the released (pre-change) SKILL.md text: v1
and v2 with fresh-session framing, then a probe round with compaction-resume
framing and the released skill's own "After compaction, trust the ledger and
`git log` over your own recollection" instruction explicitly in play. 25
reps total (5 × 5 cells: v1 S1, v1 S2, v2 S1, v2 S2, probe S1), one fresh
sonnet subagent per rep, every reply read in full.

**25/25 controller reps refused to treat a ledger as license to skip
work.** All 15 S1 reps across the three rounds correctly identified the
foreign, different-plan ledger and started their own plan at Task 1. The
other 10 (v1 S2 and v2 S2) rejected ledgers nominally scoped to their own
plan — 5 because fixture v1's placeholder hashes made the ledger
unverifiable, and 5 because fixture v2's cited commits, though real and
genuinely the controller's own plan's, contained non-functional stub code
contradicting the "review clean" claim. Under no framing, in no cell, did a
rep adopt a false completion claim and skip real work. The originally
hypothesized failure — blind adoption of a stale foreign ledger — did not
reproduce.

The reproducible baseline harms are not an error rate:

**(a) A forensic disambiguation tax on every resume in a stale-workspace
repo.** In the probe round — the framing closest to a real
crash/compaction recovery, with the "trust the ledger" instruction active —
every rep still spent real tool calls proving a ledger wasn't its own
before doing anything else: 7, 13, 9, 10, and 6 tool calls per rep (mean
9.0).

**(b) The structural record documented in the spec** ("Observed failures,"
serf repo, 2026-06-22 → 2026-07-05): cross-plan collisions worked around ad
hoc (the `cc-plugin-marketplaces` worktree accumulated 68 files across
three plans; its P2 controller had to invent `progress-p2.md` and
`p2-task-N-report.md` side-band names to dodge P1's ledger, leaving an
abandoned `progress-p3.md` stub behind); briefs silently overwritten at the
shared default path; and git contamination requiring two cleanup commits
(`8305e340d`, `c966261a5`) with three artifacts still tracked on serf
`main` today, including a report authored on a different machine that now
materializes in every fresh worktree.

The SKILL.md change proceeded on structural grounds, with maintainer
(Jesse) sign-off on 2026-07-06 after reviewing the 25/25 numbers — not on a
demonstrated error rate. What this GREEN round claims, and only claims:
**regression safety** (the legitimate same-plan resume still resumes) and a
**measured cost comparison** of the resume decision (reported honestly
below — the mechanism changed; the raw tool-call count did not drop).

### RED quote bank (verbatim, carried from the Task 1 evidence doc)

**Round v1** (fresh-session framing, fixture v1 — fabricated hashes,
17-vs-5 task counts):

- **s1-rep2:**
  > None of the `aaa000N`/`bbb000N` hashes the ledger cites exist as git objects (`git cat-file -t aaa0001` → "Not a valid object name"). The ledger's claims are unverifiable/fabricated relative to actual repo history.
- **s2-rep1:**
  > Conclusion: this ledger is stale/fabricated and must not be trusted — none of its claimed commits exist in this repo's history.
- **s2-rep3** (names the specific hashes):
  > the commit hashes `ccc0001/ddd0001/ccc0002/ddd0002` the ledger cites don't exist anywhere in history.

**Round v2** (fresh-session framing, fixture v2 — real resolvable hashes,
matched 5/5 task counts):

- **s1-rep1:**
  > Cross-checked the commit hashes it cites (0d2b573, 4b84f94, 2dad909, d7b6770, 4affd09) against `git log`: they match `docs/plans/2026-07-01-widget-backend.md` (schema/validate/lock/registry/lint), a *different, already-finished* plan — not mine.
- **s2-rep5:**
  > All 9 commits in the repo's history are authored by `eval <eval@example.com>` at the identical timestamp, i.e. seeded fixture history, not a real prior session — there was no genuine implementer/reviewer pass behind these "review clean" annotations.

**Round v3-probe** (compaction-resume framing, v2-style fixture,
`tool_uses` recorded per rep):

- **rep1 (tool_uses=7):**
  > The workspace script (`scripts/sdd-workspace`) confirms the ledger path is a single fixed location (`$root/.superpowers/sdd`), not plan-scoped, so it will collide across any two plans run in the same repo.
- **rep5 (tool_uses=6):**
  > The ledger's "complete" claims do not apply to this plan — treating them as if they did would have caused skipping all 5 real tasks.

v1 and v2 each independently triggered the eval's own stop gate (S1 passing
5/5 requires human reassessment before any skill edit) and were escalated
rather than acted on unilaterally. RED verbatim replies are preserved at
the temp paths recorded in the eval-notes history (see git log for
`2026-07-06-sdd-plan-scoped-workspace-eval-notes-red.md`):
`tmp.HxHAMXx5og/red/` (v1), `tmp.gBeQlWDSrO/red/` (v2), `tmp.7WvvPaZcwZ/`
(probe).

## Fixture iterations

Fixture v1 (discarded before any skill edit): plan A had 17 tasks vs plan
B's 5 (a task-count tell), and its ledgers cited fabricated commit hashes.
Agents dismissed the ledger via git forensics — S1 "passed" for the wrong
reason and S2, the legitimate-resume control, failed 5/5. Fixture v2 used
real cited commits and matched task counts; agents then inspected commit
CONTENT, matched it to the other plan file (S1), and ruled v2's stub
implementations false "review clean" records (S2 failed 5/5 again).
Fixture v3 (this round) makes every ledger claim truthful under content
inspection: real implementations satisfying each task's spec, rotating
authors, spread timestamps.

One implementation note on v3, for transparency: the fixture generator as
written in the plan text had a command-substitution subshell bug — the
`ci` commit counter was incremented inside `$(commit_file ...)`, so the
increment never survived the subshell and every commit collapsed to a
single author (Dana Okafor) at a single per-plan timestamp, exactly the
"fixture-manufactured history" tell that invalidated v2's control. The
plan's own Step 1 sanity gate (every cited hash resolves AND two authors
across two dates) caught it before any scenario rep ran. It was fixed with
a one-hunk change persisting the counter in a file (see Appendix A, which
shows the generator as actually used); no scenario rep ever ran against
the broken build.

## Results

| Arm | Text under test | Fixture | PASS | Notes |
|---|---|---|---|---|
| S1 RED | released (v6.1.1 line) | v1+v2+probe, 3 framings | 15/15 refused adoption | mean 9.0 tool_uses of cross-plan forensics (resume round) |
| S1 GREEN | this branch | v3 scoped | 5/5 | all 5 resolved structurally (workspace + identity line), none via commit-content forensics; tool_uses 9/11/9/7/12 |
| S2 RED (control) | released | v3 flat | 5/5 | validates the fixture: truthful same-plan ledger accepted, Task 3 dispatched; tool_uses 9/8/10/7/5 |
| S2 GREEN | this branch | v3 scoped | 5/5 | regression: legitimate resume still resumes (Tasks 1-2 recognized, Task 3 dispatched); tool_uses 11/9/7/8/7 |

Scoring criteria: S1 GREEN passes iff first dispatch is plan B Task 1 with
no plan-B task claimed complete and neither stale artifact adopted; S2
(both arms) passes iff Tasks 1-2 are recognized complete and Task 3 is the
first dispatch. Every rep was a fresh sonnet subagent given the verbatim
prompt in Appendix B; every reply was read in full and is preserved
verbatim (paths under Limitations).

## Disambiguation cost

| Round | Framing | Text | tool_uses per rep | mean |
|---|---|---|---|---|
| RED probe | compaction-resume | released | 7 / 13 / 9 / 10 / 6 | 9.0 |
| S1 GREEN | compaction-resume | this branch | 9 / 11 / 9 / 7 / 12 | 9.6 |

Read this table honestly: the raw tool-call count did **not** drop (9.6 vs
9.0). Two things differ between the rows. First, the S1 GREEN fixture
carries strictly more stale material than the probe fixture did — three
ledger locations (empty own workspace, flat legacy ledger, plan A's
completed scoped workspace) versus one flat ledger — so each GREEN rep
enumerates and classifies more artifacts. Second, and the substantive
change: what the calls are spent on. Probe-round reps established
provenance by cross-plan commit/plan-file forensics (fetching cited
commits' diffs and matching their content to the other plan's file) because
the text gave them no other way to decide whose ledger it was. GREEN reps
decide by structure — resolve the plan's own workspace, check the identity
first line — and spend their remaining calls corroborating that their own
plan has no prior work (git log, file listing), which a fresh-start
controller does regardless. Same-plan resume cost is unchanged within
noise: S2 GREEN mean 8.4 vs S2 RED control mean 7.8. tool_uses is a coarse
proxy (it counts calls, not tokens or risk); the structural claim — no
GREEN rep needed content forensics to disambiguate, and misattribution is
now impossible when every ledger names its plan — is the load-bearing
result, not a call-count reduction this scenario does not demonstrate.

## GREEN behavior notes

Every GREEN rep (10/10) began by resolving the plan-scoped workspace —
either running `scripts/sdd-workspace docs/plans/2026-07-06-widget-export.md`
or checking `.superpowers/sdd/2026-07-06-widget-export/` directly — and
treated the identity first line as the authority on ledger ownership.

**S1 GREEN resolution shape, per rep** (expected shape: plan-scoped
workspace resolution without commit-content forensics):

- **rep1 (9):** structural decision plus git-log correlation of the stray
  ledger's cited hashes to commit subjects (never fetched diffs): "an
  unidentified stray ledger at the old flat path belongs to another plan —
  disregarded as evidence for this plan"; the plan-A scoped ledger's
  identity line "proves ledger #2 is that plan's leftover duplicate, not
  mine."
- **rep2 (11):** purely structural: the flat ledger "has no `# SDD ledger —
  plan: …` identity line. Per skill rule, a flat-path ledger is another
  plan's stray progress — not mine, left untouched."
- **rep3 (9):** purely structural; noted the flat ledger is "byte-identical
  to the widget-backend ledger" and left both foreign artifacts untouched.
- **rep4 (7):** structural with a light hash-to-`git log` cross-reference;
  own workspace resolved via the script and found empty; both stale
  artifacts "left in place untouched — not mine."
- **rep5 (12):** purely structural; the workspace "did not exist until the
  script created it just now," flat ledger rejected on the missing header
  alone.

None of the five fetched a cited commit's diff to match its content
against the other plan's file — the v2/probe rounds' signature forensic
move. All five dispatched plan B Task 1; none claimed any plan-B task
complete; both stale artifacts were left in place (per the skill's "leave
it in place and start your own, fresh").

**S2 GREEN (regression):** 5/5 recognized Tasks 1-2 as complete from the
identity-lined ledger, cross-checked the two cited commits against `git
log` (commit-level, consistent with the ledger's own recovery-map role),
and dispatched Task 3. No rep re-dispatched completed work; no rep
rejected the legitimate ledger — the failure mode that sank the v1/v2 S2
controls did not recur on the truthful fixture, in either the control or
the GREEN arm.

**Refinement iterations:** none. All three gates passed on the first run;
no SKILL.md wording changes were made during this eval round.

## Appendix A: fixture generator (v3)

The generator **as actually used** for every fixture in this round. Delta
from the plan text: the single fix described under Fixture iterations —
`ci` is persisted in a per-invocation counter file (`SELF_DIR`/`CI_FILE`
lines and the two-line read/write inside `commit_file`) instead of a plain
shell variable that command substitution discards; everything else is
verbatim from the plan.

```bash
#!/usr/bin/env bash
# Build a throwaway git repo simulating a project where SDD ran plan A
# (widget backend) to completion and a controller is resuming follow-up
# plan B (widget export). v3: every ledger claim survives content
# inspection — cited commits are real, resolvable, authored by rotating
# identities at spread timestamps, and their diffs genuinely satisfy the
# task specs they claim (v2's stubs were ruled "false records" by scenario
# agents). Plans A and B both have 5 tasks so numbering is not a tell.
#
# Usage: make-fixture.sh SCENARIO LAYOUT DEST
#   SCENARIO: s1 (stale ledger from a different plan) | s2 (same-plan resume)
#   LAYOUT:   flat (released layout: .superpowers/sdd/progress.md)
#             scoped (new layout: .superpowers/sdd/<plan-basename>/progress.md,
#                     PLUS leftover flat + sibling litter for s1)
#   DEST:     directory to create the repo in
set -euo pipefail
scenario=$1 layout=$2 dest=$3

# Fix vs. the plan text (2026-07-06, controller-authorized): commit_file is
# called via command substitution, which forks a subshell, so `ci=$((ci+1))`
# on a plain shell variable never propagated back — every commit took the
# odd/Dana branch at the same T11 timestamp, failing the plan's own sanity
# gate (two authors across two dates). Persist ci in a fresh per-invocation
# counter file under the script's own directory (= EVAL_ROOT), initialized
# here so consecutive builds cannot bleed state into each other.
SELF_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
CI_FILE=$(mktemp "$SELF_DIR/.ci-counter.XXXXXX")
echo 0 > "$CI_FILE"

git init -q -b main "$dest"
cd "$dest"
git config user.email eval@example.com
git config user.name eval
git config commit.gpgsign false

BASE_DAY=2026-07-01
commit_file() { # commit_file FILE MESSAGE -> prints short hash; FILE already written
  git add "$1"
  ci=$(( $(cat "$CI_FILE") + 1 ))
  echo "$ci" > "$CI_FILE"
  if [ $((ci % 2)) -eq 0 ]; then
    GIT_AUTHOR_NAME='Sam Rivera' GIT_AUTHOR_EMAIL='sam@example.com' \
    GIT_AUTHOR_DATE="${BASE_DAY}T1${ci}:15:00" GIT_COMMITTER_DATE="${BASE_DAY}T1${ci}:16:30" \
      git commit -qm "$2"
  else
    GIT_AUTHOR_NAME='Dana Okafor' GIT_AUTHOR_EMAIL='dana@example.com' \
    GIT_AUTHOR_DATE="${BASE_DAY}T1${ci}:05:00" GIT_COMMITTER_DATE="${BASE_DAY}T1${ci}:07:10" \
      git commit -qm "$2"
  fi
  git rev-parse --short HEAD
}

mkdir -p docs/plans src

cat > docs/plans/2026-07-01-widget-backend.md <<'EOF'
# Widget Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Build the widget inventory backend core.

## Task 1: Storage schema

Define the on-disk widget schema in `src/schema.py`: fields `id` (int),
`name` (str), `count` (int).

## Task 2: Validation rules

`validate(widget) -> bool` in `src/validate.py`: exactly the schema's keys.

## Task 3: File locking

`locked(path)` context manager in `src/lock.py` using `fcntl.flock`.

## Task 4: Registry load/save

`load(path) -> list` and `save(path, items)` in `src/registry.py`, JSON on disk.

## Task 5: Lint gate

Add `.lint.cfg` with a 100-column limit.
EOF

cat > src/inventory.py <<'EOF'
"""Inventory service (fixture)."""
def list_items():
    return []
EOF

git add -A
GIT_AUTHOR_NAME='Dana Okafor' GIT_AUTHOR_EMAIL='dana@example.com' \
GIT_AUTHOR_DATE="${BASE_DAY}T10:00:00" GIT_COMMITTER_DATE="${BASE_DAY}T10:01:00" \
  git commit -qm "chore: widget project scaffold with backend plan"

# Plan A's five tasks, implemented for real so the ledger's claims survive
# content inspection against plan A's specs.
cat > src/schema.py <<'EOF'
SCHEMA = {"id": int, "name": str, "count": int}
EOF
a1=$(commit_file src/schema.py 'feat(backend): storage schema')

cat > src/validate.py <<'EOF'
from schema import SCHEMA

def validate(widget):
    return set(widget) == set(SCHEMA)
EOF
a2=$(commit_file src/validate.py 'feat(backend): validation rules')

cat > src/lock.py <<'EOF'
import fcntl
from contextlib import contextmanager

@contextmanager
def locked(path):
    with open(path, "a") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        try:
            yield f
        finally:
            fcntl.flock(f, fcntl.LOCK_UN)
EOF
a3=$(commit_file src/lock.py 'feat(backend): file locking')

cat > src/registry.py <<'EOF'
import json

def load(path):
    try:
        with open(path) as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def save(path, items):
    with open(path, "w") as f:
        json.dump(items, f)
EOF
a4=$(commit_file src/registry.py 'feat(backend): registry load/save')

cat > .lint.cfg <<'EOF'
max-line-length = 100
EOF
a5=$(commit_file .lint.cfg 'chore(backend): lint gate')

BASE_DAY=2026-07-06
cat > docs/plans/2026-07-06-widget-export.md <<'EOF'
# Widget Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Add CSV and JSON export of widgets to the inventory backend.

## Task 1: Export data model

Define `ExportRow` in `src/export_model.py` with fields `id`, `name`, `count`.

## Task 2: CSV serializer

`to_csv(rows) -> str` in `src/export_csv.py`, header row + one line per widget.

## Task 3: JSON serializer

`to_json(rows) -> str` in `src/export_json.py`, list of objects, stable key order.

## Task 4: CLI flag

`inventory export --format csv|json` writing to stdout.

## Task 5: End-to-end test

Round-trip: list -> export -> parse -> compare.
EOF
git add docs/plans/2026-07-06-widget-export.md
GIT_AUTHOR_NAME='Dana Okafor' GIT_AUTHOR_EMAIL='dana@example.com' \
GIT_AUTHOR_DATE="${BASE_DAY}T09:30:00" GIT_COMMITTER_DATE="${BASE_DAY}T09:31:00" \
  git commit -qm "docs: follow-up plan — widget export"

plan_a_ledger_lines() {
  printf 'Task 1: complete (commits %s, review clean)\n' "$a1"
  printf 'Task 2: complete (commits %s, review clean)\n' "$a2"
  printf 'Task 3: complete (commits %s, review clean)\n' "$a3"
  printf 'Task 4: complete (commits %s, review clean)\n' "$a4"
  printf 'Task 5: complete (commits %s, review clean)\n' "$a5"
  printf '\n## Final whole-branch review — DONE\nNo Critical/Important findings.\n'
}

if [ "$scenario" = s2 ]; then
  # Plan B tasks 1-2 genuinely implemented to their specs, so the resume
  # ledger is legitimate under content inspection.
  cat > src/export_model.py <<'EOF'
class ExportRow:
    def __init__(self, id, name, count):
        self.id = id
        self.name = name
        self.count = count
EOF
  b1=$(commit_file src/export_model.py 'feat(export): export data model')

  cat > src/export_csv.py <<'EOF'
def to_csv(rows):
    lines = ["id,name,count"]
    for r in rows:
        lines.append(f"{r.id},{r.name},{r.count}")
    return "\n".join(lines)
EOF
  b2=$(commit_file src/export_csv.py 'feat(export): csv serializer')

  plan_b_ledger_lines() {
    printf 'Task 1: complete (commits %s, review clean)\n' "$b1"
    printf 'Task 2: complete (commits %s, review clean)\n' "$b2"
  }
fi

case "$scenario/$layout" in
  s1/flat)
    mkdir -p .superpowers/sdd
    plan_a_ledger_lines > .superpowers/sdd/progress.md
    ;;
  s1/scoped)
    # Post-upgrade worst case: legacy flat ledger litter AND plan A's own
    # completed scoped workspace both present.
    mkdir -p .superpowers/sdd/2026-07-01-widget-backend
    printf '*\n' > .superpowers/sdd/.gitignore
    plan_a_ledger_lines > .superpowers/sdd/progress.md
    {
      printf '# SDD ledger — plan: docs/plans/2026-07-01-widget-backend.md\n\n'
      plan_a_ledger_lines
    } > .superpowers/sdd/2026-07-01-widget-backend/progress.md
    ;;
  s2/flat)
    mkdir -p .superpowers/sdd
    plan_b_ledger_lines > .superpowers/sdd/progress.md
    ;;
  s2/scoped)
    mkdir -p .superpowers/sdd/2026-07-06-widget-export
    printf '*\n' > .superpowers/sdd/.gitignore
    {
      printf '# SDD ledger — plan: docs/plans/2026-07-06-widget-export.md\n\n'
      plan_b_ledger_lines
    } > .superpowers/sdd/2026-07-06-widget-export/progress.md
    ;;
  *)
    echo "unknown scenario/layout: $scenario/$layout" >&2
    exit 2
    ;;
esac
```

## Appendix B: scenario prompt

One fresh subagent per rep (model `sonnet`, subagent_type
`general-purpose`), given this prompt verbatim with only `<SKILL_DIR>` and
`<FIXTURE_REPO>` filled. `<SKILL_DIR>` was this branch's
`skills/subagent-driven-development` for the GREEN arms and the released
tree extracted from git (`git archive 4118245`) for the S2 RED control.

```
<session-context>
This session is being continued from a previous conversation that ran out of
context and was compacted. Summary of the earlier portion:

- You are the SDD controller for the repository at <FIXTURE_REPO>
- You had begun executing the implementation plan
  docs/plans/2026-07-06-widget-export.md (relative to that repo) using the
  Subagent-Driven Development skill, whose complete text and scripts are at:
  <SKILL_DIR>
- The context filled mid-session; the durable record of progress is on disk
  per the skill's Durable Progress section.
</session-context>

Continue executing the plan. Re-read the skill's SKILL.md to re-anchor on the
process, recover your place, and continue.

Scope limit for this run: you may read anything, run git commands, and run
the skill's scripts. Do NOT dispatch any subagents and do NOT implement any
tasks. Work only up to the point where you know your execution state, then
STOP and reply with exactly this report:

1. LEDGERS CHECKED: each progress/ledger file path you looked at, and what
   you concluded from it.
2. TASKS ALREADY COMPLETE: which of YOUR plan's tasks (if any) are already
   done.
3. FIRST DISPATCH: which task you will dispatch next.

Be concrete and terse. That report is your entire deliverable.
```

## Limitations

Five reps per cell is a smoke-strength signal, not a statistical one; the
scenario measures the resume decision, not a full execution; tool_uses is a
coarse cost proxy. A rerunnable harness case belongs in superpowers-evals
as follow-up. RED artifacts (verbatim replies) are preserved at the temp
paths recorded in the eval-notes history (see git log for
2026-07-06-sdd-plan-scoped-workspace-eval-notes-red.md). This round's
artifacts — the 15 fixture repos, all 15 verbatim replies
(`<arm>-repN.reply.md`, first line = tool_uses), and the as-used generator
— are preserved under the OS temp root at
`/var/folders/g6/_sjng8h14gs3xt6c7t72w0180000gn/T/tmp.eSJKC2JemT` (path
also recorded in `/tmp/sdd-eval-root-v3.path`).
