# Superpowers for OpenCode

Complete guide for using Superpowers with [OpenCode.ai](https://opencode.ai).

## Installation

Add superpowers to the `plugin` array in your `opencode.json` (global or project-level):

```json
{
  "plugin": ["superpowers@git+https://github.com/obra/superpowers.git"]
}
```

Restart OpenCode. The plugin auto-installs via Bun and registers all skills automatically.

Verify by asking: "Tell me about your superpowers"

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
use skill tool to load superpowers/brainstorming
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

Superpowers updates automatically when you restart OpenCode. The plugin is re-installed from the git repository on each launch.

To pin a specific version, use a branch or tag:

```json
{
  "plugin": ["superpowers@git+https://github.com/obra/superpowers.git#v5.0.3"]
}
```

## How It Works

The plugin does two things:

1. **Injects bootstrap context** via the `experimental.chat.system.transform` hook, adding superpowers awareness to every conversation.
2. **Registers the skills directory** via the `config` hook, so OpenCode discovers all superpowers skills without symlinks or manual config.

### Tool Mapping

Skills written for Claude Code are automatically adapted for OpenCode:

- `TodoWrite` → `todowrite`
- `Task` with subagents → OpenCode's `@mention` system
- `Skill` tool → OpenCode's native `skill` tool
- File operations → Native OpenCode tools

## Windows: Manual Install (Workaround)

On Windows, the git-based plugin spec fails with an `ENOENT` error because
OpenCode embeds the raw spec string in the cache directory path, producing an
invalid path like:

```
C:\Users\<USER>\.cache\opencode\packages\superpowers@git+https:\github.com\obra\superpowers.git
```

The `+https:` gets backslash-mangled into a filesystem path. Until this is
fixed upstream in OpenCode, use a local clone instead:

```powershell
# 1. Clone superpowers
git clone https://github.com/obra/superpowers.git "$HOME\.config\opencode\superpowers"

# 2. Use a file:// plugin spec in opencode.json
```

```json
{
  "plugin": ["superpowers@file://~/.config/opencode/superpowers"]
}
```

```powershell
# 3. Restart OpenCode and verify
opencode debug skill --pure
```

To update later: `cd "$HOME\.config\opencode\superpowers" && git pull`

## Troubleshooting

### Windows: ENOENT when installing plugin

This is the path-mangling bug described above. Use the local clone workaround
in the "Windows: Manual Install" section. See [#1068](https://github.com/obra/superpowers/issues/1068) for details.

### Plugin not loading

1. Check OpenCode logs: `opencode run --print-logs "hello" 2>&1 | grep -i superpowers`
2. Verify the plugin line in your `opencode.json` is correct
3. Make sure you're running a recent version of OpenCode

### Skills not found

1. Use OpenCode's `skill` tool to list available skills
2. Check that the plugin is loading (see above)
3. Each skill needs a `SKILL.md` file with valid YAML frontmatter

### Bootstrap not appearing

1. Check OpenCode version supports `experimental.chat.system.transform` hook
2. Restart OpenCode after config changes

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
- OpenCode docs: https://opencode.ai/docs/
