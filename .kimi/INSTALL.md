# Installing Superpowers for Kimi Code 2.6

## Prerequisites

- [Kimi Code](https://www.moonshot.cn/kimi) installed (terminal CLI or VS Code extension)
- Git

## Installation

### 1. Clone the superpowers repository

```bash
git clone https://github.com/obra/superpowers.git ~/.kimi/superpowers
```

### 2. Create the skills symlink

Kimi Code discovers skills from `~/.kimi/skills/` (user-level) and `.kimi/skills/` (project-level). Link the superpowers skills directory globally.

Kimi Code scans **direct subdirectories** of `~/.kimi/skills/` for `SKILL.md` files. We create a junction so `~/.kimi/skills/` points directly to the repo's `skills/` directory.

> **Note:** This replaces your entire `~/.kimi/skills/` directory. If you have other Kimi skills installed, back them up first or install them under `~/.config/agents/skills/` instead.

```bash
# macOS / Linux
rm -rf ~/.kimi/skills
ln -s ~/.kimi/superpowers/skills ~/.kimi/skills
```

**Windows (PowerShell):**
```powershell
$skillsDir = "$env:USERPROFILE\.kimi\skills"
$repoSkills = "$env:USERPROFILE\.kimi\superpowers\skills"
if (Test-Path $skillsDir) {
    Remove-Item $skillsDir -Recurse -Force
}
cmd /c mklink /J $skillsDir $repoSkills
```

### 3. Add the bootstrap to your project(s)

Kimi Code auto-loads `.kimi/AGENTS.md` from the project root at session start. Copy the bootstrap file into any project where you want Superpowers active:

```bash
cp ~/.kimi/superpowers/.kimi/AGENTS.md .kimi/AGENTS.md
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force -Path ".kimi"
Copy-Item "$env:USERPROFILE\.kimi\superpowers\.kimi\AGENTS.md" ".kimi\AGENTS.md"
```

This bootstrap file is **not** overwritten by `/init`.

### 4. Verify

Start Kimi Code in your project directory and ask:

```
Tell me about your superpowers
```

Or try loading a skill explicitly:

```
/skill:using-superpowers
```

You should see the skill content load and the agent announce it.

## What `/init` Does (and Doesn't Do)

Kimi Code's `/init` command analyzes the project and generates a root `AGENTS.md` file. **It does not touch `.kimi/AGENTS.md`.** If you run `/init` after installing Superpowers:

- Root `AGENTS.md` gets overwritten with Kimi-generated project context
- `.kimi/AGENTS.md` remains intact with the Superpowers bootstrap
- Your global skills symlink remains intact

## Updating

Pull the latest changes from upstream:

```bash
cd ~/.kimi/superpowers && git pull
```

Skills update instantly through the symlink — no build step needed.

## Uninstalling

Remove the symlink and clone:

```bash
# macOS / Linux
rm ~/.kimi/skills
rm -rf ~/.kimi/superpowers
```

**Windows (PowerShell):**
```powershell
Remove-Item "$env:USERPROFILE\.kimi\skills"
Remove-Item -Recurse -Force "$env:USERPROFILE\.kimi\superpowers"
```

## Troubleshooting

### Bootstrap not appearing

1. Confirm `.kimi/AGENTS.md` exists
2. Restart Kimi Code (`.kimi/AGENTS.md` is read at session start)
3. If using the VS Code extension, run "Developer: Reload Window" from the Command Palette

### Skills not showing up

1. Verify skills exist: `ls ~/.kimi/skills/` or `dir $env:USERPROFILE\.kimi\skills\`
2. Restart Kimi Code — skills are discovered at startup
3. Try `/skill:using-superpowers` to confirm skills are accessible

### Subagent skills not working

Ensure your Kimi Code version supports the `Agent` tool. Subagent-driven development requires true subagent dispatch.

### Tool mapping confusion

See `.kimi/TOOL_MAPPING.md` for the complete mapping of Claude Code tools to Kimi Code equivalents.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Full documentation: [docs/README.kimi.md](../docs/README.kimi.md)
