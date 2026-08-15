#!/usr/bin/env bash
# Validate the DeepSeek Harness (dsh) integration. `dsh` reads the
# `.dsh-plugin/plugin.json` manifest alongside the shipped
# `dsh-skill-filesystem` provider's `customSkillDirs` config, and
# superpowers' existing `skills/<name>/SKILL.md` files are
# one-level-deep and kebab-case — the discovery shape is the same
# as the harness's other 14 bundled skills, so no skill rewrite
# is required. This test validates the manifest and the
# discovery-shape contract; it does not require `dsh` to be
# installed on the test host.
#
# Mirrors `tests/devin/test-devin-plugin.sh` and
# `tests/kimi/test-plugin-manifest.sh`. CI-safe.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

MANIFEST="$REPO_ROOT/.dsh-plugin/plugin.json"

fail() { echo "FAIL: $*" >&2; exit 1; }

echo "test-dsh-plugin: checking DeepSeek Harness manifest"

# --- Manifest is present and well-formed ------------------------------------
[ -f "$MANIFEST" ] || fail "manifest missing at $MANIFEST"

python3 - "$MANIFEST" "$REPO_ROOT" <<'PY'
import json
import re
import sys
from pathlib import Path

manifest_path = Path(sys.argv[1])
repo_root = Path(sys.argv[2])

manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

# --- Identity -------------------------------------------------------------
if manifest.get("name") != "superpowers":
    raise AssertionError(f"plugin name: expected 'superpowers', got {manifest.get('name')!r}")

package = json.loads((repo_root / "package.json").read_text(encoding="utf-8"))
if manifest.get("version") != package.get("version"):
    raise AssertionError(
        f"manifest version {manifest.get('version')!r} != package.json version {package.get('version')!r}"
    )

# --- Skills discovery -----------------------------------------------------
# The dsh harness's `skill-filesystem` provider reads
# `<root>/<name>/SKILL.md` one-level deep; superpowers' layout already
# matches. The manifest's `skills` field is the discovery root; the
# provider walks it.
skills_root = manifest.get("skills")
if skills_root is None:
    raise AssertionError("manifest is missing the 'skills' field (dsh's skill-filesystem provider needs it)")
skills_path = (repo_root / skills_root).resolve()
if not skills_path.is_dir():
    raise AssertionError(f"manifest 'skills' field points at a non-directory: {skills_path}")

# --- Every SKILL.md is kebab-case + has the dsh-required frontmatter ----
# dsh's regex is /(^|\s)\/([a-z0-9]+(?:-[a-z0-9]+)*)(?=\s|$)/g; the
# skill name in frontmatter must match. A typo drops the whole skill
# with a warning, so we enforce it here.
kebab_name = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
for skill_md in sorted(skills_path.glob("*/SKILL.md")):
    text = skill_md.read_text(encoding="utf-8")
    # crude frontmatter extraction
    if not text.startswith("---"):
        raise AssertionError(f"{skill_md} is missing YAML frontmatter")
    end = text.find("\n---", 3)
    if end == -1:
        raise AssertionError(f"{skill_md} has unterminated frontmatter")
    fm = text[3:end]
    name = None
    description = None
    for line in fm.splitlines():
        if line.startswith("name:"):
            name = line.split(":", 1)[1].strip()
        elif line.startswith("description:"):
            description = line.split(":", 1)[1].strip()
    if not name or not description:
        raise AssertionError(f"{skill_md} frontmatter is missing 'name' or 'description'")
    if not kebab_name.match(name):
        raise AssertionError(
            f"{skill_md} has non-kebab-case name {name!r} — would not match dsh's /<name> regex"
        )
    if len(description) > 500:
        # dsh's `tool-skill` truncates at 500 chars with '...', so this
        # is not a hard failure, but worth flagging.
        print(f"  note: {skill_md} description is {len(description)} chars (>500 dsh cap; will be truncated)")

# --- Manifest license + repo metadata -------------------------------------
if manifest.get("license") != "MIT":
    raise AssertionError(f"manifest license: expected 'MIT', got {manifest.get('license')!r}")
if "deepseek" not in (manifest.get("homepage") or "") and "deepseek" not in (
    manifest.get("description") or ""
).lower():
    raise AssertionError("manifest does not mention DeepSeek — does this belong in .dsh-plugin/?")

print("OK: .dsh-plugin/plugin.json validates, every SKILL.md is kebab-case and has the required frontmatter")
PY
