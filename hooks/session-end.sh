#!/usr/bin/env bash
# SessionEnd hook for horspowers plugin

set -euo pipefail

# Determine plugin root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Track session end time
SESSION_END_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Get current working directory
WORKING_DIR="$PWD"

# Get current git branch if in a git repo
CURRENT_BRANCH=""
if git rev-parse --git-dir > /dev/null 2>&1; then
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "detached")
fi

# Check if docs-core.js exists and is usable
DOCS_CORE="${PLUGIN_ROOT}/lib/docs-core.js"

# Function to check if documentation is enabled
is_docs_enabled() {
    # Check for config file in current directory or parent directories
    local current_dir="$WORKING_DIR"
    while [ "$current_dir" != "/" ]; do
        local config_file=""
        if [ -f "$current_dir/.horspowers-config.yaml" ]; then
            config_file="$current_dir/.horspowers-config.yaml"
        elif [ -f "$current_dir/.superpowers-config.yaml" ]; then
            config_file="$current_dir/.superpowers-config.yaml"
        fi

        if [ -n "$config_file" ]; then
            # Parse config and check documentation.enabled using Node.js
            local result=$(CONFIG_FILE="$config_file" node -e "
            const fs = require('fs');
            const configPath = process.env.CONFIG_FILE;
            try {
                const content = fs.readFileSync(configPath, 'utf8');
                const lines = content.split('\\n');
                const config = {};
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed && !trimmed.startsWith('#')) {
                        const match = trimmed.match(/^([^:#=]+):\\s*(.+)$/);
                        if (match) {
                            const key = match[1];
                            const value = match[2];

                            // Handle nested keys
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

                // Check if documentation.enabled is true
                if (config.documentation && config.documentation.enabled === 'true') {
                    console.log('true');
                } else {
                    console.log('false');
                }
            } catch (e) {
                console.log('false');
            }
            " 2>/dev/null)

            if [ "$result" = "true" ]; then
                return 0
            fi
        fi

        current_dir=$(dirname "$current_dir")
        if [ "$current_dir" = "$(dirname "$current_dir")" ]; then
            break
        fi
    done
    return 1
}

# Function to update active document with session progress
update_active_document() {
    local doc_path="$1"
    local session_end="$2"

    if [ -f "$doc_path" ]; then
        # Append session end information
        {
            echo ""
            echo "## 会话记录"
            echo "- **会话结束时间**: $session_end"
            echo "- **工作目录**: $WORKING_DIR"
            if [ -n "$CURRENT_BRANCH" ]; then
                echo "- **Git 分支**: $CURRENT_BRANCH"
            fi
            echo "- **会话状态**: 正常结束"
        } >> "$doc_path"
    fi
}

# Function to save session metadata
save_session_metadata() {
    local metadata_dir="$1"
    local session_id="${2:-unknown}"

    mkdir -p "$metadata_dir"

    # Use Node.js to write JSON safely
    node -e "
    const fs = require('fs');
    const metadata = {
      sessionId: '$session_id',
      endTime: '$SESSION_END_TIME',
      workingDirectory: '$WORKING_DIR',
      gitBranch: '$CURRENT_BRANCH',
      taskDoc: process.env.TASK_DOC || '',
      bugDoc: process.env.BUG_DOC || ''
    };

    fs.writeFileSync(
      '${metadata_dir}/last-session.json',
      JSON.stringify(metadata, null, 2)
    );
    " 2>/dev/null || true
}

# Function to archive completed documents automatically
auto_archive_completed() {
    local docs_core="$1"

    if [ ! -f "$docs_core" ]; then
        return
    fi

    # Check if there's a project-specific docs directory
    local project_docs_dir=""
    local current_dir="$WORKING_DIR"
    while [ "$current_dir" != "/" ]; do
        if [ -d "$current_dir/docs/active" ]; then
            project_docs_dir="$current_dir/docs/active"
            break
        fi
        current_dir=$(dirname "$current_dir")
        if [ "$current_dir" = "$(dirname "$current_dir")" ]; then
            break
        fi
    done

    if [ -z "$project_docs_dir" ]; then
        return
    fi

    # Find documents marked as completed but not yet archived
    # (documents with status:已完成 or status:已关闭)
    find "$project_docs_dir" -name "*.md" -type f 2>/dev/null | while read -r doc_file; do
        if grep -q "状态:已完成\|status:已完成\|状态:已关闭\|status:已关闭" "$doc_file" 2>/dev/null; then
            # Check if document is not already in archive
            if [[ ! "$doc_file" =~ /archive/ ]]; then
                # Use docs-core.js to archive
                node "$docs_core" archive "$doc_file" 2>/dev/null || true
            fi
        fi
    done
}

# Main execution

# Initialize result
result='{"hookSpecificOutput":{"hookEventName":"SessionEnd","additionalContext":"'

# Check if documentation is enabled
if is_docs_enabled; then
    # Save session metadata
    METADATA_DIR="${PLUGIN_ROOT}/.docs-metadata"
    SESSION_ID="${CLAUDE_SESSION_ID:-unknown}"

    save_session_metadata "$METADATA_DIR" "$SESSION_ID"

    # Update active documents if environment variables are set
    if [ -n "${TASK_DOC:-}" ] && [ -f "$TASK_DOC" ]; then
        update_active_document "$TASK_DOC" "$SESSION_END_TIME"
    fi

    if [ -n "${BUG_DOC:-}" ] && [ -f "$BUG_DOC" ]; then
        update_active_document "$BUG_DOC" "$SESSION_END_TIME"
    fi

    # Auto-archive completed documents
    if [ -f "$DOCS_CORE" ]; then
        auto_archive_completed "$DOCS_CORE"
    fi

    result+="Session ended at $SESSION_END_TIME (documentation tracked)"
else
    result+="Session ended at $SESSION_END_TIME"
fi

result+='"}}'

# Output result as JSON
echo "$result"

exit 0
