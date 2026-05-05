# Superpowers for Junie

Junie is JetBrains' AI coding agent, available as a CLI tool and IDE integration.

## Installation

Junie has no plugin marketplace, so installation uses a shell script that:

1. Symlinks all superpowers skills into `~/.junie/skills/superpowers/`
2. Injects the bootstrap into `~/.junie/guidelines.md` (loaded automatically at every session start)

### Steps

```bash
# Clone the superpowers repo (skip if already cloned)
git clone https://github.com/obra/superpowers ~/.superpowers

# Run the install script
~/.superpowers/scripts/install-junie.sh
```

### Updating

```bash
cd ~/.superpowers && git pull
~/.superpowers/scripts/install-junie.sh
```

The install is idempotent — running it again updates the bootstrap block in place.

### Uninstalling

```bash
~/.superpowers/scripts/uninstall-junie.sh
```

## How it works

Junie has no SessionStart hook mechanism. Instead, `install-junie.sh` writes the
`using-superpowers` bootstrap into `~/.junie/guidelines.md`. Junie loads this file
at the start of every session, so the bootstrap is always in context without any
user action.

Skills are symlinked (not copied) so a `git pull` in the repo is all you need to
update skill content. Re-run `install-junie.sh` after pulling to refresh the
bootstrap block in `guidelines.md`.

## Verifying the integration

After installing, open a fresh Junie session and send:

```
Let's make a react todo list
```

The `brainstorming` skill should auto-trigger before Junie writes any code.

## Testing locally

```bash
# Test install
bash tests/junie/test-install.sh

# Test idempotency and uninstall
bash tests/junie/test-bootstrap.sh
```

Both tests use an isolated temp directory and do not modify `~/.junie`.

## Known differences from hook-based harnesses

- **No real-time bootstrap updates:** Changes to `skills/using-superpowers/SKILL.md`
  are not picked up automatically — re-run `install-junie.sh` to refresh the
  bootstrap in `guidelines.md`. Skill files under `~/.junie/skills/superpowers/`
  are symlinks so those update immediately.

- **Skill invocation:** Junie does not have a native `Skill` tool like Claude Code.
  The `junie-tools.md` reference (included in the bootstrap) instructs the agent to
  load skills by reading the SKILL.md file directly from
  `~/.junie/skills/superpowers/<skill-name>/SKILL.md`.

- **Subagents:** Junie's subagent support differs from Claude Code's. Skills that
  dispatch parallel subagents (e.g., `subagent-driven-development`) will execute
  those tasks inline rather than in parallel.
