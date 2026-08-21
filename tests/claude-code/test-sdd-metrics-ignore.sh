#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
IGNORE_SCRIPT="$REPO_ROOT/skills/subagent-driven-development/scripts/ensure-metrics-ignore"

FAILURES=0
TEST_ROOT=""

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
cleanup() { [[ -z "$TEST_ROOT" || ! -d "$TEST_ROOT" ]] || rm -rf "$TEST_ROOT"; }

new_repo() {
  local name=$1
  local repo="$TEST_ROOT/$name"
  git init -q -b main "$repo"
  printf 'tracked-ignore\n' > "$repo/.gitignore"
  git -C "$repo" add .gitignore
  git -C "$repo" -c user.name=Test -c user.email=test@example.test commit -qm fixture
  printf '%s\n' "$repo"
}

exclude_path() {
  local repo=$1 path
  path="$(git -C "$repo" rev-parse --git-path info/exclude)"
  case "$path" in
    /*) printf '%s\n' "$path" ;;
    *) printf '%s/%s\n' "$repo" "$path" ;;
  esac
}

run_setup() {
  (cd "$1" && "$IGNORE_SCRIPT")
}

assert_setup() {
  local repo=$1 label=$2
  if run_setup "$repo"; then
    pass "$label installs metrics ignore"
  else
    fail "$label installs metrics ignore"
  fi
}

main() {
  echo "=== Test: sdd-metrics-ignore ==="
  TEST_ROOT="$(mktemp -d)"
  trap cleanup EXIT

  local repo ignore before after status line_count
  repo="$(new_repo new)"
  before="$(git -C "$repo" hash-object .gitignore)"
  assert_setup "$repo" "new repository"
  ignore="$(exclude_path "$repo")"
  mkdir -p "$repo/.superpowers/metrics/foo"
  printf 'event\n' > "$repo/.superpowers/metrics/foo/events.jsonl"
  status="$(git -C "$repo" status --porcelain)"
  after="$(git -C "$repo" hash-object .gitignore)"
  if git -C "$repo" check-ignore -q -- .superpowers/metrics/.ignore-probe && [[ -z "$status" ]]; then
    pass "new repository metrics path is ignored and status clean"
  else
    fail "new repository metrics path is ignored and status clean"
    echo "    status: $status"
  fi
  if [[ "$before" == "$after" ]]; then
    pass "tracked .gitignore stays unchanged"
  else
    fail "tracked .gitignore stays unchanged"
  fi
  line_count="$(grep -Fxc '/.superpowers/metrics/' "$ignore" || true)"
  if [[ "$line_count" == 1 ]]; then
    pass "new repository appends one exact metrics ignore line"
  else
    fail "new repository appends one exact metrics ignore line"
  fi

  repo="$(new_repo broad)"
  ignore="$(exclude_path "$repo")"
  mkdir -p "$(dirname "$ignore")"
  printf '/.superpowers/\n' >> "$ignore"
  before="$(git hash-object "$ignore")"
  assert_setup "$repo" "broader existing ignore"
  after="$(git hash-object "$ignore")"
  if [[ "$before" == "$after" ]]; then
    pass "broader existing ignore causes no append"
  else
    fail "broader existing ignore causes no append"
  fi

  repo="$(new_repo repeat)"
  assert_setup "$repo" "first repeated setup"
  assert_setup "$repo" "second repeated setup"
  ignore="$(exclude_path "$repo")"
  line_count="$(grep -Fxc '/.superpowers/metrics/' "$ignore" || true)"
  if [[ "$line_count" == 1 ]]; then
    pass "repeated setup never duplicates exact ignore line"
  else
    fail "repeated setup never duplicates exact ignore line"
  fi

  repo="$(new_repo worktree-main)"
  local worktree="$TEST_ROOT/worktree"
  git -C "$repo" worktree add -q -b metrics-ignore-worktree "$worktree"
  assert_setup "$worktree" "linked worktree"
  ignore="$(exclude_path "$worktree")"
  mkdir -p "$worktree/.superpowers/metrics/foo"
  printf 'event\n' > "$worktree/.superpowers/metrics/foo/events.jsonl"
  status="$(git -C "$worktree" status --porcelain)"
  if git -C "$worktree" check-ignore -q -- .superpowers/metrics/.ignore-probe && [[ -z "$status" ]] && [[ -f "$ignore" ]]; then
    pass "linked worktree resolves local exclude and stays clean"
  else
    fail "linked worktree resolves local exclude and stays clean"
    echo "    exclude: $ignore"
    echo "    status: $status"
  fi

  if [[ "$FAILURES" -ne 0 ]]; then
    echo "FAILED: $FAILURES assertion(s)."
    exit 1
  fi
  echo "PASS"
}

main "$@"
