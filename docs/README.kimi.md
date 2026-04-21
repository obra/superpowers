# Superpowers for Kimi Code 2.6

Complete guide for using Superpowers with [Kimi Code](https://www.moonshot.cn/kimi) (terminal CLI or VS Code extension).

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/obra/superpowers.git ~/.kimi/superpowers
```

### 2. Create the skills symlink

Kimi Code discovers skills from `~/.kimi/skills/` (user-level) and `.kimi/skills/` (project-level). Link the superpowers skills directory globally.

Kimi Code scans **direct subdirectories** of `~/.kimi/skills/` for `SKILL.md` files. We junction `~/.kimi/skills/` directly to the repo's `skills/` directory.

> **Note:** This replaces your entire `~/.kimi/skills/` directory. If you have other Kimi skills, back them up first or use `~/.config/agents/skills/` instead.

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

Copy the bootstrap into any project where you want Superpowers active:

```bash
cp ~/.kimi/superpowers/.kimi/AGENTS.md .kimi/AGENTS.md
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force -Path ".kimi"
Copy-Item "$env:USERPROFILE\.kimi\superpowers\.kimi\AGENTS.md" ".kimi\AGENTS.md"
```

### 4. Verify

Start Kimi Code and ask:

```
Tell me about your superpowers
```

Or try loading a skill explicitly:

```
/skill:using-superpowers
```

You should see the skill content load and the agent announce it.

## Usage

### Finding Skills

Kimi Code auto-discovers skills at startup. Their names and descriptions are injected into the system prompt automatically.

Skills are installed globally at `~/.kimi/skills/` (or `%USERPROFILE%\.kimi\skills\` on Windows):

```
~/.kimi/skills/
  brainstorming/SKILL.md
  writing-plans/SKILL.md
  test-driven-development/SKILL.md
  ...
```

Kimi Code discovers them from the global path automatically at startup.

### Loading a Skill

For regular conversations, Kimi Code automatically decides whether to read skill content based on context.

To explicitly load a skill, use the `/skill:<name>` slash command:

```
/skill:brainstorming
/skill:test-driven-development
/skill:subagent-driven-development
```

You can also append a task description:

```
/skill:brainstorming design a new caching layer
```

### Personal Skills

Create your own skills in `~/.kimi/skills/` (global) or `.kimi/skills/` (project-level):

```bash
mkdir -p .kimi/skills/my-skill
```

Create `.kimi/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

Restart Kimi Code to discover new skills.

## Updating

Pull the latest changes:

```bash
git pull https://github.com/obra/superpowers.git main
```

Skills update instantly through the symlink — no build step or restart required.

## How It Works

1. **Bootstrap injection** via `.kimi/AGENTS.md` — Kimi Code auto-merges `.kimi/AGENTS.md` into the system prompt at session start. This file survives `/init`.
2. **Skill discovery** — Kimi Code scans `.kimi/skills/` at startup, parses `SKILL.md` frontmatter, and injects skill metadata into the system prompt. The AI reads skill content automatically when relevant.

### Tool Mapping

Skills written for Claude Code are adapted for Kimi Code via the bootstrap:

| Claude Code | Kimi Code 2.6 |
|-------------|---------------|
| `Read` | `ReadFile` |
| `Write` | `WriteFile` |
| `Edit` | `StrReplaceFile` |
| `Bash` | `Shell` |
| `Grep` | `Grep` |
| `Glob` | `Glob` |
| `TodoWrite` | `SetTodoList` |
| `Task` (subagent) | `Agent` |
| `WebSearch` | `SearchWeb` |
| `WebFetch` | `FetchURL` |
| `Skill` | Auto-discovery + `/skill:<name>` |

## Troubleshooting

### Bootstrap not appearing

1. Confirm `.kimi/AGENTS.md` exists in the repository
2. Restart Kimi Code (`.kimi/AGENTS.md` is read at session start)
3. If using the VS Code extension, run "Developer: Reload Window" from the Command Palette

### Skills not showing up

1. Verify the junction: `ls -la ~/.kimi/skills/`
2. Check skills exist: `ls ~/.kimi/skills/`
3. Restart Kimi Code — skills are discovered at startup
4. Try `/skill:using-superpowers` to confirm skills are accessible

### `/init` overwrote root AGENTS.md

This is expected. `/init` only overwrites root `AGENTS.md`; it does not touch `.kimi/AGENTS.md` or the skills symlink. Your Superpowers bootstrap remains active.

If you want to restore the upstream minimal root `AGENTS.md`:

```bash
git checkout AGENTS.md
```

### Subagent skills failing

Ensure your Kimi Code version supports the `Agent` tool. Check by trying:
```
Agent subagent_type="explore" description="test" prompt="List files in the current directory"
```

### Tool mapping issues

See `.kimi/TOOL_MAPPING.md` for the complete tool mapping reference.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
- Kimi Code CLI docs: https://moonshotai.github.io/kimi-cli/
