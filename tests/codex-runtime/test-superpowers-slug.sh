#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
HELPER_BIN="$REPO_ROOT/bin/superpowers-slug"

if [[ ! -x "$HELPER_BIN" ]]; then
  echo "Expected helper to exist and be executable: $HELPER_BIN"
  exit 1
fi

repo_hash() {
  local value="$1"
  if command -v shasum >/dev/null 2>&1; then
    printf '%s' "$value" | shasum -a 256 | awk '{print substr($1, 1, 12)}'
    return
  fi
  if command -v sha256sum >/dev/null 2>&1; then
    printf '%s' "$value" | sha256sum | awk '{print substr($1, 1, 12)}'
    return
  fi
  printf '%s' "$value" | cksum | awk '{print $1}'
}

make_repo() {
  local dir="$1"
  git init "$dir" >/dev/null 2>&1
  git -C "$dir" config user.name "Superpowers Test"
  git -C "$dir" config user.email "superpowers-tests@example.com"
  printf '# slug fixture\n' > "$dir/README.md"
  git -C "$dir" add README.md
  git -C "$dir" commit -m "init" >/dev/null 2>&1
}

run_helper() {
  local repo_dir="$1"
  (cd "$repo_dir" && "$HELPER_BIN")
}

assert_equal() {
  local actual="$1"
  local expected="$2"
  local label="$3"
  if [[ "$actual" != "$expected" ]]; then
    echo "Unexpected $label"
    echo "Expected: $expected"
    echo "Actual:   $actual"
    exit 1
  fi
}

tmp_root="$(mktemp -d)"
trap 'rm -rf "$tmp_root"' EXIT

remote_repo="$tmp_root/remote-repo"
make_repo "$remote_repo"
git -C "$remote_repo" remote add origin "https://example.com/acme/slug-helper.git"
git -C "$remote_repo" checkout -b 'feature/$(shell)$branch' >/dev/null 2>&1
remote_output="$(run_helper "$remote_repo")"
unset SLUG BRANCH
eval "$remote_output"
assert_equal "$SLUG" "acme-slug-helper" "remote slug"
assert_equal "$BRANCH" "$(printf '%s\n' 'feature/$(shell)$branch' | sed 's/[^[:alnum:]._-]/-/g')" "sanitized remote branch"
if [[ "$remote_output" == *"SAFE_BRANCH"* ]]; then
  echo "Helper should not emit SAFE_BRANCH"
  printf '%s\n' "$remote_output"
  exit 1
fi

fallback_repo="$tmp_root/slug with 'quotes' and \$dollar and \$(cmd)"
make_repo "$fallback_repo"
git -C "$fallback_repo" checkout -b 'topic/$(weird)$branch' >/dev/null 2>&1
fallback_output="$(run_helper "$fallback_repo")"
unset SLUG BRANCH
eval "$fallback_output"
expected_hash="$(repo_hash "$(git -C "$fallback_repo" rev-parse --show-toplevel 2>/dev/null || printf '%s' "$fallback_repo")")"
expected_slug="$(basename "$(git -C "$fallback_repo" rev-parse --show-toplevel 2>/dev/null || printf '%s' "$fallback_repo")")-$expected_hash"
assert_equal "$SLUG" "$expected_slug" "fallback slug"
assert_equal "$BRANCH" "$(printf '%s\n' 'topic/$(weird)$branch' | sed 's/[^[:alnum:]._-]/-/g')" "sanitized fallback branch"
if [[ "$fallback_output" == *"SAFE_BRANCH"* ]]; then
  echo "Helper should not emit SAFE_BRANCH"
  printf '%s\n' "$fallback_output"
  exit 1
fi

detached_repo="$tmp_root/detached-repo"
make_repo "$detached_repo"
git -C "$detached_repo" checkout --detach HEAD >/dev/null 2>&1
detached_output="$(run_helper "$detached_repo")"
unset SLUG BRANCH
eval "$detached_output"
expected_hash="$(repo_hash "$(git -C "$detached_repo" rev-parse --show-toplevel 2>/dev/null || printf '%s' "$detached_repo")")"
expected_slug="$(basename "$(git -C "$detached_repo" rev-parse --show-toplevel 2>/dev/null || printf '%s' "$detached_repo")")-$expected_hash"
assert_equal "$SLUG" "$expected_slug" "detached-head fallback slug"
assert_equal "$BRANCH" "current" "detached-head branch fallback"
if [[ "$detached_output" == *"SAFE_BRANCH"* ]]; then
  echo "Helper should not emit SAFE_BRANCH"
  printf '%s\n' "$detached_output"
  exit 1
fi

echo "superpowers-slug helper contract passed."
