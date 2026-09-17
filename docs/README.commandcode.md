# Superpowers for Command Code

Complete guide for using Superpowers with Command Code.

## Installation

Install Superpowers as a global Command Code mod from this repository:

```bash
cmd mods add -g obra/superpowers
```

Start a fresh Command Code session after installing.

## Updating

Update installed mods with:

```bash
cmd mods update
```

Start a fresh session after updating so the new checkout is loaded.

## How It Works

`package.json` declares the Command Code mod:

```json
{
  "commandcode": {
    "mods": ["./.commandcode/mods/superpowers.ts"]
  }
}
```

That mod does two things:

1. Injects the `using-superpowers` bootstrap at session start through `appendSystemPrompt`.
2. Loads Command Code tool mapping from `skills/using-superpowers/references/commandcode-tools.md` on disk.

Skills stay in this repository's `skills/` directory. There are no copied skills, no `cmd skills add`, and no extra slash commands.

## Tool Mapping

Skills describe actions instead of hard-coding one runtime's tool names. On Command Code these resolve to the mapping in:

[skills/using-superpowers/references/commandcode-tools.md](../skills/using-superpowers/references/commandcode-tools.md)

**Blessed skill invoke path:** read `skills/<name>/SKILL.md` with `read_file` (or use `/skill-name` if already discovered).

## Troubleshooting

### Mod not loading

1. Confirm install with `cmd mods list`.
2. Re-run `cmd mods add -g obra/superpowers` if the package is missing.
3. Start a fresh session after install or update.

### Skills not triggering

1. Confirm the mod is installed and enabled.
2. Start a fresh session.
3. Try the acceptance prompt: `Let's make a react todo list`. A working install should load `brainstorming` before writing code.

### Bootstrap text missing

1. Confirm `package.json` still declares `"commandcode": { "mods": ["./.commandcode/mods/superpowers.ts"] }`.
2. Confirm `.commandcode/mods/superpowers.ts` is present in the installed package checkout.
3. Update with `cmd mods update` and start a fresh session.
