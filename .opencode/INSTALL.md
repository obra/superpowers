# Installing Superpowers Optimized for OpenCode

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed

## Installation

Add superpowers to the `plugin` array in your `opencode.json` (global or project-level):

```json
{
  "plugin": ["superpowers@git+https://github.com/josuerf/superpowers-prepared.git"]
}
```

Restart OpenCode. The plugin installs through OpenCode's plugin manager and
registers all skills.

Verify by asking: "Tell me about your superpowers"

OpenCode uses its own plugin install. If you also use Claude Code, Codex, or
another harness, install Superpowers separately for each one.

## Migrating from the old symlink-based install

If you previously installed superpowers using `git clone` and symlinks, remove the old setup:

**Unix/macOS:**
```bash
mkdir -p ~/.config/opencode/plugins
rm -f ~/.config/opencode/plugins/superpowers-prepared.js
ln -s ~/.config/opencode/superpowers/.opencode/plugins/superpowers-prepared.js ~/.config/opencode/plugins/superpowers-prepared.js
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.config\opencode\plugins"
Remove-Item -Force "$env:USERPROFILE\.config\opencode\plugins\superpowers-prepared.js" -ErrorAction SilentlyContinue
cmd /c mklink "$env:USERPROFILE\.config\opencode\plugins\superpowers-prepared.js" "$env:USERPROFILE\.config\opencode\superpowers\.opencode\plugins\superpowers-prepared.js"
```

> **Windows note:** File symlinks require Developer Mode enabled (`Settings → For developers → Developer Mode`) or an elevated PowerShell prompt.

### 3. Symlink Skills

Create a symlink so OpenCode's native skill tool discovers superpowers skills:

**Unix/macOS:**
```bash
mkdir -p ~/.config/opencode/skills
rm -rf ~/.config/opencode/skills/superpowers

# Optionally remove the cloned repo
rm -rf ~/.config/opencode/superpowers

# Remove skills.paths from opencode.json if you added one for superpowers
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.config\opencode\skills"
Remove-Item -Recurse -Force "$env:USERPROFILE\.config\opencode\skills\superpowers" -ErrorAction SilentlyContinue
cmd /c mklink /J "$env:USERPROFILE\.config\opencode\skills\superpowers" "$env:USERPROFILE\.config\opencode\superpowers\skills"
```

### 4. Restart OpenCode

Restart OpenCode. The plugin will automatically inject superpowers context.

Verify by asking: "do you have superpowers?"

## Usage

Use OpenCode's native `skill` tool:

```
use skill tool to list skills
use skill tool to load superpowers/brainstorming
```

### Personal Skills

Create your own skills in `~/.config/opencode/skills/`:

```bash
mkdir -p ~/.config/opencode/skills/my-skill
```

Create `~/.config/opencode/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when <specific trigger conditions>
---

# My Skill

[Your skill content here]
```

### Project Skills

Create project-specific skills in `.opencode/skills/` within your project.

**Skill Priority:** Project skills > Personal skills > Superpowers skills

## Updating

**Unix/macOS:**
```bash
cd ~/.config/opencode/superpowers && git pull
```

**Windows (PowerShell):**
```powershell
Set-Location "$env:USERPROFILE\.config\opencode\superpowers"; git pull
## Updating

OpenCode installs Superpowers through a git-backed package spec. Some OpenCode
and Bun versions pin that resolved git dependency in a lockfile or cache, so a
restart may not pick up the newest Superpowers commit. If updates do not appear,
clear OpenCode's package cache or reinstall the plugin.

To pin a specific version:

```json
{
  "plugin": ["superpowers@git+https://github.com/obra/superpowers.git#v6.6.1"]
}
```

## Troubleshooting

### Plugin not loading

**Unix/macOS:**
1. Check plugin symlink: `ls -l ~/.config/opencode/plugins/superpowers-prepared.js`
2. Check source exists: `ls ~/.config/opencode/superpowers/.opencode/plugins/superpowers-prepared.js`
3. Check OpenCode logs for errors

**Windows (PowerShell):**
1. Check plugin symlink: `Get-Item "$env:USERPROFILE\.config\opencode\plugins\superpowers-prepared.js"`
2. Check source exists: `Test-Path "$env:USERPROFILE\.config\opencode\superpowers\.opencode\plugins\superpowers-prepared.js"`
3. Check OpenCode logs for errors

### Skills not found

**Unix/macOS:**
1. Check skills symlink: `ls -l ~/.config/opencode/skills/superpowers`
2. Verify it points to: `~/.config/opencode/superpowers/skills`
3. Use `skill` tool to list what's discovered

**Windows (PowerShell):**
1. Check skills junction: `Get-Item "$env:USERPROFILE\.config\opencode\skills\superpowers"`
2. Verify it points to: `$env:USERPROFILE\.config\opencode\superpowers\skills`
3. Use `skill` tool to list what's discovered

### Tool mapping

When skills reference Claude Code tools:
- `TodoWrite` → `todowrite`
- `Task` with subagents → `@mention` syntax
- `Skill` tool → OpenCode's native `skill` tool
- File operations → your native tools

## Getting Help

- Report issues: https://github.com/josuerf/superpowers-prepared/issues
- Full documentation: https://github.com/josuerf/superpowers-prepared/blob/main/docs/platforms/opencode.md
