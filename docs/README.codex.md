# Horspowers for Codex

Guide for using Horspowers with Codex through native skill discovery.

## Quick Install

Tell Codex:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/LouisHors/horspowers/refs/heads/main/.codex/INSTALL.md
```

## Manual Installation

### Prerequisites

- Codex with native skills support
- Git

### Steps

1. Clone the repo:
   ```bash
   git clone https://github.com/LouisHors/horspowers.git ~/.codex/horspowers
   ```

2. Expose the skills to Codex:
   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/.codex/horspowers/skills ~/.agents/skills/horspowers
   ```

3. Restart Codex.

### Windows

Use a junction instead of a symlink:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
cmd /c mklink /J "$env:USERPROFILE\.agents\skills\horspowers" "$env:USERPROFILE\.codex\horspowers\skills"
```

## How It Works

Codex scans `~/.agents/skills/` at startup. By exposing the repository's
`skills/` directory as `~/.agents/skills/horspowers`, the built-in skill loader
can discover Horspowers without requiring a bootstrap shell command.

Primary path:

```text
~/.agents/skills/horspowers -> ~/.codex/horspowers/skills
```

Legacy compatibility files still exist under `.codex/`, but they are no longer
the recommended entrypoint.

## Usage

Once installed, Codex can discover and use the skills directly. Typical usage
patterns:

- Mention the skill by name, such as `horspowers:brainstorming`
- Ask for work that matches a skill's description
- Let `using-horspowers` route you into the required workflow

## Tool Mapping

Horspowers skills were originally written against Claude Code tool names. In
Codex, those instructions map to native Codex tools.

See:

- `skills/using-horspowers/references/codex-tools.md`

Key mappings:

- `TodoWrite` -> `update_plan`
- `Task` / subagent dispatch -> `spawn_agent`
- Wait for agent result -> `wait_agent`
- Free completed agent -> `close_agent`
- `Skill` tool -> native skill loading

If your Codex installation gates multi-agent support behind a feature flag,
enable it in `~/.codex/config.toml`:

```toml
[features]
multi_agent = true
```

## Personal Skills

Create your own skills directly under `~/.agents/skills/`:

```bash
mkdir -p ~/.agents/skills/my-skill
```

Then add `~/.agents/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill
```

Personal skills can coexist with the `horspowers` skill pack.

## Legacy Bootstrap Compatibility

This repository still ships:

- `.codex/superpowers-codex`
- `.codex/superpowers-bootstrap.md`

They exist to help users migrate from the old bootstrap flow and to support
older install guides. Native discovery should be treated as the source of truth.

## Updating

```bash
cd ~/.codex/horspowers && git pull
```

Restart Codex if the session was already open when the update was pulled.

## Troubleshooting

### Skills not showing up

1. Verify the symlink or junction:
   ```bash
   ls -la ~/.agents/skills/horspowers
   ```

2. Verify the repo contains skills:
   ```bash
   ls ~/.codex/horspowers/skills
   ```

3. Restart Codex.

### Old bootstrap and native discovery conflict

If Codex is still following an old `AGENTS.md` bootstrap path, remove or disable
that block after native discovery is working.

### Multi-agent skills do not dispatch

If a skill references subagents and Codex does not expose `spawn_agent`, enable
multi-agent support if your Codex build requires it. Otherwise execute the task
locally and document the limitation.

## Getting Help

- Horspowers issues: https://github.com/LouisHors/horspowers/issues
- Upstream project: https://github.com/obra/superpowers
