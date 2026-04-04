#!/usr/bin/env bash
set -euo pipefail

rg -q 'Codex-only|Codex-only fork' README.md
rg -q '\.agents/skills' docs/README.codex.md
rg -q '\$HOME/.agents/skills' docs/README.codex.md
rg -q '\.agents/skills' .codex/INSTALL.md
rg -q '\$HOME/.agents/skills' .codex/INSTALL.md
rg -q '\$HOME/.agents/skills' skills/writing-skills/SKILL.md
rg -q 'scripts/validate-codex-only.sh' docs/testing.md

echo "doc consistency ok"
