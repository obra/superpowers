#!/usr/bin/env bash
# Validate the Devin CLI integration. `devin plugins install obra/superpowers`
# reads `.devin-plugin/plugin.json` and auto-discovers the co-located `skills/`
# directory; Devin CLI surfaces every installed skill's name + description in
# the system prompt at session start and invokes them via its native `skill`
# tool, so there is no hook or injector scaffold to test. What IS Devin-specific
# is the manifest and the tool mapping — subagent dispatch via run_subagent
# profiles and task tracking via todo_write — and SKILL.md pointing at it.
#
# Mirrors tests/kimi/test-plugin-manifest.sh (manifest) and
# tests/antigravity/test-antigravity-tools.sh (mapping). CI-safe: does not
# require `devin` installed.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

MANIFEST="$REPO_ROOT/.devin-plugin/plugin.json"
MAPPING="$REPO_ROOT/skills/using-superpowers/references/devin-tools.md"
SKILL="$REPO_ROOT/skills/using-superpowers/SKILL.md"

fail() { echo "FAIL: $*" >&2; exit 1; }

echo "test-devin-plugin: checking Devin CLI manifest and tool mapping"

# --- Manifest is valid and matches the repo version -------------------------
[ -f "$MANIFEST" ] || fail "manifest missing at $MANIFEST"

python3 - "$MANIFEST" <<'PY'
import json
import sys
from pathlib import Path

manifest_path = Path(sys.argv[1])
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
repo_root = manifest_path.parents[1]

if manifest.get("name") != "superpowers":
    raise AssertionError(f"plugin name: expected 'superpowers', got {manifest.get('name')!r}")

package = json.loads((repo_root / "package.json").read_text(encoding="utf-8"))
if manifest.get("version") != package.get("version"):
    raise AssertionError(
        f"manifest version {manifest.get('version')!r} != package.json version {package.get('version')!r}"
    )

# Devin CLI plugins carry skills only (auto-discovered from ./skills/); the
# manifest supports metadata + dependency lists, nothing executable.
unsupported = ["skills", "hooks", "commands", "sessionStart", "contextFileName", "inject"]
present = sorted(field for field in unsupported if field in manifest)
if present:
    raise AssertionError("unsupported Devin manifest fields present: " + ", ".join(present))

version_config = json.loads((repo_root / ".version-bump.json").read_text(encoding="utf-8"))
entries = version_config.get("files")
if not isinstance(entries, list) or not any(
    entry.get("path") == ".devin-plugin/plugin.json" and entry.get("field") == "version"
    for entry in entries
    if isinstance(entry, dict)
):
    raise AssertionError(".version-bump.json must update .devin-plugin/plugin.json version")

print("Devin plugin manifest looks good")
PY

# --- Mapping exists ----------------------------------------------------------
[ -f "$MAPPING" ] || fail "tool mapping missing at $MAPPING"

# --- Core action→tool mappings are documented --------------------------------
for tool in skill run_subagent todo_write ask_user_question; do
  grep -q "$tool" "$MAPPING" \
    || fail "mapping does not document the '$tool' tool"
done

# --- Subagents use the built-in profiles --------------------------------------
grep -q 'subagent_general' "$MAPPING" \
  || fail "mapping does not document the 'subagent_general' profile"
grep -q 'subagent_explore' "$MAPPING" \
  || fail "mapping does not document the 'subagent_explore' profile"

# --- SKILL.md Platform Adaptation links the mapping ---------------------------
grep -q "devin-tools.md" "$SKILL" \
  || fail "SKILL.md Platform Adaptation does not reference devin-tools.md"

echo "PASS: Devin CLI plugin valid (manifest, tool mapping, SKILL.md link)"
