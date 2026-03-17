# Installing Superpowers for Kiro IDE

## Installation

1. Open **Kiro IDE**
2. Open the **Powers Panel**
3. Click **"Import power from GitHub"**
4. Enter: `https://github.com/obra/superpowers`
5. Install the power

That's it. The power activates automatically — no file copying, no symlinks.

## Usage

Skills activate based on keywords. Just chat naturally:

- Mention **"debug"** or **"bug"** → systematic-debugging skill activates
- Mention **"brainstorm"** or **"design"** → brainstorming skill activates
- Mention **"tdd"** or **"test"** → test-driven-development skill activates
- Mention **"plan"** → writing-plans skill activates

Or ask explicitly:

```
"Use the systematic-debugging skill"
"Start TDD"
"Use brainstorming to plan this feature"
```

The agent will load the skill via `discloseContext` and follow it immediately.

> **Note:** Slash commands (`/brainstorming`, `/tdd`, etc.) are not available with this installation method because Kiro does not currently follow symlinks in `~/.kiro/skills/`. Keyword activation covers the same use cases.

## Updating

Since skills are read directly from the cloned repository, a `git pull` is all you need:

```bash
cd ~/.kiro/powers/repos/superpowers
git pull
```

Restart Kiro. The agent immediately sees updated skill content on the next activation.

## Troubleshooting

**Power not activating:**
1. Verify the power appears in the Powers Panel
2. Try mentioning a keyword like "debug" or "brainstorm" in chat
3. Check that `POWER.md` exists in the installed power directory

**Agent uses wrong tool names (e.g. `Bash` instead of `executeBash`):**
Remind the agent: *"Use Kiro tools: `discloseContext` for skills, `invokeSubAgent` for subagents, `executeBash` for shell commands."*

**Getting help:**
- Issues: https://github.com/obra/superpowers/issues
- Documentation: https://github.com/obra/superpowers
