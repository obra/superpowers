# Superpowers for Command Code

Complete guide for using Superpowers with [Command Code](https://commandcode.ai).

## Installation

Install the mod package from GitHub:

```bash
cmd mods add -g yansigit/superpowers-commandcode
```

Then install the 14 skills (vendored in that package):

```bash
mkdir -p ~/.commandcode/skills
cp -R ~/.commandcode/mods/.registry/git/github.com/yansigit/superpowers-commandcode/skills/* ~/.commandcode/skills/
```

Verify:

```bash
cmd skills list   # 15 installed (14 superpowers + find-skills)
cmd mods list     # superpowers · user · from git:github.com/yansigit/superpowers-commandcode
```

> If you install Command Code's upstream superpowers harness (this repo) once merged,
> installation will be a single `cmd mods add` via the bundled `.commandcode/mods/`.

## Updating

```bash
cmd mods update
cp -R ~/.commandcode/mods/.registry/git/github.com/yansigit/superpowers-commandcode/skills/* ~/.commandcode/skills/
```

Pin a version: `cmd mods add -g yansigit/superpowers-commandcode@v6.2.0`

## How It Works

Command Code is a Shape B (in-process mod) harness — like Pi and OpenCode:

1. **Bootstrap** — `.commandcode/mods/superpowers.ts` injects the `using-superpowers` skill via `appendSystemPrompt` every session, appended with the Command Code tool mapping (`references/commandcode-tools.md`).
2. **Skills** — 14 skills in `skills/` are discovered via `~/.commandcode/skills/` (or project `.commandcode/skills/`).

### Tool Mapping

See `skills/using-superpowers/references/commandcode-tools.md` for the full table.

Quick hits:

- "Create a todo" → `todo_write` (or `task_create` for durable ledger)
- `Subagent (general-purpose):` → `agent` with `subagent_type: "general"`
- "Invoke a skill" → read its `SKILL.md` with `read_file` or run `/skill-name`

## Troubleshooting

### Bootstrap not appearing

Restart the session — mods load at startup. Check `cmd mods list` shows `superpowers`.

### Skills not found

`cmd skills list --debug` will show parse errors (e.g., mismatched `name` vs directory).

### Headless (`cmd -p`) doesn't load project mods

`cmd -p` loads only user-global mods. Install with `-g` (shown above) or pass `--mod ./path` per run.
