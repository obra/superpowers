#!/usr/bin/env bash
# Exercise Antigravity's native installer against this repository. Set AGY_BIN
# to an agy executable to run locally; CI without agy skips this live check.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AGY="${AGY_BIN:-}"

if [ -z "$AGY" ]; then
  AGY="$(command -v agy || true)"
fi
if [ -z "$AGY" ]; then
  echo "SKIP: agy is not available (set AGY_BIN to run the live installer test)"
  exit 0
fi

TEST_ROOT="$(cd "${TMPDIR:-/tmp}" && pwd -P)"
TEST_HOME="$(mktemp -d "$TEST_ROOT/sp-agy-test.XXXXXX")"
case "$(cd "$TEST_HOME" && pwd -P)" in
  "$TEST_ROOT"/sp-agy-test.*) ;;
  *) echo "FAIL: test profile is outside the intended temporary directory" >&2; exit 1 ;;
esac
trap 'rm -rf "$TEST_HOME"' EXIT
if command -v cygpath >/dev/null 2>&1; then
  TEST_PROFILE="$(cygpath -w "$TEST_HOME")"
else
  TEST_PROFILE="$TEST_HOME"
fi

"$AGY" plugin validate "$REPO_ROOT"
HOME="$TEST_PROFILE" USERPROFILE="$TEST_PROFILE" \
  "$AGY" plugin install "$REPO_ROOT"

INSTALLED="$TEST_HOME/.gemini/config/plugins/superpowers"
test -f "$INSTALLED/plugin.json"
test -f "$INSTALLED/rules/superpowers.md"
test -f "$INSTALLED/skills/using-superpowers/SKILL.md"
test -f "$INSTALLED/skills/brainstorming/SKILL.md"

echo "PASS: agy installed the bootstrap rule and skills through its plugin mechanism"
