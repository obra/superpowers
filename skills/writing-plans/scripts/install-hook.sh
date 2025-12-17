#!/bin/bash
# Install pre-commit hook for writing-plans enforcement

HOOK_CONTENT='#!/bin/bash
# Pre-commit hook: Validate implementation plan format

# Validate YYMMDD-XX format (6 digits, dash, 2 digits)
if git diff --cached --name-only | grep -qE "llm/implementation-plans/[^/]*\.md$" | grep -qvE "(^|/)[0-9]{6}-[0-9]{2}[^/]*\.md$"; then
  echo "❌ ERROR: Implementation plan does not follow YYMMDD-XX format"
  echo ""
  echo "Files must be created via wrapper script:"
  echo "  python3 \"\${CLAUDE_SKILLS_DIR:-~/.claude/skills}/writing-plans/scripts/write_plan.py\" \\"
  echo "    --working-dir \$(pwd) \\"
  echo "    --plan-name <descriptive-name>"
  echo ""
  echo "Wrapper ensures:"
  echo "  - Correct YYMMDD-XX naming"
  echo "  - Frontmatter validation"
  echo "  - Automatic file-track registration"
  exit 1
fi
'

# Default search path (override with REPOS_DIR environment variable)
SEARCH_PATH="${REPOS_DIR:-$HOME/dev}"

# Find all repos with llm/implementation-plans/ directory
for repo in "$SEARCH_PATH"/*/; do
  if [ -d "$repo/llm/implementation-plans" ] && [ -d "$repo/.git" ]; then
    hook_path="$repo/.git/hooks/pre-commit"

    # Backup existing hook if present
    if [ -f "$hook_path" ]; then
      backup_path="${hook_path}.backup.$(date +%s)"
      if cp "$hook_path" "$backup_path" 2>/dev/null; then
        echo "⚠️  Backed up existing hook: $backup_path"
      else
        echo "❌ Failed to backup existing hook: $hook_path"
        continue
      fi
    fi

    # Install new hook with error handling
    if echo "$HOOK_CONTENT" > "$hook_path" 2>/dev/null && chmod +x "$hook_path" 2>/dev/null; then
      echo "✓ Installed hook: $hook_path"
    else
      echo "❌ Failed to install hook: $hook_path"
    fi
  fi
done
