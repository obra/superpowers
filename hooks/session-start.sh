#!/usr/bin/env bash
# SessionStart hook for horspowers plugin

set -euo pipefail

# Determine plugin root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Check if legacy skills directory exists and build warning
warning_message=""
legacy_skills_dir="${HOME}/.config/superpowers/skills"
if [ -d "$legacy_skills_dir" ]; then
    warning_message="\n\n<important-reminder>IN YOUR FIRST REPLY AFTER SEEING THIS MESSAGE YOU MUST TELL THE USER:⚠️ **WARNING:** Horspower (forked from superpowers) now uses Claude Code's skills system. Custom skills in ~/.config/superpowers/skills will not be read. Move custom skills to ~/.claude/skills instead. To make this message go away, remove ~/.config/superpowers/skills</important-reminder>"
fi

# Detect configuration file in current working directory
config_detected_marker=""
config_output=""  # Initialize to empty string to avoid undefined variable

# Try to find .horspowers-config.yaml or .superpowers-config.yaml (for backwards compatibility)
current_dir="$PWD"
while [ "$current_dir" != "/" ]; do
    config_file=""
    if [ -f "$current_dir/.horspowers-config.yaml" ]; then
        config_file="$current_dir/.horspowers-config.yaml"
    elif [ -f "$current_dir/.superpowers-config.yaml" ]; then
        config_file="$current_dir/.superpowers-config.yaml"
    fi

    if [ -n "$config_file" ]; then
        # Config found, read it using Node.js
        # SECURITY: Pass path via environment variable to prevent code injection
        if config_output=$(CONFIG_FILE="$config_file" node -e "
        const fs = require('fs');
        const path = require('path');
        const configPath = process.env.CONFIG_FILE;
        try {
            const content = fs.readFileSync(configPath, 'utf8');
            const lines = content.split('\\n');
            const config = {};
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    // Support keys with dots like \"documentation.enabled\"
                    const match = trimmed.match(/^([^:#=]+):\\s*(.+)$/);
                    if (match) {
                        const key = match[1];
                        const value = match[2];

                        // Handle nested keys (e.g., \"documentation.enabled\")
                        if (key.includes('.')) {
                            const parts = key.split('.');
                            let current = config;
                            for (let i = 0; i < parts.length - 1; i++) {
                                if (!current[parts[i]]) {
                                    current[parts[i]] = {};
                                }
                                current = current[parts[i]];
                            }
                            current[parts[parts.length - 1]] = value;
                        } else {
                            config[key] = value;
                        }
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

# Document system detection
docs_context=""

# Function to safely escape XML content
escape_xml() {
    local content="$1"
    # Replace special XML characters
    echo "$content" | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g; s/"/\&quot;/g; s/'"'"'/\&apos;/g'
}

# Check if documentation is enabled in config
docs_enabled="false"
if [ -n "$config_output" ]; then
    # Check if documentation.enabled is true using Node.js for proper JSON parsing
    docs_enabled=$(echo "$config_output" | node -e "
    const config = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
    // Check nested documentation.enabled property
    if (config.documentation && config.documentation.enabled === 'true') {
        console.log('true');
    } else {
        console.log('false');
    }
    " 2>/dev/null || echo "false")
fi

if [ "$docs_enabled" = "true" ]; then
    docs_context="<docs-detected>true</docs-detected>"
    docs_context+="<docs-enabled>true</docs-enabled>"

    # 检测多个文档目录并提示迁移
    doc_dirs_found=()
    for pattern in docs doc document .docs .doc documentation; do
        if [ -d "$PWD/$pattern" ]; then
            doc_dirs_found+=("$pattern")
        fi
    done

    # 如果发现多个文档目录，生成迁移提示
    if [ ${#doc_dirs_found[@]} -gt 1 ]; then
        docs_context+="<doc-migration-needed>true</doc-migration-needed>"
        docs_context+="<doc-directories>"
        for dir in "${doc_dirs_found[@]}"; do
            # 转义特殊字符用于 XML
            escaped_dir=$(escape_xml "$dir")
            docs_context+="<directory>$escaped_dir</directory>"
        done
        docs_context+="</doc-directories>"
    fi

    # Check for docs directory structure
    if [ -d "docs/" ]; then
        docs_context+="<docs-directory-exists>true</docs-directory-exists>"

        # Check for docs/active
        if [ -d "docs/active" ]; then
            active_count=$(find docs/active -name "*.md" -type f 2>/dev/null | wc -l | xargs)
            docs_context+="<active-docs-count>$active_count</active-docs-count>"

            # List recent active documents (top 5)
            if [ "$active_count" -gt 0 ]; then
                docs_context+="<recent-active-docs>"
                # Use temporary file to collect results, avoiding subshell variable loss
                tmp_file=$(mktemp)
                find docs/active -name "*.md" -type f 2>/dev/null | while read -r filepath; do
                    # Get modification time in seconds since epoch
                    mtime=$(stat -c %Y "$filepath" 2>/dev/null || stat -f %m "$filepath" 2>/dev/null || echo "0")
                    echo "$mtime $filepath"
                done | sort -rn | head -5 | cut -d' ' -f2- > "$tmp_file"

                # Now read from temp file and add to docs_context (in current shell)
                while IFS= read -r filepath; do
                    [ -n "$filepath" ] || continue
                    basename_only=$(basename "$filepath")
                    docs_context+="<doc>$basename_only</doc>"
                done < "$tmp_file"

                rm -f "$tmp_file"
                docs_context+="</recent-active-docs>"
            fi
        else
            docs_context+="<active-docs-count>0</active-docs-count>"
        fi

        # Check for docs/plans
        if [ -d "docs/plans" ]; then
            plans_count=$(find docs/plans -name "*.md" -type f 2>/dev/null | wc -l | xargs)
            docs_context+="<plans-docs-count>$plans_count</plans-docs-count>"
        fi

        # Check for docs/archive
        if [ -d "docs/archive" ]; then
            archive_count=$(find docs/archive -name "*.md" -type f 2>/dev/null | wc -l | xargs)
            docs_context+="<archived-docs-count>$archive_count</archived-docs-count>"
        fi
    else
        docs_context+="<docs-directory-exists>false</docs-directory-exists>"
        docs_context+="<active-docs-count>0</active-docs-count>"
    fi

    # Check for last session metadata
    metadata_dir="${PLUGIN_ROOT}/.docs-metadata"
    if [ -f "$metadata_dir/last-session.json" ]; then
        # Read and escape the JSON content
        last_session_content=$(cat "$metadata_dir/last-session.json" 2>/dev/null || echo "{}")
        escaped_session=$(escape_xml "$last_session_content")
        docs_context+="<last-session>$escaped_session</last-session>"

        # Extract taskDoc and bugDoc for environment setup
        # Use [[:space:]] for portability (grep -E with \s not always available)
        task_doc_path=$(echo "$last_session_content" | grep -o '"taskDoc"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "")
        bug_doc_path=$(echo "$last_session_content" | grep -o '"bugDoc"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "")

        # Set environment variables if files still exist
        if [ -n "$task_doc_path" ] && [ -f "$task_doc_path" ]; then
            export TASK_DOC="$task_doc_path"
            docs_context+="<resumed-task-doc>$task_doc_path</resumed-task-doc>"
        fi

        if [ -n "$bug_doc_path" ] && [ -f "$bug_doc_path" ]; then
            export BUG_DOC="$bug_doc_path"
            docs_context+="<resumed-bug-doc>$bug_doc_path</resumed-bug-doc>"
        fi
    fi
else
    docs_context="<docs-detected>false</docs-detected>"
    docs_context+="<docs-enabled>false</docs-enabled>"
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
DOCS_CONTEXT_B64=$(printf '%s' "$docs_context" | base64) \
node -e "
const Buffer = require('buffer').Buffer;

const usingSuperpowers = Buffer.from(process.env.USING_SUPERPOWERS_B64, 'base64').toString('utf8');
const warning = Buffer.from(process.env.WARNING_B64, 'base64').toString('utf8');
const configMarker = Buffer.from(process.env.CONFIG_MARKER_B64, 'base64').toString('utf8');
const configOutput = Buffer.from(process.env.CONFIG_OUTPUT_B64, 'base64').toString('utf8');
const docsContext = Buffer.from(process.env.DOCS_CONTEXT_B64, 'base64').toString('utf8');

// Build the additional context string
let context = '<EXTREMELY_IMPORTANT>\\nYou have horspowers.\\n\\n**Below is the full content of your \\'horspowers:using-superpowers\\' skill - your introduction to using skills. For all other skills, use the \\'Skill\\' tool:**\\n\\n' +
  usingSuperpowers + '\\n\\n' + configMarker;

// Embed config output if exists (already JSON, no double-escaping)
if (configOutput) {
  context += '\\n\\n<config-detected>当前项目配置：' + configOutput + '</config-detected>';
}

// Embed document system context
context += '\\n\\n' + docsContext;

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
