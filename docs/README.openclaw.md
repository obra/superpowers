# Superpowers for OpenClaw

Complete guide for using Superpowers with OpenClaw.

## Quick Install

```bash
git clone https://github.com/obra/superpowers.git ~/.openclaw/superpowers
mkdir -p ~/.openclaw/skills
for skill in ~/.openclaw/superpowers/skills/*/; do
  name=$(basename "$skill")
  [ ! -e ~/.openclaw/skills/"$name" ] && [ ! -L ~/.openclaw/skills/"$name" ] && \
    ln -s "$skill" ~/.openclaw/skills/"$name"
done
openclaw gateway restart
```

## How It Works

OpenClaw has native skill discovery — it scans `~/.openclaw/skills/` for directories containing `SKILL.md` files and injects them into agent sessions at boot. Superpowers skills use the same format, so no plugins, hooks, or adapters are needed.

The installation clones the superpowers repo and creates individual symlinks from each skill into OpenClaw's managed skills directory:

```
~/.openclaw/
├── superpowers/                    # Git clone (source of truth)
│   └── skills/
│       ├── brainstorming/SKILL.md
│       ├── test-driven-development/SKILL.md
│       └── ...
├── skills/                         # Managed skills directory
│   ├── brainstorming -> ~/.openclaw/superpowers/skills/brainstorming/
│   ├── test-driven-development -> ~/.openclaw/superpowers/skills/test-driven-development/
│   └── ...
└── openclaw.json
```

Individual symlinks (not a single directory symlink) because OpenClaw expects flat skill directories directly under `skills/`, and this enables selective installation.

## Skill Discovery

OpenClaw scans three locations at session boot, in priority order:

1. **Workspace skills** (`<workspace>/skills/`) — project-specific overrides
2. **Managed skills** (`~/.openclaw/skills/`) — where superpowers goes
3. **Bundled skills** (OpenClaw install dir) — shipped with OpenClaw

Superpowers skills appear as `openclaw-managed`.

## Managing Skills

```bash
openclaw skills list           # List all skills
openclaw skills info <name>    # Get skill details
openclaw skills check          # Check readiness
```

## Filtering Skills Per Agent

By default, all agents see all installed skills. To restrict skills per agent, edit `~/.openclaw/openclaw.json`:

```json
{
  "agents": {
    "list": [
      {
        "name": "my-agent",
        "skills": ["test-driven-development", "systematic-debugging", "verification-before-completion"]
      }
    ]
  }
}
```

## Tool Mapping

Superpowers skills reference Claude Code tools. OpenClaw equivalents:

| Superpowers Reference | OpenClaw Equivalent |
|----------------------|---------------------|
| `TodoWrite` | Agent's task tracking or plan tool |
| `Task` (subagents) | Delegate to another agent or spawn subagent |
| `Skill` tool | Native skill discovery or `openclaw skills info` |
| `Read` / `Write` / `Edit` | Agent's native file tools |
| `Bash` | Agent's `exec` tool |

## Updating

```bash
cd ~/.openclaw/superpowers && git pull
```

Content updates instantly through symlinks. Re-run the symlink loop to pick up new skills added upstream.

## Troubleshooting

**Skills not showing up:** Restart the gateway (`openclaw gateway restart`) and check symlinks (`ls -la ~/.openclaw/skills/ | grep superpowers`).

**Agent not using skills:** Add a "Skills" section to the agent's SOUL.md listing which skills to use. Skills are discoverable but agents perform best with explicit guidance.

**Existing skill conflict:** The installer skips skills where a directory already exists. Rename your custom skill to use the superpowers version.
