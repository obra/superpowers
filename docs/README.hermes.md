# Installing Superpowers for Hermes Agent

## Prerequisites

- Hermes Agent with plugin support
- Hermes skills/tool calling enabled for coding sessions

## Installation

Install Superpowers as a Hermes plugin from this repository:

```bash
hermes plugins install obra/superpowers --enable
```

Restart Hermes or start a fresh session after installing. Hermes installs the
repository root as the plugin, so the plugin entrypoint and the shared
`skills/` tree stay together.

Install Superpowers separately for each harness you use. Installing it for
Hermes does not install it for Claude Code, Codex, OpenCode, Pi, or other
harnesses.

## Updating

```bash
hermes plugins update superpowers
```

Start a fresh session after updating so Hermes reloads the plugin code.

## Local Development

From a local checkout, install with a file URL and force replacement:

```bash
hermes plugins install file:///path/to/superpowers --force --enable
```

On Windows, use a file URL for the checkout path, for example:

```powershell
hermes plugins install file:///E:/PC/Desktop/superpowers --force --enable
```

## How It Works

The root `plugin.yaml` declares a Hermes `pre_llm_call` hook. The root
`__init__.py` registers every bundled Superpowers skill with Hermes as a
read-only plugin skill, then injects the `using-superpowers` bootstrap into the
first model call for each Hermes session.

Hermes plugin skills are loaded with qualified names. When a Superpowers skill
should be invoked, Hermes should call:

```text
skill_view(name="superpowers:brainstorming")
```

The plugin also includes a compact Superpowers skill index in the injected
bootstrap because Hermes plugin skills are loadable through `skill_view`, but
they do not enter Hermes' normal flat skills index.

## Verification

Use a neutral coding prompt that does not mention Superpowers:

```text
Let's make a react todo list
```

Pass condition: the first tool-call sequence loads
`superpowers:brainstorming` with `skill_view` before any file edit, patch,
write, or mutating shell command.

For a machine-readable check, export the session after the run:

```bash
hermes sessions list --limit 1
hermes sessions export --session-id <session-id> -
```

Inspect the exported JSONL for an assistant `tool_calls` entry where
`function.name` is `skill_view` and `function.arguments` contains
`superpowers:brainstorming`. That call must appear before the first mutating
tool call.

## Troubleshooting

### Plugin Not Loading

```bash
hermes plugins list
hermes logs --since 10m
```

Confirm `superpowers` is installed and enabled. If it is disabled, run:

```bash
hermes plugins enable superpowers
```

### Skills Not Found

Make sure Hermes has the skills toolset enabled in the session. The plugin can
inject the bootstrap without it, but Hermes needs `skill_view` available to load
`superpowers:<skill-name>` skills.

### Bootstrap Does Not Trigger

Start a fresh Hermes session after installing or updating the plugin. The
bootstrap is injected once per session through `pre_llm_call`.
