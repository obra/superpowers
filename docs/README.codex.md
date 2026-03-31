# Superpowers for Codex

Guide for using Superpowers with OpenAI Codex via native skill discovery.

## Quick Install

Tell Codex:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md
```

## Manual Installation

### Prerequisites

- OpenAI Codex CLI
- Git

### Steps

1. Clone the repo:
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.codex/superpowers
   ```

2. Create the skills symlink:
   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/.codex/superpowers/skills ~/.agents/skills/superpowers
   ```

3. Restart Codex.

4. **For subagent skills** (optional): Skills like `dispatching-parallel-agents` and `subagent-driven-development` require Codex's multi-agent feature. Add to your Codex config:
   ```toml
   [features]
   multi_agent = true
   ```

### Windows

Use a junction instead of a symlink (works without Developer Mode):

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
cmd /c mklink /J "$env:USERPROFILE\.agents\skills\superpowers" "$env:USERPROFILE\.codex\superpowers\skills"
```

## How It Works

Codex has native skill discovery — it scans `~/.agents/skills/` at startup, parses SKILL.md frontmatter, and loads skills on demand. Superpowers skills are made visible through a single symlink:

```
~/.agents/skills/superpowers/ → ~/.codex/superpowers/skills/
```

The `using-superpowers` skill is discovered automatically and enforces skill usage discipline — no additional configuration needed.

## Optional advanced setup: SessionStart hook

Native skill discovery is the recommended setup for Codex and is enough for normal Superpowers usage.

For advanced users on Linux, macOS, and WSL, Codex can also run an optional `SessionStart` hook to make startup behavior more explicit and closer to the existing Superpowers bootstrap flow.

Windows currently does not support Codex lifecycle hooks, so this optional setup does not apply there.

### Why you might want this

- Explicit startup bootstrap on each new session
- Startup behavior closer to the existing Superpowers hook flow
- A fallback if you want stronger first-turn consistency

### Codex-specific event mapping

If you are adapting from a Claude-oriented hook config, use these Codex `SessionStart` events:

- `startup`
- `resume`

Superpowers' upstream Claude hook setup uses `startup|clear|compact`. In current Codex runtimes, use `startup|resume`.

### Requirements

If you use this optional hook-based bootstrap, enable hooks in your Codex config:

```toml
[features]
codex_hooks = true
```

Superpowers includes reusable example files for this setup:

- `hooks/hooks-codex.json`
- `hooks/session-start-codex`

Copy the example `hooks.json` into your Codex config directory:

```bash
cp ~/.codex/superpowers/hooks/hooks-codex.json ~/.codex/hooks.json
chmod +x ~/.codex/superpowers/hooks/session-start-codex
```

The `session-start-codex` script is Unix-only and is intended for Linux, macOS, and WSL environments where Codex lifecycle hooks are available.

Example `hooks.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [
          {
            "type": "command",
            "command": "\"$HOME/.codex/superpowers/hooks/session-start-codex\""
          }
        ]
      }
    ]
  }
}
```

## Usage

Skills are discovered automatically. Codex activates them when:
- You mention a skill by name (e.g., "use brainstorming")
- The task matches a skill's description
- The `using-superpowers` skill directs Codex to use one

### Personal Skills

Create your own skills in `~/.agents/skills/`:

```bash
mkdir -p ~/.agents/skills/my-skill
```

Create `~/.agents/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

The `description` field is how Codex decides when to activate a skill automatically — write it as a clear trigger condition.

## Updating

```bash
cd ~/.codex/superpowers && git pull
```

Skills update instantly through the symlink.

## Uninstalling

```bash
rm ~/.agents/skills/superpowers
```

**Windows (PowerShell):**
```powershell
Remove-Item "$env:USERPROFILE\.agents\skills\superpowers"
```

Optionally delete the clone: `rm -rf ~/.codex/superpowers` (Windows: `Remove-Item -Recurse -Force "$env:USERPROFILE\.codex\superpowers"`).

## Troubleshooting

### Skills not showing up

1. Verify the symlink: `ls -la ~/.agents/skills/superpowers`
2. Check skills exist: `ls ~/.codex/superpowers/skills`
3. Restart Codex — skills are discovered at startup

If you are using the optional `SessionStart` hook setup:

4. Confirm `[features] codex_hooks = true` in `~/.codex/config.toml`
5. Confirm `~/.codex/hooks.json` points to a valid hook command
6. Start a fresh Codex session and verify the hook runs on `startup`
7. Validate `resume` behavior if needed

### Windows junction issues

Junctions normally work without special permissions. If creation fails, try running PowerShell as administrator.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
