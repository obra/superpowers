#!/usr/bin/env bash
# Tests for delivery's scripts: workspace resolves a self-ignoring
# working-tree directory, and task-brief, review-package, and dispatch-prompt
# write into it.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SCRIPTS="$REPO_ROOT/skills/delivery/scripts"

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
    echo "=== Test: delivery workspace scripts ==="

    TEST_ROOT="$(mktemp -d)"
    trap cleanup EXIT

    # Resolve repo to its physical path so string comparisons match the
    # helper's output (git rev-parse --show-toplevel resolves symlinks; on
    # macOS mktemp lives under /var -> /private/var).
    git init -q -b main "$TEST_ROOT/repo"
    local repo
    repo="$(cd "$TEST_ROOT/repo" && git rev-parse --show-toplevel)"

    local dir
    dir="$(cd "$repo" && "$SCRIPTS/workspace")"

    if [[ "$dir" == "$repo/.toolbelt/sdd" ]]; then
        pass "prints <repo-root>/.toolbelt/sdd"
    else
        fail "prints <repo-root>/.toolbelt/sdd"
        echo "    got: $dir"
    fi

    if [[ -f "$repo/.toolbelt/sdd/.gitignore" && "$(cat "$repo/.toolbelt/sdd/.gitignore")" == "*" ]]; then
        pass "self-ignoring .gitignore created with '*'"
    else
        fail "self-ignoring .gitignore created with '*'"
    fi

    printf 'x\n' > "$repo/.toolbelt/sdd/artifact.md"
    local status
    status="$(cd "$repo" && git status --porcelain)"
    if [[ -z "$status" ]]; then
        pass "workspace invisible to git status"
    else
        fail "workspace invisible to git status"
        echo "    status: $status"
    fi

    ( cd "$repo" && git add -A )
    local staged
    staged="$(cd "$repo" && git diff --cached --name-only)"
    if [[ -z "$staged" ]]; then
        pass "git add -A does not stage the workspace"
    else
        fail "git add -A does not stage the workspace"
        echo "    staged: $staged"
    fi

    cat > "$repo/plan.md" <<'PLAN'
# Plan

## Global Constraints

- Keep shared behavior unchanged.

```text
### Task 99: Fenced global example
```

## Task 1: First thing

Do the first thing.

```text
### Task 99: Fenced task example
```

Still part of Task 1.

## Task 2: Second thing

Do the second thing.
PLAN

    local brief_out brief_path
    brief_out="$(cd "$repo" && "$SCRIPTS/task-brief" plan.md 1)"
    brief_path="$(printf '%s\n' "$brief_out" | sed -n 's/^wrote \(.*\): [0-9][0-9]* lines$/\1/p')"
    case "$brief_path" in
        "$repo/.toolbelt/sdd/"*) pass "task-brief writes its brief under the workspace" ;;
        *)
            fail "task-brief writes its brief under the workspace"
            echo "    got: $brief_path"
            ;;
    esac

    local expected_brief="$TEST_ROOT/expected-brief.md"
    cat > "$expected_brief" <<'BRIEF'
## Global Constraints

- Keep shared behavior unchanged.

```text
### Task 99: Fenced global example
```

## Task 1: First thing

Do the first thing.

```text
### Task 99: Fenced task example
```

Still part of Task 1.

BRIEF
    if cmp -s "$brief_path" "$expected_brief"; then
        pass "task-brief carries the shared sections and only the selected task"
    else
        fail "task-brief carries the shared sections and only the selected task"
        diff -u "$expected_brief" "$brief_path" || true
    fi

    local git_id=(-c user.email=t@example.com -c user.name=t -c commit.gpgsign=false)
    ( cd "$repo" \
        && git add plan.md \
        && git "${git_id[@]}" commit -qm c1 \
        && printf 'y\n' > f && git add f \
        && git "${git_id[@]}" commit -qm c2 )
    local rp_out rp_path
    rp_out="$(cd "$repo" && "$SCRIPTS/review-package" HEAD~1 HEAD)"
    rp_path="$(printf '%s\n' "$rp_out" | sed -n 's/^wrote \(.*\): [0-9].*$/\1/p')"
    case "$rp_path" in
        "$repo/.toolbelt/sdd/"*) pass "review-package writes its diff under the workspace" ;;
        *)
            fail "review-package writes its diff under the workspace"
            echo "    got: $rp_path"
            ;;
    esac

    # --- Worktree isolation: a linked worktree resolves its own workspace ---
    local wt="$TEST_ROOT/wt"
    ( cd "$repo" && git worktree add -q "$wt" -b wt-feature )
    local wt_root wt_dir
    wt_root="$(cd "$wt" && git rev-parse --show-toplevel)"
    wt_dir="$(cd "$wt" && "$SCRIPTS/workspace")"
    if [[ "$wt_dir" == "$wt_root/.toolbelt/sdd" && "$wt_dir" != "$dir" ]]; then
        pass "linked worktree resolves its own distinct workspace"
    else
        fail "linked worktree resolves its own distinct workspace"
        echo "    main: $dir"
        echo "    wt:   $wt_dir"
    fi

    printf 'y\n' > "$wt/.toolbelt/sdd/artifact.md"
    local wt_status
    wt_status="$(cd "$wt" && git status --porcelain)"
    if [[ -z "$wt_status" ]]; then
        pass "worktree workspace invisible to git status"
    else
        fail "worktree workspace invisible to git status"
        echo "    status: $wt_status"
    fi


    # --- review-package slices ---
    ( cd "$repo" \
        && mkdir -p app lib \
        && printf 'a\n' > app/a.txt && printf 'b\n' > lib/b.txt \
        && git add app lib && git "${git_id[@]}" commit -qm c3 )
    local slice_out slice_path
    slice_out="$(cd "$repo" && "$SCRIPTS/review-package" HEAD~1 HEAD -- app)"
    slice_path="$(printf '%s\n' "$slice_out" | sed -n 's/^wrote \(.*\): [0-9].*$/\1/p')"
    if grep -q '^diff --git a/app/a.txt' "$slice_path" && ! grep -q '^diff --git a/lib/' "$slice_path" \
        && sed -n '/^## Files changed/,/^## Diff/p' "$slice_path" | grep -q 'lib/b.txt'; then
        pass "a sliced package diffs only its paths and lists every changed file"
    else
        fail "a sliced package diffs only its paths and lists every changed file"
        cat "$slice_path"
    fi

    local out_a out_b path_a path_b
    out_a="$TEST_ROOT/slice-a.out"
    out_b="$TEST_ROOT/slice-b.out"
    ( cd "$repo" && "$SCRIPTS/review-package" HEAD~1 HEAD -- app > "$out_a" ) &
    ( cd "$repo" && "$SCRIPTS/review-package" HEAD~1 HEAD -- lib > "$out_b" ) &
    wait
    path_a="$(sed -n 's/^wrote \(.*\): [0-9].*$/\1/p' "$out_a")"
    path_b="$(sed -n 's/^wrote \(.*\): [0-9].*$/\1/p' "$out_b")"
    if [[ -n "$path_a" && -n "$path_b" && "$path_a" != "$path_b" ]] \
        && grep -q '^diff --git a/app/' "$path_a" && grep -q '^diff --git a/lib/' "$path_b"; then
        pass "two slices of one range written at once land in two files"
    else
        fail "two slices of one range written at once land in two files"
        echo "    a: $path_a"
        echo "    b: $path_b"
    fi

    # --- task-brief section boundaries and dispatch-prompt ---
    cat > "$repo/delivery-plan.md" <<'PLAN'
# Delivery Plan

## Global Constraints

- Keep it small.

## PR Boundaries

| PR | Outcome | Tasks | Depends on | Risk | Independent verification |
|---|---|---|---|---|---|
| 1 | First outcome | `1–2` | none | high | tests pass |
| 2 | Second outcome | 3 | 1 | none | tests pass |

## Risks

- The importer also writes these rows.

### Task 1: First

Do one.

### Task 2: Second

Do two.

### Task 3: Third

Do three.

## After release

Not part of any task.
PLAN

    local last_brief
    last_brief="$(cd "$repo" && "$SCRIPTS/task-brief" delivery-plan.md 3 | sed -n 's/^wrote \(.*\): [0-9][0-9]* lines$/\1/p')"
    if grep -q 'Do three.' "$last_brief" && ! grep -q 'After release' "$last_brief"; then
        pass "task-brief stops the last task before the trailing section"
    else
        fail "task-brief stops the last task before the trailing section"
        cat "$last_brief"
    fi
    if grep -q '^## Risks' "$last_brief" && grep -q 'The importer also writes these rows.' "$last_brief"; then
        pass "task-brief copies the plan's Risks"
    else
        fail "task-brief copies the plan's Risks"
    fi

    local first_brief
    first_brief="$(cd "$repo" && "$SCRIPTS/task-brief" delivery-plan.md 1 | sed -n 's/^wrote \(.*\): [0-9][0-9]* lines$/\1/p')"
    if grep -q 'Do one.' "$first_brief" && ! grep -q 'Do two.' "$first_brief" \
        && [ "$(grep -c '^### Task 1:' "$first_brief")" -eq 1 ]; then
        pass "a Risks section right before the tasks carries no task into the brief"
    else
        fail "a Risks section right before the tasks carries no task into the brief"
        cat "$first_brief"
    fi

    local prompt_path
    prompt_path="$(cd "$repo" && "$SCRIPTS/dispatch-prompt" implementer --plan delivery-plan.md --boundary 1 --worktree "$wt")"
    local ws
    ws="$(cd "$repo" && "$SCRIPTS/workspace" delivery-plan.md)"
    if [[ "$prompt_path" == "$ws/boundary-1-implementer.md" && -f "$prompt_path" ]]; then
        pass "dispatch-prompt implementer writes the boundary's prompt into the workspace"
    else
        fail "dispatch-prompt implementer writes the boundary's prompt into the workspace"
        echo "    got: $prompt_path"
    fi
    local brief_lines
    brief_lines="$(grep -o 'task-[0-9]*-brief.md' "$prompt_path" | tr '\n' ' ')"
    if [[ "$brief_lines" == "task-1-brief.md task-2-brief.md " ]] \
        && ! grep -Eq '\[[A-Z][A-Z_]*\]' "$prompt_path"; then
        pass "the implementer prompt names every brief in order and no placeholder"
    else
        fail "the implementer prompt names every brief in order and no placeholder"
        echo "    briefs: $brief_lines"
        grep -En '\[[A-Z][A-Z_]*\]' "$prompt_path" || true
    fi

    if (cd "$repo" && "$SCRIPTS/dispatch-prompt" implementer --plan delivery-plan.md --boundary 7 --worktree "$wt") >/dev/null 2>&1; then
        fail "dispatch-prompt rejects a boundary not in the table"
    else
        pass "dispatch-prompt rejects a boundary not in the table"
    fi


    # --- dispatch-prompt reviewer ---
    printf '\n## Rulings\n\n- Keep the old name.\n' >> "$ws/task-2-brief.md"
    local pkg review_prompt
    pkg="$(cd "$repo" && "$SCRIPTS/review-package" --plan delivery-plan.md HEAD~1 HEAD | sed -n 's/^wrote \(.*\): [0-9].*$/\1/p')"
    review_prompt="$(cd "$repo" && "$SCRIPTS/dispatch-prompt" reviewer --plan delivery-plan.md --boundary 1 --package "$pkg")"
    if [[ "$review_prompt" == "$ws/boundary-1-review.md" ]] \
        && grep -i 'rulings' "$review_prompt" | grep -q "$ws/task-2-brief.md" \
        && ! grep -i 'rulings' "$review_prompt" | grep -q 'task-1-brief.md' \
        && grep -i 'scope' "$review_prompt" | grep -q 'tasks 1, 2' \
        && ! grep -Eq '\[[A-Z][A-Z_]*\]' "$review_prompt"; then
        pass "the reviewer prompt lists the ruled brief, names the boundary's tasks, and fills every placeholder"
    else
        fail "the reviewer prompt lists the ruled brief, names the boundary's tasks, and fills every placeholder"
        echo "    path: $review_prompt"
        [[ -f "$review_prompt" ]] && cat "$review_prompt"
    fi

    local slice_prompt
    slice_prompt="$(cd "$repo" && "$SCRIPTS/dispatch-prompt" reviewer --plan delivery-plan.md --boundary 1 --package "$pkg" --slice "app lib")"
    if [[ "$slice_prompt" == "$ws/boundary-1-review-"*.md && "$slice_prompt" != "$review_prompt" ]] \
        && grep -q 'app lib' "$slice_prompt"; then
        pass "a sliced reviewer prompt gets its own file and names its slice"
    else
        fail "a sliced reviewer prompt gets its own file and names its slice"
        echo "    path: $slice_prompt"
    fi

    echo ""
    if [[ "$FAILURES" -ne 0 ]]; then
        echo "FAILED: $FAILURES assertion(s)."
        exit 1
    fi
    echo "PASS"
}

main "$@"
