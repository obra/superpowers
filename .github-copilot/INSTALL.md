# Installing Superpowers for GitHub Copilot

Quick setup to enable superpowers skills in GitHub Copilot Agent Mode.

## Prerequisites

- [GitHub Copilot](https://github.com/features/copilot) with Agent Mode enabled
- [VS Code](https://code.visualstudio.com/) with Copilot extension
- Node.js installed
- Git installed

## Installation

**On macOS/Linux:**
```bash
mkdir -p ~/.copilot/superpowers
cd ~/.copilot/superpowers
git clone https://github.com/obra/superpowers.git .
```

**On Windows (PowerShell):**
```powershell
mkdir -p $env:USERPROFILE\.copilot\superpowers
cd $env:USERPROFILE\.copilot\superpowers
git clone https://github.com/obra/superpowers.git .
```

2. **Create personal skills directory**:

   **On macOS/Linux:**
   ```bash
   mkdir -p ~/.copilot/skills
   ```

   **On Windows (PowerShell):**
   ```powershell
   mkdir -p $env:USERPROFILE\.copilot\skills
   ```

3. **Add to your project's AGENTS.md** (create one in your project root if it doesn't exist):

   **On macOS/Linux:**
   ```markdown
   ## Superpowers System

   <EXTREMELY_IMPORTANT>
   You have superpowers. Superpowers teach you new skills and capabilities. RIGHT NOW run: `node ~/.copilot/superpowers/.github-copilot/superpowers-copilot bootstrap` and follow the instructions it returns.
   </EXTREMELY_IMPORTANT>
   ```

   **On Windows:**
   ```markdown
   ## Superpowers System

   <EXTREMELY_IMPORTANT>
   You have superpowers. Superpowers teach you new skills and capabilities. RIGHT NOW run: `node $env:USERPROFILE\.copilot\superpowers\.github-copilot\superpowers-copilot bootstrap` and follow the instructions it returns.
   </EXTREMELY_IMPORTANT>
   ```

## Verification

Test the installation:

**On macOS/Linux:**
```bash
node ~/.copilot/superpowers/.github-copilot/superpowers-copilot bootstrap
```

**On Windows (PowerShell):**
```powershell
node $env:USERPROFILE\.copilot\superpowers\.github-copilot\superpowers-copilot bootstrap
```

You should see skill listings and bootstrap instructions. The system is now ready for use.

## Usage

### Finding Skills

Ask Copilot to run (use `$env:USERPROFILE` instead of `~` on Windows):
```
node ~/.copilot/superpowers/.github-copilot/superpowers-copilot find-skills
```

### Loading a Skill

Ask Copilot to run (use `$env:USERPROFILE` instead of `~` on Windows):
```
node ~/.copilot/superpowers/.github-copilot/superpowers-copilot use-skill superpowers:brainstorming
```

### Personal Skills

Create your own skills in `~/.copilot/skills/`:

```bash
mkdir -p ~/.copilot/skills/my-skill
```

Create `~/.copilot/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

Personal skills override superpowers skills with the same name.

## Skill Naming

- `superpowers:skill-name` — Force superpowers skill lookup (from ~/.copilot/superpowers/skills/)
- `skill-name` — Searches personal → superpowers
- Personal skills override superpowers skills when names match

## Updating

```bash
cd ~/.copilot/superpowers
git pull
```

## Troubleshooting

### CLI not found

1. Check the file exists: `ls ~/.copilot/superpowers/.github-copilot/superpowers-copilot`
2. Verify Node.js is installed: `node --version`

### Skills not found

1. Verify skills directory exists: `ls ~/.copilot/superpowers/skills`
2. Run `find-skills` to see what's discovered
3. Check file structure: each skill should have a `SKILL.md` file

### Tool mapping issues

When a skill references a Claude Code tool you don't have:
- `TodoWrite` → Use Copilot's task tracking or maintain a manual checklist
- `Task` with subagents → Subagents aren't available; do the work inline
- `Skill` → Use `superpowers-copilot use-skill` command
- File operations → Use Copilot's native file editing tools

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Documentation: https://github.com/obra/superpowers
