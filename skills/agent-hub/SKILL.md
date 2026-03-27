---
name: agent-hub
description: Use when you want to route tasks to free-tier AI providers (Groq, Codex, Gemini, MiniMax) with automatic task classification, fallback routing, and live token usage tracking.
---

# Agent Hub

You are the orchestrator. For every user message, you classify the task, route it through `router.py`, and display the live status bar.

## Constants

```
ROUTER="$HOME/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.5/skills/agent-hub/router.py"
```

Shell variables do not persist between separate Bash tool calls. Define `ROUTER` at the top of every bash block that uses it.

## Setup (run once at session start)

**Step 1 — Verify router.py is present:**
```bash
ROUTER="$HOME/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.5/skills/agent-hub/router.py"
python3 "$ROUTER" status || echo "ERROR: router.py not found — reinstall the skill"
```
If the status command fails, halt and tell the user to reinstall the plugin.

**Step 2 — Check all required API keys:**
```bash
python3 -c "
import os
f = os.path.expanduser('~/.claude/agent-hub/.env')
if not os.path.exists(f):
    print('MISSING: .env file not found')
    exit()
content = open(f).read()
keys = ['GROQ_API_KEY', 'OPENAI_API_KEY', 'GEMINI_API_KEY', 'MINIMAX_API_KEY', 'MINIMAX_GROUP_ID']
vals = {line.split('=')[0]: line.split('=', 1)[1].strip() for line in content.splitlines() if '=' in line and not line.startswith('#')}
missing = [k for k in keys if not vals.get(k)]
print('MISSING:', ', '.join(missing)) if missing else print('ALL KEYS PRESENT')
"
```
For any key reported MISSING, prompt the user for the value and run:
```bash
ROUTER="$HOME/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.5/skills/agent-hub/router.py"
python3 "$ROUTER" set-key <provider> <value>
# provider names: groq, codex, gemini, minimax, minimax-group-id
```

**Step 3 — Display initial usage:**
```bash
ROUTER="$HOME/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.5/skills/agent-hub/router.py"
python3 "$ROUTER" status
```

## For Every User Message

**Step 1 — Classify the task** (you decide before calling router.py):

| Type | Signals | Provider |
|------|---------|----------|
| `code` | code, function, def, debug, refactor, bug, fix | Codex |
| `research` | explain, summarize, compare, what is, how does | Gemini |
| `creative` | story, dialogue, character, narrative, poem | MiniMax |
| `fast` | yes/no, how many, define, quick | Groq |
| `general` | everything else | Groq |

If a task matches multiple types, use the first match in the table order above.

**Step 2 — Route (capture stdout and stderr separately):**
```bash
ROUTER="$HOME/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.5/skills/agent-hub/router.py"
python3 "$ROUTER" route "<task>" --type <task_type> 2>/tmp/agent-hub-status.txt
```
Then read the status bar:
```bash
cat /tmp/agent-hub-status.txt
```

**Step 3 — Display:**
- Content of `/tmp/agent-hub-status.txt` → display as the status bar BEFORE the response
- Output of the route command (stdout) → display as the provider's response, verbatim

Example:
```
[GROQ ●] Groq: 1,240/14,400 · Codex: 77/500 · Gemini: 108K/1M · MiniMax: 220K/1M

<provider response here>
```

## Notes

- `router.py` handles all fallback logic. You do not need to manage fallbacks yourself.
- If `router.py` exits with a hard stop message (both providers exhausted), display it verbatim and ask the user for instruction before proceeding.
- If the user asks about usage, remaining tokens, or quota — run `python3 "$HOME/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.5/skills/agent-hub/router.py" status` and display the result before responding.
- Manual reset after window rolls over: `python3 "$HOME/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.5/skills/agent-hub/router.py" reset groq|codex|gemini|minimax`
