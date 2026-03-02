# Installing Superpowers for Gemini CLI

## Quick Install

```bash
gemini extensions install https://github.com/sh3lan93/superpowers.git --path .gemini-cli
```

## Verify Installation

Check that skills are discovered:

```bash
gemini skills list
```

You should see 14+ superpowers skills:
- brainstorming
- test-driven-development
- systematic-debugging
- writing-plans
- subagent-driven-development
- [and 9 more]

View details for a skill:

```bash
gemini skills info brainstorming
```

Load a skill into current context:

```bash
gemini skills load test-driven-development
```

## What You Get

✅ **14+ skills** covering:
- TDD and testing
- Debugging and investigation
- Planning and design
- Collaboration and code review
- Meta-skills for creating new skills

✅ **Automatic skill activation** - Skills load when relevant

✅ **Persistent context** - Superpowers guidance in every session

✅ **Integrated hooks** - Proper initialization at startup

## For Developers

### Local Development

Link the extension for active development:

```bash
cd /path/to/superpowers/.gemini-cli
gemini extensions link .
```

Changes to SKILL.md files update immediately.

### Update from GitHub

```bash
gemini extensions update superpowers
```

## Troubleshooting

### Skills not showing?

1. Check installation:
   ```bash
   ls ~/.gemini/extensions/superpowers/skills/
   ```

2. List all skills:
   ```bash
   gemini skills list
   ```

3. If still missing, reinstall:
   ```bash
   gemini extensions uninstall superpowers
   gemini extensions install https://github.com/sh3lan93/superpowers.git --path .gemini-cli
   ```

### Skills not activating?

1. Skills activate automatically based on context
2. Try asking something directly:
   ```
   "Help me debug this issue"
   "Let me plan a feature"
   "Write a test first"
   ```

3. Load manually if needed:
   ```bash
   gemini skills load systematic-debugging
   ```

### Need help?

- Full docs: [../docs/README.gemini-cli.md](../docs/README.gemini-cli.md)
- Troubleshooting: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Issues: https://github.com/sh3lan93/superpowers/issues

## Uninstalling

```bash
gemini extensions uninstall superpowers
```

To completely remove, also delete:

```bash
rm -rf ~/.gemini/extensions/superpowers
```

## Next Steps

1. Start Gemini CLI: `gemini chat`
2. Ask something that needs a skill
3. Watch the skill activate automatically
4. Read the GEMINI.md context for full guidance

Enjoy your superpowers! 🦸
