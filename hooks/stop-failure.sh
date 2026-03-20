#!/usr/bin/env bash
# StopFailure hook for hyperpowers plugin
# Saves progress state and provides recovery guidance when API errors interrupt workflows

set -euo pipefail

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

# Check for active progress file
recovery_context=""
progress_file="docs/hyperpowers/current-progress.md"
if [ -f "$progress_file" ]; then
    progress_content=$(cat "$progress_file" 2>/dev/null || echo "")
    if [ -n "$progress_content" ]; then
        progress_escaped=$(escape_for_json "$progress_content")
        recovery_context="\\n\\nWorkflow was in progress when the failure occurred. Progress state:\\n${progress_escaped}\\n\\nTo resume: use /hyperpowers:execute-plan and select the same execution approach. Progress will be detected automatically."
    fi
fi

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "StopFailure",
    "additionalContext": "Hyperpowers: API failure interrupted the session.${recovery_context}"
  }
}
EOF

exit 0
