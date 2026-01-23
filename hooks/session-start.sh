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
    warning_message=$'\n\n<important-reminder>IN YOUR FIRST REPLY AFTER SEEING THIS MESSAGE YOU MUST TELL THE USER:⚠️ **WARNING:** Superpowers now uses the new skills system. Custom skills in ~/.config/superpowers/skills will not be read. Move custom skills to ~/.gemini/skills instead. To make this message go away, remove ~/.config/superpowers/skills</important-reminder>'
fi

# Run the bootstrap command
BOOTSTRAP_SCRIPT="${PLUGIN_ROOT}/.gemini/superpowers-gemini"
chmod +x "$BOOTSTRAP_SCRIPT"

# Capture output of bootstrap (which includes the skill list and instructions)
bootstrap_output=$("$BOOTSTRAP_SCRIPT" bootstrap)

# Combine warning (if any) with bootstrap output
full_output="${bootstrap_output}${warning_message}"

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

output_escaped=$(escape_for_json "$full_output")

# Output context injection as JSON
cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "${output_escaped}"
  }
}
EOF

exit 0
