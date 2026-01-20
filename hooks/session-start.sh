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

# Version upgrade detection
upgrade_needed=""
upgrade_message=""

# First, check for version marker file
version_marker="$PWD/.horspowers-version"
needs_upgrade_check="false"

if [ ! -f "$version_marker" ]; then
    # No version marker - might be upgrading from pre-4.2.0
    needs_upgrade_check="true"
else
    # Version marker exists - check if version < 4.2.0
    marker_version=$(cat "$version_marker" 2>/dev/null || echo "0.0.0")
    # Use Node.js for proper version comparison
    needs_upgrade_check=$(node -e "
        const v1 = '$marker_version'.split('.').map(Number);
        const v2 = '4.2.0'.split('.').map(Number);
        let result = false;
        for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
            const p1 = v1[i] || 0;
            const p2 = v2[i] || 0;
            if (p1 < p2) { result = true; break; }
            if (p1 > p2) { result = false; break; }
        }
        console.log(result);
    " 2>/dev/null || echo "false")
fi

# Only check for old directories if upgrade is needed
if [ "$needs_upgrade_check" = "true" ]; then
    # Check for document-driven-ai-workflow directory (old version)
    ddaw_dir="$PWD/document-driven-ai-workflow"
    if [ -d "$ddaw_dir" ]; then
        upgrade_needed="true"
        upgrade_message="\n\n<upgrade-needed>⚠️ **检测到需要升级**: 发现旧版本的 document-driven-ai-workflow 目录。

**说明**: Horspowers 4.2.0+ 已将文档管理功能完全内置到插件中，不再需要单独安装 document-driven-ai-workflow 工具。

**操作建议**: 运行 /upgrade 命令来自动迁移并清理旧目录。

或者手动运行: ./bin/upgrade 或 node lib/version-upgrade.js</upgrade-needed>"
    fi

    # Check if there are old-style docs directories that need migration
    if [ -d "$PWD/.docs" ] || [ -d "$PWD/doc" ] || [ -d "$PWD/document" ]; then
        upgrade_needed="true"
        if [ -z "$upgrade_message" ]; then
            upgrade_message="\n\n<upgrade-needed>⚠️ **检测到需要升级**: 发现旧版本的文档目录结构。

**说明**: Horspowers 4.2.0+ 使用统一的 docs/ 目录结构。

**操作建议**: 运行 /upgrade 命令来自动迁移文档。

或者手动运行: ./bin/upgrade 或 node lib/version-upgrade.js</upgrade-needed>"
        fi
    fi
fi

# Detect configuration file status using config-manager.js
config_status_output=$(node -e "
const { detectConfigFiles, readConfig, checkConfigUpdate, validateConfig } = require('./lib/config-manager.js');
const detection = detectConfigFiles(process.cwd());

if (detection.hasOld) {
    console.log('status:needs-migration');
    console.log('old_path:' + detection.oldPath);
    console.log('new_path:' + detection.newPath);
} else if (detection.hasNew) {
    const config = readConfig(process.cwd());
    if (!config) {
        console.log('status:read-error');
    } else {
        const validation = validateConfig(config);
        if (!validation.valid) {
            console.log('status:invalid');
            console.log('errors:' + validation.errors.join('|'));
        } else {
            const check = checkConfigUpdate(config);
            if (check.needsUpdate) {
                console.log('status:needs-update');
                console.log('reason:' + check.reason);
            } else {
                console.log('status:valid');
            }
        }
        console.log('config:' + JSON.stringify(config));
    }
} else {
    console.log('status:needs-init');
}
" 2>&1)

# Parse config status output
config_status=""
config_detected_marker=""
config_output=""
config_migration_path=""
config_update_reason=""

# Parse the output line by line
while IFS= read -r line; do
    if [[ "$line" == status:* ]]; then
        config_status="${line#status:}"
    elif [[ "$line" == config:* ]]; then
        config_output="${line#config:}"
    elif [[ "$line" == old_path:* ]]; then
        config_migration_path="${line#old_path:}"
    elif [[ "$line" == reason:* ]]; then
        config_update_reason="${line#reason:}"
    fi
done <<< "$config_status_output"

# Set markers based on status
case "$config_status" in
    needs-init)
        config_detected_marker="<config-needs-init>true</config-needs-init>"
        ;;
    needs-migration)
        config_detected_marker="<config-needs-migration>true</config-needs-migration>"
        config_detected_marker+="<config-old-path>$config_migration_path</config-old-path>"
        ;;
    needs-update)
        config_detected_marker="<config-needs-update>true</config-needs-update>"
        config_detected_marker+="<config-update-reason>$config_update_reason</config-update-reason>"
        config_detected_marker="<config-exists>true</config-exists>"
        ;;
    invalid)
        config_detected_marker="<config-invalid>true</config-invalid>"
        config_detected_marker="<config-exists>true</config-exists>"
        ;;
    valid)
        config_detected_marker="<config-valid>true</config-valid>"
        config_detected_marker="<config-exists>true</config-exists>"
        ;;
    *)
        # Default: no config found
        config_detected_marker="<config-exists>false</config-exists>"
        ;;
esac

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
    try {
        const config = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
        // Check nested documentation.enabled property (can be boolean or string)
        if (config.documentation && (config.documentation.enabled === true || config.documentation.enabled === 'true')) {
            console.log('true');
        } else {
            console.log('false');
        }
    } catch (e) {
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

    # Check for last session metadata (should be in project's docs/ directory)
    metadata_dir="$PWD/docs/.docs-metadata"
    if [ -f "$metadata_dir/last-session.json" ]; then
        # Read and escape the JSON content
        last_session_content=$(cat "$metadata_dir/last-session.json" 2>/dev/null || echo "{}")
        escaped_session=$(escape_xml "$last_session_content")
        docs_context+="<last-session>$escaped_session</last-session>"

        # Extract taskDoc and bugDoc for environment setup
        # Paths are stored as relative paths, convert to absolute
        # Use [[:space:]] for portability (grep -E with \s not always available)
        task_doc_relative=$(echo "$last_session_content" | grep -o '"taskDoc"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "")
        bug_doc_relative=$(echo "$last_session_content" | grep -o '"bugDoc"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "")

        # Convert relative paths to absolute paths
        if [ -n "$task_doc_relative" ]; then
            task_doc_path="$PWD/$task_doc_relative"
            if [ -f "$task_doc_path" ]; then
                export TASK_DOC="$task_doc_path"
                docs_context+="<resumed-task-doc>$task_doc_path</resumed-task-doc>"
            fi
        fi

        if [ -n "$bug_doc_relative" ]; then
            bug_doc_path="$PWD/$bug_doc_relative"
            if [ -f "$bug_doc_path" ]; then
                export BUG_DOC="$bug_doc_path"
                docs_context+="<resumed-bug-doc>$bug_doc_path</resumed-bug-doc>"
            fi
        fi
    fi
else
    docs_context="<docs-detected>false</docs-detected>"
    docs_context+="<docs-enabled>false</docs-enabled>"
fi

# Read using-horspowers content
using_superpowers_content=$(cat "${PLUGIN_ROOT}/skills/using-horspowers/SKILL.md" 2>&1 || echo "Error reading using-horspowers skill")

# Build final JSON using Node.js to handle escaping correctly
# Use base64 encoding to safely pass all content without special character issues
using_superpowers_b64=$(printf '%s' "$using_superpowers_content" | base64)
warning_b64=$(printf '%s' "$warning_message" | base64)
upgrade_b64=$(printf '%s' "$upgrade_message" | base64)
config_marker_b64=$(printf '%s' "$config_detected_marker" | base64)
config_output_b64=$(printf '%s' "$config_output" | base64)

# Pass base64-encoded content via environment variables
USING_SUPERPOWERS_B64="$using_superpowers_b64" \
WARNING_B64="$warning_b64" \
UPGRADE_B64="$upgrade_b64" \
CONFIG_MARKER_B64="$config_marker_b64" \
CONFIG_OUTPUT_B64="$config_output_b64" \
DOCS_CONTEXT_B64=$(printf '%s' "$docs_context" | base64) \
node -e "
const Buffer = require('buffer').Buffer;

const usingSuperpowers = Buffer.from(process.env.USING_SUPERPOWERS_B64, 'base64').toString('utf8');
const warning = Buffer.from(process.env.WARNING_B64, 'base64').toString('utf8');
const upgrade = Buffer.from(process.env.UPGRADE_B64, 'base64').toString('utf8');
const configMarker = Buffer.from(process.env.CONFIG_MARKER_B64, 'base64').toString('utf8');
const configOutput = Buffer.from(process.env.CONFIG_OUTPUT_B64, 'base64').toString('utf8');
const docsContext = Buffer.from(process.env.DOCS_CONTEXT_B64, 'base64').toString('utf8');

// Build the additional context string
let context = '<EXTREMELY_IMPORTANT>\\nYou have horspowers.\\n\\n**Below is the full content of your \\'horspowers:using-horspowers\\' skill - your introduction to using skills. For all other skills, use the \\'Skill\\' tool:**\\n\\n' +
  usingSuperpowers + '\\n\\n' + configMarker;

// Embed config output if exists (already JSON, no double-escaping)
if (configOutput) {
  context += '\\n\\n<config-detected>当前项目配置：' + configOutput + '</config-detected>';
}

// Embed document system context
context += '\\n\\n' + docsContext;

// Embed upgrade message if needed
context += upgrade;

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
