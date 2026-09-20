#!/usr/bin/env bash
# Exercise Antigravity's native installer against this repository. Set AGY_BIN
# to an agy executable to run locally; CI without agy skips this live check.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AGY="${AGY_BIN:-}"

# Keep the packaging contract covered even where agy is unavailable (CI).
test -f "$REPO_ROOT/plugin.json" || { echo "FAIL: Antigravity plugin manifest is missing" >&2; exit 1; }
node - "$REPO_ROOT/plugin.json" <<'NODE'
const fs = require('node:fs');

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
} catch (error) {
  console.error(`FAIL: Antigravity plugin manifest is invalid JSON: ${error.message}`);
  process.exit(1);
}

if (manifest.name !== 'superpowers') {
  console.error('FAIL: Antigravity plugin manifest has no superpowers name');
  process.exit(1);
}
NODE
test -f "$REPO_ROOT/rules/superpowers.md" || { echo "FAIL: Antigravity bootstrap rule is missing" >&2; exit 1; }
grep -q '^trigger: always_on$' "$REPO_ROOT/rules/superpowers.md" || {
  echo "FAIL: Antigravity bootstrap rule is not always on" >&2
  exit 1
}
rule_content="$(cat "$REPO_ROOT/rules/superpowers.md")"
for relative_path in \
  ../skills/using-superpowers/SKILL.md \
  ../skills/using-superpowers/references/antigravity-tools.md; do
  included_file="$REPO_ROOT/rules/$relative_path"
  test -f "$included_file" || { echo "FAIL: bootstrap source is missing: $included_file" >&2; exit 1; }
  source_content="$(cat "$included_file")"
  if [[ "$rule_content" != *"$source_content"* ]]; then
    echo "FAIL: bootstrap rule does not inline $included_file" >&2
    exit 1
  fi
done
if grep -q '^@\.\./skills/using-superpowers/' "$REPO_ROOT/rules/superpowers.md"; then
  echo "FAIL: bootstrap rule still relies on lazy @ references" >&2
  exit 1
fi
if [ "$(wc -c < "$REPO_ROOT/rules/superpowers.md")" -gt 12000 ]; then
  echo "FAIL: Antigravity bootstrap rule exceeds the documented size limit" >&2
  exit 1
fi
if ! cmp -s "$REPO_ROOT/rules/superpowers.md" \
    <(bash "$REPO_ROOT/scripts/generate-antigravity-rule.sh" /dev/stdout); then
  echo "FAIL: Antigravity bootstrap rule differs from its generated source" >&2
  exit 1
fi

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
cmp -s "$INSTALLED/rules/superpowers.md" "$REPO_ROOT/rules/superpowers.md" || {
  echo "FAIL: agy changed the generated bootstrap rule during installation" >&2
  exit 1
}
test -f "$INSTALLED/skills/using-superpowers/SKILL.md"
test -f "$INSTALLED/skills/using-superpowers/references/antigravity-tools.md"
test -f "$INSTALLED/skills/brainstorming/SKILL.md"

echo "PASS: agy installed the bootstrap rule and skills through its plugin mechanism ($INSTALLED)"
