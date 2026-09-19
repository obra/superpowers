# Superpowers for OpenClaw

OpenClaw needs both the Superpowers skill catalog and an automatic bootstrap. The native plugin in this repository supplies both. OpenClaw discovers the skills from `openclaw.plugin.json` and calls the plugin's `agent:bootstrap` hook before the first model turn. The hook inserts the full `using-superpowers` instructions and an OpenClaw tool mapping into agent context.

## Install

```bash
openclaw plugins install git:github.com/obra/superpowers@main --force --accept-capabilities
```

OpenClaw asks for confirmation when installing third-party Git code and accepting its capabilities interactively. `--force` and `--accept-capabilities` supply those acknowledgements in a noninteractive shell. Restart a running Gateway after installation so it loads the new plugin. If you use an explicit `plugins.allow` policy, the install command adds `superpowers` to that list.

Check the installation:

```bash
openclaw plugins inspect superpowers --runtime
```

The plugin should show its skill root and `agent:bootstrap` registration. Start a fresh agent session and send exactly:

```text
Let's make a react todo list
```

The agent should read `brainstorming/SKILL.md` before creating or changing code. A list of skill names alone does not prove the bootstrap is active.

## Local development

From a Superpowers checkout, install a link to the plugin:

```bash
openclaw plugins install --link /path/to/superpowers --force --accept-capabilities
```

The plugin has no runtime package dependencies or build step. Its entry point reads the installed `using-superpowers/SKILL.md` and OpenClaw mapping once when the plugin starts. Changes to either file require restarting the Gateway.

The plugin does not edit the user's `AGENTS.md` or OpenClaw configuration. OpenClaw's own plugin manager handles installation and enables the plugin. If an operator disables the plugin or sets `agents.defaults.contextInjection: "never"`, the bootstrap will not be present; those explicit controls remain authoritative.

To run the OpenClaw host integration test against a source checkout:

```bash
OPENCLAW_ROOT=/path/to/openclaw node --test tests/openclaw/test-host-integration.mjs
```

The test loads the plugin through OpenClaw's registry and checks the agent context that OpenClaw builds for a fresh session. It needs no model API key. The live acceptance prompt above remains the final behavior check.
