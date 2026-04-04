#!/usr/bin/env bash
set -euo pipefail

rg -q 'macOS, Linux, and WSL is the primary supported execution surface' AGENTS.md
rg -q 'installation and repo-root instruction loading only' AGENTS.md
! rg -q 'native Windows is part of the supported product surface|supported Codex CLI surface' AGENTS.md README.md
rg -q 'Codex-only|Codex-only fork' README.md
rg -q '\$HOME/.agents/skills/superpowers' docs/README.codex.md
rg -q '\$HOME/.agents/skills/superpowers' .codex/INSTALL.md
rg -q 'Windows PowerShell|native Windows' docs/README.codex.md
rg -q 'Windows PowerShell|native Windows' .codex/INSTALL.md
rg -q 'mklink /J|junction' docs/README.codex.md
rg -q 'mklink /J|junction' .codex/INSTALL.md
rg -q '^description: Use when starting any conversation' skills/using-superpowers/SKILL.md
rg -q 'source skills in `skills/`|source skills in skills/' skills/using-superpowers/SKILL.md
rg -q 'Even a 1% chance|even a 1% chance' skills/using-superpowers/SKILL.md
rg -q 'Invoke relevant or requested skills BEFORE any response or action' skills/using-superpowers/SKILL.md
rg -q 'These thoughts mean STOP|## Red Flags' skills/using-superpowers/SKILL.md
rg -q '\$HOME/.agents/skills' skills/writing-skills/SKILL.md
rg -q '\.agents/skills/' skills/writing-skills/SKILL.md
rg -q 'When editing this fork|This fork.s source skills live in `skills/`' skills/writing-skills/SKILL.md
rg -q 'what the skill does and when to use it' skills/writing-skills/SKILL.md
rg -q 'what the skill does and when to use it' skills/writing-skills/codex-best-practices.md
rg -q 'scripts/validate-codex-only.sh' docs/testing.md
rg -q 'tests/codex/test-workflow-parity.sh' docs/testing.md
rg -q 'tests/codex/test-runtime-smoke.sh' docs/testing.md
rg -q 'active product surface' docs/testing.md
rg -q 'not a full behavioral parity suite|full behavioral parity with upstream' docs/testing.md
rg -q 'native Windows execution behavior|native Windows automation' docs/testing.md
rg -q 'POSIX shell helper workflows|shell-script-based helper workflows|POSIX shell helpers' README.md
rg -q 'POSIX shell|WSL|Git Bash' skills/brainstorming/visual-companion.md
! rg -q 'Write tool|Bash tool|run_in_background' skills/brainstorming/visual-companion.md
rg -q 'POSIX shell|WSL|Git Bash' skills/using-git-worktrees/SKILL.md
rg -q '### 1\. Check Existing Directories' skills/using-git-worktrees/SKILL.md
rg -q '### 2\. Check Active Instructions' skills/using-git-worktrees/SKILL.md
rg -q 'If there is no established worktree directory already in use' skills/using-git-worktrees/SKILL.md
rg -q 'agents/code-reviewer.md' skills/requesting-code-review/SKILL.md
rg -q 'agents/code-reviewer.md' skills/subagent-driven-development/code-quality-reviewer-prompt.md
rg -q '\$\{CODEX_HOME:-~/.codex\}/AGENTS.override.md|\$\{CODEX_HOME:-~/.codex\}/AGENTS.md|project_doc_fallback_filenames|at most one file per directory|More specific nested instructions override broader ones' skills/using-git-worktrees/SKILL.md
! rg -q 'Use it, even if a different default directory already exists|Check AGENTS.md|existing > AGENTS.md > ask|Skip AGENTS.md check' skills/using-git-worktrees/SKILL.md
! rg -q 'Hook installation script|install-hook|~/.config/superpowers/hooks/' skills/subagent-driven-development/SKILL.md

echo "doc consistency ok"
