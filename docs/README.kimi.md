# Superpowers for Kimi Code CLI

Guide for using Superpowers with Kimi Code CLI via native skill discovery.

## Quick Install

Tell Kimi:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/docs/README.kimi.md
```

## Manual Installation

### Prerequisites

- Kimi Code CLI 1.29+ (hierarchical AGENTS.md loading); tested on 1.32.0
- Git

### Steps

1. Clone the repo:
   ```bash
   git clone https://github.com/obra/superpowers.git ~/superpowers
   ```

2. Point Kimi at the skills directory at launch:
   ```bash
   kimi --skills-dir ~/superpowers/skills
   ```

   Or make it permanent with a shell alias:
   ```bash
   echo 'alias kimi="kimi --skills-dir ~/superpowers/skills"' >> ~/.bashrc
   source ~/.bashrc
   ```

3. (Recommended) Add AGENTS.md reinforcement — see below.

## Why AGENTS.md Reinforcement

Kimi's native skill discovery injects skill *names, paths, and descriptions* into the system prompt. In testing, this was not sufficient for Kimi to consistently invoke skills on ambiguous prompts — it would see the skills but skip them.

Adding an `~/.kimi/AGENTS.md` with explicit "invoke skills first" rules produces the same reinforcement that Claude Code's plugin provides natively. Kimi 1.29 added hierarchical AGENTS.md loading (merged into the system prompt, 32 KiB budget).

### Recommended AGENTS.md

Create `~/.kimi/AGENTS.md` (user-level, one-time setup) or `./AGENTS.md` in your project (per-project):

```markdown
# Superpowers skill reinforcement

This machine uses the superpowers skill library. The rules below override default behavior.

## Using Superpowers skills

If you think there is even a 1% chance a skill might apply, invoke the skill via `/skill:<name>` before any other action — including clarifying questions.

### Priority order

1. Process skills first — `brainstorming` (creative work), `systematic-debugging` (bugs), `writing-plans` (multi-step tasks)
2. Implementation skills second — only after the process skill has run

### Examples

- "Build me X" / "help me build X" → `/skill:brainstorming` first. No code until brainstorming is complete.
- "Fix this bug" / "something is broken" → `/skill:systematic-debugging` first.
- Writing new tests or features → `/skill:test-driven-development`.

### Red flags — stop and invoke a skill

- "This is just a simple question" → skills still apply
- "Let me explore first" → skills tell you HOW
- "The skill is overkill" → use it anyway
```

Keep it under 32 KiB. Project-level AGENTS.md overrides user-level where they conflict.

## How It Works

Kimi Code CLI scans multiple skill directories at startup:

- User-level: `~/.kimi/skills/`, `~/.claude/skills/`, `~/.codex/skills/` (brand group, mutually exclusive), plus `~/.config/agents/skills/` and `~/.agents/skills/` (generic)
- Project-level: `.kimi/skills/`, `.claude/skills/`, `.agents/skills/`
- Custom: any path passed with `--skills-dir`

The `--skills-dir` flag is the cleanest integration — no files copied or symlinked, updates via `git pull` in the clone dir. If you already have superpowers installed for Claude Code at `~/.claude/skills/`, Kimi reads it there natively with no flag needed.

## Usage

Skills are discovered automatically. Kimi activates them when:
- You mention a skill by name (e.g., "use brainstorming")
- The task matches a skill's description
- AGENTS.md rules point Kimi at one

Invoke a skill manually with the `/skill` slash command:

```
/skill:brainstorming
/skill:writing-plans
/skill:test-driven-development
```

### Personal Skills

Create your own skills in `~/.kimi/skills/`:

```bash
mkdir -p ~/.kimi/skills/my-skill
```

Create `~/.kimi/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

The `description` field is how Kimi decides when to activate a skill automatically — write it as a clear trigger condition.

## Limitations

- **Skill tool**: Kimi CLI uses `/skill:name` slash commands instead of a `Skill` tool. See `references/kimi-tools.md` for the full tool mapping.
- **Task management**: Kimi uses `SetTodoList` (full list replacement) rather than Claude Code's per-task CRUD tools.
- **Named agents**: Subagent skills dispatch using Kimi's `coder`/`explore`/`plan` types with the agent's prompt template as content.
- **NotebookEdit**: No equivalent in Kimi CLI.
- **SessionStart hooks**: Kimi's `[[hooks]] event = "SessionStart"` fires and runs the script, but the script's stdout is not injected into LLM context. Don't try to replicate Claude Code's plugin priming this way — use AGENTS.md instead.

## Updating

```bash
cd ~/superpowers && git pull
```

Skills update instantly — `--skills-dir` reads the current state of the clone.

## Uninstalling

1. Remove the alias from `~/.bashrc` (if added).
2. Delete the clone: `rm -rf ~/superpowers`
3. Remove `~/.kimi/AGENTS.md` (if added) or revert any per-project AGENTS.md.

## Troubleshooting

### Skills not showing up

1. Check Kimi CLI version: `kimi --version` (requires 1.29+ for AGENTS.md)
2. Verify the skills directory: `ls ~/superpowers/skills` — should show `brainstorming`, `writing-plans`, etc.
3. Inside Kimi, ask: `list every skill you can see and which directory each comes from` — all 15 superpowers skills should be listed with paths in `~/superpowers/skills/`.

### Kimi ignores skills on ambiguous prompts

This is the default behavior without AGENTS.md. Add `~/.kimi/AGENTS.md` with the template above — see "Why AGENTS.md Reinforcement."

### Hook didn't fire / stdout missing from context

SessionStart hooks execute but their stdout isn't injected. This is documented in Limitations. Use AGENTS.md for context injection instead.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
