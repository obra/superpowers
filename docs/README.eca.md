# Superpowers for ECA (Editor Code Assistant)

Complete guide for using Superpowers with [ECA](https://eca.dev).

## Installation

Add Superpowers as a plugin source in your ECA config:

**Global config** (`~/.config/eca/config.json`):

```json
{
  "plugins": {
    "superpowers-source": {
      "source": "https://github.com/obra/superpowers.git"
    },
    "install": ["superpowers"]
  }
}
```

**Project-local config** (`.eca/config.json`):

```json
{
  "plugins": {
    "superpowers-source": {
      "source": "https://github.com/obra/superpowers.git"
    },
    "install": ["superpowers"]
  }
}
```

ECA's runtime plugin loader matches install entries against marketplace entries by exact name. The plugin marketplace entry is named `superpowers`, so the install list must say `"superpowers"` — not `"superpowers@source-name"`. The `@source` suffix is only parsed by the `/plugin-install` command, not by the loader that resolves plugins on session start.

Restart ECA for the plugin to take effect.

Verify by sending:

> Tell me about your superpowers

### Updating

ECA re-resolves plugin sources on startup and periodically (approximately hourly). To force an update, restart ECA or clear the plugin cache at `~/.eca/cache/plugins/`.

To pin a specific version, use a branch or tag in the source URL:

```json
{
  "plugins": {
    "superpowers-source": {
      "source": "https://github.com/obra/superpowers.git#v5.1.0"
    },
    "install": ["superpowers"]
  }
}
```

## How It Works

The plugin provides three things:

1. **Skills** — All Superpowers skills are registered under the `superpowers:` namespace. ECA discovers them via the plugin's `skills/` directory (symlinked to the project's `skills/` root).
2. **Bootstrap injection** — A `chatStart` hook runs the `session-start` script, which injects the `using-superpowers` skill content as additional context at the start of every chat.
3. **Tool mapping** — The `using-superpowers` skill references `references/eca-tools.md` for ECA-specific tool name equivalents.

### Skill Namespacing

ECA plugins expose skills under a `<plugin-name>:<name>` namespace. Superpowers skills are accessed as:

- `superpowers:brainstorming`
- `superpowers:test-driven-development`
- `superpowers:systematic-debugging`
- `superpowers:using-superpowers`
- etc.

When the plugin name matches the skill name (e.g., `superpowers:superpowers`), the prefix is dropped — so `superpowers:superpowers` is just `/superpowers`.

## Usage

Skills auto-trigger based on context — the bootstrap injection teaches the agent to check for relevant skills before every response. You don't need to do anything special.

To manually invoke a skill:

```
Load the superpowers:brainstorming skill
```

## Troubleshooting

### Plugin not loading

1. Check that your `config.json` has the correct `source` URL
2. Verify the git repo is accessible: `git ls-remote https://github.com/obra/superpowers.git`
3. Check ECA logs for plugin resolution errors

### Skills not found

1. Use `/plugins` to verify `superpowers` appears in the installed list
2. Check that the plugin's `skills/` symlink resolves correctly
3. Each skill needs a `SKILL.md` file with valid YAML frontmatter (`name` and `description`)

### Bootstrap not appearing

1. Verify the `chatStart` hook is registered: check `.eca-plugin/superpowers/hooks/hooks.json`
2. The hook script uses `${plugin:root}` to resolve its path — this is ECA's dynamic interpolation that expands to the absolute plugin directory at load time
3. The hook runs `hooks/session-start` which must be executable
4. Check ECA logs for hook execution errors
