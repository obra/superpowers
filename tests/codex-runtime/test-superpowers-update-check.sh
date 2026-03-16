#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
UPDATE_BIN="$REPO_ROOT/bin/superpowers-update-check"
CONFIG_BIN="$REPO_ROOT/bin/superpowers-config"

make_install_dir() {
  local dir
  dir="$(mktemp -d)"
  mkdir -p "$dir/bin"
  ln -s "$CONFIG_BIN" "$dir/bin/superpowers-config"
  printf '%s\n' "$1" > "$dir/VERSION"
  echo "$dir"
}

make_remote_file() {
  local file
  file="$(mktemp)"
  printf '%s\n' "$1" > "$file"
  echo "$file"
}

reset_state() {
  rm -f \
    "$STATE_DIR/last-update-check" \
    "$STATE_DIR/update-snoozed" \
    "$STATE_DIR/just-upgraded-from" \
    "$STATE_DIR/config.yaml"
}

assert_output() {
  local expected="$1"
  local actual="$2"
  local label="$3"
  if [[ "$actual" != "$expected" ]]; then
    echo "Unexpected output for $label"
    echo "Expected: $expected"
    echo "Actual:   $actual"
    exit 1
  fi
}

assert_cache() {
  local expected="$1"
  local actual
  actual="$(cat "$STATE_DIR/last-update-check" 2>/dev/null || true)"
  if [[ "$actual" != "$expected" ]]; then
    echo "Unexpected cache contents"
    echo "Expected: $expected"
    echo "Actual:   $actual"
    exit 1
  fi
}

assert_no_cache() {
  if [[ -e "$STATE_DIR/last-update-check" ]]; then
    echo "Expected no update-check cache file to be written"
    cat "$STATE_DIR/last-update-check"
    exit 1
  fi
}

STATE_DIR="$(mktemp -d)"
trap 'rm -rf "$STATE_DIR"' EXIT
export SUPERPOWERS_STATE_DIR="$STATE_DIR"

local_dir="$(make_install_dir 5.1.0)"
remote_file="$(make_remote_file 5.1)"
export SUPERPOWERS_DIR="$local_dir"
export SUPERPOWERS_REMOTE_URL="file://$remote_file"
output="$("$UPDATE_BIN")"
assert_output "" "$output" "normalized equal versions"
assert_cache "UP_TO_DATE 5.1.0"
rm -rf "$local_dir"
rm -f "$remote_file"
reset_state

local_dir="$(make_install_dir 5.1.0)"
remote_file="$(make_remote_file 5.2.0)"
export SUPERPOWERS_DIR="$local_dir"
export SUPERPOWERS_REMOTE_URL="file://$remote_file"
output="$("$UPDATE_BIN")"
assert_output "UPGRADE_AVAILABLE 5.1.0 5.2.0" "$output" "local behind remote"
assert_cache "UPGRADE_AVAILABLE 5.1.0 5.2.0"
rm -rf "$local_dir"
rm -f "$remote_file"
reset_state

local_dir="$(make_install_dir 5.1.2)"
remote_file="$(make_remote_file 5.1.10)"
export SUPERPOWERS_DIR="$local_dir"
export SUPERPOWERS_REMOTE_URL="file://$remote_file"
output="$("$UPDATE_BIN")"
assert_output "UPGRADE_AVAILABLE 5.1.2 5.1.10" "$output" "multi-digit semver comparison"
assert_cache "UPGRADE_AVAILABLE 5.1.2 5.1.10"
rm -rf "$local_dir"
rm -f "$remote_file"
reset_state

local_dir="$(make_install_dir 5.2.0)"
remote_file="$(make_remote_file 5.1.9)"
export SUPERPOWERS_DIR="$local_dir"
export SUPERPOWERS_REMOTE_URL="file://$remote_file"
output="$("$UPDATE_BIN")"
assert_output "" "$output" "local ahead of remote"
assert_cache "UP_TO_DATE 5.2.0"
output="$("$UPDATE_BIN")"
assert_output "" "$output" "cached local-ahead result"
assert_cache "UP_TO_DATE 5.2.0"
rm -rf "$local_dir"
rm -f "$remote_file"
reset_state

local_dir="$(make_install_dir 5.1.0)"
export SUPERPOWERS_DIR="$local_dir"
printf '%s\n' '5.0.0' > "$STATE_DIR/just-upgraded-from"
output="$("$UPDATE_BIN")"
assert_output "JUST_UPGRADED 5.0.0 5.1.0" "$output" "just-upgraded marker"
assert_cache "UP_TO_DATE 5.1.0"
rm -rf "$local_dir"
reset_state

local_dir="$(make_install_dir 5.1.0)"
export SUPERPOWERS_DIR="$local_dir"
export SUPERPOWERS_REMOTE_URL="file:///does/not/exist"
output="$("$UPDATE_BIN")"
assert_output "" "$output" "remote lookup failure with empty cache"
assert_no_cache
rm -rf "$local_dir"
reset_state

local_dir="$(make_install_dir 5.1.0)"
export SUPERPOWERS_DIR="$local_dir"
export SUPERPOWERS_REMOTE_URL="file:///does/not/exist"
printf '%s\n' "UPGRADE_AVAILABLE 5.1.0 5.2.0" > "$STATE_DIR/last-update-check"
output="$("$UPDATE_BIN")"
assert_output "" "$output" "remote lookup failure with pre-existing cache"
assert_cache "UPGRADE_AVAILABLE 5.1.0 5.2.0"
rm -rf "$local_dir"
reset_state

local_dir="$(make_install_dir 5.1.0)"
remote_file="$(make_remote_file 5.2.0)"
export SUPERPOWERS_DIR="$local_dir"
export SUPERPOWERS_REMOTE_URL="file://$remote_file"
"$CONFIG_BIN" set update_check false
output="$("$UPDATE_BIN")"
assert_output "" "$output" "disabled update check"
rm -rf "$local_dir"
rm -f "$remote_file"
reset_state

local_dir="$(make_install_dir 5.1.0)"
remote_file="$(make_remote_file 5.2.0)"
export SUPERPOWERS_DIR="$local_dir"
export SUPERPOWERS_REMOTE_URL="file://$remote_file"
printf '%s %s %s\n' "5.2.0" "1" "$(date +%s)" > "$STATE_DIR/update-snoozed"
output="$("$UPDATE_BIN")"
assert_output "" "$output" "snoozed true upgrade"

echo "superpowers-update-check smoke test passed."
