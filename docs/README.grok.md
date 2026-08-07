# Superpowers for Grok Build

Complete guide for using Superpowers with [Grok Build](https://docs.x.ai/)
(the xAI coding agent CLI / TUI).

## Installation

### Official marketplace (recommended)

If your Grok install has the **xAI Official** marketplace:

```bash
grok plugin install superpowers --trust
# or, when multiple sources list it:
grok plugin install superpowers@xai-official --trust
```

Enable if needed:

```bash
grok plugin enable superpowers
```

Confirm skills loaded:

```bash
grok inspect
# Expect brainstorming, using-superpowers, test-driven-development, …
```

### Direct from this repository

```bash
grok plugin install obra/superpowers --trust
# or a local checkout:
grok plugin install /path/to/superpowers --trust
```

### TUI

```text
/marketplace
```

Search for Superpowers and install with trust.

Restart or open a new session after install so skill discovery refreshes.

## How bootstrap works on Grok

1. The plugin ships the shared `skills/` tree.
2. Grok lists each skill's **name + description** in session context.
3. `using-superpowers` is described as "Use when starting any conversation…",
   so the model loads it and then applies other process skills (e.g.
   `brainstorming` before creative work).
4. SessionStart hooks **do not** inject model-visible context on Grok Build
   today. The plugin therefore declares `"hooks": {}` in
   `.grok-plugin/plugin.json` (same idea as Codex) so the Claude Code
   SessionStart injector is not loaded.

## Acceptance check

In a clean empty directory:

```bash
mkdir -p /tmp/sp-smoke && cd /tmp/sp-smoke
grok -p "Let's make a react todo list" --always-approve --max-turns 4
```

You should see the agent invoke **brainstorming** (or clearly design-gate)
**before** scaffolding React code.

## Multi-trial reliability gate

Structural install is not enough. Run the eval harness:

```bash
# From a superpowers checkout (or the installed plugin path):
python3 tests/grok/eval_acceptance.py --trials 5
```

Default gate: **≥ 80%** of trials must design-gate without writing code.
The suite also runs a smoke check that the model names core Superpowers skills.

## Tool mapping

See [skills/using-superpowers/references/grok-tools.md](../skills/using-superpowers/references/grok-tools.md).

## Updating

```bash
grok plugin update superpowers
```

Or reinstall from git / local path.

## Notes

- Grok's own `/design`, `/implement`, and `/execute-plan` skills remain available.
  Superpowers process skills (brainstorming, TDD, systematic-debugging) still apply
  first when they match the task.
- User `AGENTS.md` / Grok rules override Superpowers when they conflict (see
  `using-superpowers` → User Instructions).
