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

3. Install the agent TOMLs:
   ```bash
   mkdir -p ~/.codex/agents
   cp ~/.codex/superpowers/.codex/agents/*.toml ~/.codex/agents/
   ```

4. Restart Codex.

### Optional SessionStart hook

If you want the full `using-superpowers` skill injected into every new Codex
session, add this to `~/.codex/hooks.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "^(startup|resume)$",
        "hooks": [
          {
            "type": "command",
            "command": "SUPERPOWERS_HOOK_TARGET=codex bash ~/.codex/superpowers/hooks/session-start",
            "statusMessage": "loading superpowers",
            "timeout": 600
          }
        ]
      }
    ]
  }
}
```

This is intentionally Codex-specific. The hook script resolves its own plugin
root, so Codex does not need `CLAUDE_PLUGIN_ROOT` to produce the correct
`hookSpecificOutput.additionalContext` payload.

### Windows

Use a junction for the skills directory and copy the agent TOMLs directly:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
cmd /c mklink /J "$env:USERPROFILE\.agents\skills\superpowers" "$env:USERPROFILE\.codex\superpowers\skills"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.codex\agents"
Copy-Item "$env:USERPROFILE\.codex\superpowers\.codex\agents\*.toml" "$env:USERPROFILE\.codex\agents\"
```

## How It Works

Codex loads two Superpowers integration surfaces at startup:

```
~/.agents/skills/superpowers/ -> ~/.codex/superpowers/skills/
~/.codex/agents/superpowers_*.toml <- ~/.codex/superpowers/.codex/agents/*.toml
```

- the skills directory exposes SKILL.md files for native skill discovery
- the agents directory exposes native Codex reviewer roles through copied TOML files such as `superpowers_reviewer.toml` and `superpowers_spec_reviewer.toml`

The `using-superpowers` skill is discovered automatically and enforces skill usage discipline. When subagent workflows need specialized reviewers on Codex, Superpowers can now use native `superpowers_*` roles instead of treating `worker` plus inline prompts as the primary design. Direct TOML copies are used because current Codex role discovery does not recurse into symlinked subdirectories under `agents/`.

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

The `description` field is how Codex decides when to activate a skill automatically - write it as a clear trigger condition.

## Updating

```bash
cd ~/.codex/superpowers && git pull
```

Skills update through the skills symlink after you restart Codex. Agent role updates require rerunning the copy command from step 3, then restarting Codex.

## Uninstalling

```bash
rm ~/.agents/skills/superpowers
rm ~/.codex/agents/superpowers_*.toml
```

**Windows (PowerShell):**
```powershell
Remove-Item "$env:USERPROFILE\.agents\skills\superpowers"
Remove-Item "$env:USERPROFILE\.codex\agents\superpowers_*.toml"
```

Optionally delete the clone: `rm -rf ~/.codex/superpowers` (Windows: `Remove-Item -Recurse -Force "$env:USERPROFILE\.codex\superpowers"`).

## Troubleshooting

### Skills not showing up

1. Verify the symlink: `ls -la ~/.agents/skills/superpowers`
2. Check skills exist: `find ~/.codex/superpowers/skills -maxdepth 2 -name SKILL.md | head`
3. Restart Codex - skills are discovered at startup

### Agents not showing up

1. Check TOMLs exist: `find ~/.codex/agents -maxdepth 1 -name 'superpowers_*.toml' | sort`
2. Re-run the copy command from installation step 3
3. Restart Codex - agent roles are loaded at startup

### SessionStart hook not injecting context

1. Check `~/.codex/hooks.json` uses `SUPERPOWERS_HOOK_TARGET=codex`
2. Make sure the command points to `~/.codex/superpowers/hooks/session-start`
3. Restart Codex and verify with a fresh `codex exec --json` session

### Windows junction issues

Junctions normally work without special permissions. If creation fails, try running PowerShell as administrator.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
