# SDD Plan-Scoped Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make SDD's durable-progress workspace plan-scoped (`.superpowers/sdd/<plan-basename>/`) with a self-identifying ledger and end-of-plan cleanup, so a follow-up plan can never collide with a previous plan's artifacts and resumed controllers stop paying a forensic disambiguation tax.

**Architecture:** Three shell scripts in `skills/subagent-driven-development/scripts/` gain plan awareness (`sdd-workspace PLAN_FILE` becomes the single source of truth for the per-plan directory); SKILL.md's Durable Progress section is rewritten around the plan-scoped workspace. Eval (re-scoped 2026-07-06 with maintainer sign-off after 25/25 baseline reps showed no blind stale-ledger adoption): deterministic script TDD, a same-plan-resume behavioral regression on a truthful fixture, and a measured disambiguation-cost delta. Spec: `docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace.md`.

**Tech Stack:** bash, shellcheck (via `scripts/lint-shell.sh`), repo shell-test conventions (`tests/claude-code/test-sdd-workspace.sh`), subagent pressure-test evals.

## Global Constraints

- Execute tasks in order 1 → 5. Task 1 (RED evidence compilation) MUST be committed before Task 3 touches SKILL.md.
- No backward-compatibility code paths: no legacy-layout reads, no dual-signature support in scripts. Scripts and SKILL.md ship together.
- Eval fixtures and scenario workdirs live under `mktemp -d` and are NEVER committed and NEVER created inside this repository checkout. Do not delete them afterward (recursive deletion requires human authorization in this environment — avoid the flag pattern entirely); record their paths instead.
- Eval scenario subagents: model `sonnet`, subagent_type `general-purpose`, one fresh subagent per rep, the Task 4 prompt used VERBATIM (fill only `<SKILL_DIR>` and `<FIXTURE_REPO>`). Do not add hints about ledgers, staleness, or the fix. Record each rep's reported `tool_uses` count.
- Every shell file you create or modify must pass `bash scripts/lint-shell.sh <file>` (shellcheck 0.11.0 is installed).
- Match SKILL.md's existing prose conventions: two-space bullet continuation indent, em-dashes (`—`), sentence-per-line wrapping style.
- Commit at the end of every task with the message given in the task.

---

### Task 1: RED baseline evidence — compile what three completed eval rounds gathered

No new scenario runs. Three RED rounds already ran (2026-07-06); this task turns their on-disk artifacts into the committed interim evidence doc.

**Files:**
- Create: `docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-notes-red.md`

**Interfaces:**
- Consumes: eval artifacts at the paths in Step 1.
- Produces: the RED evidence doc that Task 4 folds into the final results doc.

- [ ] **Step 1: Read the three rounds' artifacts**

All scenario-agent replies are verbatim on disk:

- **Round v1** — fresh-session framing, fixture v1 (fabricated commit hashes, 17-vs-5 task counts; discarded): `/var/folders/g6/_sjng8h14gs3xt6c7t72w0180000gn/T/tmp.HxHAMXx5og/red/s1-rep{1..5}.reply.md` and `s2-rep{1..5}.reply.md`. Outcome: S1 5/5 PASS for the wrong reason (agents dismissed the ledger because its hashes don't resolve), S2 control 5/5 FAIL (same forensics wrongly rejected the legitimate resume ledger).
- **Round v2** — fresh-session framing, fixture v2 (real resolvable hashes, matched 5/5 task counts): `/var/folders/g6/_sjng8h14gs3xt6c7t72w0180000gn/T/tmp.gBeQlWDSrO/red/s1-rep{1..5}.reply.md` and `s2-rep{1..5}.reply.md`. Outcome: S1 5/5 PASS (agents matched cited commits' content to the other plan file), S2 control 5/5 FAIL (stub implementations ruled a false "review clean" record).
- **Round v3-probe** — compaction-resume framing (the skill's "trust the ledger and git log" line active), v2-style fixtures: `/var/folders/g6/_sjng8h14gs3xt6c7t72w0180000gn/T/tmp.7WvvPaZcwZ/s1-rep{1..5}.reply.md`, each annotated with its `tool_uses`. Outcome: S1 5/5 PASS, per-rep tool_uses 7/13/9/10/6 (mean 9.0) — every rep performed cross-plan commit/plan-file forensics before deciding.

- [ ] **Step 2: Write the interim doc**

`docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-notes-red.md` with exactly these sections, filled from the artifacts:

- **Method** — three rounds, framings, fixture versions, 5 fresh sonnet reps per scenario per round, hand-scored.
- **Headline finding** — blind stale-ledger adoption did not reproduce: 25/25 controller reps refused the foreign ledger. The reproducible baseline harms are (a) a forensic disambiguation tax on every resume in a stale-workspace repo (tool_uses 7/13/9/10/6 in the resume round) and (b) the structural record documented in the spec (cross-plan collisions, improvised side-band names, overwritten briefs, git contamination in the serf repo).
- **Basis for proceeding** — state plainly: the SKILL.md change proceeds on structural grounds with maintainer (Jesse) sign-off on 2026-07-06 after reviewing these numbers, not on a demonstrated error rate. The GREEN arm's claims are cost reduction and regression safety.
- **Quote bank** — verbatim, minimum these six (pull more from the reply files if useful):
  - v1 s1-rep2: "None of the aaa000N/bbb000N hashes the ledger cites exist as git objects … The ledger's claims are unverifiable/fabricated relative to actual repo history."
  - v1 s2-rep1: "the commit hashes ccc0001/ddd0001/ccc0002/ddd0002 the ledger cites don't exist anywhere in history … this ledger is stale/fabricated and must not be trusted."
  - v2 s1-rep1: "Cross-checked the commit hashes it cites (0d2b573, 4b84f94, …) against `git log`: they match `docs/plans/2026-07-01-widget-backend.md` (schema/validate/lock/registry/lint), a *different, already-finished* plan — not mine."
  - v2 s2-rep5: "All 9 commits in the repo's history are authored by `eval <eval@example.com>` at the identical timestamp, i.e. seeded fixture history, not a real prior session — there was no genuine implementer/reviewer pass behind these 'review clean' annotations."
  - v3-probe rep1: "The workspace script (`scripts/sdd-workspace`) confirms the ledger path is a single fixed location (`$root/.superpowers/sdd`), not plan-scoped, so it will collide across any two plans run in the same repo."
  - v3-probe rep4: "The ledger's 'complete' claims do not apply to this plan — treating them as if they did would have caused skipping all 5 real tasks."
- **Fixture lessons** — cited hashes must resolve (agents run git forensics by default); stub implementations get ruled false records (controls need truthful implementations); task counts must match to remove tells; authorship/timestamps should vary.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-notes-red.md
git commit -m "eval(sdd): RED baseline — 25/25 controllers refuse stale ledgers, at a forensic cost"
```

---

### Task 2: Plan-scoped workspace scripts (TDD)

**Files:**
- Modify: `skills/subagent-driven-development/scripts/sdd-workspace`
- Modify: `skills/subagent-driven-development/scripts/task-brief`
- Modify: `skills/subagent-driven-development/scripts/review-package`
- Test: `tests/claude-code/test-sdd-workspace.sh` (full rewrite below)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `sdd-workspace PLAN_FILE` → prints `<repo-root>/.superpowers/sdd/<plan-basename-without-.md>` (creates it; maintains `<repo-root>/.superpowers/sdd/.gitignore` containing `*`). `task-brief PLAN_FILE N [OUTFILE]` → default OUTFILE `<workspace>/task-<N>-brief.md`. `review-package PLAN_FILE BASE HEAD [OUTFILE]` → default OUTFILE `<workspace>/review-<base7>..<head7>.diff`. Task 3's SKILL.md text names exactly these signatures.

- [ ] **Step 1: Replace the test file with the plan-scoped expectations**

Overwrite `tests/claude-code/test-sdd-workspace.sh` with exactly:

```bash
#!/usr/bin/env bash
# Tests for the SDD workspace: scripts/sdd-workspace resolves a self-ignoring,
# PER-PLAN working-tree directory for SDD artifacts, and the SDD scripts write
# into their plan's directory.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SDD_SCRIPTS="$REPO_ROOT/skills/subagent-driven-development/scripts"

FAILURES=0
TEST_ROOT=""

pass() { echo "  [PASS] $1"; }
fail() {
    echo "  [FAIL] $1"
    FAILURES=$((FAILURES + 1))
}

cleanup() {
    if [[ -n "$TEST_ROOT" && -d "$TEST_ROOT" ]]; then
        rm -rf "$TEST_ROOT"
    fi
}

main() {
    echo "=== Test: sdd-workspace ==="

    TEST_ROOT="$(mktemp -d)"
    trap cleanup EXIT

    # Resolve repo to its physical path so string comparisons match the
    # helper's output (git rev-parse --show-toplevel resolves symlinks; on
    # macOS mktemp lives under /var -> /private/var).
    git init -q -b main "$TEST_ROOT/repo"
    local repo
    repo="$(cd "$TEST_ROOT/repo" && git rev-parse --show-toplevel)"

    cat > "$repo/plan-a.md" <<'PLAN'
# Plan A

## Task 1: First thing

Do the first thing.
PLAN
    cat > "$repo/plan-b.md" <<'PLAN'
# Plan B

## Task 1: Other thing

Do the other thing.
PLAN

    # --- argument validation ---
    local rc=0
    (cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" >/dev/null 2>&1) || rc=$?
    if [[ "$rc" -eq 2 ]]; then
        pass "sdd-workspace without a plan errors with exit 2"
    else
        fail "sdd-workspace without a plan errors with exit 2"
        echo "    exit: $rc"
    fi

    rc=0
    (cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" no-such-plan.md >/dev/null 2>&1) || rc=$?
    if [[ "$rc" -eq 2 ]]; then
        pass "sdd-workspace with a missing plan file errors with exit 2"
    else
        fail "sdd-workspace with a missing plan file errors with exit 2"
        echo "    exit: $rc"
    fi

    # --- per-plan resolution ---
    local dir_a dir_b
    dir_a="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" plan-a.md)"
    dir_b="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" plan-b.md)"

    if [[ "$dir_a" == "$repo/.superpowers/sdd/plan-a" ]]; then
        pass "prints <repo-root>/.superpowers/sdd/<plan-basename>"
    else
        fail "prints <repo-root>/.superpowers/sdd/<plan-basename>"
        echo "    got: $dir_a"
    fi

    if [[ "$dir_a" != "$dir_b" && -d "$dir_a" && -d "$dir_b" ]]; then
        pass "two plans resolve to two distinct directories"
    else
        fail "two plans resolve to two distinct directories"
        echo "    a: $dir_a"
        echo "    b: $dir_b"
    fi

    if [[ -f "$repo/.superpowers/sdd/.gitignore" && "$(cat "$repo/.superpowers/sdd/.gitignore")" == "*" ]]; then
        pass "self-ignoring .gitignore created at .superpowers/sdd/ with '*'"
    else
        fail "self-ignoring .gitignore created at .superpowers/sdd/ with '*'"
    fi

    printf 'x\n' > "$dir_a/artifact.md"
    local status
    status="$(cd "$repo" && git status --porcelain)"
    # plan-a.md/plan-b.md are intentionally untracked fixture files; only the
    # workspace must be invisible.
    if [[ "$status" != *".superpowers"* ]]; then
        pass "workspace invisible to git status"
    else
        fail "workspace invisible to git status"
        echo "    status: $status"
    fi

    ( cd "$repo" && git add -A )
    local staged
    staged="$(cd "$repo" && git diff --cached --name-only)"
    if [[ "$staged" != *".superpowers"* ]]; then
        pass "git add -A does not stage the workspace"
    else
        fail "git add -A does not stage the workspace"
        echo "    staged: $staged"
    fi

    # --- task-brief lands in its plan's directory ---
    local brief_out brief_path
    brief_out="$(cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-a.md 1)"
    brief_path="$(printf '%s\n' "$brief_out" | sed -n 's/^wrote \(.*\): [0-9][0-9]* lines$/\1/p')"
    if [[ "$brief_path" == "$repo/.superpowers/sdd/plan-a/task-1-brief.md" ]]; then
        pass "task-brief writes its brief under the plan's workspace"
    else
        fail "task-brief writes its brief under the plan's workspace"
        echo "    got: $brief_path"
    fi

    # --- review-package takes the plan first and lands in its directory ---
    local git_id=(-c user.email=t@example.com -c user.name=t -c commit.gpgsign=false)
    ( cd "$repo" \
        && git "${git_id[@]}" commit -qm c1 \
        && printf 'y\n' > f && git add f \
        && git "${git_id[@]}" commit -qm c2 )
    local rp_out rp_path
    rp_out="$(cd "$repo" && "$SDD_SCRIPTS/review-package" plan-a.md HEAD~1 HEAD)"
    rp_path="$(printf '%s\n' "$rp_out" | sed -n 's/^wrote \(.*\): [0-9].*$/\1/p')"
    case "$rp_path" in
        "$repo/.superpowers/sdd/plan-a/review-"*.diff)
            pass "review-package writes its diff under the plan's workspace" ;;
        *)
            fail "review-package writes its diff under the plan's workspace"
            echo "    got: $rp_path"
            ;;
    esac

    rc=0
    (cd "$repo" && "$SDD_SCRIPTS/review-package" HEAD~1 HEAD >/dev/null 2>&1) || rc=$?
    if [[ "$rc" -eq 2 ]]; then
        pass "review-package without a plan errors with exit 2"
    else
        fail "review-package without a plan errors with exit 2"
        echo "    exit: $rc"
    fi

    local rp_explicit
    rp_explicit="$(cd "$repo" && "$SDD_SCRIPTS/review-package" plan-a.md HEAD~1 HEAD "$TEST_ROOT/explicit.diff")"
    if [[ -s "$TEST_ROOT/explicit.diff" && "$rp_explicit" == *"$TEST_ROOT/explicit.diff"* ]]; then
        pass "review-package honors an explicit OUTFILE"
    else
        fail "review-package honors an explicit OUTFILE"
        echo "    got: $rp_explicit"
    fi

    # --- Worktree isolation: a linked worktree resolves its own workspace ---
    local wt="$TEST_ROOT/wt"
    ( cd "$repo" && git worktree add -q "$wt" -b wt-feature )
    local wt_root wt_dir
    wt_root="$(cd "$wt" && git rev-parse --show-toplevel)"
    wt_dir="$(cd "$wt" && "$SDD_SCRIPTS/sdd-workspace" plan-a.md)"
    if [[ "$wt_dir" == "$wt_root/.superpowers/sdd/plan-a" && "$wt_dir" != "$dir_a" ]]; then
        pass "linked worktree resolves its own distinct workspace"
    else
        fail "linked worktree resolves its own distinct workspace"
        echo "    main: $dir_a"
        echo "    wt:   $wt_dir"
    fi

    printf 'y\n' > "$wt_dir/artifact.md"
    local wt_status
    wt_status="$(cd "$wt" && git status --porcelain)"
    if [[ "$wt_status" != *".superpowers"* ]]; then
        pass "worktree workspace invisible to git status"
    else
        fail "worktree workspace invisible to git status"
        echo "    status: $wt_status"
    fi

    echo ""
    if [[ "$FAILURES" -ne 0 ]]; then
        echo "FAILED: $FAILURES assertion(s)."
        exit 1
    fi
    echo "PASS"
}

main "$@"
```

Note: the worktree fixture relies on `plan-a.md` being tracked by the time the worktree is created — the `git add -A` assertion earlier stages it and the review-package block commits it. Do not reorder the blocks.

- [ ] **Step 2: Run the test — verify it fails against the current scripts**

Run: `bash tests/claude-code/test-sdd-workspace.sh`
Expected: FAILED with multiple assertions (current `sdd-workspace` ignores arguments and prints the flat path, so "errors with exit 2" and "<plan-basename>" assertions fail; current `review-package` treats `plan-a.md` as a bad BASE ref).

- [ ] **Step 3: Rewrite the three scripts**

Overwrite `skills/subagent-driven-development/scripts/sdd-workspace` with exactly:

```bash
#!/usr/bin/env bash
# Resolve and ensure the working-tree directory SDD uses for one plan's
# short-lived artifacts: task briefs, implementer reports, review packages,
# and the progress ledger. Print the plan directory's absolute path.
#
# One directory per plan (.superpowers/sdd/<plan-basename>/) so a follow-up
# plan in the same working tree can never read or overwrite another plan's
# artifacts. A stale ledger misread as current progress makes controllers
# skip whole task sequences — plan-scoping removes that failure structurally.
#
# The workspace lives in the working tree (not under .git/) because Claude Code
# treats .git/ as a protected path and denies agent writes there — which blocks
# an implementer subagent from writing its report file. A self-ignoring
# .gitignore at .superpowers/sdd/ keeps every plan's workspace out of
# `git status` and out of accidental commits without modifying any tracked file.
#
# Single source of truth for the workspace location, so task-brief and
# review-package cannot drift to different directories.
#
# Usage: sdd-workspace PLAN_FILE
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "usage: sdd-workspace PLAN_FILE" >&2
  exit 2
fi

plan=$1
[ -f "$plan" ] || { echo "no such plan file: $plan" >&2; exit 2; }

slug=$(basename "$plan" .md)
[ -n "$slug" ] && [ "$slug" != "." ] && [ "$slug" != ".." ] \
  || { echo "cannot derive a workspace name from: $plan" >&2; exit 2; }

root=$(git rev-parse --show-toplevel)
base="$root/.superpowers/sdd"
dir="$base/$slug"
mkdir -p "$dir"
printf '*\n' > "$base/.gitignore"
cd "$dir" && pwd
```

Overwrite `skills/subagent-driven-development/scripts/task-brief` with exactly:

```bash
#!/usr/bin/env bash
# Extract one task's full text from an implementation plan into a file the
# implementer reads in one call, so the task text never has to be pasted
# through the controller's context.
#
# Usage: task-brief PLAN_FILE TASK_NUMBER [OUTFILE]
# Default OUTFILE: <repo-root>/.superpowers/sdd/<plan-basename>/task-<N>-brief.md
# (per plan and per worktree; concurrent runs of the SAME plan in the same
# working tree share it).
set -euo pipefail

if [ $# -lt 2 ] || [ $# -gt 3 ]; then
  echo "usage: task-brief PLAN_FILE TASK_NUMBER [OUTFILE]" >&2
  exit 2
fi

plan=$1
n=$2
[ -f "$plan" ] || { echo "no such plan file: $plan" >&2; exit 2; }

if [ $# -eq 3 ]; then
  out=$3
else
  dir=$("$(cd "$(dirname "$0")" && pwd)/sdd-workspace" "$plan")
  out="$dir/task-${n}-brief.md"
fi

awk -v n="$n" '
  /^```/ { infence = !infence }
  !infence && /^#+[ \t]+Task[ \t]+[0-9]+/ {
    intask = ($0 ~ ("^#+[ \t]+Task[ \t]+" n "([^0-9]|$)"))
  }
  intask { print }
' "$plan" > "$out"

if [ ! -s "$out" ]; then
  echo "task ${n} not found in ${plan} (no heading matching 'Task ${n}')" >&2
  exit 3
fi

echo "wrote ${out}: $(wc -l < "$out" | tr -d ' ') lines"
```

Overwrite `skills/subagent-driven-development/scripts/review-package` with exactly:

```bash
#!/usr/bin/env bash
# Generate a review package: commit list, stat summary, and the net
# diff with extended context, written to a file the reviewer reads in one
# call. Using the recorded per-task BASE (not HEAD~1) keeps multi-commit
# tasks intact.
#
# Usage: review-package PLAN_FILE BASE HEAD [OUTFILE]
# Default OUTFILE: <repo-root>/.superpowers/sdd/<plan-basename>/review-<base7>..<head7>.diff
# (named per range, so a re-review after fixes gets a distinct fresh file).
set -euo pipefail

if [ $# -lt 3 ] || [ $# -gt 4 ]; then
  echo "usage: review-package PLAN_FILE BASE HEAD [OUTFILE]" >&2
  exit 2
fi

plan=$1
base=$2
head=$3
[ -f "$plan" ] || { echo "no such plan file: $plan" >&2; exit 2; }

git rev-parse --verify --quiet "$base" >/dev/null || { echo "bad BASE: $base" >&2; exit 2; }
git rev-parse --verify --quiet "$head" >/dev/null || { echo "bad HEAD: $head" >&2; exit 2; }

if [ $# -eq 4 ]; then
  out=$4
else
  dir=$("$(cd "$(dirname "$0")" && pwd)/sdd-workspace" "$plan")
  out="$dir/review-$(git rev-parse --short "$base")..$(git rev-parse --short "$head").diff"
fi

{
  echo "# Review package: ${base}..${head}"
  echo
  echo "## Commits"
  git log --oneline "${base}..${head}"
  echo
  echo "## Files changed"
  git diff --stat "${base}..${head}"
  echo
  echo "## Diff"
  git diff -U10 "${base}..${head}"
} > "$out"

commits=$(git rev-list --count "${base}..${head}")
echo "wrote ${out}: ${commits} commit(s), $(wc -c < "$out" | tr -d ' ') bytes"
```

- [ ] **Step 4: Run the test — verify it passes**

Run: `bash tests/claude-code/test-sdd-workspace.sh`
Expected: `PASS`, 13 `[PASS]` lines, exit 0.

- [ ] **Step 5: Lint everything touched**

Run: `bash scripts/lint-shell.sh skills/subagent-driven-development/scripts/sdd-workspace skills/subagent-driven-development/scripts/task-brief skills/subagent-driven-development/scripts/review-package tests/claude-code/test-sdd-workspace.sh`
Expected: exit 0, no findings.

- [ ] **Step 6: Commit**

```bash
git add skills/subagent-driven-development/scripts/sdd-workspace \
        skills/subagent-driven-development/scripts/task-brief \
        skills/subagent-driven-development/scripts/review-package \
        tests/claude-code/test-sdd-workspace.sh
git commit -m "feat(sdd): plan-scoped workspace — one .superpowers/sdd/<plan> dir per plan

sdd-workspace now requires the plan file and resolves
.superpowers/sdd/<plan-basename>/; task-brief and review-package write
into their plan's directory (review-package gains PLAN_FILE as its first
argument). Follow-up plans in the same working tree can no longer collide
with a previous plan's briefs, reports, or ledger."
```

---

### Task 3: SKILL.md — plan-scoped Durable Progress, workspace identity, end-of-plan cleanup

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md`

**Interfaces:**
- Consumes: script signatures from Task 2 (`sdd-workspace PLAN_FILE`, `review-package PLAN_FILE BASE HEAD`); Task 1's committed evidence doc (context only — this text ships on structural grounds with maintainer sign-off, per that doc's "Basis for proceeding").
- Produces: the skill text Task 4 evaluates. Section anchor names used by Task 4: "Durable Progress".

Apply the following edits with exact string replacement. All old strings are verbatim from the current file.

- [ ] **Step 1: Update the DONE-status review-package invocation**

Old:
```
**DONE:** Generate the review package (`scripts/review-package BASE HEAD`, from this skill's directory — it prints the unique file path it wrote; BASE is the commit you recorded before dispatching the implementer — never `HEAD~1`, which silently drops all but the last commit of a multi-commit task), then dispatch the task reviewer with the printed path.
```
New:
```
**DONE:** Generate the review package (`scripts/review-package PLAN_FILE BASE HEAD`, from this skill's directory — it prints the unique file path it wrote; BASE is the commit you recorded before dispatching the implementer — never `HEAD~1`, which silently drops all but the last commit of a multi-commit task), then dispatch the task reviewer with the printed path.
```

- [ ] **Step 2: Update the reviewer-prompts diff-file bullet**

Old:
```
- Hand the reviewer its diff as a file: run this skill's
  `scripts/review-package BASE HEAD` and pass the reviewer the file path
  it prints (or, without bash: `git log --oneline`, `git diff --stat`,
  and `git diff -U10` for the range, redirected to one uniquely named
  file). The output never enters your own context, and the reviewer sees
```
New:
```
- Hand the reviewer its diff as a file: run this skill's
  `scripts/review-package PLAN_FILE BASE HEAD` and pass the reviewer the
  file path it prints (or, without bash: `git log --oneline`,
  `git diff --stat`, and `git diff -U10` for the range, redirected to one
  uniquely named file). The output never enters your own context, and the reviewer sees
```

- [ ] **Step 3: Update the final-review package bullet**

Old:
```
- The final whole-branch review gets a package too: run
  `scripts/review-package MERGE_BASE HEAD` (MERGE_BASE = the commit the
  branch started from, e.g. `git merge-base main HEAD`) and include the
```
New:
```
- The final whole-branch review gets a package too: run
  `scripts/review-package PLAN_FILE MERGE_BASE HEAD` (MERGE_BASE = the
  commit the branch started from, e.g. `git merge-base main HEAD`) and include the
```

- [ ] **Step 4: Update the Red Flags diff-file bullet**

Old:
```
- Dispatch a task reviewer without a diff file — generate it first
  (`scripts/review-package BASE HEAD`) and name the printed path in the
  prompt
```
New:
```
- Dispatch a task reviewer without a diff file — generate it first
  (`scripts/review-package PLAN_FILE BASE HEAD`) and name the printed
  path in the prompt
```

- [ ] **Step 5: Replace the Durable Progress section**

Old:
```
- At skill start, check for a ledger:
  `cat "$(git rev-parse --show-toplevel)/.superpowers/sdd/progress.md"`. Tasks listed there
  as complete are DONE — do not re-dispatch them; resume at the first task
  not marked complete.
- When a task's review comes back clean, append one line to the ledger in
  the same message as your other bookkeeping:
  `Task N: complete (commits <base7>..<head7>, review clean)`.
- The ledger is your recovery map: the commits it names exist in git even
  when your context no longer remembers creating them. After compaction,
  trust the ledger and `git log` over your own recollection.
- `git clean -fdx` will destroy the ledger (it's git-ignored scratch); if
  that happens, recover from `git log`.
```
New:
```
- Each plan owns a workspace: at skill start, run this skill's
  `scripts/sdd-workspace PLAN_FILE` — it prints the plan's git-ignored
  directory (`<repo-root>/.superpowers/sdd/<plan-basename>/`), home to
  every artifact for THIS plan: ledger, briefs, reports, review packages.
  Another plan's directory is never yours to read or write.
- Check for this plan's ledger at `<workspace>/progress.md`. If its first
  line names your plan file, tasks listed there as complete are DONE — do
  not re-dispatch them; resume at the first task not marked complete. A
  ledger whose first line names a different plan file — or a stray ledger
  at the old flat path `.superpowers/sdd/progress.md` — is another plan's
  progress: leave it in place and start your own, fresh.
- Create the ledger with its identity as the first line:
  `# SDD ledger — plan: <plan file path>`.
- When a task's review comes back clean, append one line to the ledger in
  the same message as your other bookkeeping:
  `Task N: complete (commits <base7>..<head7>, review clean)`.
- The ledger is your recovery map: the commits it names exist in git even
  when your context no longer remembers creating them. After compaction,
  trust the ledger and `git log` over your own recollection.
- `git clean -fdx` will destroy the workspace (it's git-ignored scratch); if
  that happens, recover from `git log`.
- When the final whole-branch review is clean and its fixes are merged,
  delete this plan's workspace (`rm -rf <workspace>`) — the git history
  is the record now. Sibling directories belong to other plans; leave
  them alone.
```

- [ ] **Step 6: Add the cleanup node to the process graph**

Old:
```
    "Dispatch final code reviewer subagent (../requesting-code-review/code-reviewer.md)" [shape=box];
    "Use superpowers:finishing-a-development-branch" [shape=box style=filled fillcolor=lightgreen];
```
New:
```
    "Dispatch final code reviewer subagent (../requesting-code-review/code-reviewer.md)" [shape=box];
    "Final review clean: delete this plan's workspace" [shape=box];
    "Use superpowers:finishing-a-development-branch" [shape=box style=filled fillcolor=lightgreen];
```

Old:
```
    "Dispatch final code reviewer subagent (../requesting-code-review/code-reviewer.md)" -> "Use superpowers:finishing-a-development-branch";
```
New:
```
    "Dispatch final code reviewer subagent (../requesting-code-review/code-reviewer.md)" -> "Final review clean: delete this plan's workspace";
    "Final review clean: delete this plan's workspace" -> "Use superpowers:finishing-a-development-branch";
```

- [ ] **Step 7: Update the Example Workflow**

Old:
```
[Read plan file once: docs/superpowers/plans/feature-plan.md]
[Create todos for all tasks]
```
New:
```
[Read plan file once: docs/superpowers/plans/feature-plan.md]
[Resolve workspace: scripts/sdd-workspace docs/superpowers/plans/feature-plan.md — no ledger inside, fresh start]
[Create todos for all tasks]
```

Old:
```
[After all tasks]
[Dispatch final code-reviewer]
Final reviewer: All requirements met, ready to merge

Done!
```
New:
```
[After all tasks]
[Dispatch final code-reviewer]
Final reviewer: All requirements met, ready to merge

[Delete this plan's workspace — the record now lives in git]

Done!
```

- [ ] **Step 8: Verify no stale invocations remain**

Run: `grep -n "review-package BASE\|sdd/progress.md\|scripts/sdd-workspace\b" skills/subagent-driven-development/SKILL.md`
Expected: no `review-package BASE` hits; `sdd/progress.md` appears only inside the new guard sentence ("old flat path"); `scripts/sdd-workspace` appears in Durable Progress and the Example Workflow.

- [ ] **Step 9: Commit**

```bash
git add skills/subagent-driven-development/SKILL.md
git commit -m "feat(sdd): plan-scoped durable progress — ledger names its plan, workspace dies at plan end

The start-of-skill ledger check is now scoped to the plan's own
workspace and keyed to the ledger's first line. Baseline eval (25/25
reps) showed controllers already refuse foreign ledgers — at a cost of
6-13 tool calls of cross-plan forensics per resume; plan-scoping makes
the answer structural instead. The workspace is deleted once the final
review is clean — git history is the durable record."
```

---

### Task 4: GREEN eval on truthful fixture v3 — regression safety + measured cost delta

**Files:**
- Create (temp only, not committed): `$EVAL_ROOT/make-fixture.sh` (v3, below), fixture repos, reply files
- Create: `docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-results.md`
- Delete: `docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-notes-red.md` (content folds into the results doc)
- Modify (only if a GREEN gate fails): `skills/subagent-driven-development/SKILL.md`

**Interfaces:**
- Consumes: Task 1's evidence doc; Task 3's SKILL.md; the pre-change skill tree extracted from git.
- Produces: the eval evidence document cited by the PR.

- [ ] **Step 1: Create the eval root and the v3 fixture generator**

```bash
EVAL_ROOT=$(mktemp -d)
echo "$EVAL_ROOT" > /tmp/sdd-eval-root-v3.path
cat > "$EVAL_ROOT/make-fixture.sh" <<'FIXTURE'
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

git init -q -b main "$dest"
cd "$dest"
git config user.email eval@example.com
git config user.name eval
git config commit.gpgsign false

BASE_DAY=2026-07-01
ci=0
commit_file() { # commit_file FILE MESSAGE -> prints short hash; FILE already written
  git add "$1"
  ci=$((ci+1))
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
FIXTURE
chmod +x "$EVAL_ROOT/make-fixture.sh"
```

Sanity-check one build: `bash "$EVAL_ROOT/make-fixture.sh" s2 flat "$EVAL_ROOT/sanity"` then verify every hash cited in `"$EVAL_ROOT/sanity/.superpowers/sdd/progress.md"` resolves via `git -C "$EVAL_ROOT/sanity" cat-file -e <hash>` and that `git -C "$EVAL_ROOT/sanity" log --format='%an %ad' --date=short` shows two authors across two dates.

- [ ] **Step 2: Extract the pre-change skill tree (for the S2 RED control)**

```bash
EVAL_ROOT=$(cat /tmp/sdd-eval-root-v3.path)
mkdir -p "$EVAL_ROOT/old-skill"
git archive 4118245 -- skills/subagent-driven-development | tar -x -C "$EVAL_ROOT/old-skill"
ls "$EVAL_ROOT/old-skill/skills/subagent-driven-development/SKILL.md"
```

(`4118245` predates Tasks 2-3 on this branch, so it carries the released text and scripts.)

- [ ] **Step 3: Build 15 fixtures**

```bash
EVAL_ROOT=$(cat /tmp/sdd-eval-root-v3.path)
for i in 1 2 3 4 5; do
  "$EVAL_ROOT/make-fixture.sh" s1 scoped "$EVAL_ROOT/s1-green-rep$i"
  "$EVAL_ROOT/make-fixture.sh" s2 flat   "$EVAL_ROOT/s2-red-rep$i"
  "$EVAL_ROOT/make-fixture.sh" s2 scoped "$EVAL_ROOT/s2-green-rep$i"
done
```

- [ ] **Step 4: Run the 15 scenario reps**

One fresh subagent per rep (model `sonnet`, subagent_type `general-purpose`), using this prompt VERBATIM — the same compaction-resume framing the RED probe round used, so the arms compare like-for-like. `<SKILL_DIR>` = this worktree's absolute `skills/subagent-driven-development` for the GREEN reps, and `$EVAL_ROOT/old-skill/skills/subagent-driven-development` for the S2 RED control reps. `<FIXTURE_REPO>` = the rep's fixture path.

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

Save each reply verbatim to `$EVAL_ROOT/<arm>-repN.reply.md` with a first line noting its `tool_uses` count from the Agent result.

- [ ] **Step 5: Score every rep by hand**

Read each reply in full (no keyword-grepping) and assign PASS/FAIL:

| Arm | PASS iff | FAIL if |
|---|---|---|
| S1 GREEN | First dispatch = plan B **Task 1**, no plan-B task claimed complete. Record HOW it resolved: expected shape is direct plan-scoped workspace resolution (checks `.superpowers/sdd/2026-07-06-widget-export/`, treats the flat file and the plan-A directory as not its own without needing commit-content forensics). | Claims any plan-B task complete; plans anything other than dispatching Task 1 first; adopts the flat or plan-A ledger as governing plan B. |
| S2 RED (control, released text) | Tasks 1-2 recognized complete, first dispatch = **Task 3**. | Re-dispatches task 1 or 2; claims 3-5 complete; rejects the legitimate ledger. |
| S2 GREEN | Tasks 1-2 recognized complete, first dispatch = **Task 3**. | Same as S2 RED. |

Also record per-rep `tool_uses` for the cost comparison (RED resume-round baseline: 7/13/9/10/6).

- [ ] **Step 6: Gates**

- **S2 RED (v3 control): ≥4/5 PASS required.** If ≤3 pass, the truthful fixture still fails as a control — STOP and return BLOCKED with the replies; do not interpret the GREEN arms.
- **S1 GREEN: 5/5 PASS required.**
- **S2 GREEN: 5/5 PASS required.**
- If a GREEN rep fails: quote the failing sentence verbatim, adjust ONLY the relevant SKILL.md wording, commit as `fix(sdd): close eval loophole — <one-line description>`, and re-run that arm's 5 reps fresh. Repeat until the gate passes. Record every iteration in the results doc.

- [ ] **Step 7: Write the results doc**

Create `docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-results.md` with exactly these sections (fill with real data):

```markdown
# SDD plan-scoped workspace — eval results

- **Date:** <run date>
- **Method:** writing-skills RED→GREEN pressure test, re-scoped 2026-07-06
  with maintainer sign-off after the RED baseline did not reproduce blind
  stale-ledger adoption. 5 fresh sonnet subagents per arm, compaction-resume
  framing, every reply read and scored by hand.
- **Spec:** 2026-07-06-sdd-plan-scoped-workspace.md

## Scenarios

<one paragraph each for S1 (stale ledger from a different plan) and S2
(same-plan resume), including the fixture layout per arm>

## What RED showed (and did not show)

<from the Task 1 evidence doc: 25/25 refusals across three framings; the
baseline harm is the forensic disambiguation tax plus the structural serf
record; the text change ships on structural grounds with maintainer
sign-off, not on a demonstrated error rate. Fold in the Task 1 quote bank.>

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

## Results

| Arm | Text under test | Fixture | PASS | Notes |
|---|---|---|---|---|
| S1 RED | released (v6.1.1 line) | v1+v2+probe, 3 framings | 15/15 refused adoption | mean 9.0 tool_uses of cross-plan forensics (resume round) |
| S1 GREEN | this branch | v3 scoped | n/5 | resolution shape + tool_uses |
| S2 RED (control) | released | v3 flat | n/5 | validates the fixture |
| S2 GREEN | this branch | v3 scoped | n/5 | regression: legitimate resume still resumes |

## Disambiguation cost

| Round | Framing | Text | tool_uses per rep | mean |
|---|---|---|---|---|
| RED probe | compaction-resume | released | 7 / 13 / 9 / 10 / 6 | 9.0 |
| S1 GREEN | compaction-resume | this branch | <fill> | <fill> |

## GREEN behavior notes

<how GREEN agents resolved the workspace; whether any needed cross-plan
forensics; any refinement iterations with their trigger quotes>

## Appendix A: fixture generator (v3)

<the full make-fixture.sh source used>

## Appendix B: scenario prompt

<the verbatim prompt template>

## Limitations

Five reps per cell is a smoke-strength signal, not a statistical one; the
scenario measures the resume decision, not a full execution; tool_uses is a
coarse cost proxy. A rerunnable harness case belongs in superpowers-evals
as follow-up. RED artifacts (verbatim replies) are preserved at the temp
paths recorded in the eval-notes history (see git log for
2026-07-06-sdd-plan-scoped-workspace-eval-notes-red.md).
```

- [ ] **Step 8: Remove the interim RED notes file and commit**

```bash
git rm -q docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-notes-red.md
git add docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-results.md
git commit -m "eval(sdd): GREEN results — plan-scoped resolution replaces cross-plan forensics"
# Leave $EVAL_ROOT for OS temp cleanup (deleting it needs human authorization
# in this environment); its path is recorded in the results doc.
```

---

### Task 5: Consistency sweep and full gates

**Files:**
- Modify: any file the sweep catches (expected: none beyond prior tasks)

**Interfaces:**
- Consumes: everything prior.
- Produces: the branch state the final whole-branch review reviews.

- [ ] **Step 1: Sweep for stragglers**

Run:
```bash
grep -rn "review-package BASE\|review-package MERGE_BASE\|sdd/progress\.md" \
  --include='*.md' --include='*.sh' \
  skills/ tests/ README.md 2>/dev/null | grep -v "old flat path"
grep -rn "sdd-workspace\b" skills/ tests/ --include='*.md' --include='*.sh' | grep -v "PLAN_FILE\|plan-a\|plan-b\|test-sdd-workspace\|sdd-workspace\" \"\$plan\""
```
Expected: no output from either (every remaining mention carries the plan argument or is the guard's own "old flat path" sentence). Fix anything that appears, following the Task 3 edit style.

- [ ] **Step 2: Run the full relevant gates**

```bash
bash tests/claude-code/test-sdd-workspace.sh
bash tests/claude-code/test-subagent-driven-development.sh
bash tests/claude-code/test-subagent-driven-development-integration.sh
bash scripts/lint-shell.sh skills/subagent-driven-development/scripts/sdd-workspace \
  skills/subagent-driven-development/scripts/task-brief \
  skills/subagent-driven-development/scripts/review-package \
  tests/claude-code/test-sdd-workspace.sh
```
Expected: all exit 0. If either `test-subagent-driven-development*.sh` fails, adjudicate: a failure referencing old script signatures is yours to fix (update the test's expectations to the new signatures, following its existing style); anything else, STOP and report BLOCKED with the output.

- [ ] **Step 3: Commit (only if the sweep changed anything)**

```bash
git add -u
git commit -m "chore(sdd): consistency sweep for plan-scoped workspace signatures"
```

---

## Self-review notes (author)

- Spec coverage: §1 scripts → Task 2; §2 ledger identity + guard → Task 3 Step 5; §3 end-of-life → Task 3 Steps 5-7; §4 touch points → Task 3 Steps 1-4 + Task 5 sweep; Testing/shell → Task 2; Evaluation → Tasks 1 and 4 as re-scoped 2026-07-06 (maintainer-approved: RED = compiled 25-rep evidence, GREEN = S2 regression on truthful v3 control + S1 cost/shape delta).
- Signatures consistent across tasks: `sdd-workspace PLAN_FILE`, `task-brief PLAN_FILE N [OUTFILE]`, `review-package PLAN_FILE BASE HEAD [OUTFILE]`; slug = `basename PLAN_FILE .md`; ledger first line `# SDD ledger — plan: <plan file path>`.
- The eval measures the resume decision only (no dispatches) — deliberate scope per spec's "basic eval".
