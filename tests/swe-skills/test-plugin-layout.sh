#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PLUGIN_ROOT="$REPO_ROOT/plugins/swe-skills"
CORE_VERSION_FILE="$REPO_ROOT/.codex-plugin/plugin.json"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

[[ -d "$PLUGIN_ROOT" ]] || fail "missing companion plugin directory: $PLUGIN_ROOT"
[[ -d "$PLUGIN_ROOT/skills" ]] || fail "missing companion skills directory"

expected_skills=(
  behavior-guidelines
  code-review
  design-an-interface
  managing-skill-library
  self-evolved
)

actual_skills="$(find "$PLUGIN_ROOT/skills" -mindepth 1 -maxdepth 1 -type d -print | sed 's#.*/##' | LC_ALL=C sort)"
expected_skills_text="$(printf '%s\n' "${expected_skills[@]}" | LC_ALL=C sort)"
[[ "$actual_skills" == "$expected_skills_text" ]] || {
  printf 'FAIL: companion skill directories differ\nexpected:\n%s\nactual:\n%s\n' "$expected_skills_text" "$actual_skills" >&2
  exit 1
}

for skill in "${expected_skills[@]}"; do
  [[ ! -e "$REPO_ROOT/skills/$skill" ]] || fail "moved skill remains in core: skills/$skill"
  [[ -f "$PLUGIN_ROOT/skills/$skill/SKILL.md" ]] || fail "missing companion skill: $skill/SKILL.md"
done

for reference in solid-checklist.md object-design.md code-quality-checklist.md; do
  [[ -f "$PLUGIN_ROOT/skills/code-review/references/$reference" ]] ||
    fail "missing code-review reference: $reference"
done

[[ ! -e "$PLUGIN_ROOT/skills/using-superpowers" ]] || fail "companion plugin contains core bootstrap skill"
[[ ! -e "$PLUGIN_ROOT/hooks" ]] || fail "companion plugin contains core hooks"
[[ ! -e "$PLUGIN_ROOT/.pi/extensions" ]] || fail "companion plugin contains a Pi bootstrap extension"
[[ ! -e "$PLUGIN_ROOT/.opencode/plugins/superpowers.js" ]] || fail "companion plugin contains core OpenCode bootstrap"

python3 - "$REPO_ROOT" "$PLUGIN_ROOT" "$CORE_VERSION_FILE" <<'PY'
import json
import sys
from pathlib import Path

repo_root = Path(sys.argv[1])
plugin_root = Path(sys.argv[2])
core_manifest = json.loads(Path(sys.argv[3]).read_text(encoding="utf-8"))
core_version = core_manifest["version"]

manifest_paths = [
    plugin_root / ".claude-plugin/plugin.json",
    plugin_root / ".codex-plugin/plugin.json",
    plugin_root / ".cursor-plugin/plugin.json",
    plugin_root / ".kimi-plugin/plugin.json",
    plugin_root / "gemini-extension.json",
]

for path in manifest_paths:
    if not path.exists():
        raise AssertionError(f"missing companion manifest: {path.relative_to(repo_root)}")
    manifest = json.loads(path.read_text(encoding="utf-8"))
    if manifest.get("name") != "swe-skills":
        raise AssertionError(f"{path}: expected name swe-skills")
    if manifest.get("version") != core_version:
        raise AssertionError(f"{path}: expected version {core_version!r}, got {manifest.get('version')!r}")
    if "skills" in manifest and manifest["skills"] != "./skills/":
        raise AssertionError(f"{path}: expected skills path ./skills/")

codex = json.loads((plugin_root / ".codex-plugin/plugin.json").read_text(encoding="utf-8"))
if codex.get("hooks") != {}:
    raise AssertionError("companion Codex manifest must declare hooks: {}")

kimi = json.loads((plugin_root / ".kimi-plugin/plugin.json").read_text(encoding="utf-8"))
for field in ("sessionStart", "skillInstructions"):
    if field in kimi:
        raise AssertionError(f"companion Kimi manifest must not declare {field}")

package = json.loads((plugin_root / "package.json").read_text(encoding="utf-8"))
if package.get("name") != "swe-skills":
    raise AssertionError("companion package must be named swe-skills")
if package.get("version") != core_version:
    raise AssertionError("companion package version must match core version")
if package.get("main") != ".opencode/plugins/swe-skills.js":
    raise AssertionError("companion package must expose its OpenCode entry point")
if package.get("pi", {}).get("skills") != ["./skills"]:
    raise AssertionError("companion package must expose ./skills to Pi")
PY

echo "PASS: swe-skills ownership and manifest layout"
