# Installing Superpowers for OpenCode

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed

## OpenCode V1 (`opencode`) Installation

Add superpowers to the `plugin` array in your `opencode.json` (global or project-level):

```json
{
  "plugin": ["superpowers@git+https://github.com/obra/superpowers.git"]
}
```

Restart OpenCode. The plugin installs through OpenCode's plugin manager and
registers all skills.

Verify by asking: "Tell me about your superpowers"

OpenCode uses its own plugin install. If you also use Claude Code, Codex, or
another harness, install Superpowers separately for each one.

## OpenCode V2 (`opencode2`) Installation

V2 does not support `git+https://` plugin installation. Use a local clone
with a path reference instead.

### Steps

1. Clone the repository:

```bash
git clone https://github.com/obra/superpowers.git ~/superpowers
```

2. Add the plugin to your `opencode.json` (global or project-level).
   Use the `plugin` field (singular) with an absolute path:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "/home/your-username/superpowers/.opencode/plugins/superpowers.js"
  ]
}
```

> **Note:** V2 does not expand `~` in local plugin paths. Use an absolute
> path or a relative path (`./` or `../`) resolved from the config file
> directory.

3. Restart OpenCode:

```bash
opencode2 service restart
```

4. Verify by asking: "Tell me about your superpowers"

### Updating

```bash
cd ~/superpowers && git pull
opencode2 service restart
```

## Running V1 and V2 Side by Side

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

## Migrating from the old symlink-based install

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

Use OpenCode's native `skill` tool:

```
use skill tool to list skills
use skill tool to load brainstorming
```

## Updating

### V1 (`opencode`)

OpenCode installs Superpowers through a git-backed package spec. Some OpenCode
and Bun versions pin that resolved git dependency in a lockfile or cache, so a
restart may not pick up the newest Superpowers commit. If updates do not appear,
clear OpenCode's package cache or reinstall the plugin.

To pin a specific version:

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

## Troubleshooting

### Plugin not loading

1. Check logs: `opencode run --print-logs "hello" 2>&1 | grep -i superpowers`
2. Verify the plugin line in your `opencode.json`
3. Make sure you're running a recent version of OpenCode

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

1. Use `skill` tool to list what's discovered
2. Check that the plugin is loading (see above)

### Tool mapping

Skills speak in actions ("create a todo", "dispatch a subagent", "read a file"). On OpenCode these resolve to:

- "Create a todo" / "mark complete in todo list" → `todowrite`
- `Subagent (general-purpose):` template → `task` tool with `subagent_type: "general"` (or `"explore"` for codebase exploration)
- "Invoke a skill" → OpenCode's native `skill` tool
- "Read a file" → `read`
- "Create a file" / "edit a file" / "delete a file" → `apply_patch`
- "Run a shell command" → `bash`
- "Search file contents" / "find files by name" → `grep`, `glob`
- "Fetch a URL" → `webfetch`

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Full documentation: https://github.com/obra/superpowers/blob/main/docs/README.opencode.md
