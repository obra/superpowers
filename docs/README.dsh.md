# Superpowers for DeepSeek Harness

Complete guide for using Superpowers with [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`).

## Installation

`dsh plugin` installs into one profile at a time. Use the profile you actually
run — `web`, `headless`, or one of your own:

```bash
dsh plugin --profile web add github:obra/superpowers
```

Restart the profile. The plugin joins the profile's bundle stack, registers all
14 skills, and contributes the `using-superpowers` bootstrap to the system
prompt of every session.

Verify by asking: "Tell me about your superpowers"

dsh installs plugins per profile. If you also use Claude Code, Codex, or another
harness, install Superpowers separately for each one.

## Updating

```bash
dsh plugin --profile web update superpowers
```

To pin a version, install a tag instead:

```bash
dsh plugin --profile web add github:obra/superpowers#v6.3.0
```

## Uninstalling

```bash
dsh plugin --profile web remove superpowers
```

## Usage

### Finding and loading skills

dsh lists every available skill in the session skill catalog and loads one with
its native `skill` tool:

```
use the skill tool to load brainstorming
```

### Personal and project skills

dsh's filesystem skill provider also scans `~/.dsh/skills`, `~/.agents/skills`,
and each project's `.dsh/skills` and `.agents/skills`. Superpowers skills are
registered as runtime entries, and precedence depends on the profile: within one
registry layer project-root skills outrank them while user-root skills do not,
and in preset-based profiles the nearest scope layer wins a duplicate outright.
If you shadow a Superpowers skill with your own, confirm your version actually
wins in the profile you run.

### Turning the bootstrap off

The plugin is one row in your profile's plugin tree. Disable it — without
uninstalling — from the profile's own `cordis.patch.yml`:

```yaml
- id: superpowers
  disabled: true
```

## How it works

The plugin (`.dsh/plugins/superpowers.js`) is a Cordis plugin that injects two
services and does two things with them:

1. **Registers the skills.** Every `skills/*/SKILL.md` in this repository is
   read at load time and contributed through `ctx.skills.register()`, so dsh's
   native `skill` tool can list and load them. Nothing is copied into your
   config directory.
2. **Registers the bootstrap.** The `using-superpowers` body is wrapped in
   `<EXTREMELY_IMPORTANT>` and registered with
   `ctx.systemPrompt.section({ order: 50 })`. dsh reassembles the system prompt
   before every model step, so the bootstrap is present on the first request and
   survives compaction without re-injection logic.

The plugin imports Node builtins only. A plugin installed into a profile cannot
resolve `@deepseek-ai/*` — those live inside the dsh installation — so both
registries are reached through the injected context alone.

### Why a prompt section rather than a user message

The porting guide's Shape B recipe injects the bootstrap as a user-role message
because repeated system messages bloat tokens (#750) and multiple system
messages break some models (#894). Neither applies here: dsh renders all
registered sections into a *single* system message, and a static section sits in
the stable request prefix rather than being appended to history each turn.

dsh does offer a user-role path — `ctx.systemPrompt.context()` materializes a
durable user-role snapshot — but it is meant for *dynamic runtime context*, is
gated by the `includeRuntimeContext` config, and can be turned off wholesale by
any plugin calling `suppressRuntimeContext()`. A bootstrap that must load every
session does not belong behind that switch.

## Troubleshooting

### The plugin is not loading

Confirm it composed into the profile tree:

```bash
dsh --profile web --dump-config | grep -A1 'id: superpowers'
```

You should see the `superpowers` row pointing at
`superpowers/.dsh/plugins/superpowers.js`. If the row is missing, `dsh plugin`
did not see the `dsh.bundle` declaration — re-run the install and check that
`~/.dsh/profiles/<name>/package.json` lists `superpowers` under both
`dependencies` and `dsh.profile.bundles`.

### Skills are listed but never trigger

That means the skills registered but the bootstrap did not. Check the profile's
`cordis.patch.yml` for a `superpowers` override, and look for a
`superpowers: using-superpowers is missing` warning in the dsh log.

### `pnpm not found on PATH`

`dsh plugin` forwards to pnpm. Install pnpm and re-run.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
- DeepSeek Harness: https://github.com/deepseek-ai/deepseek-harness
