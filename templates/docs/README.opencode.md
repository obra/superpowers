<!-- GENERATED: do not edit directly. Source: templates/docs/README.opencode.md -->
# Superpowers for {{AGENT_NAME}}

Complete guide for using Superpowers with [{{AGENT_NAME}}](https://opencode.ai).

## Quick Install

Tell {{AGENT_NAME}}:

```
Clone https://github.com/obra/superpowers to {{SUPERPOWERS_DIR}}, then create directory {{PLUGIN_DIR}}, then symlink {{SUPERPOWERS_DIR}}/.opencode/plugins/superpowers.js to {{PLUGIN_DIR}}/superpowers.js, then symlink {{SUPERPOWERS_DIR}}/skills to {{SKILLS_DIR}}/superpowers, then restart {{AGENT_NAME}}.
```

## Manual Installation

### Prerequisites

- [OpenCode.ai](https://opencode.ai) installed
- Git installed

### macOS / Linux

```bash
# 1. Install Superpowers (or update existing)
if [ -d {{SUPERPOWERS_DIR}} ]; then
  cd {{SUPERPOWERS_DIR}} && git pull
else
  git clone https://github.com/obra/superpowers.git {{SUPERPOWERS_DIR}}
fi

# 2. Create directories
mkdir -p {{PLUGIN_DIR}} {{SKILLS_DIR}}

# 3. Remove old symlinks/directories if they exist
rm -f {{PLUGIN_DIR}}/superpowers.js
rm -rf {{SKILLS_DIR}}/superpowers

# 4. Create symlinks
ln -s {{SUPERPOWERS_DIR}}/.opencode/plugins/superpowers.js {{PLUGIN_DIR}}/superpowers.js
ln -s {{SUPERPOWERS_DIR}}/skills {{SKILLS_DIR}}/superpowers

# 5. Restart OpenCode
```

#### Verify Installation

```bash
ls -l {{PLUGIN_DIR}}/superpowers.js
ls -l {{SKILLS_DIR}}/superpowers
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
git clone https://github.com/obra/superpowers.git "%USERPROFILE%\.config\opencode\superpowers"

:: 2. Create directories
mkdir "%USERPROFILE%\.config\opencode\plugins" 2>nul
mkdir "%USERPROFILE%\.config\opencode\skills" 2>nul

:: 3. Remove existing links (safe for reinstalls)
del "%USERPROFILE%\.config\opencode\plugins\superpowers.js" 2>nul
rmdir "%USERPROFILE%\.config\opencode\skills\superpowers" 2>nul

:: 4. Create plugin symlink (requires Developer Mode or Admin)
mklink "%USERPROFILE%\.config\opencode\plugins\superpowers.js" "%USERPROFILE%\.config\opencode\superpowers\.opencode\plugins\superpowers.js"

:: 5. Create skills junction (works without special privileges)
mklink /J "%USERPROFILE%\.config\opencode\skills\superpowers" "%USERPROFILE%\.config\opencode\superpowers\skills"

:: 6. Restart OpenCode
```

#### PowerShell

Run as Administrator, or with Developer Mode enabled:

```powershell
# 1. Install Superpowers
git clone https://github.com/obra/superpowers.git "$env:USERPROFILE\.config\opencode\superpowers"

# 2. Create directories
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.config\opencode\plugins"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.config\opencode\skills"

# 3. Remove existing links (safe for reinstalls)
Remove-Item "$env:USERPROFILE\.config\opencode\plugins\superpowers.js" -Force -ErrorAction SilentlyContinue
Remove-Item "$env:USERPROFILE\.config\opencode\skills\superpowers" -Force -ErrorAction SilentlyContinue

# 4. Create plugin symlink (requires Developer Mode or Admin)
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.config\opencode\plugins\superpowers.js" -Target "$env:USERPROFILE\.config\opencode\superpowers\.opencode\plugins\superpowers.js"

# 5. Create skills junction (works without special privileges)
New-Item -ItemType Junction -Path "$env:USERPROFILE\.config\opencode\skills\superpowers" -Target "$env:USERPROFILE\.config\opencode\superpowers\skills"

# 6. Restart OpenCode
```

#### Git Bash

Note: Git Bash's native `ln` command copies files instead of creating symlinks. Use `cmd //c mklink` instead (the `//c` is Git Bash syntax for `/c`).

```bash
# 1. Install Superpowers
git clone https://github.com/obra/superpowers.git {{SUPERPOWERS_DIR}}

# 2. Create directories
mkdir -p {{PLUGIN_DIR}} {{SKILLS_DIR}}

# 3. Remove existing links (safe for reinstalls)
rm -f {{PLUGIN_DIR}}/superpowers.js 2>/dev/null
rm -rf {{SKILLS_DIR}}/superpowers 2>/dev/null

# 4. Create plugin symlink (requires Developer Mode or Admin)
cmd //c "mklink \"$(cygpath -w {{PLUGIN_DIR}}/superpowers.js)\" \"$(cygpath -w {{SUPERPOWERS_DIR}}/.opencode/plugins/superpowers.js)\""

# 5. Create skills junction (works without special privileges)
cmd //c "mklink /J \"$(cygpath -w {{SKILLS_DIR}}/superpowers)\" \"$(cygpath -w {{SUPERPOWERS_DIR}}/skills)\""

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

Use OpenCode's native `skill` tool to load a specific skill:

```
use skill tool to load superpowers/brainstorming
```

### Personal Skills

Create your own skills in `{{SKILLS_DIR}}/`:

```bash
mkdir -p {{SKILLS_DIR}}/my-skill
```

Create `{{SKILLS_DIR}}/my-skill/SKILL.md`:

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
2. **Personal skills** (`{{SKILLS_DIR}}/`)
3. **Superpowers skills** (`{{SKILLS_DIR}}/superpowers/`) - via symlink

## Features

### Automatic Context Injection

The plugin automatically injects superpowers context via the `experimental.chat.system.transform` hook. This adds the "using-superpowers" skill content to the system prompt on every request.

### Native Skills Integration

Superpowers uses {{AGENT_NAME}}'s native `skill` tool for skill discovery and loading. Skills are symlinked into `{{SKILLS_DIR}}/superpowers/` so they appear alongside your personal and project skills.

### Tool Mapping

Skills written for Claude Code are automatically adapted for OpenCode. The bootstrap provides mapping instructions:

- `TodoWrite` → `update_plan`
- `Task` with subagents → OpenCode's `@mention` system
- `Skill` tool → OpenCode's native `skill` tool
- File operations → Native OpenCode tools

## Architecture

### Plugin Structure

**Location:** `{{SUPERPOWERS_DIR}}/.opencode/plugins/superpowers.js`

**Components:**
- `experimental.chat.system.transform` hook for bootstrap injection
- Reads and injects the "using-superpowers" skill content

### Skills

**Location:** `{{SKILLS_DIR}}/superpowers/` (symlink to `{{SUPERPOWERS_DIR}}/skills/`)

Skills are discovered by OpenCode's native skill system. Each skill has a `SKILL.md` file with YAML frontmatter.

## Templates & Rendering

Source files live in `templates/`. Regenerate agent-specific outputs with:

```bash
node scripts/render-agent.js --agent opencode --write
```

Validate all templates:

```bash
bash tests/render-templates.sh
```

## Updating

```bash
cd {{SUPERPOWERS_DIR}}
git pull
```

Restart OpenCode to load the updates.

## Troubleshooting

### Plugin not loading

1. Check plugin exists: `ls {{SUPERPOWERS_DIR}}/.opencode/plugins/superpowers.js`
2. Check symlink/junction: `ls -l {{PLUGIN_DIR}}/` (macOS/Linux) or `dir /AL %USERPROFILE%\.config\opencode\plugins` (Windows)
3. Check OpenCode logs: `opencode run "test" --print-logs --log-level DEBUG`
4. Look for plugin loading message in logs

### Skills not found

1. Verify skills symlink: `ls -l {{SKILLS_DIR}}/superpowers` (should point to superpowers/skills/)
2. Use OpenCode's `skill` tool to list available skills
3. Check skill structure: each skill needs a `SKILL.md` file with valid frontmatter

### Windows: Module not found error

If you see `Cannot find module` errors on Windows:
- **Cause:** Git Bash `ln -sf` copies files instead of creating symlinks
- **Fix:** Use `mklink /J` directory junctions instead (see Windows installation steps)

### Bootstrap not appearing

1. Verify using-superpowers skill exists: `ls {{SUPERPOWERS_DIR}}/skills/using-superpowers/SKILL.md`
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
