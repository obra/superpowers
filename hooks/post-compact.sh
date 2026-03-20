#!/usr/bin/env bash
# PostCompact hook for hyperpowers plugin
# Re-injects critical workflow context after conversation compaction

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Escape outputs for JSON using pure bash
escape_for_json() {
    local input="$1"
    local output=""
    local i char
    for (( i=0; i<${#input}; i++ )); do
        char="${input:$i:1}"
        case "$char" in
            $'\\') output+='\\' ;;
            '"') output+='\"' ;;
            $'\n') output+='\n' ;;
            $'\r') output+='\r' ;;
            $'\t') output+='\t' ;;
            *) output+="$char" ;;
        esac
    done
    printf '%s' "$output"
}

# Check for active progress file (indicates mid-workflow execution)
progress_context=""
progress_file="docs/hyperpowers/current-progress.md"
if [ -f "$progress_file" ]; then
    progress_content=$(cat "$progress_file" 2>/dev/null || echo "")
    if [ -n "$progress_content" ]; then
        progress_escaped=$(escape_for_json "$progress_content")
        progress_context="\\n\\n**ACTIVE WORKFLOW IN PROGRESS — Resume from where you left off:**\\n\\n${progress_escaped}"
    fi
fi

# Read using-hyperpowers content for re-injection
using_hyperpowers_content=$(cat "${PLUGIN_ROOT}/skills/using-hyperpowers/SKILL.md" 2>&1 || echo "Error reading using-hyperpowers skill")
using_hyperpowers_escaped=$(escape_for_json "$using_hyperpowers_content")

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PostCompact",
    "additionalContext": "<EXTREMELY_IMPORTANT>\nContext was compacted. You have hyperpowers — always check skills before responding.\n\n${using_hyperpowers_escaped}${progress_context}\n</EXTREMELY_IMPORTANT>"
  }
}
EOF

exit 0
