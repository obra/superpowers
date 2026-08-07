#!/usr/bin/env bash
# Structural checks for the Grok Build harness adapter.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
fail=0

check() {
  if "$@"; then
    echo "OK: $*"
  else
    echo "FAIL: $*"
    fail=1
  fi
}

check test -f "$ROOT/.grok-plugin/plugin.json"
check test -f "$ROOT/skills/using-superpowers/references/grok-tools.md"
check test -f "$ROOT/docs/README.grok.md"
check test -d "$ROOT/skills/using-superpowers"
check test -d "$ROOT/skills/brainstorming"
check test -d "$ROOT/skills/test-driven-development"

# hooks must be empty object (suppress Claude SessionStart on Grok)
python3 - <<PY
import json, sys
from pathlib import Path
root = Path("$ROOT")
manifest = json.loads((root / ".grok-plugin/plugin.json").read_text())
assert manifest.get("hooks") == {}, f"expected hooks: {{}}, got {manifest.get('hooks')!r}"
assert "skills" in manifest
tools = (root / "skills/using-superpowers/references/grok-tools.md").read_text()
for token in ("spawn_subagent", "read_file", "todo_write", "run_terminal_command"):
    assert token in tools, f"missing tool {token} in grok-tools.md"
skill = (root / "skills/using-superpowers/SKILL.md").read_text()
assert "Grok Build" in skill and "grok-tools.md" in skill, "Platform Adaptation missing Grok pointer"
print("OK: manifest + tool map + platform pointer")
PY

# Required skills present
for s in brainstorming using-superpowers writing-plans test-driven-development \
         systematic-debugging subagent-driven-development verification-before-completion; do
  check test -f "$ROOT/skills/$s/SKILL.md"
done

if [[ "$fail" -ne 0 ]]; then
  echo "Structural checks failed"
  exit 1
fi
echo "All Grok structural checks passed"
