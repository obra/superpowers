# Installing Superpowers for Kimi Code 2.6

## Prerequisites

- [Kimi Code](https://www.moonshot.cn/kimi) installed (terminal CLI or VS Code extension)
- Git
- Bash (macOS/Linux) or PowerShell (Windows)

## Installation

### 1. Clone the superpowers repository

```bash
git clone https://github.com/obra/superpowers.git ~/.kimi/superpowers
```

### 2. Run the install script

The install script copies skills to the cross-compatible `~/.config/agents/skills/` directory and configures a global `SessionStart` hook for bootstrap injection.

**macOS / Linux:**
```bash
~/.kimi/superpowers/.kimi/install.sh
```

**Windows (PowerShell):**
```powershell
& "$env:USERPROFILE\.kimi\superpowers\.kimi\install.ps1"
```

What the script does:
- Copies all skills from the repo to `~/.config/agents/skills/` (the recommended, cross-tool skills path)
- Enables `merge_all_available_skills` in `~/.kimi/config.toml`
- Adds a `SessionStart` hook that injects the Superpowers bootstrap into every session

> **Note:** No symlinks or junctions are created. Skills are copied so they work reliably across all platforms and filesystems.

### 3. Verify

Start Kimi Code in any project directory and ask:

```
Tell me about your superpowers
```

Or try loading a skill explicitly:

```
/skill:using-superpowers
```

You should see the skill content load and the agent announce it.

## What `/init` Does (and Doesn't Do)

Kimi Code's `/init` command analyzes the project and generates a root `AGENTS.md` file. **It does not touch `.kimi/AGENTS.md` or the global SessionStart hook.** If you run `/init` after installing Superpowers:

- Root `AGENTS.md` gets overwritten with Kimi-generated project context
- The global SessionStart hook remains active
- Your skills remain installed in `~/.config/agents/skills/`

## Project-Level Bootstrap (Optional)

If you prefer project-level bootstrap instead of (or in addition to) the global hook, copy the bootstrap file into your project:

```bash
mkdir -p .kimi
cp ~/.kimi/superpowers/.kimi/AGENTS.md .kimi/AGENTS.md
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force -Path ".kimi"
Copy-Item "$env:USERPROFILE\.kimi\superpowers\.kimi\AGENTS.md" ".kimi\AGENTS.md"
```

This file is **not** overwritten by `/init` and is auto-merged into Kimi Code's system prompt at session start.

## Updating

Pull the latest changes and re-run the install script:

**macOS / Linux:**
```bash
~/.kimi/superpowers/.kimi/update.sh
```

**Windows (PowerShell):**
```powershell
& "$env:USERPROFILE\.kimi\superpowers\.kimi\update.ps1"
```

This re-copies skills from the latest repo state and ensures your hook is up to date.

## Uninstalling

Remove the copied skills and hook configuration:

```bash
# Remove copied skills
rm -rf ~/.config/agents/skills

# Remove the SessionStart hook from ~/.kimi/config.toml
# (edit the file manually to remove the [[hooks]] block for SessionStart)

# Remove the cloned repo
rm -rf ~/.kimi/superpowers
```

**Windows (PowerShell):**
```powershell
Remove-Item -Recurse -Force "$env:USERPROFILE\.config\agents\skills"
Remove-Item -Recurse -Force "$env:USERPROFILE\.kimi\superpowers"
# Edit $env:USERPROFILE\.kimi\config.toml to remove the SessionStart hook block
```

## Troubleshooting

### Bootstrap not appearing

1. Confirm the SessionStart hook is in `~/.kimi/config.toml`
2. Restart Kimi Code (hooks are read at session start)
3. If using the VS Code extension, run "Developer: Reload Window" from the Command Palette
4. As a fallback, copy `.kimi/AGENTS.md` into your project directory

### Skills not showing up

1. Verify skills exist: `ls ~/.config/agents/skills/` or `dir $env:USERPROFILE\.config\agents\skills\`
2. Check that `merge_all_available_skills = true` is set in `~/.kimi/config.toml`
3. Restart Kimi Code — skills are discovered at startup
4. Try `/skill:using-superpowers` to confirm skills are accessible

### Subagent skills not working

Ensure your Kimi Code version supports the `Agent` tool. Subagent-driven development requires true subagent dispatch.

### Tool mapping confusion

See `.kimi/TOOL_MAPPING.md` for the complete mapping of Claude Code tools to Kimi Code equivalents.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Full documentation: [docs/README.kimi.md](../docs/README.kimi.md)
