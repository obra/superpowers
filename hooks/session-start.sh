#!/usr/bin/env bash
# SessionStart hook for superpowers plugin

set -euo pipefail

# Determine plugin root directory with path validation
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Validate that PLUGIN_ROOT is an actual directory
if [ ! -d "$PLUGIN_ROOT" ]; then
    echo '{"error": "Plugin root directory does not exist"}' >&2
    exit 1
fi

# Resolve to canonical path to prevent symlink attacks
if command -v realpath >/dev/null 2>&1; then
    PLUGIN_ROOT="$(realpath "$PLUGIN_ROOT")"
elif command -v readlink >/dev/null 2>&1; then
    PLUGIN_ROOT="$(readlink -f "$PLUGIN_ROOT" 2>/dev/null || echo "$PLUGIN_ROOT")"
fi

# Check if legacy skills directory exists and build warning
warning_message=""
legacy_skills_dir="${HOME}/.config/superpowers/skills"
if [ -d "$legacy_skills_dir" ]; then
    warning_message="\n\n<important-reminder>IN YOUR FIRST REPLY AFTER SEEING THIS MESSAGE YOU MUST TELL THE USER:⚠️ **WARNING:** Superpowers now uses Claude Code's skills system. Custom skills in ~/.config/superpowers/skills will not be read. Move custom skills to ~/.claude/skills instead. To make this message go away, remove ~/.config/superpowers/skills</important-reminder>"
fi

# Read using-superpowers content
if ! using_superpowers_content=$(cat "${PLUGIN_ROOT}/skills/using-superpowers/SKILL.md" 2>/dev/null); then
    echo '{"error": "Failed to read using-superpowers skill"}' >&2
    exit 1
fi

# Escape content for JSON using jq (proper JSON encoding)
# If jq is not available, fail safely
if ! command -v jq >/dev/null 2>&1; then
    echo '{"error": "jq is required for secure JSON encoding. Please install jq."}' >&2
    exit 1
fi

# Build the additional context message
additional_context="<EXTREMELY_IMPORTANT>
You have superpowers.

**Below is the full content of your 'superpowers:using-superpowers' skill - your introduction to using skills. For all other skills, use the 'Skill' tool:**

${using_superpowers_content}

${warning_message}
</EXTREMELY_IMPORTANT>"

# Output context injection as JSON using jq for safe encoding
jq -n \
    --arg context "$additional_context" \
    '{
        hookSpecificOutput: {
            hookEventName: "SessionStart",
            additionalContext: $context
        }
    }'

exit 0
