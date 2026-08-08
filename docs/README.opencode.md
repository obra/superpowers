# Superpowers for OpenCode

Complete guide for using Superpowers with [OpenCode.ai](https://opencode.ai).

## Installation

Installation differs between OpenCode V1 (`opencode`) and V2 (`opencode2`).
Install Superpowers separately for each version if you use both.

### OpenCode V1 (`opencode`)

Add superpowers to the `plugin` array in your `opencode.json` (global or project-level):

```json
{
  "plugin": ["superpowers@git+https://github.com/obra/superpowers.git"]
}
```

Restart OpenCode. The plugin installs through OpenCode's plugin manager and
registers all skills.

Verify by asking: "Tell me about your superpowers"

### OpenCode V2 (`opencode2`)

V2 does not support `git+https://` plugin installation. Use a local clone with
a path reference instead.

1. Clone the repository:

```bash
git clone https://github.com/obra/superpowers.git ~/superpowers
```

2. Add the plugin using the `plugin` field (singular) with an absolute path:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "/home/your-username/superpowers/.opencode/plugins/superpowers.js"
  ]
}
```

> **Note:** V2 does not expand `~` in local plugin paths. Use an absolute path
> or a relative path (`./` or `../`) resolved from the config file directory.

3. Restart and verify:

```bash
opencode2 service restart
```

Ask: "Tell me about your superpowers"

### Running V1 and V2 Side by Side

V1 (`opencode`) and V2 (`opencode2`) share the same default config directory
(`~/.config/opencode/`). Since V2 normalizes V1's `plugin` field into its own
loading pipeline, putting a `git+https://` spec (which V2 cannot install) in
the shared config causes V2 to silently fail loading it.

To use different plugin sources for each version, point V2 at a separate
config directory via the `OPENCODE_CONFIG_DIR` environment variable:

```bash
# In ~/.bashrc (or equivalent shell config)
export OPENCODE_CONFIG_DIR="$HOME/.config/opencode2"
```

Then maintain two config files:

- `~/.config/opencode/opencode.json` — V1 config, using `git+https://` sources
- `~/.config/opencode2/opencode.json` — V2 config, using local path sources

Both versions can now run independently without interfering with each other.

### Migrating from the old symlink-based install (V1)

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

### V1 (`opencode`)

OpenCode installs Superpowers through a git-backed package spec. Some OpenCode
and Bun versions pin that resolved git dependency in a lockfile or cache, so a
restart may not pick up the newest Superpowers commit. If updates do not appear,
clear OpenCode's package cache or reinstall the plugin.

To pin a specific version, use a branch or tag:

```json
{
  "plugin": ["superpowers@git+https://github.com/obra/superpowers.git#v5.0.3"]
}
```

### V2 (`opencode2`)

```bash
cd ~/superpowers && git pull
opencode2 service restart
```

## How It Works

The plugin does two things:

1. **Registers the skills directory** so OpenCode discovers all superpowers skills without symlinks or manual config.
   - **V1:** via the `config` hook, injecting into `config.skills.paths`
   - **V2:** via the `setup()` function using `ctx.skill.transform()` (V2 native API, confirmed active at runtime)
2. **Injects bootstrap context** into the first user message of each conversation, adding superpowers awareness.
   - **V1:** via `experimental.chat.messages.transform` hook
   - **V2:** via `ctx.session.hook("context")` — the V2 equivalent (confirmed active at runtime)

### Tool Mapping

Skills speak in actions rather than naming any one runtime's tools. On OpenCode these resolve to:

- "Create a todo" / "mark complete in todo list" → `todowrite`
- `Subagent (general-purpose):` template → OpenCode's `task` tool with `subagent_type: "general"` (or `"explore"` for codebase exploration)
- "Invoke a skill" → OpenCode's native `skill` tool
- "Read a file" → `read`
- "Create a file" / "edit a file" / "delete a file" → `apply_patch`
- "Run a shell command" → `bash`
- "Search file contents" / "find files by name" → `grep`, `glob`
- "Fetch a URL" → `webfetch`

(Verified against the installed OpenCode CLI's tool inventory.)

## Troubleshooting

### Plugin not loading

**V1:** Check OpenCode logs:

```
opencode run --print-logs "hello" 2>&1 | grep -i superpowers
```

**V2:** Check the server log:

```
opencode2 service status
```

Then inspect `~/.local/share/opencode/log/opencode.log`, filtering for `role=server`.

Also verify the plugin path in your `opencode.json` is correct and that you're
running a recent version of OpenCode.

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
  "plugin": ["~/.config/opencode/node_modules/superpowers"]
}
```

### Skills not found

1. Use OpenCode's `skill` tool to list available skills
2. Check that the plugin is loading (see above)
3. Each skill needs a `SKILL.md` file with valid YAML frontmatter

### Bootstrap not appearing

- **V1:** Check OpenCode version supports `experimental.chat.messages.transform` hook. Restart OpenCode after config changes.
- **V2:** The plugin uses `ctx.session.hook("context")` for bootstrap injection. Verify the plugin loaded via `opencode2 api get /api/plugin`. Restart with `opencode2 service restart` after config changes.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
- OpenCode V2 docs: https://opencode.ai/v2/docs/
- OpenCode V1 docs: https://opencode.ai/docs/
