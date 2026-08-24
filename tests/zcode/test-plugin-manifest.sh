#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MANIFEST="$REPO_ROOT/.zcode-plugin/plugin.json"
HOOKS_CONFIG="$REPO_ROOT/hooks/hooks-zcode.json"
SESSION_START="$REPO_ROOT/hooks/session-start"

python3 - "$MANIFEST" "$HOOKS_CONFIG" "$SESSION_START" "$REPO_ROOT/.version-bump.json" <<'PY'
import json
import sys
from pathlib import Path

manifest_path = Path(sys.argv[1])
hooks_config_path = Path(sys.argv[2])
session_start_path = Path(sys.argv[3])
version_bump_path = Path(sys.argv[4])

manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

def assert_equal(actual, expected, label):
    if actual != expected:
        raise AssertionError(f"{label}: expected {expected!r}, got {actual!r}")

assert_equal(manifest.get("name"), "superpowers", "plugin name")
assert_equal(manifest.get("skills"), "skills", "skills path")
assert_equal(
    manifest.get("hooks"), "./hooks/hooks-zcode.json", "declared hooks path"
)

# ZCode's plugin hook schema uses a top-level `events` key with strict
# parsing, so the shared Claude-format hooks/hooks.json cannot be reused.
hooks_config = json.loads(hooks_config_path.read_text(encoding="utf-8"))
events = hooks_config.get("events")
if not isinstance(events, dict) or "hooks" in hooks_config:
    raise AssertionError("hooks-zcode.json must use ZCode's top-level events schema")
entries = events.get("SessionStart")
if not isinstance(entries, list) or not entries:
    raise AssertionError("hooks-zcode.json missing SessionStart entry")
hook = entries[0].get("hooks", [])[0]
assert_equal(hook.get("type"), "command", "hook type")
assert_equal(hook.get("shell"), "bash", "hook shell")
assert_equal(hook.get("async"), False, "hook async")
command = hook.get("command", "")
if "${ZCODE_PLUGIN_ROOT}" not in command:
    raise AssertionError("hook command must reference ${ZCODE_PLUGIN_ROOT}")
if not command.endswith('run-hook.cmd" session-start'):
    raise AssertionError(f"unexpected hook command shape: {command}")

# The ZCode branch must precede the Claude Code branch: ZCode sets both
# ZCODE_PLUGIN_ROOT and CLAUDE_PLUGIN_ROOT (compat alias), and the Claude
# branch would otherwise shadow it.
script = session_start_path.read_text(encoding="utf-8")
zcode_pos = script.find('elif [ -n "${ZCODE_PLUGIN_ROOT:-}" ]')
claude_pos = script.find('elif [ -n "${CLAUDE_PLUGIN_ROOT:-}" ]')
if zcode_pos == -1 or claude_pos == -1:
    raise AssertionError("session-start is missing the ZCode branch")
if zcode_pos > claude_pos:
    raise AssertionError(
        "ZCode branch must run before the Claude Code branch "
        "(ZCode sets CLAUDE_PLUGIN_ROOT too)"
    )
for shape in ("hookEventName", "additionalContext"):
    segment = script[zcode_pos:claude_pos]
    if shape not in segment:
        raise AssertionError(f"ZCode branch must emit top-level {shape}")

version_config = json.loads(version_bump_path.read_text(encoding="utf-8"))
version_entries = version_config.get("files")
if not isinstance(version_entries, list):
    raise AssertionError(".version-bump.json must contain files list")
if not any(
    entry.get("path") == ".zcode-plugin/plugin.json" and entry.get("field") == "version"
    for entry in version_entries
    if isinstance(entry, dict)
):
    raise AssertionError(
        ".version-bump.json must update .zcode-plugin/plugin.json version"
    )

# Tool mapping: ZCode's surface is mostly Claude-compatible but dispatches
# subagents via `Agent` and has no dedicated Grep/Glob tools.
tools_mapping = (manifest_path.parents[1] / "skills/using-superpowers/references/zcode-tools.md").read_text(
    encoding="utf-8"
)
for token in ("ZCode Tool Mapping", "`Agent`", "`TodoWrite`", "`Skill`", "no dedicated Grep"):
    if token not in tools_mapping:
        raise AssertionError(f"zcode-tools.md missing expected content: {token!r}")

skill_md = (manifest_path.parents[1] / "skills/using-superpowers/SKILL.md").read_text(
    encoding="utf-8"
)
if "- ZCode: `references/zcode-tools.md`" not in skill_md:
    raise AssertionError(
        "SKILL.md Platform Adaptation list must point at references/zcode-tools.md"
    )

print("ZCode plugin manifest looks good")
PY
