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

# Detect configuration file in current working directory
config_message=""
config_detected_marker=""

# Try to find .superpowers-config.yaml
current_dir="$PWD"
while [ "$current_dir" != "/" ]; do
    if [ -f "$current_dir/.superpowers-config.yaml" ]; then
        # Config found, read it using Node.js
        if config_output=$(node -e "
        const fs = require('fs');
        const path = require('path');
        const configPath = path.join('$current_dir', '.superpowers-config.yaml');
        try {
            const content = fs.readFileSync(configPath, 'utf8');
            const lines = content.split('\\n');
            const config = {};
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    const match = trimmed.match(/^(\\w+):\\s*(.+)$/);
                    if (match) {
                        config[match[1]] = match[2];
                    }
                }
            }
            console.log(JSON.stringify(config));
        } catch (e) {
            console.error('Error:', e.message);
            process.exit(1);
        }
        " 2>&1); then
            # Check that config_output is not empty and is valid JSON
            if [ -n "$config_output" ]; then
                config_message="\n\n<config-detected>当前项目配置：$config_output</config-detected>"
                config_detected_marker="<config-exists>true</config-exists>"
            fi
        fi
        break
    fi
    # Move up one directory
    new_dir=$(dirname "$current_dir")
    if [ "$new_dir" = "$current_dir" ]; then
        break
    fi
    current_dir="$new_dir"
done

# If no config found, add marker for initial setup
if [ -z "$config_detected_marker" ]; then
    config_detected_marker="<config-exists>false</config-exists>"
fi

# Read using-superpowers content
using_superpowers_content=$(cat "${PLUGIN_ROOT}/skills/using-superpowers/SKILL.md" 2>&1 || echo "Error reading using-superpowers skill")

# Escape outputs for JSON using pure bash
escape_for_json() {
    local input="$1"
    local output=""
    local i char
    for (( i=0; i<${#input}; i++ )); do
        char="${input:$i:1}"
        case "$char" in
            $'\\') output+='\\\\' ;;  # Fixed: need \\ for valid JSON
            '"') output+='\"' ;;
            $'\n') output+='\n' ;;
            $'\r') output+='\r' ;;
            $'\t') output+='\t' ;;
            *) output+="$char" ;;
        esac
    done
    printf '%s' "$output"
}

using_superpowers_escaped=$(escape_for_json "$using_superpowers_content")
warning_escaped=$(escape_for_json "$warning_message")
config_escaped=$(escape_for_json "$config_message")
config_marker_escaped=$(escape_for_json "$config_detected_marker")

# Output context injection as JSON
cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "<EXTREMELY_IMPORTANT>\nYou have superpowers.\n\n**Below is the full content of your 'superpowers:using-superpowers' skill - your introduction to using skills. For all other skills, use the 'Skill' tool:**\n\n${using_superpowers_escaped}\n\n${config_marker_escaped}${config_escaped}${warning_escaped}\n</EXTREMELY_IMPORTANT>"
  }
}
EOF

exit 0
