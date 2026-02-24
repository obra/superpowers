# Superpowers for Gemini CLI

Guide for using Superpowers with Google's Gemini CLI.

## Quick Install

```bash
gemini extensions install https://github.com/obra/superpowers
```

Then restart Gemini CLI.

## Manual Install (Recommended for power users)

For individual skill symlinks and full `~/.gemini/GEMINI.md` context injection:

```bash
git clone https://github.com/obra/superpowers.git ~/.gemini/superpowers && ~/.gemini/superpowers/.gemini/install.sh
```

This will:
- Symlink each skill individually into `~/.gemini/skills/` (hub pattern)
- Symlink agent definitions into `~/.gemini/agents/`
- Inject the Superpowers context block into `~/.gemini/GEMINI.md`

Then restart Gemini CLI.

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

1. **Check skills are enabled**: Run `/settings` in Gemini CLI → search "Skills" → ensure `skills.enabled` is `true` (it is on by default in v0.24.0+).
2. **Check symlinks**: `ls -l ~/.gemini/skills/` — should show symlinks into your superpowers clone
3. **Check Gemini version**: Skills require v0.24.0+. Run `gemini --version`
4. **Reload Skills**: Run `/skills reload` or restart Gemini CLI.

If issues persist, please report them on the [Superpowers GitHub repository](https://github.com/obra/superpowers/issues).
