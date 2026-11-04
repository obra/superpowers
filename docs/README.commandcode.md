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

Start a fresh session after updating so the new checkout is loaded. Skills stay in that checkout. There is no `cmd skills add` and no copy into `~/.commandcode/skills/`.

## How It Works

`package.json` declares the mod and the skills directory:

```json
{
  "commandcode": {
    "mods": ["./.commandcode/mods/superpowers.ts"],
    "skills": ["./skills"]
  }
}
```

The mod does two things:

1. Calls `cmd.addSkillsPath` on this package's `skills/` directory so Command Code's skill catalog includes Superpowers. `activate_skill` loads a skill by name from that catalog. The same directory is declared as `commandcode.skills`, which `cmd mods add` registers when it loads the package.
2. Injects the `using-superpowers` bootstrap through `appendSystemPrompt`, including the tool mapping from `skills/using-superpowers/references/commandcode-tools.md`.

`appendSystemPrompt` is appended after the base system prompt on every round. The text is cached at module scope so those bytes stay stable; the prompt-prefix cache keys off them. That cache is load-bearing.

Command Code also has `SessionStart` hooks (`settings.json` → `hooks.SessionStart` → `hookSpecificOutput.additionalContext`). That field is injected into the session's first user turn, so compaction can drop it. `appendSystemPrompt` stays in the system prompt across compaction, which is why this integration is a mod and not a SessionStart hook.

## Tool Mapping

Skills describe actions instead of hard-coding one runtime's tool names. On Command Code these resolve to the mapping in:

[skills/using-superpowers/references/commandcode-tools.md](../skills/using-superpowers/references/commandcode-tools.md)

**Invoke a skill with `activate_skill` and the skill's `name`.** If the name collides with a built-in command, use `/skill:<name>`.

## Troubleshooting

### Mod not loading

1. Confirm install with `cmd mods list`.
2. Re-run `cmd mods add -g obra/superpowers` if the package is missing.
3. Start a fresh session after install or update.

### Skills not triggering

1. Confirm the mod is installed and enabled.
2. Start a fresh session so the skill catalog reloads.
3. Try the acceptance prompt: `Let's make a react todo list`. A working install should load `brainstorming` before writing code.

### Bootstrap text missing

1. Confirm `package.json` still declares `"commandcode": { "mods": ["./.commandcode/mods/superpowers.ts"], "skills": ["./skills"] }`.
2. Confirm `.commandcode/mods/superpowers.ts` is present in the installed package checkout.
3. Update with `cmd mods update` and start a fresh session.

### Bootstrap injected twice

`appendSystemPrompt` and a `SessionStart` hook's `additionalContext` are separate channels. Command Code does not dedupe them. Do not also install a SessionStart hook that injects the using-superpowers bootstrap. This mod already injects it.
