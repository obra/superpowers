# Superpowers for OpenCode

Complete guide for using Superpowers with [OpenCode v2](https://v2.opencode.ai).

> **OpenCode v2 only.** This plugin targets the OpenCode v2 plugin API
> (default `{ id, setup }` export, `ctx.skill.transform`, `ctx.session.hook`).
> OpenCode states that v1 plugins do not run under v2, so use an older
> Superpowers release if you are still on OpenCode v1.

## Installation

Add superpowers to the `plugins` array in your `opencode.json` (global or
project-level). `plugins` is the canonical v2 key; the legacy singular `plugin`
key still loads for now but may be removed:

```json
{
  "plugins": ["superpowers@git+https://github.com/obra/superpowers.git"]
}
```

Restart OpenCode. The plugin installs through OpenCode's plugin manager and
registers all skills.

Verify by asking: "Tell me about your superpowers"

OpenCode uses its own plugin install. If you also use Claude Code, Codex, or
another harness, install Superpowers separately for each one.

### Migrating from the old symlink-based install

If you previously installed superpowers using `git clone` and symlinks, remove the old setup:

```bash
# Remove old symlinks
rm -f ~/.config/opencode/plugins/superpowers.js
rm -rf ~/.config/opencode/skills/superpowers

# Optionally remove the cloned repo
rm -rf ~/.config/opencode/superpowers

# Remove skills.paths from opencode.json if you added one for superpowers
```

Then follow the installation steps above.

## Usage

### Finding Skills

Use OpenCode's native `skill` tool to list all available skills:

```
use skill tool to list skills
```

### Loading a Skill

```
use skill tool to load brainstorming
```

### Personal Skills

Create your own skills in `~/.config/opencode/skills/`:

```bash
mkdir -p ~/.config/opencode/skills/my-skill
```

Create `~/.config/opencode/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

### Project Skills

Create project-specific skills in `.opencode/skills/` within your project.

**Skill Priority:** Project skills > Personal skills > Superpowers skills

## Updating

OpenCode installs Superpowers through a git-backed package spec. Some OpenCode
and Bun versions pin that resolved git dependency in a lockfile or cache, so a
restart may not pick up the newest Superpowers commit. If updates do not appear,
clear OpenCode's package cache or reinstall the plugin.

To pin a specific version, use a branch or tag:

```json
{
  "plugins": ["superpowers@git+https://github.com/obra/superpowers.git#v5.0.3"]
}
```

## How It Works

The plugin's `setup(ctx)` does two things:

1. **Registers the skills directory** via `ctx.skill.transform()`, adding the
   bundled `skills/` folder as a directory skill source so OpenCode discovers
   all superpowers skills without symlinks or manual `skills.paths` config.
2. **Injects bootstrap context** via `ctx.session.hook("context", ...)`,
   prepending superpowers awareness to the first user message before each model
   dispatch. (Using a user message rather than a system message avoids token
   bloat and multi-system-message issues on some models.)

### Tool Mapping

Skills speak in actions rather than naming any one runtime's tools. On OpenCode v2 these resolve to:

- "Create a todo" / "mark complete in todo list" → `todowrite`
- `Subagent (general-purpose):` template → OpenCode's `task` tool with `subagent_type: "general"` (or `"explore"` for codebase exploration)
- "Invoke a skill" → OpenCode's native `skill` tool
- "Read a file" → `read`
- "Create a file" → `write`; "edit a file" → `edit`
- "Run a shell command" → `bash`
- "Search file contents" / "find files by name" → `grep`, `glob`
- "Fetch a URL" → `webfetch`

(Verified against the installed OpenCode v2 CLI's tool inventory.)

## Troubleshooting

### Plugin not loading

1. Check OpenCode logs: `grep -i "loading plugin" ~/.local/share/opencode/log/opencode.log` (OpenCode v2 logs to a file; the CLI `run` command no longer has a `--print-logs` flag). If the shared background service is stuck, run `opencode service restart`.
2. Verify the plugin line in your `opencode.json` is correct and uses the `plugins` key
3. Make sure you're running OpenCode v2

### Windows install issues

Some Windows OpenCode builds have upstream installer issues with git-backed
plugin specs, including cache paths for `git+https` URLs and Bun not finding
`git.exe` even when it works in a normal terminal. If OpenCode cannot install
the plugin, try installing with system npm and pointing OpenCode at the local
package:

```powershell
npm install superpowers@git+https://github.com/obra/superpowers.git --prefix "$HOME\.config\opencode"
```

Then use the installed package path in `opencode.json`:

```json
{
  "plugins": ["~/.config/opencode/node_modules/superpowers"]
}
```

### Skills not found

1. Use OpenCode's `skill` tool to list available skills
2. Check that the plugin is loading (see above)
3. Each skill needs a `SKILL.md` file with valid YAML frontmatter

### Bootstrap not appearing

1. Make sure you are on OpenCode v2 (the plugin uses the v2 `ctx.session.hook("context", ...)` API)
2. Restart OpenCode after config changes (`opencode service restart` if the background service is stuck)

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
- OpenCode docs: https://v2.opencode.ai/
