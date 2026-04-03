#!/usr/bin/env bash
set -euo pipefail

rg -n \
  'Claude Code|Cursor|OpenCode|Gemini|Copilot|Task tool|TodoWrite|Skill tool|activate_skill|/plugin|/add-plugin|marketplace' \
  AGENTS.md README.md .codex/INSTALL.md docs/README.codex.md docs/testing.md skills agents .github package.json scripts/validate-codex-only.sh tests/codex/test-repo-surface.sh tests/codex/test-doc-consistency.sh && {
  echo "forbidden terms found"
  exit 1
}

echo "forbidden terms ok"
