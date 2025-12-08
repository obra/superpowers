# Installing Superpowers for Claude Code for Web

Claude Code for Web can install Superpowers skills locally to your home directory, making them available across sessions.

## Installation

1. **Clone superpowers repository**:
   ```bash
   mkdir -p ~/.claude/skills/superpowers
   cd ~/.claude/skills/superpowers
   git clone https://github.com/obra/superpowers.git .
   ```

2. **Activate at session start**: Claude Code for Web doesn't have automatic hooks, so at the beginning of each conversation, tell Claude:
   ```
   Read ~/.claude/skills/superpowers/skills/using-superpowers/SKILL.md and follow it.
   ```

## Verification

To test the installation, ask Claude:

```
List the directories in ~/.claude/skills/superpowers/skills/ and read the using-superpowers skill.
```

You should see a list of skill directories (brainstorming, test-driven-development, systematic-debugging, etc.) and Claude should display the using-superpowers skill content. The system is now ready for use.
