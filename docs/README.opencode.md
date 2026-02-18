# Superpowers for OpenCode

Complete guide for using Superpowers with [OpenCode.ai](https://opencode.ai).

## Quick Install

Tell OpenCode:

```
Clone https://github.com/obra/superpowers to ~/.config/opencode/superpowers, then create directory ~/.config/opencode/plugins, then symlink ~/.config/opencode/superpowers/.opencode/plugins/superpowers.js to ~/.config/opencode/plugins/superpowers.js, then symlink ~/.config/opencode/superpowers/skills to ~/.config/opencode/skills/superpowers, then restart opencode.
```

## Manual Installation

### Prerequisites

- [OpenCode.ai](https://opencode.ai) installed
- Git installed

> **Note:** All paths below use the default config directory (`~/.config/opencode` on macOS/Linux, `%USERPROFILE%\.config\opencode` on Windows). If you have `OPENCODE_CONFIG_DIR` set, the install scripts will use that instead.

### macOS / Linux

```bash
OPENCODE_CONFIG_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"

# 1. Install Superpowers (or update existing)
if [ -d "$OPENCODE_CONFIG_DIR/superpowers" ]; then
  cd "$OPENCODE_CONFIG_DIR/superpowers" && git pull
else
  git clone https://github.com/obra/superpowers.git "$OPENCODE_CONFIG_DIR/superpowers"
fi

# 2. Create directories
mkdir -p "$OPENCODE_CONFIG_DIR/plugins" "$OPENCODE_CONFIG_DIR/skills"

# 3. Remove old symlinks/directories if they exist
rm -f "$OPENCODE_CONFIG_DIR/plugins/superpowers.js"
rm -rf "$OPENCODE_CONFIG_DIR/skills/superpowers"

# 4. Create symlinks
ln -s "$OPENCODE_CONFIG_DIR/superpowers/.opencode/plugins/superpowers.js" "$OPENCODE_CONFIG_DIR/plugins/superpowers.js"
ln -s "$OPENCODE_CONFIG_DIR/superpowers/skills" "$OPENCODE_CONFIG_DIR/skills/superpowers"

# 5. Restart OpenCode
```

#### Verify Installation

```bash
OPENCODE_CONFIG_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"
ls -l "$OPENCODE_CONFIG_DIR/plugins/superpowers.js"
ls -l "$OPENCODE_CONFIG_DIR/skills/superpowers"
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
if not defined OPENCODE_CONFIG_DIR set OPENCODE_CONFIG_DIR=%USERPROFILE%\.config\opencode

:: 1. Install Superpowers
git clone https://github.com/obra/superpowers.git "%OPENCODE_CONFIG_DIR%\superpowers"

:: 2. Create directories
mkdir "%OPENCODE_CONFIG_DIR%\plugins" 2>nul
mkdir "%OPENCODE_CONFIG_DIR%\skills" 2>nul

:: 3. Remove existing links (safe for reinstalls)
del "%OPENCODE_CONFIG_DIR%\plugins\superpowers.js" 2>nul
rmdir "%OPENCODE_CONFIG_DIR%\skills\superpowers" 2>nul

:: 4. Create plugin symlink (requires Developer Mode or Admin)
mklink "%OPENCODE_CONFIG_DIR%\plugins\superpowers.js" "%OPENCODE_CONFIG_DIR%\superpowers\.opencode\plugins\superpowers.js"

:: 5. Create skills junction (works without special privileges)
mklink /J "%OPENCODE_CONFIG_DIR%\skills\superpowers" "%OPENCODE_CONFIG_DIR%\superpowers\skills"

:: 6. Restart OpenCode
```

#### PowerShell

Run as Administrator, or with Developer Mode enabled:

```powershell
if (-not $env:OPENCODE_CONFIG_DIR) { $env:OPENCODE_CONFIG_DIR = "$env:USERPROFILE\.config\opencode" }

# 1. Install Superpowers
git clone https://github.com/obra/superpowers.git "$env:OPENCODE_CONFIG_DIR\superpowers"

# 2. Create directories
New-Item -ItemType Directory -Force -Path "$env:OPENCODE_CONFIG_DIR\plugins"
New-Item -ItemType Directory -Force -Path "$env:OPENCODE_CONFIG_DIR\skills"

# 3. Remove existing links (safe for reinstalls)
Remove-Item "$env:OPENCODE_CONFIG_DIR\plugins\superpowers.js" -Force -ErrorAction SilentlyContinue
Remove-Item "$env:OPENCODE_CONFIG_DIR\skills\superpowers" -Force -ErrorAction SilentlyContinue

# 4. Create plugin symlink (requires Developer Mode or Admin)
New-Item -ItemType SymbolicLink -Path "$env:OPENCODE_CONFIG_DIR\plugins\superpowers.js" -Target "$env:OPENCODE_CONFIG_DIR\superpowers\.opencode\plugins\superpowers.js"

# 5. Create skills junction (works without special privileges)
New-Item -ItemType Junction -Path "$env:OPENCODE_CONFIG_DIR\skills\superpowers" -Target "$env:OPENCODE_CONFIG_DIR\superpowers\skills"

# 6. Restart OpenCode
```

#### Git Bash

Note: Git Bash's native `ln` command copies files instead of creating symlinks. Use `cmd //c mklink` instead (the `//c` is Git Bash syntax for `/c`).

```bash
OPENCODE_CONFIG_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"

# 1. Install Superpowers
git clone https://github.com/obra/superpowers.git "$OPENCODE_CONFIG_DIR/superpowers"

# 2. Create directories
mkdir -p "$OPENCODE_CONFIG_DIR/plugins" "$OPENCODE_CONFIG_DIR/skills"

# 3. Remove existing links (safe for reinstalls)
rm -f "$OPENCODE_CONFIG_DIR/plugins/superpowers.js" 2>/dev/null
rm -rf "$OPENCODE_CONFIG_DIR/skills/superpowers" 2>/dev/null

# 4. Create plugin symlink (requires Developer Mode or Admin)
cmd //c "mklink \"$(cygpath -w "$OPENCODE_CONFIG_DIR/plugins/superpowers.js")\" \"$(cygpath -w "$OPENCODE_CONFIG_DIR/superpowers/.opencode/plugins/superpowers.js")\""

# 5. Create skills junction (works without special privileges)
cmd //c "mklink /J \"$(cygpath -w "$OPENCODE_CONFIG_DIR/skills/superpowers")\" \"$(cygpath -w "$OPENCODE_CONFIG_DIR/superpowers/skills")\""

# 6. Restart OpenCode
```

#### WSL Users

If running OpenCode inside WSL, use the [macOS / Linux](#macos--linux) instructions instead.

#### Verify Installation

**Command Prompt:**
```cmd
if not defined OPENCODE_CONFIG_DIR set OPENCODE_CONFIG_DIR=%USERPROFILE%\.config\opencode
dir /AL "%OPENCODE_CONFIG_DIR%\plugins"
dir /AL "%OPENCODE_CONFIG_DIR%\skills"
```

**PowerShell:**
```powershell
if (-not $env:OPENCODE_CONFIG_DIR) { $env:OPENCODE_CONFIG_DIR = "$env:USERPROFILE\.config\opencode" }
Get-ChildItem "$env:OPENCODE_CONFIG_DIR\plugins" | Where-Object { $_.LinkType }
Get-ChildItem "$env:OPENCODE_CONFIG_DIR\skills" | Where-Object { $_.LinkType }
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

Use OpenCode's native `skill` tool to load a specific skill:

```
use skill tool to load superpowers/brainstorming
```

### Personal Skills

Create your own skills in `~/.config/opencode/skills/`:

```bash
mkdir -p "${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}/skills/my-skill"
```

Create `~/.config/opencode/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

### Project Skills

Create project-specific skills in your OpenCode project:

```bash
# In your OpenCode project
mkdir -p .opencode/skills/my-project-skill
```

Create `.opencode/skills/my-project-skill/SKILL.md`:

```markdown
---
name: my-project-skill
description: Use when [condition] - [what it does]
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

**Location:** `~/.config/opencode/superpowers/.opencode/plugins/superpowers.js`

**Components:**
- `experimental.chat.system.transform` hook for bootstrap injection
- Reads and injects the "using-superpowers" skill content

### Skills

**Location:** `~/.config/opencode/skills/superpowers/` (symlink to `~/.config/opencode/superpowers/skills/`)

Skills are discovered by OpenCode's native skill system. Each skill has a `SKILL.md` file with YAML frontmatter.

## Updating

```bash
cd "${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}/superpowers"
git pull
```

Restart OpenCode to load the updates.

## Troubleshooting

### Plugin not loading

1. Check plugin exists: `ls ~/.config/opencode/superpowers/.opencode/plugins/superpowers.js`
2. Check symlink/junction: `ls -l ~/.config/opencode/plugins/` (macOS/Linux) or `dir /AL "%USERPROFILE%\.config\opencode\plugins"` (Windows)
3. Check OpenCode logs: `opencode run "test" --print-logs --log-level DEBUG`
4. Look for plugin loading message in logs

### Skills not found

1. Verify skills symlink: `ls -l ~/.config/opencode/skills/superpowers` (should point to superpowers/skills/)
2. Use OpenCode's `skill` tool to list available skills
3. Check skill structure: each skill needs a `SKILL.md` file with valid frontmatter

### Windows: Module not found error

If you see `Cannot find module` errors on Windows:
- **Cause:** Git Bash `ln -sf` copies files instead of creating symlinks
- **Fix:** Use `mklink /J` directory junctions instead (see Windows installation steps)

### Bootstrap not appearing

1. Verify using-superpowers skill exists: `ls ~/.config/opencode/superpowers/skills/using-superpowers/SKILL.md`
2. Check OpenCode version supports `experimental.chat.system.transform` hook
3. Restart OpenCode after plugin changes

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
- OpenCode docs: https://opencode.ai/docs/

## Testing

Verify your installation:

```bash
# Check plugin loads
opencode run --print-logs "hello" 2>&1 | grep -i superpowers

# Check skills are discoverable
opencode run "use skill tool to list all skills" 2>&1 | grep -i superpowers

# Check bootstrap injection
opencode run "what superpowers do you have?"
```

The agent should mention having superpowers and be able to list skills from `superpowers/`.
