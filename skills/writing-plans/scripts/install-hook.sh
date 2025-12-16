#!/bin/bash
# Install pre-commit hook for writing-plans enforcement

HOOK_CONTENT='#!/bin/bash
# Pre-commit hook: Validate implementation plan format

if git diff --cached --name-only | grep -qE "llm/implementation-plans/[^0-9][^/]*\.md$"; then
  echo "❌ ERROR: Implementation plan does not follow YYMMDD-XX format"
  echo ""
  echo "Files must be created via wrapper script:"
  echo "  python3 ~/.claude/skills/writing-plans/scripts/write_plan.py \\"
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
    echo "$HOOK_CONTENT" > "$hook_path"
    chmod +x "$hook_path"
    echo "✓ Installed hook: $hook_path"
  fi
done
