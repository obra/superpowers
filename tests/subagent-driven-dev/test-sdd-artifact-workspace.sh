#!/usr/bin/env bash
# Tests for subagent-driven-development artifact workspace scripts.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SCRIPT_DIR="$REPO_ROOT/skills/subagent-driven-development/scripts"

fail() {
    echo "FAIL: $*" >&2
    exit 1
}

assert_eq() {
    local expected=$1
    local actual=$2
    local message=$3

    if [ "$expected" != "$actual" ]; then
        fail "$message: expected '$expected', got '$actual'"
    fi
}

assert_file() {
    local file=$1
    [ -f "$file" ] || fail "expected file to exist: $file"
}

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT

worktree="$tmpdir/repo"
mkdir -p "$worktree"
cd "$worktree"
worktree=$(pwd -P)

git init --quiet
git config user.email "test@example.com"
git config user.name "Test User"

echo "initial" > file.txt
git add file.txt
git commit -m "initial" --quiet

legacy_workspace=$("$SCRIPT_DIR/sdd-workspace")
assert_eq "$worktree/.superpowers/sdd" "$legacy_workspace" "legacy workspace path"
assert_file "$legacy_workspace/.gitignore"
assert_eq "*" "$(cat "$legacy_workspace/.gitignore")" "legacy workspace gitignore"

mkdir -p "plans/a" "plans/b"
plan_a="$worktree/plans/a/Same Plan.md"
plan_b="$worktree/plans/b/Same_Plan.md"

cat > "$plan_a" <<'PLAN'
# Plan A

## Task 1: Alpha

Implement alpha.

## Task 2: Beta

Implement beta.
PLAN

cat > "$plan_b" <<'PLAN'
# Plan B

## Task 1: Gamma

Implement gamma.
PLAN

brief_a_output=$("$SCRIPT_DIR/task-brief" "$plan_a" 1)
brief_b_output=$("$SCRIPT_DIR/task-brief" "$plan_b" 1)

brief_a=${brief_a_output#wrote }
brief_a=${brief_a%%:*}
brief_b=${brief_b_output#wrote }
brief_b=${brief_b%%:*}

assert_file "$brief_a"
assert_file "$brief_b"

dir_a=$(dirname "$brief_a")
dir_b=$(dirname "$brief_b")

[ "$dir_a" != "$legacy_workspace" ] || fail "plan A brief used legacy workspace"
[ "$dir_b" != "$legacy_workspace" ] || fail "plan B brief used legacy workspace"
[ "$dir_a" != "$dir_b" ] || fail "plans with colliding sanitized names used the same workspace"

case "$(basename "$dir_a")" in
    *[!a-z0-9-]*)
        fail "plan A workspace is not a safe single path segment: $(basename "$dir_a")"
        ;;
esac

case "$(basename "$dir_b")" in
    *[!a-z0-9-]*)
        fail "plan B workspace is not a safe single path segment: $(basename "$dir_b")"
        ;;
esac

grep -q "Implement alpha" "$brief_a" || fail "plan A brief missing task 1 content"
if grep -q "Implement beta" "$brief_a"; then
    fail "plan A brief leaked task 2 content"
fi

report_a="${brief_a%-brief.md}-report.md"
report_b="${brief_b%-brief.md}-report.md"
printf 'report A\n' > "$report_a"
printf 'report B\n' > "$report_b"

assert_file "$report_a"
assert_file "$report_b"
assert_eq "report A" "$(cat "$report_a")" "plan A report content"
assert_eq "report B" "$(cat "$report_b")" "plan B report content"

echo "changed" > file.txt
git add file.txt
git commit -m "change file" --quiet
base_ref=HEAD~1

mkdir -p "$legacy_workspace"
printf 'stale review package\n' > "$legacy_workspace/review-$base_ref..HEAD.md"

plan_a_id="$(cd "$(dirname "$plan_a")" && pwd)/$(basename "$plan_a")"
review_output=$(SDD_PLAN_ID="$plan_a_id" "$SCRIPT_DIR/review-package" "$base_ref" HEAD)
review_path=${review_output#wrote }
review_path=${review_path%%:*}

assert_file "$review_path"
assert_eq "$dir_a" "$(dirname "$review_path")" "review package workspace matches task brief workspace"
assert_eq "stale review package" "$(cat "$legacy_workspace/review-$base_ref..HEAD.md")" "stale flat review package was untouched"
grep -q "changed" "$review_path" || fail "review package missing diff content"

echo "All SDD artifact workspace tests passed"
