# Superpowers for AtomCode

Complete guide for using Superpowers with [AtomCode](https://atomgit.com).

## Installation

Register the Superpowers marketplace and install the plugin from it:

```bash
atomcode plugin marketplace add https://github.com/obra/superpowers-marketplace
atomcode plugin install superpowers@superpowers-marketplace
```

Trust the plugin's hooks so the session-start bootstrap runs:

```bash
atomcode plugin trust superpowers
```

Restart AtomCode. The plugin installs through AtomCode's plugin manager,
registers all skills, and the session-start hook injects the
`using-superpowers` bootstrap at the start of every session.

Verify by asking: "Tell me about your superpowers"

AtomCode installs Superpowers through its own plugin mechanism. If you also
use Claude Code, Codex, or another harness, install Superpowers separately
for each one.

### Installing from this repository (development)

The repository itself is a marketplace (`source: "./"` in
`.claude-plugin/marketplace.json`), so you can install the in-development
version directly:

```bash
atomcode plugin marketplace add https://github.com/obra/superpowers
atomcode plugin install superpowers@superpowers
atomcode plugin trust superpowers
```

A local checkout works the same way with a `file://` URL:

```bash
atomcode plugin marketplace add file:///path/to/superpowers
atomcode plugin install superpowers@superpowers
atomcode plugin trust superpowers
```

### Reinstalling / updating

Update the marketplace clone, reinstall the plugin, and re-trust hooks if the
plugin's hook set changed (the trust record is keyed to a hash of the hook set):

```bash
atomcode plugin marketplace update superpowers-marketplace
atomcode plugin install superpowers@superpowers-marketplace
atomcode plugin trust superpowers
```

## Usage

### Finding Skills

Use AtomCode's native `list_skills` tool to enumerate available skills.
Installed skills are namespaced (`superpowers:skill-name`):

```
use list_skills to list skills
```

### Loading a Skill

```
use use_skill to load brainstorming
```

### Personal Skills

Create your own skills in `~/.atomcode/skills/`:

```bash
mkdir -p ~/.atomcode/skills/my-skill
```

Create `~/.atomcode/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

### Project Skills

Create project-specific skills in `.atomcode/skills/` within your project.

**Skill Priority:** Project skills > Personal skills > Superpowers skills

## How It Works

Superpowers ships as a Claude Code–compatible plugin that AtomCode loads
natively:

1. **Bootstrap injection** — AtomCode runs the plugin's `SessionStart` hook
   (`hooks/hooks.json` → `hooks/session-start`) at session start and injects
   the hook's `hookSpecificOutput.additionalContext` output (the
   `using-superpowers` skill content, wrapped in `<EXTREMELY_IMPORTANT>`) into
   the conversation as a user-role message.
2. **Skill discovery** — AtomCode reads the plugin's `skills/` directory and
   exposes every skill through its native `use_skill` tool, namespaced
   `superpowers:skill-name`.

No AtomCode-specific manifest is needed: AtomCode accepts the
`.claude-plugin/marketplace.json` marketplace format, the plugin manifest, and
the Claude Code `hooks.json` schema (event names are case-insensitive), and it
exports `CLAUDE_PLUGIN_ROOT` to plugin hooks just like Claude Code does.

### Tool Mapping

Skills speak in actions rather than naming any one runtime's tools. On AtomCode these resolve to:

- "Invoke a skill" → AtomCode's native `use_skill` tool (`list_skills` to enumerate)
- "Create a todo" / "mark complete in todo list" → `todowrite`
- `Subagent (general-purpose):` template → `task` tool with `subagent_type` (or `team` for async parallel work)
- "Read a file" → `read_file`
- "Create a file" / "edit a file" / "delete a file" → `write_file`, `edit_file`, `bash`
- "Run a shell command" → `bash`
- "Search file contents" / "find files by name" → `grep`, `glob`
- "Fetch a URL" / "search the web" → `web_fetch`, `web_search`

(Verified against AtomCode 5.0.x's installed tool inventory; see
`skills/using-superpowers/references/atomcode-tools.md`.)

## Troubleshooting

### Bootstrap not appearing

1. Check that the plugin is installed: `atomcode plugin list`
2. Check that the plugin's hooks are trusted: the plugin list shows trust
   state — if untrusted, run `atomcode plugin trust superpowers`
3. Restart AtomCode after install/trust changes

### Skills not found

1. Use the `list_skills` tool to list available skills
2. Check that the plugin is installed (see above)
3. Each skill needs a `SKILL.md` file with valid YAML frontmatter

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
- AtomCode docs: https://atomgit.com (docs section)
