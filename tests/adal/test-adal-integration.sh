#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

MAPPING="$REPO_ROOT/skills/using-superpowers/references/adal-tools.md"
SKILL="$REPO_ROOT/skills/using-superpowers/SKILL.md"
README="$REPO_ROOT/README.md"
DOCS="$REPO_ROOT/docs/README.adal.md"

# Assert tool mapping exists and is non-empty
[ -f "$MAPPING" ] || { echo "FAIL: adal-tools.md not found"; exit 1; }
[ -s "$MAPPING" ] || { echo "FAIL: adal-tools.md is empty"; exit 1; }

# Assert mapping covers required actions
for tool in "read_file" "create_file" "bash" "grep" "glob" "fetch_url" "web_search"; do
  grep -q "$tool" "$MAPPING" || { echo "FAIL: missing tool '$tool' in mapping"; exit 1; }
done

# Assert mapping does NOT claim unavailable Claude Code tools
for bad_tool in '| `Skill`' '| `Task`' '| `TodoWrite`'; do
  if grep -qF "$bad_tool" "$MAPPING"; then
    echo "FAIL: mapping claims unavailable tool: $bad_tool"
    exit 1
  fi
done

# Assert Platform Adaptation pointer exists
grep -q 'AdaL.*adal-tools' "$SKILL" || {
  echo "FAIL: Platform Adaptation section missing AdaL pointer"; exit 1;
}

# Assert README references AdaL
grep -q 'AdaL' "$README" || {
  echo "FAIL: README.md missing AdaL"; exit 1;
}

# Assert docs exist
[ -f "$DOCS" ] || { echo "FAIL: docs/README.adal.md not found"; exit 1; }

echo "PASS: AdaL integration files verified"
