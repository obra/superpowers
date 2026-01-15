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
config_detected_marker=""
config_output=""  # Initialize to empty string to avoid undefined variable

# Try to find .superpowers-config.yaml
current_dir="$PWD"
while [ "$current_dir" != "/" ]; do
    if [ -f "$current_dir/.superpowers-config.yaml" ]; then
        # Config found, read it using Node.js
        # SECURITY: Pass path via environment variable to prevent code injection
        if config_output=$(CONFIG_DIR="$current_dir" node -e "
        const fs = require('fs');
        const path = require('path');
        const configPath = path.join(process.env.CONFIG_DIR, '.superpowers-config.yaml');
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
                # Config found - set marker (config_output already contains JSON)
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

# Build final JSON using Node.js to handle escaping correctly
# Use base64 encoding to safely pass all content without special character issues
using_superpowers_b64=$(printf '%s' "$using_superpowers_content" | base64)
warning_b64=$(printf '%s' "$warning_message" | base64)
config_marker_b64=$(printf '%s' "$config_detected_marker" | base64)
config_output_b64=$(printf '%s' "$config_output" | base64)

# Pass base64-encoded content via environment variables
USING_SUPERPOWERS_B64="$using_superpowers_b64" \
WARNING_B64="$warning_b64" \
CONFIG_MARKER_B64="$config_marker_b64" \
CONFIG_OUTPUT_B64="$config_output_b64" \
node -e "
const Buffer = require('buffer').Buffer;

const usingSuperpowers = Buffer.from(process.env.USING_SUPERPOWERS_B64, 'base64').toString('utf8');
const warning = Buffer.from(process.env.WARNING_B64, 'base64').toString('utf8');
const configMarker = Buffer.from(process.env.CONFIG_MARKER_B64, 'base64').toString('utf8');
const configOutput = Buffer.from(process.env.CONFIG_OUTPUT_B64, 'base64').toString('utf8');

// Build the additional context string
let context = '<EXTREMELY_IMPORTANT>\\nYou have superpowers.\\n\\n**Below is the full content of your \\'superpowers:using-superpowers\\' skill - your introduction to using skills. For all other skills, use the \\'Skill\\' tool:**\\n\\n' +
  usingSuperpowers + '\\n\\n' + configMarker;

// Embed config output if exists (already JSON, no double-escaping)
if (configOutput) {
  context += '\\n\\n<config-detected>当前项目配置：' + configOutput + '</config-detected>';
}

context += warning + '\\n</EXTREMELY_IMPORTANT>';

const result = {
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: context
  }
};

console.log(JSON.stringify(result, null, 2));
"

exit 0
