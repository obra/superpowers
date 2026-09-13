# Installing Superpowers for AtomCode

## Prerequisites

- [AtomCode](https://atomgit.com) installed (5.0.0+; hooks support is required)

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

## Usage

Use AtomCode's native skill tools:

```
use list_skills to list skills
use use_skill to load brainstorming
```

Installed skills are namespaced (`superpowers:skill-name`). See
`docs/README.atomcode.md` for the tool mapping and details.

## Updating

AtomCode installs Superpowers through a git-backed marketplace clone. Update
the marketplace and reinstall the plugin to pick up new commits:

```bash
atomcode plugin marketplace update superpowers-marketplace
atomcode plugin install superpowers@superpowers-marketplace
```

If the plugin's hooks changed, re-trust them (the trust record is keyed to a
hash of the hook set):

```bash
atomcode plugin trust superpowers
```

## Troubleshooting

### Bootstrap not appearing

1. Check that the plugin is installed: `atomcode plugin list`
2. Check that the plugin's hooks are trusted: `atomcode plugin list` shows
   trust state — if untrusted, run `atomcode plugin trust superpowers`
3. Restart AtomCode after install/trust changes

### Skills not found

1. Use the `list_skills` tool to see what's discovered
2. Check that the plugin is installed (see above)

### Tool mapping

Skills speak in actions ("create a todo", "dispatch a subagent", "read a file"). On AtomCode these resolve to:

- "Invoke a skill" → AtomCode's native `use_skill` tool (`list_skills` to enumerate)
- "Create a todo" / "mark complete in todo list" → `todowrite`
- `Subagent (general-purpose):` template → `task` tool with `subagent_type`
- "Read a file" → `read_file`
- "Create a file" / "edit a file" → `write_file`, `edit_file`
- "Run a shell command" → `bash`
- "Search file contents" / "find files by name" → `grep`, `glob`
- "Fetch a URL" / "search the web" → `web_fetch`, `web_search`

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Full documentation: https://github.com/obra/superpowers/blob/main/docs/README.atomcode.md
