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

# Push a path through the same normalization that sdd-workspace's own
# printed output goes through, so both sides of a string comparison are
# guaranteed to be spelled identically. On Windows (Git Bash/MSYS, Cygwin)
# that is the drive-letter form `cygpath -m` prints (C:/Users/...), not the
# MSYS form `pwd` prints (/c/Users/...); on Linux/macOS it is plain `pwd`
# (modulo the resolved-symlink /var -> /private/var case handled by the
# mktemp comment below).
physical_path() {
    (cd "$1" && if command -v cygpath >/dev/null 2>&1; then cygpath -m "$PWD"; else pwd; fi)
}

# On Windows, check that PowerShell (the shell an agent's PowerShell tool
# runs) can open a path the helpers printed. Elsewhere there is nothing to
# check: the printed path is the shell's own.
native_readable() {
    command -v cygpath >/dev/null 2>&1 && command -v powershell.exe >/dev/null 2>&1 || return 0
    [[ "$(powershell.exe -NoProfile -Command "Test-Path -LiteralPath '$1'" | tr -d '\r')" == "True" ]]
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
    repo="$(physical_path "$repo")"

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

    if native_readable "$dir_a"; then
        pass "the printed workspace path opens from PowerShell on Windows"
    else
        fail "the printed workspace path opens from PowerShell on Windows"
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
    if native_readable "$brief_path"; then
        pass "the printed brief path opens from PowerShell on Windows"
    else
        fail "the printed brief path opens from PowerShell on Windows"
        echo "    got: $brief_path"
    fi

    # --- Task IDs: alphanumeric (#2459), matched whole, never as a prefix ---
    cat > "$repo/plan-ids.md" <<'PLAN'
# Lanes Plan

## Task Overview

Shared context; not a task.

### Task A1: First lane

BODY-A1

#### Task notes

Still part of A1.

### Task A10: Same lane, later

BODY-A10

### Task 6: Numbered

BODY-6

### Task 6b: Sub-task

BODY-6B

### Task 2.1: Dotted

BODY-2.1

### Task 201: Decoy

BODY-201
PLAN
    local id want got id_out="$TEST_ROOT/id-brief.md"
    for id in A1 A10 6 6b 2.1 201; do
        want="BODY-$(printf '%s' "$id" | tr '[:lower:]' '[:upper:]')"
        rc=0
        (cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-ids.md "$id" "$id_out" >/dev/null 2>&1) || rc=$?
        got="$(grep '^BODY-' "$id_out" 2>/dev/null | tr '\n' ' ')" || true
        if [[ "$rc" -eq 0 && "$got" == "$want " ]]; then
            pass "task-brief extracts Task $id and nothing else"
        else
            fail "task-brief extracts Task $id and nothing else"
            echo "    exit: $rc, bodies: $got"
        fi
        : > "$id_out"
    done
    (cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-ids.md A1 "$id_out" >/dev/null 2>&1) || true
    if grep -q 'Still part of A1.' "$id_out"; then
        pass "a Task heading with no digit in its ID is not a task boundary"
    else
        fail "a Task heading with no digit in its ID is not a task boundary"
        echo "    brief: $(cat "$id_out" 2>/dev/null)"
    fi
    # A deeper heading whose ID extends the task's (7 -> 7a) is a sub-task and
    # stays in the parent's brief; a deeper heading for another task (a plan
    # that drifts from ## Task 9 to ### Task 10) is still a boundary.
    cat > "$repo/plan-nested.md" <<'PLAN'
### Task 7: Parent

BODY-7

#### Task 7a: First part

BODY-7A

#### Task 7b: Second part

BODY-7B

### Task 8: Next

BODY-8

## Task 9: Shallower heading

BODY-9

### Task 10: Deeper, but not a sub-task

BODY-10
PLAN
    for id in 7 7a 7b 8 9 10; do
        case "$id" in
            7) want="BODY-7 BODY-7A BODY-7B " ;;
            *) want="BODY-$(printf '%s' "$id" | tr '[:lower:]' '[:upper:]') " ;;
        esac
        rc=0
        (cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-nested.md "$id" "$id_out" >/dev/null 2>&1) || rc=$?
        got="$(grep '^BODY-' "$id_out" 2>/dev/null | tr '\n' ' ')" || true
        if [[ "$rc" -eq 0 && "$got" == "$want" ]]; then
            pass "nested plan: Task $id brief holds exactly its own section"
        else
            fail "nested plan: Task $id brief holds exactly its own section"
            echo "    exit: $rc, bodies: $got (want: $want)"
        fi
    done

    for id in 2 '2|6' '6(' Overview; do
        rc=0
        (cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-ids.md "$id" "$id_out" >/dev/null 2>&1) || rc=$?
        if [[ "$rc" -eq 3 ]]; then
            pass "task-brief '$id' matches no task (exit 3)"
        else
            fail "task-brief '$id' matches no task (exit 3)"
            echo "    exit: $rc, brief: $(cat "$id_out" 2>/dev/null)"
        fi
    done

    # --- Translated task headings: say so instead of "not found" (#2496) ---
    cat > "$repo/plan-es.md" <<'PLAN'
# Plan: demo

## Tarea 1: Banner

**Archivos:**

## Tarea 2: Segunda
PLAN
    local es_err
    rc=0
    es_err="$(cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-es.md 1 "$id_out" 2>&1 >/dev/null)" || rc=$?
    if [[ "$rc" -eq 3 && "$es_err" == *'English word "Task"'* \
        && "$es_err" == *"## Tarea 1: Banner"* && "$es_err" == *"## Tarea 2: Segunda"* ]]; then
        pass "task-brief on a plan with no Task headings names the headings it saw"
    else
        fail "task-brief on a plan with no Task headings names the headings it saw"
        echo "    exit: $rc"
        echo "    stderr: $es_err"
    fi

    # A plan that has Task headings, just not this one, gets the plain error.
    rc=0
    es_err="$(cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-ids.md 99 "$id_out" 2>&1 >/dev/null)" || rc=$?
    if [[ "$rc" -eq 3 && "$es_err" == "task 99 not found in plan-ids.md (no heading matching 'Task 99')" ]]; then
        pass "a missing task in a plan with Task headings gets only the not-found line"
    else
        fail "a missing task in a plan with Task headings gets only the not-found line"
        echo "    exit: $rc"
        echo "    stderr: $es_err"
    fi

    # --- An unclosed fence hides every later Task heading (#2436) ---
    cat > "$repo/plan-unclosed.md" <<'PLAN'
# Example Plan

### Task 1: First task

```typescript
const x = 1
```

```typescript
const y = 2

### Task 2: Second task

TASK-2-MARKER

### Task 3: Third task

TASK-3-MARKER
PLAN
    local fence_out="$TEST_ROOT/unclosed-brief.md" fence_err
    rc=0
    fence_err="$(cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-unclosed.md 1 "$fence_out" 2>&1 >/dev/null)" || rc=$?
    if [[ "$rc" -eq 4 && ! -e "$fence_out" && "$fence_err" == *"line 9"*"never closes"* ]]; then
        pass "task-brief refuses a brief that an unclosed fence would run to EOF (exit 4, names the line)"
    else
        fail "task-brief refuses a brief that an unclosed fence would run to EOF (exit 4, names the line)"
        echo "    exit: $rc"
        echo "    stderr: $fence_err"
        echo "    brief: $(cat "$fence_out" 2>/dev/null)"
    fi

    rc=0
    fence_err="$(cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-unclosed.md 2 "$fence_out" 2>&1 >/dev/null)" || rc=$?
    if [[ "$rc" -eq 3 && "$fence_err" == *"never closes"* ]]; then
        pass "task-brief names the unclosed fence when it hides the requested heading"
    else
        fail "task-brief names the unclosed fence when it hides the requested heading"
        echo "    exit: $rc"
        echo "    stderr: $fence_err"
    fi

    # An unclosed fence in a later task does not touch an earlier task's brief.
    sed 's/^### Task 1: First task$/### Task 0: Before/' "$repo/plan-unclosed.md" \
        | sed '1a\
\
### Task 1: Clean\
\
CLEAN-MARKER' > "$repo/plan-unclosed-later.md"
    rc=0
    fence_err="$(cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-unclosed-later.md 1 "$fence_out" 2>&1 >/dev/null)" || rc=$?
    if [[ "$rc" -eq 0 && -z "$fence_err" ]] && grep -q CLEAN-MARKER "$fence_out" && ! grep -q 'Task 0' "$fence_out"; then
        pass "an unclosed fence in a later task leaves an earlier task's brief alone"
    else
        fail "an unclosed fence in a later task leaves an earlier task's brief alone"
        echo "    exit: $rc"
        echo "    stderr: $fence_err"
        echo "    brief: $(cat "$fence_out" 2>/dev/null)"
    fi

    # A stray fence that hides no Task heading (seen in real plans as a lone
    # ``` on the last line) leaves the brief complete: brief it, and warn.
    cat > "$repo/plan-stray-fence.md" <<'PLAN'
### Task 1: First

BODY-1

### Task 2: Last

BODY-2
```
PLAN
    rc=0
    fence_err="$(cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-stray-fence.md 2 "$fence_out" 2>&1 >/dev/null)" || rc=$?
    if [[ "$rc" -eq 0 && "$fence_err" == *"warning"*"line 8"*"never closes"* ]] \
        && grep -q BODY-2 "$fence_out" && ! grep -q BODY-1 "$fence_out"; then
        pass "a stray fence that hides no Task heading briefs the task and warns"
    else
        fail "a stray fence that hides no Task heading briefs the task and warns"
        echo "    exit: $rc"
        echo "    stderr: $fence_err"
        echo "    brief: $(cat "$fence_out" 2>/dev/null)"
    fi

    # An unclosed fence that hides only some later prose, but no Task
    # heading, also leaves the last task's brief complete.
    printf '### Task 1: Only\n\nBODY-1\n\n```sh\necho hi\n\n## Notes\n\nNOT-A-TASK\n' > "$repo/plan-stray-prose.md"
    rc=0
    fence_err="$(cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-stray-prose.md 1 "$fence_out" 2>&1 >/dev/null)" || rc=$?
    if [[ "$rc" -eq 0 && "$fence_err" == *"warning"* ]] && grep -q BODY-1 "$fence_out"; then
        pass "an unclosed fence that hides no Task heading does not block the brief"
    else
        fail "an unclosed fence that hides no Task heading does not block the brief"
        echo "    exit: $rc"
        echo "    stderr: $fence_err"
    fi

    # When the open fence hides every Task heading, the fence is the
    # diagnosis: the plan's English Task headings must not also draw the
    # "use the English word Task" hint, which would contradict it.
    printf '## Phase 1: Setup\n\n```sh\necho hi\n\n### Task 1: Hidden\n\nBODY-1\n' > "$repo/plan-fence-hides-all.md"
    rc=0
    fence_err="$(cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-fence-hides-all.md 1 "$fence_out" 2>&1 >/dev/null)" || rc=$?
    if [[ "$rc" -eq 3 && "$fence_err" == *"line 3"*"never closes"* && "$fence_err" == *"task 1 not found"* \
        && "$fence_err" != *"English word"* ]]; then
        pass "a fence hiding every Task heading gets the fence message, not the English-word hint"
    else
        fail "a fence hiding every Task heading gets the fence message, not the English-word hint"
        echo "    exit: $rc"
        echo "    stderr: $fence_err"
    fi

    # --- Preamble inclusion without controller leak (#2493) ---
    cat > "$repo/plan-preamble.md" <<'PLAN'
# Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.
> Continuation line of worker blockquote.

**Goal:** Build widget

## Global Constraints

- Keep zero dependencies

## Review Focus

- Verify CRLF handling

---

### Task 1: First widget

BODY-PREAMBLE-1

### Task 2: Second widget

BODY-PREAMBLE-2
PLAN
    local pre_b1 pre_b2 pre_dir
    pre_dir="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" plan-preamble.md)"
    (cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-preamble.md 1 >/dev/null)
    (cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-preamble.md 2 >/dev/null)
    pre_b1="$pre_dir/task-1-brief.md"
    pre_b2="$pre_dir/task-2-brief.md"
    if grep -q '^\*\*Goal:\*\* Build widget$' "$pre_b1" \
        && grep -q '^## Global Constraints$' "$pre_b1" \
        && grep -q '^- Keep zero dependencies$' "$pre_b1" \
        && grep -q '^## Review Focus$' "$pre_b1" \
        && grep -q 'BODY-PREAMBLE-1' "$pre_b1" \
        && ! grep -q 'BODY-PREAMBLE-2' "$pre_b1" \
        && grep -q '^\*\*Goal:\*\* Build widget$' "$pre_b2" \
        && grep -q '^## Global Constraints$' "$pre_b2" \
        && grep -q '^## Review Focus$' "$pre_b2" \
        && grep -q 'BODY-PREAMBLE-2' "$pre_b2" \
        && ! grep -q 'BODY-PREAMBLE-1' "$pre_b2"; then
        pass "task-brief prepends plan preamble (Goal, Global Constraints, Review Focus) to Task 1 and Task 2"
    else
        fail "task-brief prepends plan preamble (Goal, Global Constraints, Review Focus) to Task 1 and Task 2"
        echo "    brief1:"; sed 's/^/      /' "$pre_b1" 2>/dev/null || true
        echo "    brief2:"; sed 's/^/      /' "$pre_b2" 2>/dev/null || true
    fi
    if ! grep -q 'REQUIRED SUB-SKILL' "$pre_b1" \
        && ! grep -q 'For agentic workers:' "$pre_b1" \
        && ! grep -q 'Continuation line of worker blockquote' "$pre_b1" \
        && ! grep -q 'REQUIRED SUB-SKILL' "$pre_b2"; then
        pass "task-brief strips worker dispatch blockquote from preamble"
    else
        fail "task-brief strips worker dispatch blockquote from preamble"
    fi

    # 0-preamble plan (or worker-blockquote-only header) gets no leading blank lines
    cat > "$repo/plan-zero-preamble.md" <<'PLAN'
### Task 1: Zero preamble

ZERO-BODY
PLAN
    local zero_out="$TEST_ROOT/zero-brief.md"
    (cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-zero-preamble.md 1 "$zero_out" >/dev/null)
    if [[ "$(head -n 1 "$zero_out")" == "### Task 1: Zero preamble" ]]; then
        pass "0-preamble plan gets no leading blank lines"
    else
        fail "0-preamble plan gets no leading blank lines"
        echo "    first line: $(head -n 1 "$zero_out")"
    fi

    cat > "$repo/plan-only-worker-quote.md" <<'PLAN'
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development

### Task 1: Starts clean

CLEAN-BODY
PLAN
    local qonly_out="$TEST_ROOT/qonly-brief.md"
    (cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-only-worker-quote.md 1 "$qonly_out" >/dev/null)
    if [[ "$(head -n 1 "$qonly_out")" == "### Task 1: Starts clean" ]] && ! grep -q 'REQUIRED SUB-SKILL' "$qonly_out"; then
        pass "plan with only worker blockquote before Task 1 gets no leading blank lines"
    else
        fail "plan with only worker blockquote before Task 1 gets no leading blank lines"
        echo "    first line: $(head -n 1 "$qonly_out")"
    fi

    # Chunked plan: the header is labelled and ends at its --- rule, so Chunk 1's
    # heading and intro stay out of a task that sits under Chunk 2
    cat > "$repo/plan-chunked.md" <<'PLAN'
# Chunked Plan

**Goal:** Build in chunks

## Global Constraints

- Keep zero dependencies

---

## Chunk 1: Storage

Chunk 1 is pure storage with no CLI changes.

### Task 1: Store

STORE-BODY

### Task 2: Load

LOAD-BODY

## Chunk 2: CLI

### Task 3: Command

COMMAND-BODY
PLAN
    local chunk_out="$TEST_ROOT/chunked-t3.md"
    (cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-chunked.md 3 "$chunk_out" >/dev/null)
    if grep -q '^## Global Constraints$' "$chunk_out" \
        && grep -qF '> **From the plan header.** Its Global Constraints bind this task. The' "$chunk_out" \
        && grep -q 'COMMAND-BODY' "$chunk_out" \
        && ! grep -q 'Chunk 1' "$chunk_out"; then
        pass "chunked plan: Task 3's brief has the labelled plan header and not Chunk 1"
    else
        fail "chunked plan: Task 3's brief has the labelled plan header and not Chunk 1"
        sed 's/^/      /' "$chunk_out" 2>/dev/null || true
    fi

    # --- Final-task boundary (#2406), nested fences, ~~~ fences, and CRLF ---
    cat > "$repo/plan-fences-final.md" <<'PLAN'
# Fences Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development

**Goal:** Test fences and boundaries

### Task 1: Intermediate with nested fences

````markdown
```bash
echo hi
```

## Inner Heading

### Task 99: Fake inside 4-backtick fence
````

~~~sh
echo tilde
### Task 2: Fake inside tilde fence
## Fake Heading inside tilde fence
~~~

~~~~markdown
~~~
still open inside 4-tilde fence
### Task 2: Fake inside 4-tilde fence
```
still open inside 4-tilde fence
~~~~

  ```text
  ### Task 2: Fake inside 2-space indented fence
  ```

    ```
```inline`tick```
AFTER-NESTED-AND-TILDE

### Task 2: Final task

FINAL-BODY

```markdown
## Fenced Heading Inside Final Task
```

#### Step 1: Subheading inside final task

STEP-1-BODY

## Self-Review

SELF-REVIEW-LEAK

## Execution Handoff

HANDOFF-LEAK
PLAN
    local f1_out="$TEST_ROOT/fences-t1.md" f2_out="$TEST_ROOT/fences-t2.md" f1_err="" f2_err=""
    rc=0
    f1_err="$(cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-fences-final.md 1 "$f1_out" 2>&1 >/dev/null)" || rc=$?
    if [[ "$rc" -eq 0 && -z "$f1_err" ]] \
        && grep -q '^## Inner Heading$' "$f1_out" \
        && grep -q '```bash' "$f1_out" \
        && grep -q 'AFTER-NESTED-AND-TILDE' "$f1_out" \
        && ! grep -q 'FINAL-BODY' "$f1_out"; then
        pass 'intermediate task with nested ````markdown, ```bash, ## Inner Heading, and ~~~ fences extracts in full'
    else
        fail 'intermediate task with nested ````markdown, ```bash, ## Inner Heading, and ~~~ fences extracts in full'
        echo "    rc: $rc, err: $f1_err"
        sed 's/^/      /' "$f1_out" 2>/dev/null || true
    fi

    rc=0
    f2_err="$(cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-fences-final.md 2 "$f2_out" 2>&1 >/dev/null)" || rc=$?
    if [[ "$rc" -eq 0 && "$f2_err" == *"## Self-Review"* && "$f2_err" == *"in no brief"* ]] \
        && grep -q 'FINAL-BODY' "$f2_out" \
        && grep -q '^## Fenced Heading Inside Final Task$' "$f2_out" \
        && grep -q 'STEP-1-BODY' "$f2_out" \
        && ! grep -q 'SELF-REVIEW-LEAK' "$f2_out" \
        && ! grep -q '## Self-Review' "$f2_out" \
        && ! grep -q 'HANDOFF-LEAK' "$f2_out" \
        && ! grep -q '## Execution Handoff' "$f2_out"; then
        pass "final task stops before trailing ## Self-Review / ## Execution Handoff and notes heading on stderr"
    else
        fail "final task stops before trailing ## Self-Review / ## Execution Handoff and notes heading on stderr"
        echo "    rc: $rc, err: $f2_err"
        sed 's/^/      /' "$f2_out" 2>/dev/null || true
    fi

    # Backtick info string containing backtick is not a fence; 4-space indent is not a fence
    cat > "$repo/plan-backtick-info.md" <<'PLAN'
### Task 1: Inline backticks

```foo`bar```
    ```
    ### Task 1b: Indented 4 spaces is code, or at least not a fence opener

AFTER-INLINE-TICKS

### Task 2: Second

TASK-2-CLEAN
PLAN
    local bt_out="$TEST_ROOT/bt-t2.md"
    rc=0
    (cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-backtick-info.md 2 "$bt_out" >/dev/null 2>&1) || rc=$?
    if [[ "$rc" -eq 0 ]] && grep -q 'TASK-2-CLEAN' "$bt_out" && ! grep -q 'AFTER-INLINE-TICKS' "$bt_out"; then
        pass "backtick fence info string containing backtick and 4-space indented backticks do not swallow Task 2"
    else
        fail "backtick fence info string containing backtick and 4-space indented backticks do not swallow Task 2"
        echo "    rc: $rc"
    fi

    # CRLF plan extracts cleanly without \r
    printf '# CRLF Plan\r\n\r\n> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development\r\n\r\n**Goal:** CRLF test\r\n\r\n### Task 1: CRLF one\r\n\r\n```sh\r\necho one\r\n```\r\n\r\nCRLF-1\r\n\r\n### Task 2: CRLF two\r\n\r\nCRLF-2\r\n\r\n## Execution Handoff\r\n\r\nCRLF-HANDOFF\r\n' > "$repo/plan-crlf.md"
    local crlf1="$TEST_ROOT/crlf-1.md" crlf2="$TEST_ROOT/crlf-2.md"
    rc=0
    (cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-crlf.md 1 "$crlf1" >/dev/null 2>&1) || rc=$?
    local rc2=0
    (cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-crlf.md 2 "$crlf2" >/dev/null 2>&1) || rc2=$?
    if [[ "$rc" -eq 0 && "$rc2" -eq 0 ]] \
        && grep -q 'CRLF-1' "$crlf1" \
        && ! grep -q 'CRLF-2' "$crlf1" \
        && grep -q 'CRLF-2' "$crlf2" \
        && ! grep -q 'CRLF-HANDOFF' "$crlf2" \
        && ! grep -q 'REQUIRED SUB-SKILL' "$crlf1" \
        && ! grep -q $'\r' "$crlf1" \
        && ! grep -q $'\r' "$crlf2"; then
        pass "CRLF plan extracts cleanly without CR bytes and respects fences and headings"
    else
        fail "CRLF plan extracts cleanly without CR bytes and respects fences and headings"
        echo "    rc1: $rc, rc2: $rc2"
    fi

    # --- Missing task on plan with preamble and atomic write (#2611) ---
    rc=0
    (cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-preamble.md 99 >/dev/null 2>&1) || rc=$?
    if [[ "$rc" -eq 3 && ! -e "$pre_dir/task-99-brief.md" ]]; then
        pass "missing task on plan with preamble exits 3 and creates no task-99-brief.md"
    else
        fail "missing task on plan with preamble exits 3 and creates no task-99-brief.md"
        echo "    rc: $rc, exists: $(test -e "$pre_dir/task-99-brief.md" && echo yes || echo no)"
    fi

    local existing_brief="$TEST_ROOT/existing-brief.md"
    printf 'PRESERVED-BRIEF-BYTES\nline-two\n' > "$existing_brief"
    rc=0
    (cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-preamble.md 99 "$existing_brief" >/dev/null 2>&1) || rc=$?
    if [[ "$rc" -eq 3 && "$(cat "$existing_brief")" == $'PRESERVED-BRIEF-BYTES\nline-two' ]]; then
        pass "missing task does not truncate or clobber an existing OUTFILE"
    else
        fail "missing task does not truncate or clobber an existing OUTFILE"
        echo "    rc: $rc, content: $(cat "$existing_brief" 2>/dev/null)"
    fi

    rc=0
    (cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-unclosed.md 1 "$existing_brief" >/dev/null 2>&1) || rc=$?
    if [[ "$rc" -eq 4 && "$(cat "$existing_brief")" == $'PRESERVED-BRIEF-BYTES\nline-two' ]]; then
        pass "unclosed fence (exit 4) does not truncate or clobber an existing OUTFILE"
    else
        fail "unclosed fence (exit 4) does not truncate or clobber an existing OUTFILE"
        echo "    rc: $rc, content: $(cat "$existing_brief" 2>/dev/null)"
    fi

    # Equal-depth non-Task heading inside Task 1 (including nested Task 1a subtask) followed by an unclosed fence hiding Task 2 must still exit 4
    cat > "$repo/plan-footer-then-unclosed.md" <<'PLAN'
### Task 1: First

BODY-1

#### Task 1a: Nested subtask

BODY-1A

### Requirements

REQ-1

```sh
echo unclosed

### Task 2: Hidden by fence

BODY-2
PLAN
    rc=0
    (cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-footer-then-unclosed.md 1 "$existing_brief" >/dev/null 2>&1) || rc=$?
    if [[ "$rc" -eq 4 && "$(cat "$existing_brief")" == $'PRESERVED-BRIEF-BYTES\nline-two' ]]; then
        pass "parent task with nested subtask + equal-depth subheading + unclosed fence hiding Task 2 exits 4"
    else
        fail "parent task with nested subtask + equal-depth subheading + unclosed fence hiding Task 2 did not exit 4 (rc=$rc)"
    fi

    # --- Deleted-plan fallback to claimed workspace brief (#2630) ---
    local fb_bin="$TEST_ROOT/fb-bin" fb_ws="$TEST_ROOT/fb-ws" fb_explicit="$TEST_ROOT/fb-explicit.md" fb_out=""
    mkdir -p "$fb_bin" "$fb_ws"
    cp "$SDD_SCRIPTS/task-brief" "$fb_bin/task-brief"
    cat > "$fb_bin/sdd-workspace" <<EOF
#!/usr/bin/env bash
printf '%s\n' "$fb_ws"
EOF
    printf '### Task 1: Cached\n\nCACHED-BODY\n' > "$fb_ws/task-1-brief.md"
    rc=0
    fb_out="$(cd "$repo" && bash "$fb_bin/task-brief" deleted-plan.md 1 2>"$TEST_ROOT/fb.err")" || rc=$?
    if [[ "$rc" -eq 0 && "$fb_out" == "wrote $fb_ws/task-1-brief.md: 3 lines" ]] && grep -q 'serving cached brief' "$TEST_ROOT/fb.err"; then
        pass "task-brief returns existing cached brief when plan is deleted (#2630)"
    else
        fail "task-brief returns existing cached brief when plan is deleted (#2630)"
        echo "    rc: $rc, out: $fb_out"
    fi

    rc=0
    fb_out="$(cd "$repo" && bash "$fb_bin/task-brief" deleted-plan.md 1 "$fb_explicit" 2>"$TEST_ROOT/fb-explicit.err")" || rc=$?
    if [[ "$rc" -eq 0 && "$fb_out" == "wrote $fb_explicit: 3 lines" ]] && grep -q 'CACHED-BODY' "$fb_explicit" && grep -q 'serving cached brief' "$TEST_ROOT/fb-explicit.err"; then
        pass "task-brief copies cached brief to explicit OUTFILE when plan is deleted"
    else
        fail "task-brief copies cached brief to explicit OUTFILE when plan is deleted"
        echo "    rc: $rc, out: $fb_out"
    fi

    rc=0
    (cd "$repo" && bash "$fb_bin/task-brief" deleted-plan.md 99 >/dev/null 2>&1) || rc=$?
    if [[ "$rc" -eq 2 ]]; then
        pass "task-brief exits 2 when plan is deleted and no cached brief exists for task"
    else
        fail "task-brief exits 2 when plan is deleted and no cached brief exists for task"
        echo "    rc: $rc"
    fi

    # Same-filesystem atomic rename & `--` handling: OUTFILE never depends on TMPDIR
    local new_out_dir="$TEST_ROOT/new-brief-dir" new_out_file="" leftover_tmp=""
    new_out_file="$new_out_dir/brief.md"
    mkdir -p "$new_out_dir"
    rc=0
    (cd "$repo" && TMPDIR="$TEST_ROOT/nonexistent-tmpdir" "$SDD_SCRIPTS/task-brief" plan-a.md 1 "$new_out_file" >/dev/null 2>&1) || rc=$?
    leftover_tmp="$(find "$new_out_dir" -name '.task-brief.*' 2>/dev/null || true)"
    if [[ "$rc" -eq 0 && -s "$new_out_file" && -z "$leftover_tmp" ]]; then
        pass "task-brief stages its temp file beside OUTFILE without needing TMPDIR"
    else
        fail "task-brief stages its temp file beside OUTFILE without needing TMPDIR"
        echo "    rc: $rc, leftover: $leftover_tmp"
    fi

    rc=0
    (cd "$TEST_ROOT" && TMPDIR="$TEST_ROOT/nonexistent-tmpdir" "$SDD_SCRIPTS/task-brief" "$repo/plan-a.md" 1 -dash-brief.md >/dev/null 2>&1) || rc=$?
    local rc_fb_dash=0
    (cd "$TEST_ROOT" && bash "$fb_bin/task-brief" deleted-plan.md 1 -dash-cached.md >/dev/null 2>&1) || rc_fb_dash=$?
    if [[ "$rc" -eq 0 && -s "$TEST_ROOT/-dash-brief.md" && "$rc_fb_dash" -eq 0 ]] \
        && grep -q 'CACHED-BODY' "$TEST_ROOT/-dash-cached.md"; then
        pass "task-brief handles dash-prefixed OUTFILE in both normal and cached fallback paths"
    else
        fail "task-brief handles dash-prefixed OUTFILE in both normal and cached fallback paths"
        echo "    rc: $rc, rc_fb_dash: $rc_fb_dash"
    fi

    # Directory OUTFILE is rejected without placing a temp file inside it
    local dir_out_target="$TEST_ROOT/dir-as-outfile" rc_dir_norm=0 rc_dir_fb=0
    mkdir -p "$dir_out_target"
    (cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-a.md 1 "$dir_out_target" >/dev/null 2>&1) || rc_dir_norm=$?
    (cd "$repo" && bash "$fb_bin/task-brief" deleted-plan.md 1 "$dir_out_target" >/dev/null 2>&1) || rc_dir_fb=$?
    if [[ "$rc_dir_norm" -eq 2 && "$rc_dir_fb" -eq 2 && -z "$(ls -A "$dir_out_target")" ]]; then
        pass "task-brief rejects directory OUTFILE in both normal and cached paths without leaving temp files"
    else
        fail "task-brief rejects directory OUTFILE in both normal and cached paths without leaving temp files"
        echo "    rc_dir_norm: $rc_dir_norm, rc_dir_fb: $rc_dir_fb, contents: $(ls -A "$dir_out_target")"
    fi

    # A FIFO OUTFILE is refused before anything is staged: renaming the brief
    # into place would replace the pipe with a regular file
    local fifo_out_dir="$TEST_ROOT/fifo-outfile-dir" fifo_out="" fifo_err="" fifo_leftover=""
    fifo_out="$fifo_out_dir/brief.md"
    mkdir -p "$fifo_out_dir"
    if ! mkfifo "$fifo_out" 2>/dev/null || [[ ! -p "$fifo_out" ]]; then
        echo "  [SKIP] task-brief refusing a FIFO OUTFILE (this shell cannot make a FIFO)"
    else
        rc=0
        fifo_err="$(cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-a.md 1 "$fifo_out" 2>&1 >/dev/null)" || rc=$?
        fifo_leftover="$(find "$fifo_out_dir" -name '.task-brief.*' 2>/dev/null || true)"
        if [[ "$rc" -eq 2 && "$fifo_err" == *"output path is a symlink or special file"* \
            && -p "$fifo_out" && -z "$fifo_leftover" ]]; then
            pass "task-brief refuses a FIFO OUTFILE and leaves it a FIFO"
        else
            fail "task-brief refuses a FIFO OUTFILE and leaves it a FIFO"
            echo "    exit: $rc, fifo: $(test -p "$fifo_out" && echo yes || echo no), leftover: $fifo_leftover"
            echo "    stderr: $fifo_err"
        fi
    fi

    # A symlink OUTFILE is refused too: the rename would replace the link
    # itself, not write through it to its target
    local link_out_dir="$TEST_ROOT/symlink-outfile-dir" link_out="" link_target="" link_err="" link_leftover=""
    link_out="$link_out_dir/brief.md"
    link_target="$link_out_dir/linked-brief.md"
    mkdir -p "$link_out_dir"
    printf 'LINKED-BRIEF-BYTES\n' > "$link_target"
    if ! ln -s "$link_target" "$link_out" 2>/dev/null || [[ ! -L "$link_out" ]]; then
        echo "  [SKIP] task-brief refusing a symlink OUTFILE (ln -s does not make a symlink here)"
    else
        rc=0
        link_err="$(cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-a.md 1 "$link_out" 2>&1 >/dev/null)" || rc=$?
        link_leftover="$(find "$link_out_dir" -name '.task-brief.*' 2>/dev/null || true)"
        if [[ "$rc" -eq 2 && "$link_err" == *"output path is a symlink or special file"* \
            && -L "$link_out" && "$(cat "$link_target")" == "LINKED-BRIEF-BYTES" && -z "$link_leftover" ]]; then
            pass "task-brief refuses a symlink OUTFILE and leaves the link and its target unchanged"
        else
            fail "task-brief refuses a symlink OUTFILE and leaves the link and its target unchanged"
            echo "    exit: $rc, symlink: $(test -L "$link_out" && echo yes || echo no), target: $(cat "$link_target" 2>/dev/null), leftover: $link_leftover"
            echo "    stderr: $link_err"
        fi
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

    # --- range guards: BASE must be an ancestor of HEAD, range must be non-empty ---
    local divergent
    divergent="$(cd "$repo" && git "${git_id[@]}" commit-tree 'HEAD~1^{tree}' -p 'HEAD~1' -m divergent)"
    rc=0
    local guard_err
    guard_err="$(cd "$repo" && "$SDD_SCRIPTS/review-package" plan-a.md "$divergent" HEAD 2>&1 >/dev/null)" || rc=$?
    if [[ "$rc" -eq 3 && "$guard_err" == *"not a descendant"* ]]; then
        pass "review-package rejects a BASE that is not an ancestor of HEAD with exit 3"
    else
        fail "review-package rejects a BASE that is not an ancestor of HEAD with exit 3"
        echo "    exit: $rc"
        echo "    stderr: $guard_err"
    fi

    rc=0
    guard_err="$(cd "$repo" && "$SDD_SCRIPTS/review-package" plan-a.md HEAD HEAD 2>&1 >/dev/null)" || rc=$?
    if [[ "$rc" -eq 3 && "$guard_err" == *"empty commit range"* ]]; then
        pass "review-package rejects an empty BASE..HEAD range with exit 3"
    else
        fail "review-package rejects an empty BASE..HEAD range with exit 3"
        echo "    exit: $rc"
        echo "    stderr: $guard_err"
    fi

    # --- Worktree isolation: a linked worktree resolves its own workspace ---
    local wt="$TEST_ROOT/wt"
    ( cd "$repo" && git worktree add -q "$wt" -b wt-feature )
    local wt_root wt_dir
    wt_root="$(cd "$wt" && git rev-parse --show-toplevel)"
    wt_root="$(physical_path "$wt_root")"
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

    # --- Which repository: cwd, then -C, then the plan's (#2429, #1799) ---
    printf 'wt-only\n' > "$wt/wt-only.txt"
    ( cd "$wt" && git add wt-only.txt && git "${git_id[@]}" commit -qm wt-change )
    local wt_base wt_head
    wt_base="$(cd "$wt" && git rev-parse HEAD~1)"
    wt_head="$(cd "$wt" && git rev-parse HEAD)"

    # An executor working in the worktree with an absolute path to the main
    # checkout's plan (writing-plans leaves the plan uncommitted there) keeps
    # its workspace in the worktree it is working in.
    printf '# Main only\n\n## Task 1: Main only\n\nMain only.\n' > "$repo/main-only.md"
    local wt_abs_dir
    wt_abs_dir="$(cd "$wt" && "$SDD_SCRIPTS/sdd-workspace" "$repo/main-only.md")" || true
    if [[ "$wt_abs_dir" == "$wt_root/.superpowers/sdd/main-only" ]]; then
        pass "a plan in another worktree still resolves to the current worktree's workspace"
    else
        fail "a plan in another worktree still resolves to the current worktree's workspace"
        echo "    got: $wt_abs_dir"
    fi

    # -C DIR runs as if started in DIR: workspace and git commands both.
    local c_dir
    c_dir="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" -C "$wt" plan-a.md)" || true
    if [[ "$c_dir" == "$wt_root/.superpowers/sdd/plan-a" ]]; then
        pass "sdd-workspace -C DIR resolves DIR's workspace"
    else
        fail "sdd-workspace -C DIR resolves DIR's workspace"
        echo "    got: $c_dir"
    fi

    # These two run the way SKILL.md invokes them, `bash scripts/...` from the
    # skill's directory: the relative script path must survive the -C cd.
    local c_brief
    c_brief="$(cd "$SDD_SCRIPTS/.." && bash scripts/task-brief -C "$wt" plan-a.md 1)" || true
    if [[ "$c_brief" == "wrote $wt_root/.superpowers/sdd/plan-a/task-1-brief.md: "* ]]; then
        pass "task-brief -C DIR writes the brief into DIR's workspace"
    else
        fail "task-brief -C DIR writes the brief into DIR's workspace"
        echo "    got: $c_brief"
    fi

    local c_rp c_rp_path
    c_rp="$(cd "$SDD_SCRIPTS/.." && bash scripts/review-package -C "$wt" plan-a.md "$wt_base" HEAD)" || true
    c_rp_path="$(printf '%s\n' "$c_rp" | sed -n 's/^wrote \(.*\): [0-9].*$/\1/p')"
    case "$c_rp_path" in
        "$wt_root/.superpowers/sdd/plan-a/review-"*.diff)
            if grep -q 'wt-only.txt' "$c_rp_path"; then
                pass "review-package -C DIR diffs DIR's HEAD into DIR's workspace"
            else
                fail "review-package -C DIR diffs DIR's HEAD into DIR's workspace"
                echo "    diff lacks the worktree's commit: $c_rp_path"
            fi
            ;;
        *)
            fail "review-package -C DIR diffs DIR's HEAD into DIR's workspace"
            echo "    got: $c_rp"
            ;;
    esac

    rc=0
    (cd "$repo" && "$SDD_SCRIPTS/review-package" -C "$TEST_ROOT/no-such-dir" plan-a.md HEAD~1 HEAD >/dev/null 2>&1) || rc=$?
    if [[ "$rc" -eq 2 ]]; then
        pass "review-package -C with a missing directory errors with exit 2"
    else
        fail "review-package -C with a missing directory errors with exit 2"
        echo "    exit: $rc"
    fi

    # Run from outside any repository (e.g. the skill's own directory in an
    # installed plugin), the scripts stop even when the plan's absolute path
    # is inside a repository: like git, they act on the current directory's
    # working tree (or -C DIR), never on one guessed from the plan.
    local nonrepo="$TEST_ROOT/not-a-repo"
    mkdir -p "$nonrepo"
    local nr_msg="SDD scripts must run from inside the git working tree you're executing in, with at least one commit (current directory: $nonrepo). If this is a new project, run 'git init' and make a first commit, then rerun."
    local nr_before nr_cmd nr_err
    nr_before="$(find "$wt_root/.superpowers" | sort)"
    for nr_cmd in "sdd-workspace $wt/plan-a.md" "task-brief $wt/plan-a.md 1" "review-package $wt/plan-a.md $wt_base $wt_head"; do
        rc=0
        # shellcheck disable=SC2086 # nr_cmd is a fixed script name plus its arguments
        nr_err="$(cd "$nonrepo" && "$SDD_SCRIPTS"/$nr_cmd 2>&1 >/dev/null)" || rc=$?
        if [[ "$rc" -eq 2 && "$nr_err" == "$nr_msg"$'\n'"git said: fatal: not a git repository"* ]]; then
            pass "${nr_cmd%% *} outside any repository stops with the shared message despite a plan in a repository"
        else
            fail "${nr_cmd%% *} outside any repository stops with the shared message despite a plan in a repository"
            echo "    exit: $rc"
            echo "    stderr: $nr_err"
        fi
    done
    if [[ ! -e "$nonrepo/.superpowers" && "$(find "$wt_root/.superpowers" | sort)" == "$nr_before" ]]; then
        pass "outside any repository, nothing is written to the cwd or the plan's repository"
    else
        fail "outside any repository, nothing is written to the cwd or the plan's repository"
    fi

    # --- No repository anywhere: a greenfield plan before Task 1 (#2242) ---
    local gf="$TEST_ROOT/greenfield"
    mkdir -p "$gf"
    printf '## Task 1: Scaffold the repo\n\nCreate files.\n' > "$gf/plan.md"
    # One message for both ways to get here: a caller standing in the wrong
    # directory (such as the plugin's own skill directory, where git init is
    # the wrong fix) and a new project with no repository yet. git's own
    # first error line follows it, so the reason git refused is never hidden.
    local no_repo_msg="SDD scripts must run from inside the git working tree you're executing in, with at least one commit (current directory: $gf). If this is a new project, run 'git init' and make a first commit, then rerun."
    local cmd gf_err
    for cmd in "sdd-workspace plan.md" "task-brief plan.md 1"; do
        local script=${cmd%% *}
        rc=0
        # shellcheck disable=SC2086 # cmd is a fixed script name plus its arguments
        gf_err="$(cd "$gf" && "$SDD_SCRIPTS"/$cmd 2>&1 >/dev/null)" || rc=$?
        if [[ "$rc" -eq 2 && "$gf_err" == "$no_repo_msg"$'\n'"git said: fatal: not a git repository"* ]]; then
            pass "$script outside any repository exits 2 naming both fixes"
        else
            fail "$script outside any repository exits 2 naming both fixes"
            echo "    exit: $rc"
            echo "    stderr: $gf_err"
        fi
    done
    rc=0
    gf_err="$(cd "$gf" && "$SDD_SCRIPTS/review-package" plan.md HEAD~1 HEAD 2>&1 >/dev/null)" || rc=$?
    if [[ "$rc" -eq 2 && "$gf_err" == "$no_repo_msg"$'\n'"git said: fatal: not a git repository"* ]]; then
        pass "review-package outside any repository exits 2 naming both fixes"
    else
        fail "review-package outside any repository exits 2 naming both fixes"
        echo "    exit: $rc"
        echo "    stderr: $gf_err"
    fi
    if [[ ! -e "$gf/.superpowers" ]]; then
        pass "nothing is written outside a repository"
    else
        fail "nothing is written outside a repository"
        find "$gf/.superpowers" | sed 's/^/    /'
    fi

    # A repository with no commit yet has no range to review, so
    # review-package gets the same stop, naming its directory.
    git init -q -b main "$gf"
    rc=0
    gf_err="$(cd "$gf" && "$SDD_SCRIPTS/review-package" plan.md HEAD~1 HEAD 2>&1 >/dev/null)" || rc=$?
    if [[ "$rc" -eq 2 && "$gf_err" == "$no_repo_msg"$'\n'"git said: fatal: "* && ! -e "$gf/.superpowers" ]]; then
        pass "review-package in a repository with no commit exits 2 with the same message"
    else
        fail "review-package in a repository with no commit exits 2 with the same message"
        echo "    exit: $rc"
        echo "    stderr: $gf_err"
    fi

    # --- git refuses the repository itself: its reason must reach the caller ---
    # Inside a working tree git won't trust ("dubious ownership": another
    # owner, a FAT or network drive, WSL /mnt/c), the shared message alone
    # would be wrong, so git's own line has to follow it. git's test knob
    # GIT_TEST_ASSUME_DIFFERENT_OWNER simulates another owner without root.
    local dub_err dub_msg="SDD scripts must run from inside the git working tree you're executing in, with at least one commit (current directory: $repo). If this is a new project, run 'git init' and make a first commit, then rerun."
    if (cd "$repo" && GIT_TEST_ASSUME_DIFFERENT_OWNER=1 git rev-parse --show-toplevel >/dev/null 2>&1); then
        echo "  [SKIP] git refusing a dubious-ownership repo ($(git --version) ignores GIT_TEST_ASSUME_DIFFERENT_OWNER)"
    else
        rc=0
        dub_err="$(cd "$repo" && GIT_TEST_ASSUME_DIFFERENT_OWNER=1 "$SDD_SCRIPTS/sdd-workspace" plan-a.md 2>&1 >/dev/null)" || rc=$?
        if [[ "$rc" -eq 2 && "$dub_err" == "$dub_msg"$'\n'"git said: fatal: detected dubious ownership in repository at "* ]]; then
            pass "a repository git refuses as dubious stops with the shared message plus git's reason"
        else
            fail "a repository git refuses as dubious stops with the shared message plus git's reason"
            echo "    exit: $rc"
            echo "    stderr: $dub_err"
        fi
    fi

    # --- helpers survive a mode-stripping extractor dropping exec bits (#2040) ---
    local stripped="$TEST_ROOT/stripped-scripts"
    mkdir -p "$stripped"
    cp "$SDD_SCRIPTS/sdd-repo" "$SDD_SCRIPTS/sdd-workspace" "$SDD_SCRIPTS/task-brief" "$SDD_SCRIPTS/review-package" "$stripped/"
    chmod -x "$stripped"/*
    local noexec_out noexec_rc=0
    noexec_out="$(cd "$repo" && bash "$stripped/task-brief" plan-b.md 1 2>&1)" || noexec_rc=$?
    if [[ "$noexec_rc" -eq 0 && -f "$repo/.superpowers/sdd/plan-b/task-1-brief.md" ]]; then
        pass "task-brief works with no exec bit on sdd-workspace"
    else
        fail "task-brief works with no exec bit on sdd-workspace"
        echo "    rc: $noexec_rc"
        echo "    output: $noexec_out"
    fi

    # --- Ownership markers: two plans with the same basename (#2045) ---
    mkdir -p "$repo/docs/alpha" "$repo/docs/beta"
    cat > "$repo/docs/alpha/plan.md" <<'PLAN'
# Alpha Plan

## Task 1: Alpha work

Alpha-only requirement text.
PLAN
    cat > "$repo/docs/beta/plan.md" <<'PLAN'
# Beta Plan

## Task 1: Beta work

Beta-only requirement text.
PLAN

    local dir_alpha dir_beta
    dir_alpha="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" docs/alpha/plan.md)"
    dir_beta="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" docs/beta/plan.md)"
    if [[ "$dir_alpha" != "$dir_beta" ]]; then
        pass "same-basename plans resolve to distinct workspaces"
    else
        fail "same-basename plans resolve to distinct workspaces"
        echo "    alpha: $dir_alpha"
        echo "    beta:  $dir_beta"
    fi

    ( cd "$repo" && "$SDD_SCRIPTS/task-brief" docs/alpha/plan.md 1 >/dev/null )
    ( cd "$repo" && "$SDD_SCRIPTS/task-brief" docs/beta/plan.md 1 >/dev/null )
    if grep -q "Alpha-only requirement text." "$dir_alpha/task-1-brief.md" 2>/dev/null \
        && grep -q "Beta-only requirement text." "$dir_beta/task-1-brief.md" 2>/dev/null; then
        pass "same-basename plans keep both task briefs intact"
    else
        fail "same-basename plans keep both task briefs intact"
        echo "    alpha brief: $(cat "$dir_alpha/task-1-brief.md" 2>/dev/null)"
        echo "    beta brief:  $(cat "$dir_beta/task-1-brief.md" 2>/dev/null)"
    fi

    # --- Legacy adoption: pre-existing workspace without a marker ---
    printf '# Foo\n\n## Task 1: Foo\n\nFoo.\n' > "$repo/foo.md"
    mkdir -p "$repo/.superpowers/sdd/foo"
    printf 'ledger\n' > "$repo/.superpowers/sdd/foo/progress.md"
    local dir_foo
    dir_foo="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" foo.md)"
    if [[ "$dir_foo" == "$repo/.superpowers/sdd/foo" \
        && -f "$dir_foo/progress.md" \
        && "$(cat "$dir_foo/plan-path" 2>/dev/null)" == "foo.md" ]]; then
        pass "legacy markerless workspace is adopted in place and marked"
    else
        fail "legacy markerless workspace is adopted in place and marked"
        echo "    dir: $dir_foo"
        echo "    marker: $(cat "$dir_foo/plan-path" 2>/dev/null)"
    fi

    # --- Ownership conflict: marker names a different plan ---
    printf '# Bar\n\n## Task 1: Bar\n\nBar.\n' > "$repo/bar.md"
    mkdir -p "$repo/.superpowers/sdd/bar"
    printf 'somewhere-else/bar.md\n' > "$repo/.superpowers/sdd/bar/plan-path"
    printf 'other ledger\n' > "$repo/.superpowers/sdd/bar/progress.md"
    local dir_bar
    dir_bar="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" bar.md)"
    if [[ "$dir_bar" == "$repo/.superpowers/sdd/bar-repo" \
        && "$(cat "$dir_bar/plan-path" 2>/dev/null)" == "bar.md" ]]; then
        pass "owned workspace disambiguates with parent-dir suffix"
    else
        fail "owned workspace disambiguates with parent-dir suffix"
        echo "    got: $dir_bar"
    fi
    if [[ "$(cat "$repo/.superpowers/sdd/bar/plan-path")" == "somewhere-else/bar.md" \
        && "$(cat "$repo/.superpowers/sdd/bar/progress.md")" == "other ledger" ]]; then
        pass "conflicting plan leaves the original workspace untouched"
    else
        fail "conflicting plan leaves the original workspace untouched"
    fi

    # --- Counter fallback: parent-suffixed workspace is owned too ---
    printf '# Baz\n\n## Task 1: Baz\n\nBaz.\n' > "$repo/baz.md"
    mkdir -p "$repo/.superpowers/sdd/baz" "$repo/.superpowers/sdd/baz-repo"
    printf 'one/baz.md\n' > "$repo/.superpowers/sdd/baz/plan-path"
    printf 'two/baz.md\n' > "$repo/.superpowers/sdd/baz-repo/plan-path"
    local dir_baz
    dir_baz="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" baz.md)"
    if [[ "$dir_baz" == "$repo/.superpowers/sdd/baz-repo-2" \
        && "$(cat "$dir_baz/plan-path" 2>/dev/null)" == "baz.md" ]]; then
        pass "double conflict falls back to a counter suffix"
    else
        fail "double conflict falls back to a counter suffix"
        echo "    got: $dir_baz"
    fi

    # --- Same plan spelled differently resolves to one workspace ---
    local dir_rel dir_abs dir_dotdot
    dir_rel="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" docs/alpha/plan.md)"
    dir_abs="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" "$repo/docs/alpha/plan.md")"
    dir_dotdot="$(cd "$repo/docs/beta" && "$SDD_SCRIPTS/sdd-workspace" ../alpha/plan.md)"
    if [[ "$dir_rel" == "$dir_abs" && "$dir_rel" == "$dir_dotdot" \
        && "$(cat "$dir_rel/plan-path" 2>/dev/null)" == "docs/alpha/plan.md" ]]; then
        pass "relative, absolute, and ../ spellings share one workspace and marker"
    else
        fail "relative, absolute, and ../ spellings share one workspace and marker"
        echo "    rel:    $dir_rel"
        echo "    abs:    $dir_abs"
        echo "    dotdot: $dir_dotdot"
        echo "    marker: $(cat "$dir_rel/plan-path" 2>/dev/null)"
    fi

    # --- Out-of-repo plans keep working, marker holds the absolute path ---
    mkdir -p "$TEST_ROOT/outside"
    printf '# Remote\n\n## Task 1: Remote\n\nRemote.\n' > "$TEST_ROOT/outside/remote-plan.md"
    local outside_abs dir_out
    outside_abs="$(cd "$TEST_ROOT/outside" && pwd -P)/remote-plan.md"
    dir_out="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" "$TEST_ROOT/outside/remote-plan.md")"
    if [[ "$dir_out" == "$repo/.superpowers/sdd/remote-plan" \
        && "$(cat "$dir_out/plan-path" 2>/dev/null)" == "$outside_abs" ]]; then
        pass "out-of-repo plan gets a basename slug and an absolute-path marker"
    else
        fail "out-of-repo plan gets a basename slug and an absolute-path marker"
        echo "    dir:    $dir_out"
        echo "    marker: $(cat "$dir_out/plan-path" 2>/dev/null)"
    fi

    # --- A repo's own committed .superpowers/sdd/.gitignore is left alone ---
    git init -q -b main "$TEST_ROOT/own-ignore"
    local own own_ignore
    own="$(cd "$TEST_ROOT/own-ignore" && git rev-parse --show-toplevel)"
    own_ignore=$'*\n!.gitignore\n!*/\n!*/progress.md'
    mkdir -p "$own/.superpowers/sdd"
    printf '%s\n' "$own_ignore" > "$own/.superpowers/sdd/.gitignore"
    printf '# Plan\n\n## Task 1: One\n\nOne.\n' > "$own/plan.md"
    (cd "$own" && git add -A && git -c user.name=t -c user.email=t@t commit -qm init)
    (cd "$own" && "$SDD_SCRIPTS/sdd-workspace" plan.md >/dev/null)
    if [[ "$(cat "$own/.superpowers/sdd/.gitignore")" == "$own_ignore" \
        && -z "$(cd "$own" && git status --porcelain -- .superpowers/sdd/.gitignore)" ]]; then
        pass "an existing .superpowers/sdd/.gitignore is not overwritten"
    else
        fail "an existing .superpowers/sdd/.gitignore is not overwritten"
        echo "    now: $(cat "$own/.superpowers/sdd/.gitignore")"
    fi

    # --- Blocked .superpowers regular file fails fast (#2619) ---
    local blocked="$TEST_ROOT/blocked-base"
    git init -q -b main "$blocked"
    printf '# Plan\n\n## Task 1: One\n\nOne.\n' > "$blocked/plan.md"
    (cd "$blocked" && git add plan.md && git "${git_id[@]}" commit -qm init)
    printf 'not a dir\n' > "$blocked/.superpowers"
    local blocked_start=$SECONDS blocked_elapsed
    rc=0
    if command -v perl >/dev/null 2>&1; then
        (cd "$blocked" && perl -e 'alarm 2; exec @ARGV' -- "$SDD_SCRIPTS/sdd-workspace" plan.md >/dev/null 2>&1) || rc=$?
    else
        (cd "$blocked" && timeout 2 "$SDD_SCRIPTS/sdd-workspace" plan.md >/dev/null 2>&1) || rc=$?
    fi
    blocked_elapsed=$((SECONDS - blocked_start))
    if [[ "$rc" -eq 2 && "$blocked_elapsed" -lt 2 ]]; then
        pass "blocked .superpowers regular file fails fast with exit 2 (${blocked_elapsed}s)"
    else
        fail "blocked .superpowers regular file fails fast with exit 2"
        echo "    rc: $rc, elapsed: ${blocked_elapsed}s"
    fi

    # --- Concurrent sdd-workspace claims (#2619) & stale-PID lock break ---
    local conc="$TEST_ROOT/concurrent"
    git init -q -b main "$conc"
    mkdir -p "$conc/docs/a" "$conc/docs/b" "$conc/docs/same"
    printf '# A\n\n## Task 1: A\n\nA.\n' > "$conc/docs/a/plan.md"
    printf '# B\n\n## Task 1: B\n\nB.\n' > "$conc/docs/b/plan.md"
    printf '# Same\n\n## Task 1: Same\n\nSame.\n' > "$conc/docs/same/unique.md"
    (cd "$conc" && git add -A && git "${git_id[@]}" commit -qm init)

    local conc_out="$TEST_ROOT/conc-out"
    mkdir -p "$conc_out"
    local i pids=()
    for i in $(seq 1 20); do
        (cd "$conc" && "$SDD_SCRIPTS/sdd-workspace" docs/a/plan.md > "$conc_out/a-$i") &
        pids+=($!)
        (cd "$conc" && "$SDD_SCRIPTS/sdd-workspace" docs/b/plan.md > "$conc_out/b-$i") &
        pids+=($!)
        (cd "$conc" && "$SDD_SCRIPTS/sdd-workspace" docs/same/unique.md > "$conc_out/same-$i") &
        pids+=($!)
    done
    local conc_rc=0 p
    for p in "${pids[@]}"; do
        wait "$p" || conc_rc=1
    done
    local uniq_a uniq_b uniq_same
    uniq_a="$(sort -u "$conc_out"/a-*)"
    uniq_b="$(sort -u "$conc_out"/b-*)"
    uniq_same="$(sort -u "$conc_out"/same-*)"
    if [[ "$conc_rc" -eq 0 \
        && "$(printf '%s\n' "$uniq_a" | wc -l | tr -d ' ')" -eq 1 \
        && "$(printf '%s\n' "$uniq_b" | wc -l | tr -d ' ')" -eq 1 \
        && "$(printf '%s\n' "$uniq_same" | wc -l | tr -d ' ')" -eq 1 \
        && "$uniq_a" != "$uniq_b" \
        && "$(cat "$uniq_a/plan-path" 2>/dev/null)" == "docs/a/plan.md" \
        && "$(cat "$uniq_b/plan-path" 2>/dev/null)" == "docs/b/plan.md" \
        && "$(cat "$uniq_same/plan-path" 2>/dev/null)" == "docs/same/unique.md" ]]; then
        pass "20 concurrent colliding and identical sdd-workspace invocations converge cleanly"
    else
        fail "20 concurrent colliding and identical sdd-workspace invocations converge cleanly"
        echo "    rc: $conc_rc"
        echo "    uniq_a: $uniq_a"
        echo "    uniq_b: $uniq_b"
        echo "    uniq_same: $uniq_same"
    fi

    # Copied backup workspace (a-backup) does not hijack canonical candidate lookup
    printf '# Stale\n\n## Task 1: Stale\n\nStale.\n' > "$conc/stale.md"
    local stale_dir="" after_backup_dir=""
    stale_dir="$(cd "$conc" && "$SDD_SCRIPTS/sdd-workspace" stale.md)"
    cp -R "$stale_dir" "$conc/.superpowers/sdd/a-backup"
    after_backup_dir="$(cd "$conc" && "$SDD_SCRIPTS/sdd-workspace" stale.md)"
    if [[ "$after_backup_dir" == "$stale_dir" ]]; then
        pass "canonical candidate workspace wins over alphabetically earlier backup copy"
    else
        fail "canonical candidate workspace wins over alphabetically earlier backup copy"
        echo "    got: $after_backup_dir, want: $stale_dir"
    fi

    # Stale .lock left by a dead PID is recovered automatically
    mkdir -p "$conc/.superpowers/sdd/.lock"
    printf '999999\n' > "$conc/.superpowers/sdd/.lock/pid"
    local stale_lock_rc=0 stale_lock_dir=""
    stale_lock_dir="$(cd "$conc" && "$SDD_SCRIPTS/sdd-workspace" stale.md 2>/dev/null)" || stale_lock_rc=$?
    if [[ "$stale_lock_rc" -eq 0 && "$stale_lock_dir" == "$stale_dir" && ! -d "$conc/.superpowers/sdd/.lock" ]]; then
        pass "sdd-workspace recovers stale .lock left by dead PID"
    else
        fail "sdd-workspace recovers stale .lock left by dead PID"
        echo "    rc: $stale_lock_rc, dir: $stale_lock_dir"
    fi

    # Counter bound: disambiguation stops at 100 and exits 2
    printf '# Cap\n\n## Task 1: Cap\n\nCap.\n' > "$conc/cap.md"
    local cap_base="$conc/.superpowers/sdd" cap_n
    mkdir -p "$cap_base/cap" "$cap_base/cap-concurrent"
    printf 'other/cap.md\n' > "$cap_base/cap/plan-path"
    printf 'other-0/cap.md\n' > "$cap_base/cap-concurrent/plan-path"
    for cap_n in $(seq 2 100); do
        mkdir -p "$cap_base/cap-concurrent-$cap_n"
        printf 'other-%s/cap.md\n' "$cap_n" > "$cap_base/cap-concurrent-$cap_n/plan-path"
    done
    rc=0
    (cd "$conc" && "$SDD_SCRIPTS/sdd-workspace" cap.md >/dev/null 2>&1) || rc=$?
    if [[ "$rc" -eq 2 && ! -e "$cap_base/cap-concurrent-101" ]]; then
        pass "sdd-workspace bounds disambiguation counter at <= 100 and exits 2"
    else
        fail "sdd-workspace bounds disambiguation counter at <= 100 and exits 2"
        echo "    rc: $rc"
    fi

    # --- Deleted-plan resolution (#2630) end-to-end across all helpers ---
    mkdir -p "$repo/docs/plans"
    cat > "$repo/docs/plans/gone.md" <<'PLAN'
# Gone Plan

**Goal:** Survive plan deletion

### Task 1: Initial

GONE-TASK-1

### Task 2: Uncached

GONE-TASK-2
PLAN
    (cd "$repo" && git add docs/plans/gone.md && git "${git_id[@]}" commit -qm "add gone plan")
    local gone_base gone_head gone_dir
    gone_base="$(cd "$repo" && git rev-parse HEAD)"
    gone_dir="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" docs/plans/gone.md)"
    (cd "$repo" && "$SDD_SCRIPTS/task-brief" docs/plans/gone.md 1 >/dev/null)
    (cd "$repo" && git rm -q docs/plans/gone.md && git "${git_id[@]}" commit -qm "remove gone plan")
    gone_head="$(cd "$repo" && git rev-parse HEAD)"

    local gone_ws_after="" gone_ws_dotdot=""
    rc=0
    gone_ws_after="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" docs/plans/gone.md 2>/dev/null)" || rc=$?
    gone_ws_dotdot="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" docs/plans/./sub/../gone.md 2>/dev/null)" || true
    if [[ "$rc" -eq 0 && "$gone_ws_after" == "$gone_dir" && "$gone_ws_dotdot" == "$gone_dir" && ! -d "$repo/docs/plans" ]]; then
        pass "sdd-workspace resolves deleted plan even after parent directory removal"
    else
        fail "sdd-workspace resolves deleted plan even after parent directory removal"
        echo "    rc: $rc, after: $gone_ws_after, dotdot: $gone_ws_dotdot, want: $gone_dir"
    fi

    local e2e_tb_out="" e2e_tb_err="" e2e_tb_exp="$TEST_ROOT/gone-nested/sub/gone-explicit.md"
    mkdir -p "$TEST_ROOT/gone-nested/sub"
    rc=0
    e2e_tb_out="$(cd "$repo" && "$SDD_SCRIPTS/task-brief" docs/plans/gone.md 1 2>"$TEST_ROOT/gone-tb.err")" || rc=$?
    e2e_tb_err="$(cat "$TEST_ROOT/gone-tb.err" 2>/dev/null || true)"
    if [[ "$rc" -eq 0 && "$e2e_tb_out" == "wrote $gone_dir/task-1-brief.md: "* && "$e2e_tb_err" == *"serving cached brief"* ]] \
        && (cd "$repo" && TMPDIR="$TEST_ROOT/nonexistent-tmpdir" "$SDD_SCRIPTS/task-brief" docs/plans/gone.md 1 "$e2e_tb_exp" >/dev/null 2>&1) \
        && grep -q 'GONE-TASK-1' "$e2e_tb_exp"; then
        pass "task-brief resolves deleted plan via real sdd-workspace, warns on stderr, and stages explicit OUTFILE"
    else
        fail "task-brief resolves deleted plan via real sdd-workspace, warns on stderr, and stages explicit OUTFILE"
        echo "    rc: $rc, out: $e2e_tb_out, err: $e2e_tb_err"
    fi

    rc=0
    (cd "$repo" && "$SDD_SCRIPTS/task-brief" docs/plans/gone.md 2 >/dev/null 2>&1) || rc=$?
    if [[ "$rc" -eq 2 ]]; then
        pass "task-brief exits 2 on deleted plan when requested task was never cached"
    else
        fail "task-brief exits 2 on deleted plan when requested task was never cached"
        echo "    rc: $rc"
    fi

    local gone_rp3="" gone_rp3_path="" gone_rp4="$TEST_ROOT/gone-explicit-review.diff" gone_rp4_out=""
    rc=0
    gone_rp3="$(cd "$repo" && "$SDD_SCRIPTS/review-package" docs/plans/gone.md "$gone_base" "$gone_head" 2>/dev/null)" || rc=$?
    gone_rp3_path="$(printf '%s\n' "$gone_rp3" | sed -n 's/^wrote \(.*\): [0-9].*$/\1/p')"
    if [[ "$rc" -eq 0 && "$gone_rp3_path" == "$gone_dir/review-"*.diff && -s "$gone_rp3_path" ]]; then
        pass "review-package (3-arg) succeeds on deleted claimed plan"
    else
        fail "review-package (3-arg) succeeds on deleted claimed plan"
        echo "    rc: $rc, out: $gone_rp3"
    fi

    rc=0
    gone_rp4_out="$(cd "$repo" && "$SDD_SCRIPTS/review-package" docs/plans/gone.md "$gone_base" "$gone_head" "$gone_rp4" 2>/dev/null)" || rc=$?
    if [[ "$rc" -eq 0 && -s "$gone_rp4" && "$gone_rp4_out" == *"$gone_rp4"* ]]; then
        pass "review-package (4-arg OUTFILE) succeeds on deleted claimed plan"
    else
        fail "review-package (4-arg OUTFILE) succeeds on deleted claimed plan"
        echo "    rc: $rc, out: $gone_rp4_out"
    fi

    local never_out="$TEST_ROOT/never-claimed-out.diff"
    rc=0
    (cd "$repo" && "$SDD_SCRIPTS/review-package" never-claimed.md HEAD HEAD >/dev/null 2>&1) || rc=$?
    local rc_never4=0
    (cd "$repo" && "$SDD_SCRIPTS/review-package" never-claimed.md HEAD HEAD "$never_out" >/dev/null 2>&1) || rc_never4=$?
    if [[ "$rc" -eq 2 && "$rc_never4" -eq 2 && ! -e "$never_out" ]]; then
        pass "review-package exits 2 (not 3) for unclaimed missing plan in both 3-arg and 4-arg forms"
    else
        fail "review-package exits 2 (not 3) for unclaimed missing plan in both 3-arg and 4-arg forms"
        echo "    rc3: $rc, rc4: $rc_never4, out_exists: $(test -e "$never_out" && echo yes || echo no)"
    fi

    # --- Hidden dot-prefixed plan (.plan.md) survives deletion ---
    cat > "$repo/.plan.md" <<'PLAN'
# Hidden Plan

### Task 1: Hidden task

HIDDEN-TASK-1
PLAN
    local hidden_dir="" hidden_after="" hidden_tb_out="" hidden_tb_exp="$TEST_ROOT/hidden-explicit.md"
    hidden_dir="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" .plan.md)"
    (cd "$repo" && "$SDD_SCRIPTS/task-brief" .plan.md 1 >/dev/null)
    rm -f "$repo/.plan.md"
    rc=0
    hidden_after="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" .plan.md 2>/dev/null)" || rc=$?
    local hidden_tb_rc=0
    hidden_tb_out="$(cd "$repo" && "$SDD_SCRIPTS/task-brief" .plan.md 1 2>/dev/null)" || hidden_tb_rc=$?
    local hidden_tb_exp_rc=0
    (cd "$repo" && "$SDD_SCRIPTS/task-brief" .plan.md 1 "$hidden_tb_exp" >/dev/null 2>&1) || hidden_tb_exp_rc=$?
    if [[ "$hidden_dir" == "$repo/.superpowers/sdd/.plan" \
        && "$rc" -eq 0 && "$hidden_after" == "$hidden_dir" \
        && "$hidden_tb_rc" -eq 0 && "$hidden_tb_out" == "wrote $hidden_dir/task-1-brief.md: "* \
        && "$hidden_tb_exp_rc" -eq 0 ]] \
        && grep -q 'HIDDEN-TASK-1' "$hidden_tb_exp"; then
        pass "hidden dot-prefixed plan (.plan.md) resolves via sdd-workspace and task-brief after deletion"
    else
        fail "hidden dot-prefixed plan (.plan.md) resolves via sdd-workspace and task-brief after deletion"
        echo "    dir: $hidden_dir, rc: $rc, after: $hidden_after, tb_rc: $hidden_tb_rc, tb_out: $hidden_tb_out"
    fi

    # --- Reserved control slugs (.lock.md, .LOCK.md) never collide with $base files ---
    cat > "$repo/.lock.md" <<'PLAN'
# Lock Plan

### Task 1: Lock task

LOCK-PLAN-1
PLAN
    cat > "$repo/.LOCK.md" <<'PLAN'
# Upper Lock Plan

### Task 1: Upper lock task

UPPER-LOCK-PLAN-1
PLAN
    local lock_slug_dir="" upper_lock_dir=""
    local lock_slug_rc=0 upper_lock_rc=0
    lock_slug_dir="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" .lock.md 2>/dev/null)" || lock_slug_rc=$?
    upper_lock_dir="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" .LOCK.md 2>/dev/null)" || upper_lock_rc=$?
    if [[ "$lock_slug_rc" -eq 0 && "$upper_lock_rc" -eq 0 \
        && "$lock_slug_dir" == "$repo/.superpowers/sdd/plan-lock" \
        && "$(cat "$repo/.superpowers/sdd/.gitignore")" == "*" \
        && -d "$upper_lock_dir" ]]; then
        pass "plans named .lock.md and .LOCK.md reserve the lock name case-insensitively"
    else
        fail "plans named .lock.md and .LOCK.md reserve the lock name case-insensitively"
        echo "    lock_rc: $lock_slug_rc ($lock_slug_dir), upper_rc: $upper_lock_rc ($upper_lock_dir)"
    fi

    # --- review-package rejects non-commit objects (#2620) and includes commit bodies (#2298) ---
    local tree_err="" rc_tree_base=0 rc_tree_head=0 rc_blob=0
    tree_err="$(cd "$repo" && "$SDD_SCRIPTS/review-package" plan-a.md 'HEAD^{tree}' HEAD 2>&1 >/dev/null)" || rc_tree_base=$?
    (cd "$repo" && "$SDD_SCRIPTS/review-package" plan-a.md HEAD~1 'HEAD^{tree}' >/dev/null 2>&1) || rc_tree_head=$?
    (cd "$repo" && "$SDD_SCRIPTS/review-package" plan-a.md 'HEAD:plan-a.md' HEAD >/dev/null 2>&1) || rc_blob=$?
    if [[ "$rc_tree_base" -eq 2 && "$rc_tree_head" -eq 2 && "$rc_blob" -eq 2 && "$tree_err" == *"bad BASE:"* ]]; then
        pass "review-package rejects tree and blob refs with exit 2 (not 3)"
    else
        fail "review-package rejects tree and blob refs with exit 2 (not 3)"
        echo "    rc_tree_base: $rc_tree_base, rc_tree_head: $rc_tree_head, rc_blob: $rc_blob, err: $tree_err"
    fi

    printf 'body-test\n' > "$repo/body-file.txt"
    (cd "$repo" && git add body-file.txt && git "${git_id[@]}" commit -qm "subject line for review" -m $'Detailed multi-line commit body explaining why.\nSecond line of commit body.')
    local body_diff="$TEST_ROOT/body-review.diff"
    (cd "$repo" && "$SDD_SCRIPTS/review-package" plan-a.md HEAD~1 HEAD "$body_diff" >/dev/null)
    if grep -q 'subject line for review' "$body_diff" \
        && grep -q 'Detailed multi-line commit body explaining why.' "$body_diff" \
        && grep -q 'Second line of commit body.' "$body_diff"; then
        pass "review-package includes full multi-line commit bodies under ## Commits"
    else
        fail "review-package includes full multi-line commit bodies under ## Commits"
        sed -n '1,40p' "$body_diff" | sed 's/^/      /'
    fi

    echo ""
    if [[ "$FAILURES" -ne 0 ]]; then
        echo "FAILED: $FAILURES assertion(s)."
        exit 1
    fi
    echo "PASS"
}

main "$@"
