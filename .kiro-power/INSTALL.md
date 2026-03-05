# Installing Superpowers for Kiro

## Prerequisites

- [Kiro IDE](https://kiro.dev) installed
- Git installed

## Installation via Powers Panel (Recommended)

1. Open Kiro IDE
2. Open the Powers panel
3. Click "Import power from GitHub"
4. Enter: `https://github.com/obra/superpowers/tree/main/.kiro-power`
5. Install the power

The agent will automatically set up skills for `/` slash command access during onboarding.

## Manual Installation

### macOS / Linux

```bash
# 1. Clone Superpowers
git clone https://github.com/obra/superpowers.git ~/.kiro/superpowers

# 2. Copy each skill into Kiro's skills directory
mkdir -p ~/.kiro/skills
for skill in ~/.kiro/superpowers/skills/*/; do
  target=~/.kiro/skills/"$(basename "$skill")"
  rm -rf "$target"
  cp -R "$skill" "$target"
done

# 3. Restart Kiro
```

### Windows

#### PowerShell

```powershell
# 1. Clone Superpowers
git clone https://github.com/obra/superpowers.git "$env:USERPROFILE\.kiro\superpowers"

# 2. Create skills directory
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.kiro\skills"

# 3. Copy each skill into Kiro's skills directory
Get-ChildItem "$env:USERPROFILE\.kiro\superpowers\skills" -Directory | ForEach-Object {
    $target = "$env:USERPROFILE\.kiro\skills\$($_.Name)"
    if (Test-Path $target) { Remove-Item $target -Recurse -Force }
    Copy-Item $_.FullName $target -Recurse
}

# 4. Restart Kiro
```

#### Command Prompt

```cmd
:: 1. Clone Superpowers
git clone https://github.com/obra/superpowers.git "%USERPROFILE%\.kiro\superpowers"

:: 2. Create directory
mkdir "%USERPROFILE%\.kiro\skills" 2>nul

:: 3. Copy each skill into Kiro's skills directory
for /D %%s in ("%USERPROFILE%\.kiro\superpowers\skills\*") do (
    rmdir /S /Q "%USERPROFILE%\.kiro\skills\%%~ns" 2>nul
    xcopy "%%s" "%USERPROFILE%\.kiro\skills\%%~ns\" /E /I /Q
)

:: 4. Restart Kiro
```

#### Git Bash

```bash
# 1. Clone Superpowers
git clone https://github.com/obra/superpowers.git ~/.kiro/superpowers

# 2. Create directory
mkdir -p ~/.kiro/skills

# 3. Copy each skill into Kiro's skills directory
for skill in ~/.kiro/superpowers/skills/*/; do
  target=~/.kiro/skills/"$(basename "$skill")"
  rm -rf "$target"
  cp -R "$skill" "$target"
done

# 4. Restart Kiro
```

#### WSL Users

If running Kiro inside WSL, use the macOS / Linux instructions.

## Verify Installation

```bash
ls ~/.kiro/skills/brainstorming/SKILL.md
```

You should see the file path printed. You can also list all installed skills:

```bash
ls ~/.kiro/skills/
```

Expected: `brainstorming/`, `systematic-debugging/`, `test-driven-development/`, etc. directly under `~/.kiro/skills/`.

In Kiro chat, type `/` to see available slash commands — superpowers skills should appear.

## Usage

### Slash Commands

Type `/` in Kiro chat to see available skills. Select a skill to load its full instructions.

Examples:
- `/brainstorming` — Design exploration before implementation
- `/writing-plans` — Create detailed implementation plans
- `/systematic-debugging` — Four-phase root cause debugging
- `/test-driven-development` — Red-green-refactor TDD cycle

### Automatic Activation

When the Superpowers power is installed, Kiro automatically activates it when you mention relevant keywords like "debug", "plan", "brainstorm", or "tdd". The power loads bootstrap context that tells the agent to check for applicable skills before any response.

### Skill Discovery

Kiro discovers skills from these locations (highest priority first):

1. **Project skills** (`.kiro/skills/`) — Project-specific skills
2. **Global skills** (`~/.kiro/skills/`) — Personal and superpowers skills
3. **Power activation** — POWER.md loaded on keyword match

## Updating

### Powers Panel Install

Update from the Powers panel in Kiro.

### Manual Install

```bash
cd ~/.kiro/superpowers && git pull
```

After pulling, re-copy skills to pick up changes:

**macOS / Linux:**
```bash
for skill in ~/.kiro/superpowers/skills/*/; do
  target=~/.kiro/skills/"$(basename "$skill")"
  rm -rf "$target"
  cp -R "$skill" "$target"
done
```

**Windows (PowerShell):**
```powershell
Get-ChildItem "$env:USERPROFILE\.kiro\superpowers\skills" -Directory | ForEach-Object {
    $target = "$env:USERPROFILE\.kiro\skills\$($_.Name)"
    if (Test-Path $target) { Remove-Item $target -Recurse -Force }
    Copy-Item $_.FullName $target -Recurse
}
```

Restart Kiro to pick up changes.

## Uninstalling

### Remove skill directories

**macOS / Linux:**
```bash
for skill in ~/.kiro/superpowers/skills/*/; do
  rm -rf ~/.kiro/skills/"$(basename "$skill")"
done
```

**Windows (PowerShell):**
```powershell
Get-ChildItem "$env:USERPROFILE\.kiro\superpowers\skills" -Directory | ForEach-Object {
    Remove-Item "$env:USERPROFILE\.kiro\skills\$($_.Name)" -Recurse -Force -ErrorAction SilentlyContinue
}
```

### Optionally delete the clone

```bash
rm -rf ~/.kiro/superpowers
```

## Troubleshooting

### Skills not showing in slash commands

1. Verify skills exist: `ls ~/.kiro/skills/brainstorming/SKILL.md`
2. Check skill structure: each skill needs a `SKILL.md` with valid frontmatter
3. Restart Kiro after copying skills

### Power not activating

1. Verify the power is installed in the Powers panel
2. Try mentioning a keyword like "debug" or "brainstorm" in chat
3. Check that POWER.md exists in the installed power directory

### Tool mapping issues

If the agent uses Claude Code tool names instead of Kiro equivalents, remind it:
```text
Use Kiro tools: discloseContext for skills, invokeSubAgent for subagents, executeBash for shell commands
```

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
