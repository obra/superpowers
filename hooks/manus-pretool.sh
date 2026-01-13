#!/usr/bin/env bash
# PreToolUse hook for manus-planning skill
# Only outputs reminder if manus-planning is active (marker file exists)

set -euo pipefail

# Get the working directory (where the user's project is)
# The hook runs from the plugin directory, so we need to find the actual working directory
WORKING_DIR="${PWD}"

MARKER_FILE="${WORKING_DIR}/docs/manus/.active"
PLAN_FILE="${WORKING_DIR}/docs/manus/task_plan.md"

# Check if manus-planning is active
if [ ! -f "$MARKER_FILE" ] || [ ! -f "$PLAN_FILE" ]; then
    # Not active - output empty JSON, hook passes silently
    echo '{}'
    exit 0
fi

# Manus planning is active - read and output plan preview

# Escape content for JSON using pure bash
escape_for_json() {
    local input="$1"
    local output=""
    local i char
    for (( i=0; i<${#input}; i++ )); do
        char="${input:$i:1}"
        case "$char" in
            $'\\') output+='\\';;
            '"') output+='\"';;
            $'\n') output+='\n';;
            $'\r') output+='\r';;
            $'\t') output+='\t';;
            *) output+="$char";;
        esac
    done
    printf '%s' "$output"
}

# Read first 30 lines of task_plan.md
plan_preview=$(head -30 "$PLAN_FILE" 2>/dev/null || echo "Error reading plan file")
plan_escaped=$(escape_for_json "$plan_preview")

# Output as additionalContext
cat <<EOF
{
  "hookSpecificOutput": {
    "additionalContext": "**[Manus Planning Reminder]** Review your plan before this action:\\n\\n${plan_escaped}\\n\\n---"
  }
}
EOF

exit 0
