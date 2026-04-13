# Superpowers for Qoder

Complete guide for using Superpowers with [Qoder](https://qoder.com) IDE and CLI.

## Quick Install

Run in Qoder IDE terminal:

```bash
npx skills add https://github.com/obra/superpowers -a qoder
```

Restart Qoder. All skills are automatically installed and discoverable.

## Manual Installation

### Prerequisites

- [Qoder IDE](https://qoder.com/download) or Qoder CLI
- Git

### Steps

1. Clone the repo:
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.qoder/superpowers
   ```

2. Link skills into the Qoder skills directory:
   ```bash
   mkdir -p ~/.qoder/skills
   ln -s ~/.qoder/superpowers/skills/* ~/.qoder/skills/
   ```

3. Restart Qoder.

## How It Works

Qoder scans two locations for skills at startup:

| Location | Path | Scope |
| --- | --- | --- |
| User-level | `~/.qoder/skills/{skill-name}/SKILL.md` | All projects for current user |
| Project-level | `.qoder/skills/{skill-name}/SKILL.md` | Current project only |

Each skill directory contains a `SKILL.md` file with YAML frontmatter (name, description, tags) and markdown content. Qoder parses the frontmatter to determine when to activate each skill.

When both user-level and project-level skills share the same name, the **project-level skill takes priority**.

## Usage

### Automatic Trigger

Describe your need directly. Qoder's model automatically determines whether to use an appropriate skill:

```
Help me plan this feature
```

The model will automatically recognize and invoke the relevant superpowers skill (e.g., `brainstorming`).

### Manual Trigger

Type `/` in the chat dialog to see all loaded skills, then select one. Or invoke directly by name:

```
/brainstorming
```

### Available Skills

After installation, all superpowers skills are available:

- **brainstorming** — Socratic design refinement
- **writing-plans** — Detailed implementation plans
- **executing-plans** — Batch execution with checkpoints
- **test-driven-development** — RED-GREEN-REFACTOR cycle
- **systematic-debugging** — 4-phase root cause process
- **subagent-driven-development** — Fast iteration with two-stage review
- **requesting-code-review** — Pre-review checklist
- **receiving-code-review** — Responding to feedback
- **using-git-worktrees** — Parallel development branches
- **finishing-a-development-branch** — Merge/PR decision workflow
- **dispatching-parallel-agents** — Concurrent subagent workflows
- **verification-before-completion** — Ensure it's actually fixed
- **writing-skills** — Create new skills following best practices
- **using-superpowers** — Introduction to the skills system

## Personal Skills

Create your own skills in `~/.qoder/skills/`:

```bash
mkdir -p ~/.qoder/skills/my-skill
```

Create `~/.qoder/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

The `description` field is how Qoder decides when to activate a skill automatically — write it as a clear trigger condition.

You can also use Qoder's built-in `/create-skill` command to generate a skill interactively:

```
/create-skill Convert Word documents to PDF
```

### Project-level Skills

For skills specific to a project, place them in `.qoder/skills/` at the project root:

```
my-project/
  .qoder/
    skills/
      my-project-skill/
        SKILL.md
```

These skills are only available when working within that project.

## Updating

### Skills CLI

```bash
npx skills add https://github.com/obra/superpowers -a qoder
```

### Manual

```bash
cd ~/.qoder/superpowers && git pull
```

Skills update instantly through the symlinks.

## Uninstalling

```bash
# Remove skill symlinks
find ~/.qoder/skills -maxdepth 1 -type l -delete
```

Optionally delete the clone: `rm -rf ~/.qoder/superpowers`.

## Troubleshooting

### Skills not showing up

1. Type `/` in chat to check loaded skills list
2. Verify the skill files exist: `ls ~/.qoder/skills/`
3. Each skill needs a `SKILL.md` file with valid YAML frontmatter
4. Restart Qoder — skills are discovered at startup

### Skills CLI installation fails

1. Make sure Node.js and npm are installed
2. Try running the command in a standard terminal instead of Qoder's built-in terminal
3. Check network connectivity to GitHub

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
- Qoder docs: https://docs.qoder.com/extensions/skills
