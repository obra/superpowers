#!/usr/bin/env bash
set -euo pipefail

active_paths=(
  AGENTS.md
  README.md
  .codex/INSTALL.md
  docs/README.codex.md
  docs/testing.md
  skills
  agents
  .github
  package.json
  tests
  scripts
)

rg -n \
  -g '!tests/codex/test-forbidden-terms.sh' \
  -g '!tests/codex/test-repo-surface.sh' \
  'Claude Code|Cursor|OpenCode|Gemini|Copilot|Task tool|TodoWrite|Skill tool|activate_skill|/plugin|/add-plugin|\bClaude\b|\.claude/CLAUDE\.md|CLAUDE\.md|claude-content|sendToClaude' \
  "${active_paths[@]}" && {
  echo "forbidden terms found"
  exit 1
}

echo "forbidden terms ok"
