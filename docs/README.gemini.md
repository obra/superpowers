# Superpowers for Gemini CLI

Guide for using Superpowers with Google's Gemini CLI.

## Quick Install

```bash
git clone https://github.com/obra/superpowers.git ~/.gemini/superpowers && ~/.gemini/superpowers/.gemini/install.sh
```

This will:
- Symlink each skill individually into `~/.gemini/skills/` (hub pattern)
- Symlink agent definitions into `~/.gemini/agents/`
- Inject the Superpowers context block into `~/.gemini/GEMINI.md`

Then restart Gemini CLI.

## Extension Install

You can also install via the Gemini CLI extension system, which uses the same native skill discovery:

```bash
gemini extensions install https://github.com/obra/superpowers
```

> **Note:** The install script approach above is recommended because it provides individual skill symlinks and injects the full context block with tool mappings into `~/.gemini/GEMINI.md`.

## How It Works

Gemini CLI (v0.24.0+) natively supports Agent Skills. At startup it scans `~/.gemini/skills/` for directories containing a `SKILL.md` file and injects their name and description into the system prompt. When a task matches a skill's description, Gemini calls the `activate_skill` tool to load the full instructions.

The installer creates individual symlinks (hub pattern) so each skill is discoverable independently. Skills update instantly whenever you `git pull`.

## Usage

Once installed, skills are discovered automatically. Gemini will activate them when:
- You mention a skill by name (e.g., "use brainstorming")
- The task matches a skill's description

You can also list and manage skills:

```text
/skills list
```

## Updating

```bash
cd ~/.gemini/superpowers && git pull
```

## Uninstalling

```bash
find ~/.gemini/skills -type l -lname '*/superpowers/skills/*' -delete
find ~/.gemini/agents -type l -lname '*/superpowers/agents/*' -delete
# Remove the injected Superpowers context block from GEMINI.md
sed -i.bak '/<!-- SUPERPOWERS-CONTEXT-START -->/,/<!-- SUPERPOWERS-CONTEXT-END -->/d' ~/.gemini/GEMINI.md && rm -f ~/.gemini/GEMINI.md.bak
rm -rf ~/.gemini/superpowers
```

## Troubleshooting

### Skills not showing up

1. **Check symlinks**: `ls -l ~/.gemini/skills/` — should show symlinks into your superpowers clone
2. **Check Gemini version**: Skills require v0.24.0+. Run `gemini --version`
3. **Restart Gemini CLI**: Skills are discovered at startup

If issues persist, please report them on the [Superpowers GitHub repository](https://github.com/obra/superpowers/issues).
