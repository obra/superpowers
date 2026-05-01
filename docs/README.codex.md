# Superpowers for Codex

Guide for using Sonbbal Superpowers with OpenAI Codex via Codex plugin metadata or native skill discovery.

## Package Location

The Codex package lives at:

```text
codex/
```

Codex skills live at:

```text
codex/skills
```

Claude Code uses the separate package at:

```text
claude-code/
```

## Quick Install

Tell Codex:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/Sonbbal/superpowers/refs/heads/main/codex/INSTALL.md
```

Paste-ready install prompts are in [prompts.md](prompts.md).

## Manual Installation

Clone the repo:

```bash
git clone https://github.com/Sonbbal/superpowers.git ~/.codex/superpowers
```

If already cloned:

```bash
cd ~/.codex/superpowers
git pull
```

Create the native skill discovery symlink:

```bash
mkdir -p ~/.agents/skills
ln -s ~/.codex/superpowers/codex/skills ~/.agents/skills/sonbbal-superpowers-codex
```

Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
cmd /c mklink /J "$env:USERPROFILE\.agents\skills\sonbbal-superpowers-codex" "$env:USERPROFILE\.codex\superpowers\codex\skills"
```

Restart Codex after installation.

## How It Works

Codex discovers skills from `~/.agents/skills/` at startup. The symlink makes this package visible as:

```text
~/.agents/skills/sonbbal-superpowers-codex/ -> ~/.codex/superpowers/codex/skills/
```

The `using-superpowers` skill is discovered automatically and enforces skill usage discipline.

## Packaged Skills

The Codex package includes the Superpowers workflows ported to Codex-native tool language:

- `api-edr-validation`
- `audit-verification`
- `brainstorming`
- `context-window-management`
- `dispatching-parallel-agents`
- `executing-plans`
- `finishing-a-development-branch`
- `model-assignment`
- `project-scoping`
- `receiving-code-review`
- `requesting-code-review`
- `subagent-driven-development`
- `systematic-debugging`
- `team-driven-development`
- `test-driven-development`
- `using-git-worktrees`
- `using-superpowers`
- `verification-before-completion`
- `wiki-management`
- `writing-plans`
- `writing-skills`

## Updating

```bash
cd ~/.codex/superpowers && git pull
```

Skills update through the symlink. Restart Codex so discovery reloads them.

## Uninstalling

```bash
rm ~/.agents/skills/sonbbal-superpowers-codex
```

Windows PowerShell:

```powershell
Remove-Item "$env:USERPROFILE\.agents\skills\sonbbal-superpowers-codex"
```

Optionally delete the clone:

```bash
rm -rf ~/.codex/superpowers
```
