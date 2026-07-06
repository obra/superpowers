# SDD Plan-Scoped Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make SDD's durable-progress workspace plan-scoped (`.superpowers/sdd/<plan-basename>/`) with a self-identifying ledger and end-of-plan cleanup, so a follow-up plan can never mistake a previous plan's ledger for its own progress.

**Architecture:** Three shell scripts in `skills/subagent-driven-development/scripts/` gain plan awareness (`sdd-workspace PLAN_FILE` becomes the single source of truth for the per-plan directory); SKILL.md's Durable Progress section is rewritten around the plan-scoped workspace with a mismatch guard keyed to the ledger's first line; a RED→GREEN pressure-test eval (writing-skills methodology) proves the old text fails and the new text binds. Spec: `docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace.md`.

**Tech Stack:** bash, shellcheck (via `scripts/lint-shell.sh`), repo shell-test conventions (`tests/claude-code/test-sdd-workspace.sh`), subagent pressure-test evals.

## Global Constraints

- Execute tasks in order 1 → 5. Task 1 (RED baseline) MUST complete before Task 3 touches SKILL.md — no skill edit without a captured failing baseline (writing-skills Iron Law).
- No backward-compatibility code paths: no legacy-layout reads, no dual-signature support in scripts. Scripts and SKILL.md ship together.
- Eval fixtures and scenario workdirs live under `mktemp -d` and are deleted afterward; they are NEVER committed and NEVER created inside this repository checkout.
- Eval scenario subagents: model `sonnet`, subagent_type `general-purpose`, one fresh subagent per rep, prompt used VERBATIM as given (fill only the `<PLACEHOLDER>` paths). Do not add hints about ledgers, staleness, or the fix.
- Every shell file you create or modify must pass `bash scripts/lint-shell.sh <file>` (shellcheck 0.11.0 is installed).
- Match SKILL.md's existing prose conventions: two-space bullet continuation indent, em-dashes (`—`), sentence-per-line wrapping style.
- Commit at the end of every task with the message given in the task.

---

### Task 1: RED baseline eval — capture the failure with the released skill text

**Files:**
- Create (temp only, not committed): `$EVAL_ROOT/make-fixture.sh`, `$EVAL_ROOT/red/` working files
- Create: `docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-notes-red.md` (interim RED evidence; folded into the final results doc in Task 4)

**Interfaces:**
- Consumes: `skills/subagent-driven-development/` at current HEAD (pre-edit text).
- Produces: RED scoring table + verbatim failure quotes that Task 3 uses to tune wording and Task 4 folds into the final results doc. Also the fixture generator script content, reused verbatim in Task 4.

- [ ] **Step 1: Create the eval root and the fixture generator**

```bash
EVAL_ROOT=$(mktemp -d)
echo "$EVAL_ROOT" > /tmp/sdd-eval-root.path   # so later steps/tasks can find it
mkdir -p "$EVAL_ROOT/red"
cat > "$EVAL_ROOT/make-fixture.sh" <<'FIXTURE'
#!/usr/bin/env bash
# Build a throwaway git repo simulating a project where SDD ran plan A
# (widget backend) to completion and a controller is now starting the
# follow-up plan B (widget export). Every commit a ledger cites is a real,
# resolvable commit in this history — the released skill text tells
# controllers to cross-check the ledger against git log, so fabricated
# hashes would let agents dismiss the ledger via forensics and the eval
# would measure the wrong mechanism (fixture v1 failed exactly this way).
# Plans A and B both have 5 tasks so task count is not a tell: the only
# signal distinguishing the ledgers is plan identity.
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

commit_task() { # commit_task FILE CONTENT MESSAGE -> prints short hash
  printf '%s\n' "$2" > "$1"
  git add "$1"
  git commit -qm "$3"
  git rev-parse --short HEAD
}

mkdir -p docs/plans src

cat > docs/plans/2026-07-01-widget-backend.md <<'EOF'
# Widget Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Build the widget inventory backend core.

## Task 1: Storage schema

Define the on-disk widget schema in `src/schema.py`.

## Task 2: Validation rules

Reject malformed widgets in `src/validate.py`.

## Task 3: File locking

Serialize writers via `src/lock.py`.

## Task 4: Registry load/save

Round-trip the registry in `src/registry.py`.

## Task 5: Lint gate

Add the lint configuration and make it pass.
EOF

cat > src/inventory.py <<'EOF'
"""Inventory service (fixture)."""
def list_items():
    return []
EOF

git add -A
git commit -qm "chore: widget project scaffold with backend plan"

# Plan A's five tasks, executed for real so its ledger cites real commits.
a1=$(commit_task src/schema.py   'SCHEMA = {"id": int, "name": str, "count": int}' 'feat(backend): storage schema')
a2=$(commit_task src/validate.py 'def validate(w): return set(w) == {"id", "name", "count"}' 'feat(backend): validation rules')
a3=$(commit_task src/lock.py     'import fcntl' 'feat(backend): file locking')
a4=$(commit_task src/registry.py 'def load(p): return []' 'feat(backend): registry load/save')
a5=$(commit_task .lint.cfg       'max-line-length = 100' 'chore(backend): lint gate')

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
  # Plan B tasks 1-2 genuinely executed, so the resume ledger is legitimate
  # and its cited commits resolve.
  b1=$(commit_task src/export_model.py 'class ExportRow: pass' 'feat(export): export data model')
  b2=$(commit_task src/export_csv.py   'def to_csv(rows): return ""' 'feat(export): csv serializer')
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

- [ ] **Step 2: Extract the pre-edit skill directory (the text under test)**

```bash
EVAL_ROOT=$(cat /tmp/sdd-eval-root.path)
mkdir -p "$EVAL_ROOT/red/skill"
git archive HEAD -- skills/subagent-driven-development | tar -x -C "$EVAL_ROOT/red/skill"
ls "$EVAL_ROOT/red/skill/skills/subagent-driven-development/SKILL.md"
```

Expected: the SKILL.md path prints (file exists). This snapshot is the RELEASED behavior baseline; Task 3 has not run yet so HEAD's copy is the released text.

- [ ] **Step 3: Build 10 RED fixtures (5 reps × scenarios S1, S2, `flat` layout)**

```bash
EVAL_ROOT=$(cat /tmp/sdd-eval-root.path)
for i in 1 2 3 4 5; do
  "$EVAL_ROOT/make-fixture.sh" s1 flat "$EVAL_ROOT/red/s1-rep$i"
  "$EVAL_ROOT/make-fixture.sh" s2 flat "$EVAL_ROOT/red/s2-rep$i"
done
ls "$EVAL_ROOT/red"
```

Expected: directories `s1-rep1..5`, `s2-rep1..5`, plus `skill/`.

- [ ] **Step 4: Run the 10 scenario reps as fresh subagents**

Dispatch one fresh subagent per rep (model `sonnet`, subagent_type `general-purpose`). Use this prompt VERBATIM, substituting only `<SKILL_DIR>` = `$EVAL_ROOT/red/skill/skills/subagent-driven-development` and `<FIXTURE_REPO>` = the rep's fixture path. The S1 and S2 prompts are identical — only the fixture differs.

```
You are a controller about to execute an implementation plan using the
Subagent-Driven Development skill. The complete skill (SKILL.md plus its
scripts/ directory) is at: <SKILL_DIR>
Read <SKILL_DIR>/SKILL.md first and follow its process exactly.

The repository you are working in: <FIXTURE_REPO>
Your plan: docs/plans/2026-07-06-widget-export.md (relative to that repo)

This session may be a resume after context compaction: you do not remember
whether any of this plan was already executed. The repository state and the
skill's process are your only sources of truth.

Scope limit for this run: you may read anything, run git commands, and run
the skill's scripts. Do NOT dispatch any subagents and do NOT implement any
tasks. Work only up to the point where you know your execution state, then
STOP and reply with exactly this report:

1. LEDGERS CHECKED: each progress/ledger file path you looked at, and what
   you concluded from it.
2. TASKS ALREADY COMPLETE: which of YOUR plan's tasks (if any) are already
   done.
3. FIRST DISPATCH: which task you will dispatch first.

Be concrete and terse. That report is your entire deliverable.
```

Save each subagent's reply verbatim to `$EVAL_ROOT/red/s1-repN.reply.md` / `$EVAL_ROOT/red/s2-repN.reply.md`.

- [ ] **Step 5: Score every rep by hand against these criteria**

Read each reply in full (do not keyword-grep) and assign PASS/FAIL:

| Scenario | PASS iff | FAIL if |
|---|---|---|
| S1 | Report says first dispatch = plan B **Task 1** AND does not claim any plan-B task is complete. Explicitly identifying the found ledger as another plan's also passes. | Claims any plan-B task complete; plans anything other than dispatching Task 1 first (e.g., "all five tasks are done — proceed to final review"); treats the found ledger as governing plan B. |
| S2 | Report says tasks 1–2 complete, first dispatch = **Task 3**. | Re-dispatches task 1 or 2; claims 3–5 complete; ignores the ledger. |

Record a table plus at least one verbatim quote per FAIL (the sentence where the agent adopts the stale ledger — these quotes drive Task 3/4 wording).

- [ ] **Step 6: Apply the gates**

- S1 RED: expected result is FAIL on 1 or more of 5 reps (any failure proves the bug). **If S1 RED passes 5/5, STOP — return BLOCKED** with the replies attached; the human partner must reassess before any skill text changes (no failing test = no edit).
- S2 RED: expected PASS 5/5 (released text handles same-plan resume). One S2 failure is baseline data — note it and continue. **If S2 RED fails on 2 or more reps, the control itself is broken (a legitimate ledger must be honored): STOP and return BLOCKED** rather than proceeding on a miscalibrated fixture.

- [ ] **Step 7: Write the interim RED evidence file and commit**

Write `docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-notes-red.md` containing: the scoring table, per-rep one-line outcomes, every FAIL quote verbatim, and the exact `$EVAL_ROOT` paths used (for traceability within this branch's history; the file is interim and gets superseded in Task 4).

```bash
git add docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-notes-red.md
git commit -m "eval(sdd): RED baseline — released text vs stale-ledger and resume scenarios"
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

### Task 3: SKILL.md — plan-scoped Durable Progress, mismatch guard, end-of-plan cleanup

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md`

**Interfaces:**
- Consumes: script signatures from Task 2 (`sdd-workspace PLAN_FILE`, `review-package PLAN_FILE BASE HEAD`); RED failure quotes from Task 1 (context only — the text below is the starting wording; Task 4 refines it if GREEN fails).
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
workspace and keyed to the ledger's first line, so a follow-up plan in
the same working tree no longer adopts a previous plan's completed
ledger as its own progress (observed: controllers skipping or renaming
around stale ledgers). The workspace is deleted once the final review
is clean — git history is the durable record."
```

---

### Task 4: GREEN eval, refinement loop, and the committed results doc

**Files:**
- Create: `docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-results.md`
- Delete: `docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-notes-red.md` (its content folds into the results doc)
- Modify (only if GREEN fails): `skills/subagent-driven-development/SKILL.md`

**Interfaces:**
- Consumes: Task 1's RED table/quotes and fixture generator (recreate `$EVAL_ROOT/make-fixture.sh` verbatim from Task 1 Step 1 if the temp dir is gone); Task 3's SKILL.md.
- Produces: the eval evidence document cited by the PR.

- [ ] **Step 1: Build 10 GREEN fixtures (`scoped` layout)**

```bash
EVAL_ROOT=$(cat /tmp/sdd-eval-root.path)   # if missing, recreate make-fixture.sh from Task 1 Step 1 verbatim
mkdir -p "$EVAL_ROOT/green"
for i in 1 2 3 4 5; do
  "$EVAL_ROOT/make-fixture.sh" s1 scoped "$EVAL_ROOT/green/s1-rep$i"
  "$EVAL_ROOT/make-fixture.sh" s2 scoped "$EVAL_ROOT/green/s2-rep$i"
done
```

- [ ] **Step 2: Run 10 scenario reps against the NEW skill directory**

Same dispatch protocol and VERBATIM prompt as Task 1 Step 4, with `<SKILL_DIR>` = this worktree's `skills/subagent-driven-development` (absolute path) and the green fixtures. Save replies to `$EVAL_ROOT/green/s{1,2}-repN.reply.md`.

- [ ] **Step 3: Score with the same criteria table as Task 1 Step 5**

Additional S1 GREEN expectation (record, don't merely pass/fail): the reply's LEDGERS CHECKED should show the agent resolving `.superpowers/sdd/2026-07-06-widget-export/` for itself and identifying `.superpowers/sdd/progress.md` and/or the plan-A directory as not its own.

- [ ] **Step 4: Gate — refine wording only on evidence**

- S1 GREEN and S2 GREEN must both PASS 5/5.
- If any rep fails: quote the failing sentence verbatim, adjust ONLY the relevant SKILL.md wording (e.g., add a Red Flags bullet quoting the observed rationalization pattern, or tighten the Durable Progress guard), commit the adjustment with message `fix(sdd): close eval loophole — <one-line description>`, and re-run that scenario's 5 reps fresh. Repeat until 5/5. Record every iteration in the results doc.

- [ ] **Step 5: Write the results doc**

Create `docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-results.md` with exactly these sections (fill with real data):

```markdown
# SDD plan-scoped workspace — eval results

- **Date:** <run date>
- **Method:** writing-skills RED→GREEN pressure test; 5 fresh sonnet
  subagents per scenario per arm; every reply read and scored by hand.
- **Spec:** 2026-07-06-sdd-plan-scoped-workspace.md

## Scenarios

<one paragraph each for S1 (stale ledger from a different plan) and S2
(same-plan resume), including the fixture layout per arm>

## Fixture iterations

Fixture v1 (discarded before any skill edit): plan A had 17 tasks vs plan
B's 5 (a task-count tell), and its ledgers cited fabricated commit hashes.
Because the released skill text already says to cross-check the ledger
against `git log`, every RED agent dismissed the ledger via forensics — S1
"passed" 5/5 for the wrong reason and S2, the legitimate-resume control,
failed 5/5. The Task 1 STOP gate fired and the fixture was rebuilt (v2)
with real cited commits and matched task counts, so plan identity is the
only distinguishing signal. v1 evidence:

> s1-rep2: "None of the aaa000N/bbb000N hashes the ledger cites exist as
> git objects … The ledger's claims are unverifiable/fabricated relative
> to actual repo history."

> s2-rep1: "the commit hashes ccc0001/ddd0001/ccc0002/ddd0002 the ledger
> cites don't exist anywhere in history … this ledger is stale/fabricated
> and must not be trusted."

## Results

| Scenario | Arm | Text under test | PASS | FAIL |
|---|---|---|---|---|
| S1 | RED | released SKILL.md (v6.1.1 line) | n/5 | n/5 |
| S1 | GREEN | this branch | 5/5 | 0/5 |
| S2 | RED | released SKILL.md (v6.1.1 line) | n/5 | n/5 |
| S2 | GREEN | this branch | 5/5 | 0/5 |

## Verbatim failure evidence (RED)

<every RED FAIL quote, one block per rep, with rep id>

## GREEN behavior notes

<how GREEN agents resolved the workspace and what they said about the
stale artifacts; any refinement iterations with their trigger quotes>

## Appendix A: fixture generator

<the full make-fixture.sh source used>

## Appendix B: scenario prompt

<the verbatim prompt template>

## Limitations

Five reps per cell is a smoke-strength signal, not a statistical one; the
scenario measures the resume decision, not a full execution. A rerunnable
harness case belongs in superpowers-evals as follow-up.
```

- [ ] **Step 6: Remove the interim RED notes file and commit**

```bash
git rm -q docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-notes-red.md
git add docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-results.md
git commit -m "eval(sdd): GREEN results — plan-scoped text binds where released text failed"
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

- Spec coverage: §1 scripts → Task 2; §2 ledger identity + guard → Task 3 Step 5; §3 end-of-life → Task 3 Steps 5–7; §4 touch points → Task 3 Steps 1–4 + Task 5 sweep; Testing/shell → Task 2; Evaluation → Tasks 1 and 4; out-of-scope items have no tasks (correct).
- Signatures consistent across tasks: `sdd-workspace PLAN_FILE`, `task-brief PLAN_FILE N [OUTFILE]`, `review-package PLAN_FILE BASE HEAD [OUTFILE]`; slug = `basename PLAN_FILE .md`; ledger first line `# SDD ledger — plan: <plan file path>`.
- The eval measures the resume decision only (no dispatches) — deliberate scope per spec's "basic eval".
