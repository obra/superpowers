# Superpowers for GitHub Copilot - Detailed Documentation

## Overview

Superpowers integrates seamlessly with GitHub Copilot through the **Agent Skills** standard. This is the same standard used across Claude Code, VS Code, Copilot CLI, and GitHub Copilot coding agent, making Superpowers skills portable across all these platforms.

## What Are Agent Skills?

Agent Skills are folders containing:
- `SKILL.md` - Main instruction file with YAML frontmatter
- Optional supporting resources (scripts, examples, references)

Skills are discovered by AI agents based on their `name` and `description`, then loaded on-demand when relevant to your task.

## How GitHub Copilot Discovers Skills

Copilot uses a **progressive disclosure** loading system:

1. **Discovery**: Copilot reads the `name` and `description` from SKILL.md frontmatter
2. **Matching**: When your query matches a skill's description, Copilot considers loading it
3. **Loading**: Only then does Copilot load the full SKILL.md content into context

This means you can have dozens of skills installed without overwhelming the AI's context window.

## Skill Locations

GitHub Copilot searches for skills in multiple locations, in order of precedence:

### 1. Repository Skills (`.github/skills/`)
**Path**: `.github/skills/<skill-name>/SKILL.md`

**Use case**: Project-specific workflows, team standards, or when you want skills available to all collaborators.

**Example**:
```text
your-project/
├── .github/
│   └── skills/
│       ├── brainstorming/
│       │   └── SKILL.md
│       ├── test-driven-development/
│       │   └── SKILL.md
│       └── ...
```

### 2. Alternative Repository Location (`.claude/skills/`)
**Path**: `.claude/skills/<skill-name>/SKILL.md`

**Use case**: Cross-compatibility with Claude Code. Copilot recognizes this location too.

### 3. Personal Skills (`~/.copilot/skills/`)
**Path**: `~/.copilot/skills/<skill-name>/SKILL.md`

**Use case**: Skills that follow you across all projects, personal preferences, or when working solo.

### 4. Alternative Personal Location (`~/.claude/skills/`)
**Path**: `~/.claude/skills/<skill-name>/SKILL.md`

**Use case**: Shared with Claude Code for consistency.

## Installation Patterns

### Pattern 1: Symlink to Repository (Recommended)

```bash
# Clone once
git clone https://github.com/obra/superpowers.git ~/.local/share/superpowers

# Symlink each skill directly in each project
cd your-project
mkdir -p .github/skills
ln -s ~/.local/share/superpowers/skills/* .github/skills/
```

**Benefits**:
- Single source of truth (one clone, many projects)
- Easy updates (`cd ~/.local/share/superpowers && git pull`)
- Skills are placed directly in `.github/skills/<skill-name>/` for proper discovery

**Note**: Each developer must run these steps locally. The symlinks target a user-specific path and should not be committed.

### Pattern 2: Personal Skills Directory

```bash
# Clone once
git clone https://github.com/obra/superpowers.git ~/.local/share/superpowers

# Symlink to personal directory
mkdir -p ~/.copilot/skills
ln -s ~/.local/share/superpowers/skills/* ~/.copilot/skills/
```

**Benefits**:
- Skills available in all projects automatically
- No per-project setup needed
- Great for solo developers or personal workflows

### Pattern 3: Direct Clone (Simple but Less Flexible)

```bash
cd your-project
mkdir -p .github/skills
git submodule add https://github.com/obra/superpowers.git .github/skills/superpowers
```

**Tradeoffs**:
- Adds a git submodule
- Must update per-project (`cd .github/skills/superpowers && git pull`)
- Team members need `git submodule update --init` after cloning

## Using Skills in VS Code

### Explicit Invocation with Slash Commands

Type `/skill-name` in Copilot Chat:

```text
/brainstorming help me design a user authentication system
```

```text
/test-driven-development write tests for my new API endpoint
```

```text
/systematic-debugging diagnose this race condition
```

### Automatic Loading Based on Context

Copilot automatically loads skills when their description matches your query:

**You**: "I need to debug a complex async issue with race conditions"

**Copilot**: Automatically loads `systematic-debugging` skill and applies its 4-phase root cause process.

### Viewing Available Skills

Type `/skills` in Copilot Chat to see all discovered skills and their descriptions.

## Using Skills in GitHub Copilot CLI

Skills work seamlessly with the CLI:

```bash
# Copilot automatically loads relevant skills
gh copilot suggest "write comprehensive tests for my API"

# Skills from ~/.copilot/skills/ are available
gh copilot explain "how does this error handling work"
```

## Using Skills with GitHub Copilot Coding Agent

When you assign an issue to Copilot on GitHub.com:

1. Ensure your repository has skill directories in `.github/skills/`
2. The coding agent discovers skills automatically
3. Skills are applied based on the issue description
4. Execution logs show which skills were loaded

## Skill Structure

Each Superpowers skill follows this format:

```markdown
---
name: skill-name
description: When to use this skill and what it does
---

# Skill Title

## Main instructions here...
```

**Frontmatter fields**:
- `name`: Kebab-case identifier (matches directory name)
- `description`: Used by Copilot to decide when to load the skill

**Body**: Markdown content with instructions, examples, and guidelines.

## Custom Instructions vs Skills

GitHub Copilot supports both **custom instructions** and **skills**. Here's when to use each:

### Custom Instructions (`.github/copilot-instructions.md`)
**Use for**: Always-on background guidance
- Project coding standards
- Architecture notes
- How to build/test/deploy
- Libraries to prefer/avoid

**Loading**: Always included in every Copilot request

### Skills (`.github/skills/*/SKILL.md`)
**Use for**: On-demand specialized workflows
- Specific debugging techniques
- TDD workflows
- Code review checklists
- Planning methodologies

**Loading**: Only loaded when relevant to current task

### Using Both Together

Superpowers includes an optional `.github/copilot-instructions.md` that provides high-level context about the skills library. This helps Copilot understand that skills are available and when to use them.

## Precedence and Conflicts

When the same skill exists in multiple locations:

1. **Repository skills** (`.github/skills/`) take highest precedence
2. **Personal skills** (`~/.copilot/skills/`) are used as fallback
3. If skill names conflict, repository wins

This allows teams to override personal skills with project-specific versions.

## Updating Skills

### If Installed via Symlink
```bash
cd ~/.local/share/superpowers  # or wherever you cloned it
git pull
```

Skills update immediately across all projects using the symlink.

### If Added as Submodule
```bash
cd .github/skills/superpowers
git pull
```

Must be done per-project.

## Troubleshooting

### Skills Don't Appear in /skills Menu

**Check skill directories exist**:
```bash
ls -la .github/skills/
ls -la ~/.copilot/skills/
```

**Verify SKILL.md files**:
```bash
# Should show multiple SKILL.md files
ls -la ~/.local/share/superpowers/skills/*/SKILL.md
```

**Check symlinks are valid**:
```bash
# Symlinks should point to actual skill directories
ls -la .github/skills/
# Should show skill directories, not "No such file"
```

**Restart VS Code**: Fresh start picks up new skills.

### Skills Not Loading Automatically

**Check skill descriptions**: Run this to see all skill descriptions:
```bash
grep "^description:" ~/.local/share/superpowers/skills/*/SKILL.md
```

Copilot matches based on these descriptions. If your query doesn't match any description, try explicit invocation with `/skill-name`.

**Be specific in your query**: Instead of "help me code", try "help me write tests with TDD" (matches test-driven-development skill).

### Skill Loads but Doesn't Work as Expected

**Check the skill content**:
```bash
cat ~/.local/share/superpowers/skills/brainstorming/SKILL.md
```

Skills are instructions for Copilot, not executable code. The AI interprets and applies them, so results depend on:
- How well the skill matches your task
- Your query clarity
- The AI model's understanding

### Copilot Says "Skill Not Found"

**Verify exact name**: Skill names must match directory names exactly:
```text
# Correct:
/test-driven-development

# Wrong (no kebab-case):
/test_driven_development
/testDrivenDevelopment
```

### Skills Work in VS Code but Not CLI

CLI requires Copilot CLI to be properly configured:
```bash
gh auth status
gh copilot --version
```

Personal skills in `~/.copilot/skills/` work with CLI. Repository skills in `.github/skills/` only work when running CLI from within that repository.

## Advanced Configuration

### Adding Custom Search Paths (VS Code Only)

You can configure additional skill locations in VS Code settings:

1. Open Settings (Ctrl+, / Cmd+,)
2. Search for `chat.agentSkillsLocations`
3. Add paths to additional skill directories

Example:
```json
{
  "chat.agentSkillsLocations": [
    "/path/to/company-wide/skills",
    "/path/to/team/skills"
  ]
}
```

### Disabling Automatic Skill Loading

If you only want explicit `/skill-name` invocation:

1. Check skill frontmatter
2. Some skills support `user-invokable: true` and `disable-model-invocation: true`
3. Superpowers skills currently auto-load by design

## Verifying Installation

Run this verification script:

```bash
#!/bin/bash
echo "=== Superpowers for Copilot - Verification ==="
echo ""

echo "1. Checking personal skills directory..."
if [ -d "$HOME/.copilot/skills" ] && ls "$HOME/.copilot/skills"/*/SKILL.md &>/dev/null; then
    echo "   ✓ Personal skills found at ~/.copilot/skills/"
    ls "$HOME/.copilot/skills" | head -5
else
    echo "   ✗ Personal skills not found"
fi
echo ""

echo "2. Checking repository skills (if in a project)..."
if [ -d ".github/skills" ] && ls .github/skills/*/SKILL.md &>/dev/null; then
    echo "   ✓ Repository skills found at .github/skills/"
    ls ".github/skills" | head -5
else
    echo "   ✗ Repository skills not found (this is OK if using personal skills)"
fi
echo ""

echo "3. Checking symlink validity..."
for skill in "$HOME/.copilot/skills"/*/; do
    if [ -L "$skill" ]; then
        TARGET=$(readlink "$skill")
        echo "   ✓ $(basename "$skill") → $TARGET"
        if [ -d "$TARGET" ]; then
            echo "     ✓ Target exists"
        else
            echo "     ✗ Target missing - reinstall needed"
        fi
        break  # Just check first one as sample
    fi
done
echo ""

echo "4. Counting available skills..."
SKILL_COUNT=$(find ~/.local/share/superpowers/skills -name "SKILL.md" 2>/dev/null | wc -l)
echo "   Found $SKILL_COUNT skills"
echo ""

echo "5. Sample skills:"
find ~/.local/share/superpowers/skills -name "SKILL.md" 2>/dev/null | head -5 | xargs -I {} dirname {} | xargs -I {} basename {}
```

## Further Reading

- **Agent Skills Standard**: https://agentskills.io
- **GitHub Copilot Docs**: https://docs.github.com/copilot
- **Superpowers Blog**: https://blog.fsck.com/2025/10/09/superpowers/
- **Main README**: [../README.md](../README.md)

## Getting Help

- **GitHub Issues**: https://github.com/obra/superpowers/issues
- **Quick Install**: [../.copilot/INSTALL.md](../.copilot/INSTALL.md)
- **Testing Guide**: [./testing.md](./testing.md)
