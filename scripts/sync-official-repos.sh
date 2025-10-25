#!/usr/bin/env bash
# Monitor official skill repositories for updates

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CACHE_DIR="${REPO_ROOT}/.sync-cache/repos"
REPORT_FILE="${REPO_ROOT}/sync-report.md"

# Create cache directory
mkdir -p "$CACHE_DIR"

echo "=== Checking Official Repositories for Updates ==="
echo ""

# Repositories to monitor
REPOS=(
  "anthropics/skills"
  "obra/superpowers"
)

# Track if any updates found
updates_found=false

for repo in "${REPOS[@]}"; do
  echo "Checking: $repo"

  cache_file="${CACHE_DIR}/${repo//\//_}_commits.json"

  # Fetch latest commits via GitHub API
  api_url="https://api.github.com/repos/${repo}/commits?per_page=10"

  if curl -s -f "$api_url" -o "${cache_file}.new" 2>/dev/null; then
    if [ -f "$cache_file" ]; then
      # Get latest commit SHA from cache
      cached_sha=$(jq -r '.[0].sha' "$cache_file" 2>/dev/null || echo "")
      current_sha=$(jq -r '.[0].sha' "${cache_file}.new" 2>/dev/null || echo "")

      if [ -n "$cached_sha" ] && [ -n "$current_sha" ] && [ "$cached_sha" != "$current_sha" ]; then
        echo "  ✓ New commits detected!"
        updates_found=true

        # Get commit messages
        commits=$(jq -r '.[] | "- \(.commit.message | split("\n")[0]) (by \(.commit.author.name))"' "${cache_file}.new" | head -5)

        # Append to report
        cat >> "$REPORT_FILE" <<EOF

## Repository Update: $repo

**Status:** New commits since last check
**Recent commits:**
$commits

**Action Required:** Review new commits at https://github.com/$repo/commits

EOF

        # Update cache
        mv "${cache_file}.new" "$cache_file"
      else
        echo "  - No new commits"
        rm -f "${cache_file}.new"
      fi
    else
      echo "  - First check, caching for future comparison"
      mv "${cache_file}.new" "$cache_file"
    fi
  else
    echo "  ⚠ Failed to fetch (network issue or rate limit)"
  fi

  echo ""
done

if [ "$updates_found" = true ]; then
  echo "📋 Updates found! Check $REPORT_FILE for details"
  exit 1
else
  echo "✓ All repositories up to date"
  exit 0
fi
