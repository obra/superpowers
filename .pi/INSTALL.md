# Installing Superpowers for Pi

## Prerequisites

- [Pi](https://github.com/earendil-works/pi) installed

## Installation

```bash
pi install git:github.com/obra/superpowers
```

Pi clones the repo, runs `npm install`, and auto-discovers the `skills/`
directory. All skills are available immediately — no restart needed.

Verify by asking: "Tell me about your superpowers"

Pi has its own package install. If you also use OpenCode, Claude Code, Codex, or
another harness, install Superpowers separately for each one.

## Migrating from a manual install

If you previously installed superpowers by cloning and adding to `skills` in
settings, remove the old setup:

```bash
# Remove any manual skills path you added for superpowers
# Edit ~/.pi/agent/settings.json and remove the entry from "skills"

# Optionally remove the cloned repo
rm -rf ~/path/to/cloned/superpowers
```

Then follow the installation steps above.

## Usage

Pi discovers skills automatically. Use the `/skill:name` command or ask the
agent to load a skill by name:

```
/skill:brainstorming
/skill:systematic-debugging
```

Or ask naturally: "load the brainstorming skill" / "use the test-driven-development skill"

List all available skills:

```
/skill:using-superpowers
```

## Updating

```bash
pi update git:github.com/obra/superpowers
```

Or update all packages at once:

```bash
pi update --extensions
```

To pin a specific version:

```bash
pi install git:github.com/obra/superpowers@v5.0.3
```

Which writes to `~/.pi/agent/settings.json`:

```json
{
  "packages": [
    "git:github.com/obra/superpowers@v5.0.3"
  ]
}
```

## Troubleshooting

### Skills not found

1. Check pi can see installed packages: `pi list`
2. Confirm the package cloned correctly:
   `ls ~/.pi/agent/git/github.com/obra/superpowers/skills/`
3. Make sure you're running a recent version of pi: `pi update --self`

### Installing without the pi CLI

Add the entry directly to `~/.pi/agent/settings.json`:

```json
{
  "packages": [
    "git:github.com/obra/superpowers"
  ]
}
```

Pi will clone and install on next startup.

### Tool mapping

When skills reference tools from other harnesses:

- `TodoWrite` → `todowrite`
- `Task` with subagents → not supported; follow instructions manually
- `Skill` tool → use `/skill:name` or ask the agent to read the SKILL.md
- File operations → your native `read`/`write`/`edit`/`bash` tools

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Full documentation: https://github.com/obra/superpowers/blob/main/docs/README.md
- Pi documentation: run `pi help` or visit https://github.com/earendil-works/pi
