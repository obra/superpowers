#!/usr/bin/env bash
# sspower wiki-archive — PreCompact/SessionEnd hook.
# Delegates to wiki-archive.py which writes per-project session summaries.

set -euo pipefail

# CLAUDE_PLUGIN_ROOT is set by the Claude Code harness for plugin hooks.
# Fallback to script-relative path so this still works if invoked manually.
SCRIPT_DIR="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

exec python3 "${SCRIPT_DIR}/hooks/wiki-archive.py"
