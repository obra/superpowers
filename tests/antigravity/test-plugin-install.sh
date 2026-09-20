#!/usr/bin/env bash
# Exercise Antigravity's native installer against this repository. Set AGY_BIN
# to an agy executable to run locally; CI without agy skips this live check.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AGY="${AGY_BIN:-}"

# Keep the packaging contract covered even where agy is unavailable (CI).
test -f "$REPO_ROOT/plugin.json" || { echo "FAIL: Antigravity plugin manifest is missing" >&2; exit 1; }
grep -Eq '"name"[[:space:]]*:[[:space:]]*"superpowers"' "$REPO_ROOT/plugin.json" || {
  echo "FAIL: Antigravity plugin manifest has no superpowers name" >&2
  exit 1
}
test -f "$REPO_ROOT/rules/superpowers.md" || { echo "FAIL: Antigravity bootstrap rule is missing" >&2; exit 1; }
grep -q '^trigger: always_on$' "$REPO_ROOT/rules/superpowers.md" || {
  echo "FAIL: Antigravity bootstrap rule is not always on" >&2
  exit 1
}
for relative_path in \
  ../skills/using-superpowers/SKILL.md \
  ../skills/using-superpowers/references/antigravity-tools.md; do
  included_file="$REPO_ROOT/rules/$relative_path"
  test -f "$included_file" || { echo "FAIL: bootstrap include target is missing: $included_file" >&2; exit 1; }
  grep -Fxq "@$relative_path" "$REPO_ROOT/rules/superpowers.md" || {
    echo "FAIL: bootstrap rule does not include $included_file" >&2
    exit 1
  }
done

if [ -z "$AGY" ]; then
  AGY="$(command -v agy || true)"
fi
if [ -z "$AGY" ]; then
  echo "PASS: Antigravity package structure valid; live install skipped (set AGY_BIN)"
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

INSTALLED=""
for candidate in \
  "$TEST_HOME/.gemini/antigravity-cli/plugins/superpowers" \
  "$TEST_HOME/.gemini/config/plugins/superpowers"; do
  if [ -f "$candidate/plugin.json" ]; then
    INSTALLED="$candidate"
    break
  fi
done
test -n "$INSTALLED" || { echo "FAIL: agy did not install the plugin in a supported profile path" >&2; exit 1; }
test -f "$INSTALLED/plugin.json"
test -f "$INSTALLED/rules/superpowers.md"
test -f "$INSTALLED/skills/using-superpowers/SKILL.md"
test -f "$INSTALLED/skills/brainstorming/SKILL.md"

echo "PASS: agy installed the bootstrap rule and skills through its plugin mechanism ($INSTALLED)"
