#!/usr/bin/env bash
# SessionStart hook for superpowers plugin

set -euo pipefail

# Determine plugin root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Check if legacy skills directory exists and build warning
warning_message=""
legacy_skills_dir="${HOME}/.config/superpowers/skills"
if [ -d "$legacy_skills_dir" ]; then
    warning_message="\n\n<important-reminder>IN YOUR FIRST REPLY AFTER SEEING THIS MESSAGE YOU MUST TELL THE USER:⚠️ **WARNING:** Superpowers now uses Claude Code's skills system. Custom skills in ~/.config/superpowers/skills will not be read. Move custom skills to ~/.claude/skills instead. To make this message go away, remove ~/.config/superpowers/skills</important-reminder>"
fi

# Skill file path
using_superpowers_file="${PLUGIN_ROOT}/skills/using-superpowers/SKILL.md"

# Escape file content for JSON embedding
# Uses jq (fastest) > python3 (fallback) > sed (last resort)
# Performance: ~0.01s for jq vs ~0.24s for character-by-character loop
escape_file_for_json() {
    local file="$1"
    if command -v jq &>/dev/null; then
        # jq: fastest option, strips surrounding quotes
        jq -Rs '.' < "$file" | sed 's/^"//;s/"$//'
    elif command -v python3 &>/dev/null; then
        # Python fallback
        python3 -c "import json,sys; print(json.dumps(sys.stdin.read())[1:-1])" < "$file"
    else
        # sed fallback (no external deps)
        sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's/\t/\\t/g' < "$file" | awk '{printf "%s\\n", $0}' | sed 's/\\n$//'
    fi
}

# Escape string for JSON (for small strings like warning_message)
escape_string_for_json() {
    local input="$1"
    if [ -z "$input" ]; then
        printf ''
        return
    fi
    if command -v jq &>/dev/null; then
        printf '%s' "$input" | jq -Rs '.' | sed 's/^"//;s/"$//'
    elif command -v python3 &>/dev/null; then
        printf '%s' "$input" | python3 -c "import json,sys; print(json.dumps(sys.stdin.read())[1:-1])"
    else
        printf '%s' "$input" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's/\t/\\t/g' | awk '{printf "%s\\n", $0}' | sed 's/\\n$//'
    fi
}

using_superpowers_escaped=$(escape_file_for_json "$using_superpowers_file")
warning_escaped=$(escape_string_for_json "$warning_message")

# Output context injection as JSON
cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "<EXTREMELY_IMPORTANT>\nYou have superpowers.\n\n**Below is the full content of your 'superpowers:using-superpowers' skill - your introduction to using skills. For all other skills, use the 'Skill' tool:**\n\n${using_superpowers_escaped}\n\n${warning_escaped}\n</EXTREMELY_IMPORTANT>"
  }
}
EOF

exit 0
