# Superpowers for OpenCode

Complete guide for using Superpowers with [OpenCode.ai](https://opencode.ai).

## Installation

Add superpowers to the `plugin` array in your `opencode.json` (global or project-level):

```
Clone https://github.com/josuerf/superpowers-prepared.git to ~/.config/opencode/superpowers, then create directory ~/.config/opencode/plugins, then symlink ~/.config/opencode/superpowers/.opencode/plugins/superpowers-prepared.js to ~/.config/opencode/plugins/superpowers-prepared.js, then symlink ~/.config/opencode/superpowers/skills to ~/.config/opencode/skills/superpowers, then restart opencode.
```

Restart OpenCode. The plugin installs through OpenCode's plugin manager and
registers all skills.

Verify by asking: "Tell me about your superpowers"

OpenCode uses its own plugin install. If you also use Claude Code, Codex, or
another harness, install Superpowers separately for each one.

### Migrating from the old symlink-based install

If you previously installed superpowers using `git clone` and symlinks, remove the old setup:

```bash
# 1. Install Superpowers (or update existing)
if [ -d ~/.config/opencode/superpowers ]; then
  cd ~/.config/opencode/superpowers && git pull
else
  git clone https://github.com/josuerf/superpowers-prepared.git ~/.config/opencode/superpowers
fi

# 2. Create directories
mkdir -p ~/.config/opencode/plugins ~/.config/opencode/skills

# 3. Remove old symlinks/directories if they exist
rm -f ~/.config/opencode/plugins/superpowers-prepared.js
rm -rf ~/.config/opencode/skills/superpowers

# 4. Create symlinks
ln -s ~/.config/opencode/superpowers/.opencode/plugins/superpowers-prepared.js ~/.config/opencode/plugins/superpowers-prepared.js
ln -s ~/.config/opencode/superpowers/skills ~/.config/opencode/skills/superpowers

# Remove skills.paths from opencode.json if you added one for superpowers
```

#### Verify Installation

```bash
ls -l ~/.config/opencode/plugins/superpowers-prepared.js
ls -l ~/.config/opencode/skills/superpowers
```

Both should show symlinks pointing to the superpowers directory.

### Windows

**Prerequisites:**
- Git installed
- Either **Developer Mode** enabled OR **Administrator privileges**
  - Windows 10: Settings → Update & Security → For developers
  - Windows 11: Settings → System → For developers

Pick your shell below: [Command Prompt](#command-prompt) | [PowerShell](#powershell) | [Git Bash](#git-bash)

#### Command Prompt

Run as Administrator, or with Developer Mode enabled:

```cmd
:: 1. Install Superpowers
git clone https://github.com/josuerf/superpowers-prepared.git "%USERPROFILE%\.config\opencode\superpowers"

:: 2. Create directories
mkdir "%USERPROFILE%\.config\opencode\plugins" 2>nul
mkdir "%USERPROFILE%\.config\opencode\skills" 2>nul

:: 3. Remove existing links (safe for reinstalls)
del "%USERPROFILE%\.config\opencode\plugins\superpowers-prepared.js" 2>nul
rmdir "%USERPROFILE%\.config\opencode\skills\superpowers" 2>nul

:: 4. Create plugin symlink (requires Developer Mode or Admin)
mklink "%USERPROFILE%\.config\opencode\plugins\superpowers-prepared.js" "%USERPROFILE%\.config\opencode\superpowers\.opencode\plugins\superpowers-prepared.js"

:: 5. Create skills junction (works without special privileges)
mklink /J "%USERPROFILE%\.config\opencode\skills\superpowers" "%USERPROFILE%\.config\opencode\superpowers\skills"

:: 6. Restart OpenCode
```

#### PowerShell

Run as Administrator, or with Developer Mode enabled:

```powershell
# 1. Install Superpowers
git clone https://github.com/josuerf/superpowers-prepared.git "$env:USERPROFILE\.config\opencode\superpowers"

# 2. Create directories
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.config\opencode\plugins"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.config\opencode\skills"

# 3. Remove existing links (safe for reinstalls)
Remove-Item "$env:USERPROFILE\.config\opencode\plugins\superpowers-prepared.js" -Force -ErrorAction SilentlyContinue
Remove-Item "$env:USERPROFILE\.config\opencode\skills\superpowers" -Force -ErrorAction SilentlyContinue

# 4. Create plugin symlink (requires Developer Mode or Admin)
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.config\opencode\plugins\superpowers-prepared.js" -Target "$env:USERPROFILE\.config\opencode\superpowers\.opencode\plugins\superpowers-prepared.js"

# 5. Create skills junction (works without special privileges)
New-Item -ItemType Junction -Path "$env:USERPROFILE\.config\opencode\skills\superpowers" -Target "$env:USERPROFILE\.config\opencode\superpowers\skills"

# 6. Restart OpenCode
```

#### Git Bash

Note: Git Bash's native `ln` command copies files instead of creating symlinks. Use `cmd //c mklink` instead (the `//c` is Git Bash syntax for `/c`).

```bash
# 1. Install Superpowers
git clone https://github.com/josuerf/superpowers-prepared.git ~/.config/opencode/superpowers

# 2. Create directories
mkdir -p ~/.config/opencode/plugins ~/.config/opencode/skills

# 3. Remove existing links (safe for reinstalls)
rm -f ~/.config/opencode/plugins/superpowers-prepared.js 2>/dev/null
rm -rf ~/.config/opencode/skills/superpowers 2>/dev/null

# 4. Create plugin symlink (requires Developer Mode or Admin)
cmd //c "mklink \"$(cygpath -w ~/.config/opencode/plugins/superpowers-prepared.js)\" \"$(cygpath -w ~/.config/opencode/superpowers/.opencode/plugins/superpowers-prepared.js)\""

# 5. Create skills junction (works without special privileges)
cmd //c "mklink /J \"$(cygpath -w ~/.config/opencode/skills/superpowers)\" \"$(cygpath -w ~/.config/opencode/superpowers/skills)\""

# 6. Restart OpenCode
```

#### WSL Users

If running OpenCode inside WSL, use the [macOS / Linux](#macos--linux) instructions instead.

#### Verify Installation

**Command Prompt:**
```cmd
dir /AL "%USERPROFILE%\.config\opencode\plugins"
dir /AL "%USERPROFILE%\.config\opencode\skills"
```

**PowerShell:**
```powershell
Get-ChildItem "$env:USERPROFILE\.config\opencode\plugins" | Where-Object { $_.LinkType }
Get-ChildItem "$env:USERPROFILE\.config\opencode\skills" | Where-Object { $_.LinkType }
```

Look for `<SYMLINK>` or `<JUNCTION>` in the output.

#### Troubleshooting Windows

**"You do not have sufficient privilege" error:**
- Enable Developer Mode in Windows Settings, OR
- Right-click your terminal → "Run as Administrator"

**"Cannot create a file when that file already exists":**
- Run the removal commands (step 3) first, then retry

**Symlinks not working after git clone:**
- Run `git config --global core.symlinks true` and re-clone

## Usage

### Finding Skills

Use OpenCode's native `skill` tool to list all available skills:

```
use skill tool to list skills
```

### Loading a Skill

```
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

```bash
# In your OpenCode project
mkdir -p .opencode/skills/my-project-skill
```

Create `.opencode/skills/my-project-skill/SKILL.md`:

```markdown
---
name: my-project-skill
description: Use when <specific trigger conditions>
---

# My Project Skill

[Your skill content here]
```

## Skill Locations

OpenCode discovers skills from these locations:

1. **Project skills** (`.opencode/skills/`) - Highest priority
2. **Personal skills** (`~/.config/opencode/skills/`)
3. **Superpowers skills** (`~/.config/opencode/skills/superpowers/`) - via symlink

## Features

### Automatic Context Injection

The plugin automatically injects superpowers context via the `experimental.chat.system.transform` hook. This adds the "using-superpowers" skill content to the system prompt on every request.

### Native Skills Integration

Superpowers uses OpenCode's native `skill` tool for skill discovery and loading. Skills are symlinked into `~/.config/opencode/skills/superpowers/` so they appear alongside your personal and project skills.

### Tool Mapping

Skills written for Claude Code are automatically adapted for OpenCode. The bootstrap provides mapping instructions:

- `TodoWrite` → `update_plan`
- `Task` with subagents → OpenCode's `@mention` system
- `Skill` tool → OpenCode's native `skill` tool
- File operations → Native OpenCode tools

## Architecture

### Plugin Structure

**Location:** `~/.config/opencode/superpowers/.opencode/plugins/superpowers-prepared.js`

**Components:**
- `experimental.chat.system.transform` hook for bootstrap injection
- Reads and injects the "using-superpowers" skill content

### Skills

**Location:** `~/.config/opencode/skills/superpowers/` (symlink to `~/.config/opencode/superpowers/skills/`)

Skills are discovered by OpenCode's native skill system. Each skill has a `SKILL.md` file with YAML frontmatter.

## Updating

OpenCode installs Superpowers through a git-backed package spec. Some OpenCode
and Bun versions pin that resolved git dependency in a lockfile or cache, so a
restart may not pick up the newest Superpowers commit. If updates do not appear,
clear OpenCode's package cache or reinstall the plugin.

To pin a specific version, use a branch or tag:

```json
{
  "plugin": ["superpowers@git+https://github.com/obra/superpowers.git#v5.0.3"]
}
```

## How It Works

The plugin does two things:

1. **Injects bootstrap context** via the `experimental.chat.system.transform` hook, adding superpowers awareness to every conversation.
2. **Registers the skills directory** via the `config` hook, so OpenCode discovers all superpowers skills without symlinks or manual config.

### Tool Mapping

Skills written for Claude Code are automatically adapted for OpenCode:

- `TodoWrite` → `todowrite`
- `Task` with subagents → OpenCode's `@mention` system
- `Skill` tool → OpenCode's native `skill` tool
- File operations → Native OpenCode tools

## Troubleshooting

### Plugin not loading

1. Check plugin exists: `ls ~/.config/opencode/superpowers/.opencode/plugins/superpowers-prepared.js`
2. Check symlink/junction: `ls -l ~/.config/opencode/plugins/` (macOS/Linux) or `dir /AL %USERPROFILE%\.config\opencode\plugins` (Windows)
3. Check OpenCode logs: `opencode run "test" --print-logs --log-level DEBUG`
4. Look for plugin loading message in logs

OR

1. Check OpenCode logs: `opencode run --print-logs "hello" 2>&1 | grep -i superpowers`
2. Verify the plugin line in your `opencode.json` is correct
3. Make sure you're running a recent version of OpenCode

### Windows install issues

Some Windows OpenCode builds have upstream installer issues with git-backed
plugin specs, including cache paths for `git+https` URLs and Bun not finding
`git.exe` even when it works in a normal terminal. If OpenCode cannot install
the plugin, try installing with system npm and pointing OpenCode at the local
package:

```powershell
npm install superpowers@git+https://github.com/obra/superpowers.git --prefix "$HOME\.config\opencode"
```

Then use the installed package path in `opencode.json`:

```json
{
  "plugin": ["~/.config/opencode/node_modules/superpowers"]
}
```

### Skills not found

1. Use OpenCode's `skill` tool to list available skills
2. Check that the plugin is loading (see above)
3. Each skill needs a `SKILL.md` file with valid YAML frontmatter

### Bootstrap not appearing

1. Check OpenCode version supports `experimental.chat.system.transform` hook
2. Restart OpenCode after config changes

## Getting Help

- Report issues: https://github.com/josuerf/superpowers-prepared/issues
- Main documentation: https://github.com/josuerf/superpowers-prepared
- OpenCode docs: https://opencode.ai/docs/
