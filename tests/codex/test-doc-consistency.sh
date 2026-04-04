#!/usr/bin/env bash
set -euo pipefail

rg -q 'Codex-only|Codex-only fork' README.md
rg -q '\$HOME/.agents/skills/superpowers' docs/README.codex.md
rg -q '\$HOME/.agents/skills/superpowers' .codex/INSTALL.md
rg -q 'Windows PowerShell|native Windows' docs/README.codex.md
rg -q 'Windows PowerShell|native Windows' .codex/INSTALL.md
rg -q 'mklink /J|junction' docs/README.codex.md
rg -q 'mklink /J|junction' .codex/INSTALL.md
rg -q '^description: Use when starting any conversation' skills/using-superpowers/SKILL.md
! rg -q 'in this repository' skills/using-superpowers/SKILL.md
rg -q 'Even a 1% chance|even a 1% chance' skills/using-superpowers/SKILL.md
rg -q 'Invoke relevant or requested skills BEFORE any response or action' skills/using-superpowers/SKILL.md
rg -q 'These thoughts mean STOP|## Red Flags' skills/using-superpowers/SKILL.md
rg -q '\$HOME/.agents/skills' skills/writing-skills/SKILL.md
rg -q 'what the skill does and when to use it' skills/writing-skills/SKILL.md
rg -q 'scripts/validate-codex-only.sh' docs/testing.md
rg -q 'tests/codex/test-workflow-parity.sh' docs/testing.md
rg -q 'tests/codex/test-runtime-smoke.sh' docs/testing.md
rg -q 'active product surface' docs/testing.md
rg -q 'not a full behavioral parity suite|full behavioral parity with upstream' docs/testing.md
rg -q 'native Windows execution behavior|native Windows automation' docs/testing.md
rg -q 'POSIX shell helper workflows|shell-script-based helper workflows|POSIX shell helpers' README.md
rg -q 'POSIX shell|WSL|Git Bash' skills/brainstorming/visual-companion.md
rg -q 'POSIX shell|WSL|Git Bash' skills/using-git-worktrees/SKILL.md

echo "doc consistency ok"
