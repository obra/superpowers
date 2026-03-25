# Superpowers for Windsurf

Complete guide for using Superpowers with [Windsurf](https://windsurf.com).

## Quick Install

Tell Windsurf Cascade:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.windsurf/INSTALL.md
```

## Manual Installation

### Prerequisites

- Windsurf Editor installed
- Git installed

### Steps

1. Clone the repo:
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.codeium/windsurf/superpowers
   ```

2. Copy skills to global skills directory:
   ```bash
   mkdir -p ~/.codeium/windsurf/skills
   
   for skill in ~/.codeium/windsurf/superpowers/skills/*; do
     skill_name=$(basename "$skill")
     rm -rf ~/.codeium/windsurf/skills/"$skill_name"
     cp -r "$skill" ~/.codeium/windsurf/skills/"$skill_name"
   done
   ```

3. Set up the global rule (see [.windsurf/INSTALL.md](../.windsurf/INSTALL.md#installation) for detailed steps)

4. Restart Windsurf.

### Windows

For Windows installation steps, see [.windsurf/INSTALL.md](../.windsurf/INSTALL.md).

## How It Works

Windsurf has native skill discovery — it scans `~/.codeium/windsurf/skills/` at startup, parses SKILL.md frontmatter, and loads skills on demand. Superpowers skills are copied to the global skills directory:

```
~/.codeium/windsurf/skills/brainstorming/
~/.codeium/windsurf/skills/test-driven-development/
~/.codeium/windsurf/skills/systematic-debugging/
...
```

The global rule at `~/.codeium/windsurf/memories/global_rules.md` enforces skill usage discipline — ensuring Cascade checks for and uses relevant skills before taking action.

### How the Global Rule Works

The installation adds a small instruction to your `global_rules.md` that points Cascade to the full Superpowers discipline rules. This avoids the 6,000 character limit and keeps rules up-to-date when you `git pull`.

### Cross-Platform Compatibility

Windsurf also discovers skills in `.agents/skills/` and `~/.agents/skills/` for cross-agent compatibility with Codex and OpenCode.

## Usage

Skills are discovered automatically. Cascade activates them when:
- You mention a skill by name (e.g., "use brainstorming")
- The task matches a skill's description
- The superpowers discipline rule directs Cascade to use one

### Manual Invocation

You can explicitly activate a skill by typing `@skill-name` in Cascade (e.g., `@brainstorming`, `@test-driven-development`).

### Available Skills

All skills from the Superpowers library are available:

**Testing**
- `test-driven-development` - RED-GREEN-REFACTOR cycle

**Debugging**
- `systematic-debugging` - 4-phase root cause process
- `verification-before-completion` - Ensure it's actually fixed

**Collaboration** 
- `brainstorming` - Socratic design refinement
- `writing-plans` - Detailed implementation plans
- `executing-plans` - Batch execution with checkpoints
- `requesting-code-review` - Pre-review checklist
- `receiving-code-review` - Responding to feedback
- `using-git-worktrees` - Parallel development branches
- `finishing-a-development-branch` - Merge/PR decision workflow

**Meta**
- `writing-skills` - Create new skills following best practices
- `using-superpowers` - Introduction to the skills system

### Personal Skills

Create your own skills in `~/.codeium/windsurf/skills/`:

```bash
mkdir -p ~/.codeium/windsurf/skills/my-skill
```

Create `~/.codeium/windsurf/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

The `description` field is how Cascade decides when to activate a skill automatically — write it as a clear trigger condition.

### Project Skills

Create project-specific skills in `.windsurf/skills/` within your project:

```bash
mkdir -p .windsurf/skills/my-project-skill
```

Create `.windsurf/skills/my-project-skill/SKILL.md` following the same format.

## Skill Locations

Windsurf discovers skills from these locations (in priority order):

1. **Project skills** (`.windsurf/skills/`) - Highest priority
2. **Global skills** (`~/.codeium/windsurf/skills/`) - Used by Superpowers installation

## Limitations

### Subagent Skills Use Different Mechanism

Windsurf Cascade does not have a `Task` tool for spawning subagents within a conversation. However, the following skills **are fully compatible** with Windsurf using **Simultaneous Cascades** (optionally with **Worktrees**):

- `dispatching-parallel-agents` - Use multiple Cascade tabs for parallel execution
- `subagent-driven-development` - Use Cascade tabs with Worktrees for isolated task execution

**How it works:**
- Open new Cascade tabs for each parallel task (like spawning subagents)
- Use **Worktree mode** when tasks might edit the same files (recommended default)
- Use basic parallel Cascades when tasks operate on completely separate files/repos
- Click "Merge" to bring Worktree changes back to main workspace

See each skill's "Platform Adaptation" section for detailed Windsurf instructions.


## Updating

```bash
cd ~/.codeium/windsurf/superpowers && git pull

# Re-copy skills to pick up updates and new skills
for skill in ~/.codeium/windsurf/superpowers/skills/*; do
  skill_name=$(basename "$skill")
  rm -rf ~/.codeium/windsurf/skills/"$skill_name"
  cp -r "$skill" ~/.codeium/windsurf/skills/"$skill_name"
done
```

Skills will be updated after running the copy commands above.

## Uninstalling

```bash
cd ~/.codeium/windsurf/superpowers/skills
for skill in *; do
  rm -rf ~/.codeium/windsurf/skills/"$skill"
done
```

**Note:** To fully remove Superpowers, also delete the global rule reference. See [.windsurf/INSTALL.md](../.windsurf/INSTALL.md#uninstalling) for details.

## Troubleshooting

### Skills not showing up

1. Verify the skills: `ls ~/.codeium/windsurf/skills/`
2. Check skills exist: `ls ~/.codeium/windsurf/superpowers/skills`
3. Restart Windsurf — skills are discovered at startup

### Rule not being applied

1. Check rule file exists: `ls ~/.codeium/windsurf/memories/global_rules.md`
2. Verify the global rule file is properly formatted
3. Restart Windsurf to reload rules

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
- Windsurf documentation: https://docs.windsurf.com
