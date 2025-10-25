#!/usr/bin/env bash
# Check Anthropic documentation for Claude Code best practices updates

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CACHE_DIR="${REPO_ROOT}/.sync-cache/docs"
REPORT_FILE="${REPO_ROOT}/sync-report.md"

# Create cache directory
mkdir -p "$CACHE_DIR"

echo "=== Checking Anthropic Documentation for Updates ==="
echo ""

# Documentation URLs to monitor
DOCS_URLS=(
  "https://docs.claude.com/en/docs/claude-code/skills"
  "https://docs.claude.com/en/docs/claude-code/claude_code_docs_map.md"
)

# Track if any updates found
updates_found=false

for url in "${DOCS_URLS[@]}"; do
  filename=$(echo "$url" | sed 's/[^a-zA-Z0-9]/_/g')
  cache_file="${CACHE_DIR}/${filename}.html"

  echo "Checking: $url"

  # Fetch current content
  if curl -s -f "$url" -o "${cache_file}.new" 2>/dev/null; then
    if [ -f "$cache_file" ]; then
      # Compare with cached version
      if ! diff -q "$cache_file" "${cache_file}.new" > /dev/null 2>&1; then
        echo "  ✓ Updates detected!"
        updates_found=true

        # Append to report
        cat >> "$REPORT_FILE" <<EOF

## Documentation Update: $(basename "$url")

**URL:** $url
**Status:** Changed since last check
**Action Required:** Review changes and update skills accordingly

EOF
      else
        echo "  - No changes"
        rm "${cache_file}.new"
      fi
    else
      echo "  - First check, caching for future comparison"
      mv "${cache_file}.new" "$cache_file"
    fi
  else
    echo "  ⚠ Failed to fetch (network issue or URL changed)"
  fi

  echo ""
done

if [ "$updates_found" = true ]; then
  echo "📋 Updates found! Check $REPORT_FILE for details"
  exit 1
else
  echo "✓ All documentation up to date"
  exit 0
fi
