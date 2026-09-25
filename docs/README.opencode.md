# Superpowers for OpenCode

Complete guide for using Superpowers with [OpenCode.ai](https://opencode.ai).

## Installation

OpenCode V2 requires version 2.0.4 or later.

### OpenCode V1

Use the existing V1 plugin configuration:

```json
{
  "plugin": ["superpowers@git+https://github.com/obra/superpowers.git"]
}
```

### OpenCode V2 (2.0.4 or later)

Use the V2 plugin configuration:

```json
{
  "plugins": ["superpowers@git+https://github.com/obra/superpowers.git"]
}
```

For a local V2 installation, configure the repository directory containing
`index.js`. OpenCode 2.0.4 and 2.0.7 reject a configured direct JavaScript-file
path. Discovered plugin symlinks remain supported.

Restart OpenCode. V2 uses the `opencode` command; `opencode2` may be available
as an alias. The plugin installs through OpenCode's plugin manager and
registers all skills.

Verify by asking: "Tell me about your superpowers"

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

**V2 Skill Priority:** Project skills > Personal skills > Superpowers skills. On
tested V1 1.18.31, bundled Superpowers skills take precedence when a personal
or project skill has the same name; use distinct names for personal and project
skills. This behavior is unchanged by the migration.

## Updating

OpenCode installs Superpowers through a git-backed package spec. Some OpenCode
and Bun versions pin that resolved git dependency in a lockfile or cache, so a
restart may not pick up the newest Superpowers commit. If updates do not appear,
clear OpenCode's package cache or reinstall the plugin.

To pin a specific version, add a tag or commit to the spec (same form for the
V1 `plugin` key and the V2 `plugins` key):

```json
{
  "plugin": ["superpowers@git+https://github.com/obra/superpowers.git#v6.4.2"]
}
```

On V2, pin `v6.4.1` or later; `v6.3.0` and earlier releases load only on V1.

## How It Works

The plugin does two things, using host-flavor-specific APIs:

1. **Registers the skills directory** so OpenCode discovers all superpowers skills without symlinks or manual config.
    - **V1:** via the `config` hook, injecting into `config.skills.paths`
    - **V2:** via the `setup()` function using `ctx.skill.transform()` (V2 native API, confirmed active at runtime)
2. **Injects bootstrap context** with a flavor-specific tool mapping: V1 sessions get the V1 tool names below, and V2 sessions get the V2 names.
    - **V1:** via `experimental.chat.messages.transform` hook
    - **V2:** via `ctx.session.hook("context")` — the V2 equivalent (confirmed active at runtime)

Controller sessions receive the using-superpowers bootstrap in transient model
context. Delegated child sessions keep access to native skills but do not receive
the controller bootstrap. A manual fork without a parent session keeps controller
behavior. When V2 native compaction retains earlier user messages (the default
`compaction.keep.tokens` budget), the bootstrap goes into the first retained user
message ahead of the checkpoint, as in an uncompacted session. When compaction
removes all user messages, the plugin appends a transient bootstrap message after
the checkpoint. Saved history is unchanged either way.

If session lookup fails, the plugin keeps bootstrap for that request and retries
on the next request. Failed lookups are not cached as controller decisions.

### Tool Mapping

Skills speak in actions rather than naming any one runtime's tools. The bootstrap maps them to the tools your OpenCode flavor actually exposes.

**V1 (`opencode` 1.x):**

- "Create a todo" / "mark complete in todo list" → `todowrite`
- `Subagent (general-purpose):` template → OpenCode's `task` tool with `subagent_type: "general"` (or `"explore"` for codebase exploration)
- "Invoke a skill" → OpenCode's native `skill` tool
- "Read a file" → `read`
- "Create a file" / "edit a file" / "delete a file" → `apply_patch`
- "Run a shell command" → `bash`
- "Search file contents" / "find files by name" → `grep`, `glob`
- "Fetch a URL" → `webfetch`

**V2 (`opencode` 2.0.4 or later; `opencode2` may be available as an alias):**

- "Create a todo" → V2 has no todo tool of any kind; the mapping tells the model to track the plan in a markdown file (or the harness's plan facility) instead
- `Subagent (general-purpose):` template → OpenCode's `subagent` tool with `agent: "general"` (or `"explore"`); pass `sessionID` to continue a previous subagent
- "Invoke a skill" → OpenCode's native `skill` tool
- "Read a file" → `read`
- "Create, edit, or delete files" → use `patch` with `patchText` when available; otherwise use `write` to create or overwrite files, `edit` for targeted changes, and `shell` for deletion
- "Run a shell command" → `shell` (`command`, `workdir`, `timeout`, `background`)
- "Search file contents" / "find files by name" → `grep`, `glob`
- "Fetch a URL" → `webfetch`
- "Search the web" → `websearch`

In short, V2 renamed `task` → `subagent` (the agent name moved from `subagent_type` to `agent`, and continuation happens by re-invoking with `sessionID`), `apply_patch` → `patch`, and `bash` → `shell`, and it dropped the todo tool entirely. The available mutation tools depend on the selected model: `patch` is available for selected GPT model IDs, while other models use `write` and `edit`.

(V1 list verified against the installed OpenCode 1.18.x CLI's tool inventory; V2 list verified against the OpenCode 2.0.4 and 2.0.7 host contracts.)

## Troubleshooting

### Plugin not loading

**V1:** Check OpenCode logs:

```
opencode run --print-logs "hello" 2>&1 | grep -i superpowers
```

**V2:** Plugins load in the background server, whose logs `--print-logs` only
shows with `--standalone`:

```
opencode run --standalone --print-logs "hello" 2>&1 | grep -i superpowers
```

Or inspect `~/.local/share/opencode/log/opencode.log`, filtering for `role=server`.

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

Then use the absolute path of the installed package in `opencode.json` for your
OpenCode version. OpenCode does not expand `~`; a `~/...` entry is treated as a
package name, not a local directory.

**V1:**

```json
{
  "plugin": ["C:\\Users\\<you>\\.config\\opencode\\node_modules\\superpowers"]
}
```

**V2 (2.0.4 or later):**

```json
{
  "plugins": ["C:\\Users\\<you>\\.config\\opencode\\node_modules\\superpowers"]
}
```

### Skills not found

1. Use OpenCode's `skill` tool to list available skills
2. Check that the plugin is loading (see above)
3. Each skill needs a `SKILL.md` file with valid YAML frontmatter

### Bootstrap not appearing

- **V1:** Check OpenCode version supports `experimental.chat.messages.transform` hook. Restart OpenCode after config changes.
- **V2:** The plugin uses `ctx.session.hook("context")` for bootstrap injection. Verify the plugin loaded via `opencode api get /api/plugin`. Restart with `opencode service restart` after config changes. The `opencode2` command may be available as an alias.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
- OpenCode V2 docs: https://opencode.ai/v2/docs/
- OpenCode V1 docs: https://opencode.ai/docs/
