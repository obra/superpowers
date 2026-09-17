#!/usr/bin/env bash
# Validate the IBM Bob plugin manifest.
# Bob has no plugin-install CLI, so the manifest is a metadata-only file
# used for version tracking. This test checks it is well-formed, matches
# the repo version, and is registered in .version-bump.json.
#
# CI-safe: does not require Bob to be installed.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

MANIFEST="$REPO_ROOT/.bob-plugin/plugin.json"

fail() { echo "FAIL: $*" >&2; exit 1; }

echo "test-bob-plugin-manifest: checking IBM Bob plugin manifest"

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

for field in ("description", "license"):
    if not manifest.get(field):
        raise AssertionError(f"manifest missing required field: {field!r}")

# Bob manifests are metadata-only — these executable fields are not supported
unsupported = ["skills", "hooks", "commands", "sessionStart", "contextFileName", "inject"]
present = sorted(field for field in unsupported if field in manifest)
if present:
    raise AssertionError("unsupported Bob manifest fields present: " + ", ".join(present))

version_config = json.loads((repo_root / ".version-bump.json").read_text(encoding="utf-8"))
entries = version_config.get("files", [])
if not any(
    isinstance(e, dict)
    and e.get("path") == ".bob-plugin/plugin.json"
    and e.get("field") == "version"
    for e in entries
):
    raise AssertionError(".version-bump.json must update .bob-plugin/plugin.json version")

print("Bob plugin manifest looks good")
PY

echo "PASS: IBM Bob plugin manifest valid"
