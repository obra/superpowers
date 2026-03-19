#!/usr/bin/env bash
# verify-install.sh — Check that all superpowers skills were downloaded correctly
#
# Usage:
#   bash verify-install.sh [plugin-root]
#
# If plugin-root is omitted, searches common Claude Code plugin cache paths.
# Exit code 0 = all skills present, 1 = missing skills detected.

set -euo pipefail

# All skills that ship with superpowers (update this list when adding new skills)
EXPECTED_SKILLS=(
  brainstorming
  dispatching-parallel-agents
  executing-plans
  finishing-a-development-branch
  receiving-code-review
  requesting-code-review
  subagent-driven-development
  systematic-debugging
  test-driven-development
  using-git-worktrees
  using-superpowers
  verification-before-completion
  writing-plans
  writing-skills
)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

find_plugin_root() {
  local search_dirs=(
    "$HOME/.claude/plugins/cache/claude-plugins-official/superpowers"
    "$HOME/.claude/plugins/cache/superpowers-marketplace/superpowers"
  )

  for base in "${search_dirs[@]}"; do
    if [ -d "$base" ]; then
      # Find the highest version directory
      local latest
      latest=$(ls -1 "$base" 2>/dev/null | sort -V | tail -1)
      if [ -n "$latest" ] && [ -d "$base/$latest/skills" ]; then
        echo "$base/$latest"
        return 0
      fi
    fi
  done
  return 1
}

main() {
  local plugin_root="${1:-}"

  if [ -z "$plugin_root" ]; then
    plugin_root=$(find_plugin_root) || {
      echo -e "${RED}ERROR: Could not find superpowers plugin cache.${NC}"
      echo "Usage: bash verify-install.sh /path/to/superpowers/plugin"
      exit 1
    }
    echo "Found plugin at: $plugin_root"
  fi

  local skills_dir="$plugin_root/skills"

  if [ ! -d "$skills_dir" ]; then
    echo -e "${RED}ERROR: skills/ directory not found at $skills_dir${NC}"
    exit 1
  fi

  local missing=()
  local present=0

  for skill in "${EXPECTED_SKILLS[@]}"; do
    if [ -f "$skills_dir/$skill/SKILL.md" ]; then
      present=$((present + 1))
    else
      missing+=("$skill")
    fi
  done

  local total=${#EXPECTED_SKILLS[@]}
  echo ""
  echo "Superpowers skill verification: $present/$total skills present"
  echo ""

  if [ ${#missing[@]} -eq 0 ]; then
    echo -e "${GREEN}All skills installed correctly.${NC}"
    exit 0
  fi

  echo -e "${RED}Missing skills (${#missing[@]}):${NC}"
  for skill in "${missing[@]}"; do
    echo -e "  ${RED}✗${NC} $skill"
  done

  echo ""
  echo -e "${YELLOW}This is a known issue with Claude Code's plugin download mechanism.${NC}"
  echo "The fix needs to come from Claude Code itself."
  echo "See: https://github.com/anthropics/claude-code/issues/35989"

  exit 1
}

main "$@"
