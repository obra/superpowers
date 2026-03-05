# Superpowers for Codex

Guide for using Superpowers with OpenAI Codex via native skill discovery.

## Quick Install

Tell Codex:

`Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md`
Or
`run the ./codex/install.sh helper script in this repo. It wraps install, update, verification, migration, and removal in one place.`



## Scripted install & management

The repository ships with `codex/install.sh` (make it executable via `chmod +x ./codex/install.sh`). It is a thin shell helper that performs everything the manual steps describe:
1. Clones (or pulls) `https://github.com/obra/superpowers.git` into `~/.codex/superpowers`.
2. Ensures the `~/.agents/skills` directory exists.
3. Creates or refreshes `~/.agents/skills/superpowers` as a symlink (or PowerShell symbolic link/junction on Windows) that points at the cloned `skills/` tree.

The script exposes the following commands:
- `./codex/install.sh` (or `./codex/install.sh install` / `update`): install or refresh Superpowers via the symlink workflow described above. Install/update share the same implementation so you can't accidentally do the wrong thing.
- `./codex/install.sh migrate`: same as install/update but additionally reminds you to remove any legacy `superpowers-codex bootstrap` block from `~/.codex/AGENTS.md`.
- `./codex/install.sh remove`: deletes the symlink/junction and the local clone so you can start over.
- `./codex/install.sh doctor`: checks the home directory, git, target directories, PowerShell (when on Windows), the existing repo, and the legacy bootstrap block, printing `[OK]/[FAIL]/[INFO]` lines so you can confirm every prerequisite is met.

On Linux and macOS the helper relies on POSIX shell tools, and on Windows it runs `pwsh`/`powershell` under the hood so the same script works across platforms.

Running `doctor` gives you the same verification mentioned earlier: it confirms git is available, the link target directory is createable, the old bootstrap block is removed, and the repo/symlink are where they need to be. That ensures the program fulfills the options documented in this file.

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

### Windows junction issues

Junctions normally work without special permissions. If creation fails, try running PowerShell as administrator.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
