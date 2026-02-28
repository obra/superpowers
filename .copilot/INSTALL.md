# Installing Superpowers for GitHub Copilot

## Prerequisites

- [GitHub Copilot](https://github.com/features/copilot) subscription
- VS Code with GitHub Copilot extension installed, OR
- GitHub Copilot CLI, OR
- Access to GitHub Copilot coding agent

## Installation Steps

GitHub Copilot natively supports the Agent Skills standard that Superpowers uses. You can install skills at the repository level or personal level.

### Option 1: Repository-Level Installation (Recommended for Project Work)

Install skills into your project's `.github/skills/` directory:

```bash
# Clone Superpowers to a known location
git clone https://github.com/obra/superpowers.git ~/.local/share/superpowers

# In your project directory, symlink each skill directly
mkdir -p .github/skills
ln -s ~/.local/share/superpowers/skills/* .github/skills/
```

**Note:** Each developer must run these steps locally. The symlinks target a user-specific path and should not be committed to the repo.

### Option 2: Personal Installation (Skills Available Everywhere)

Install skills globally for your user:

```bash
# Clone Superpowers to a known location
git clone https://github.com/obra/superpowers.git ~/.local/share/superpowers

# Create symlink in Copilot's personal skills directory
mkdir -p ~/.copilot/skills
ln -s ~/.local/share/superpowers/skills/* ~/.copilot/skills/
```

**Benefits:** Skills follow you across all projects where you use Copilot.

### Option 3: Direct Clone into .github/skills/ (Simple but Less Flexible)

```bash
# In your project directory, add as a submodule
mkdir -p .github/skills
git submodule add https://github.com/obra/superpowers.git .github/skills/superpowers
# Expose skills at Copilot's expected discovery path
ln -s .github/skills/superpowers/skills/* .github/skills/
```

**Note:** This adds a git submodule. Updates require `cd .github/skills/superpowers && git pull`. Team members need `git submodule update --init` after cloning.

## Verification

### In VS Code

1. Open Copilot Chat (Ctrl+Shift+I / Cmd+Shift+I)
2. Type `/skills` in the chat input
3. You should see Superpowers skills listed (e.g., brainstorming, test-driven-development, systematic-debugging)

### Test a Skill

Try invoking a skill directly:

```text
/brainstorming help me design a new feature
```

Or let Copilot auto-select skills based on context:

```text
I need to debug a complex race condition in my async code
```

Copilot should automatically load the `systematic-debugging` skill.

## Updating

```bash
cd ~/.local/share/superpowers  # or wherever you cloned it
git pull
```

Skills update immediately—no restart needed.

## Troubleshooting

### Skills not appearing in /skills menu

1. **Check symlinks**:
   ```bash
   ls -la .github/skills/  # for repo-level
   ls -la ~/.copilot/skills/  # for personal
   ```

2. **Verify SKILL.md files exist**:
   ```bash
   ls -la ~/.local/share/superpowers/skills/*/SKILL.md
   ```

3. **Restart VS Code** if skills were just installed

4. **Check Copilot is enabled**: Ensure GitHub Copilot extension is active and authenticated

### Skills not loading automatically

- Skills load based on their `description` field in the SKILL.md frontmatter
- Try explicitly invoking with `/skill-name` first
- Check the skill's description matches your use case

### Can I use both repository and personal skills?

Yes! Copilot loads skills from both locations. Repository skills take precedence if there are naming conflicts.

## Using with GitHub Copilot CLI

Skills work the same way with the CLI:

```bash
# Copilot CLI uses the same ~/.copilot/skills/ directory
gh copilot suggest "help me write a test"
```

The CLI will automatically load relevant skills (like test-driven-development).

## Using with GitHub Copilot Coding Agent

When assigning issues to Copilot coding agent on GitHub.com:

1. Ensure your repository has skills symlinked in `.github/skills/`
2. The coding agent automatically discovers and uses skills
3. Skills are listed in the agent's execution logs

## What Skills Are Available?

See the main [README.md](../README.md) for the complete skills library. Key skills include:

- **test-driven-development** - RED-GREEN-REFACTOR cycle
- **systematic-debugging** - 4-phase root cause process
- **brainstorming** - Socratic design refinement
- **writing-plans** - Detailed implementation plans
- **executing-plans** - Batch execution with checkpoints
- **requesting-code-review** - Pre-review checklist
- **subagent-driven-development** - Fast iteration with review

## Getting Help

- **Issues**: https://github.com/obra/superpowers/issues
- **Documentation**: ../docs/README.copilot.md
