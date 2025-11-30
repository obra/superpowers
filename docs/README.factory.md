# Superpowers for Droid CLI (Factory)

Complete guide for using Superpowers with Factory's Droid CLI.

## Overview

Droid CLI has native support for skills and task dispatching, making Superpowers integration straightforward:

- **Native `Skill` tool** - Load skills directly without CLI scripts
- **Native `Task` tool** - Dispatch droids (subagents) for parallel work
- **`AGENTS.md` context injection** - Protocol loaded automatically each session
- **Native `TodoWrite`** - Task tracking built-in

## Installation

### One-Line Install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/obra/superpowers/main/.factory/install.sh | bash
```

### Quick Install via Droid

Tell Droid:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/main/.factory/INSTALL.md
```

### Manual Installation

See [.factory/INSTALL.md](../.factory/INSTALL.md) for step-by-step instructions.

## Verification

After installation, start a **new Droid CLI session** and verify:

| Test | Command/Prompt | Expected |
|------|----------------|----------|
| Commands work | `/brainstorm` | AI calls `Skill("brainstorming")` tool |
| Auto-detection | "I want to build a todo app" | AI uses brainstorming skill |
| Droids available | "What droids can you dispatch?" | Lists general-purpose, code-reviewer, etc. |
| Protocol active | "Help debug: undefined error" | AI uses systematic-debugging skill |

See [INSTALL.md](../.factory/INSTALL.md#verification) for detailed test cases.

## Usage

### Commands

Superpowers provides shortcut commands:

| Command | Description |
|---------|-------------|
| `/brainstorm` | Start interactive design refinement |
| `/write-plan` | Create detailed implementation plan |
| `/execute-plan` | Execute plan with review checkpoints |

### Skills are Automatic

The `AGENTS.md` protocol ensures the AI checks for applicable skills before every response. You don't need to manually invoke skills - they activate automatically based on context.

### Manual Skill Loading

If needed, you can explicitly request a skill:

```
Use the systematic-debugging skill to help me fix this bug
```

### Finding Skills

Ask Droid:

```
What skills are available?
```

Or check the directory:

```bash
ls ~/.factory/skills/
```

### Dispatching Droids

The `subagent-driven-development` skill automatically dispatches droids using the `Task` tool:

```
Task(
  subagent_type: "general-purpose",
  description: "Implement Task 1",
  prompt: "..."
)
```

Available droids:

| Droid | Purpose |
|-------|---------|
| `general-purpose` | Implementation tasks |
| `code-reviewer` | Code review |
| `explore` | Read-only codebase search |
| `plan` | Planning research |

## Workflow

### Automatic Chain

```
brainstorming → writing-plans → [execution choice] → TDD per task → code-review → finishing-branch
```

### Execution Options

After `writing-plans`, the AI offers:

1. **Subagent-Driven (same session)**
   - Fresh droid per task
   - Automatic code review between tasks
   - Fast iteration

2. **Parallel Session (separate)**
   - Human review checkpoints
   - Batch execution
   - More oversight

### Contextual Skills

These activate based on situation:

| Situation | Skill |
|-----------|-------|
| Bug/error | `systematic-debugging` |
| Flaky tests | `condition-based-waiting` |
| 3+ independent failures | `dispatching-parallel-agents` |
| Deep debugging | `root-cause-tracing` |

## Architecture

### Directory Structure

```
~/.factory/
├── AGENTS.md              # Protocol (auto-loaded each session)
├── skills/                # Skills
│   ├── brainstorming/
│   ├── test-driven-development/
│   └── ...
├── droids/                # Droid definitions
│   ├── general-purpose.md
│   ├── code-reviewer.md
│   ├── explore.md
│   └── plan.md
├── commands/              # Shortcut commands
│   ├── brainstorm.md
│   ├── write-plan.md
│   └── execute-plan.md
└── superpowers/           # Cloned repository
    └── .factory/
```

### How It Works

1. **Session Start**: Droid CLI loads `~/.factory/AGENTS.md` into context
2. **Protocol Active**: AI follows superpowers protocol for every request
3. **Skill Check**: AI checks `<available_skills>` before responding
4. **Skill Load**: AI uses native `Skill("skill-name")` tool
5. **Droid Dispatch**: AI uses native `Task` tool for subagent work

### Tool Mapping

| Superpowers Concept | Droid CLI Implementation |
|---------------------|--------------------------|
| Load skill | `Skill("skill-name")` tool |
| Dispatch subagent | `Task(subagent_type: "droid-name", ...)` |
| Track tasks | `TodoWrite` tool |
| File operations | `Read`, `Edit`, `Create`, `Grep`, `Glob` |
| Run commands | `Execute` tool |

### Terminology

| Claude Code | Droid CLI |
|-------------|-----------|
| Subagent | Droid |
| CLAUDE.md | AGENTS.md |
| ~/.claude/ | ~/.factory/ |

## Personal Skills

Create custom skills in `~/.factory/skills/`:

```bash
mkdir -p ~/.factory/skills/my-custom-skill
```

Create `SKILL.md`:

```markdown
---
name: my-custom-skill
description: Use when [condition] - [what it does]
---

# My Custom Skill

[Skill content here]
```

Personal skills override superpowers skills with the same name.

## Updating

```bash
cd ~/.factory/superpowers
git pull
~/.factory/superpowers/.factory/install.sh
```

## Troubleshooting

### Skills Not Loading

1. Verify skills exist: `ls ~/.factory/skills/`
2. Check AGENTS.md has protocol: `grep "SUPERPOWERS" ~/.factory/AGENTS.md`
3. Restart Droid CLI session (AGENTS.md loads at session start)

### Droids Not Dispatching

1. Verify droids exist: `ls ~/.factory/droids/`
2. Check droid has correct frontmatter: `head -10 ~/.factory/droids/general-purpose.md`

### AI Skipping Protocol

The AI may rationalize skipping skills. If this happens:
- Remind: "Please follow the superpowers protocol"
- Check AGENTS.md has anti-rationalization rules
- Report persistent issues on GitHub

## Differences from Claude Code

| Feature | Claude Code | Droid CLI |
|---------|-------------|-----------|
| Skill loading | Built-in `/skill` command | Native `Skill` tool |
| Subagents | Built-in Task tool | Native `Task` tool with droids |
| Context injection | CLAUDE.md + hooks | AGENTS.md (auto-loaded) |
| Installation | Plugin marketplace | One-line script |

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Factory docs: https://docs.factory.ai/
- Superpowers blog: https://blog.fsck.com/2025/10/09/superpowers/
