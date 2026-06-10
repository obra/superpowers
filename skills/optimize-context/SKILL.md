---
name: optimize-context
description: Diagnose and reduce session context bloat — covers MCP integration cleanup, session memory trimming, and mid-session cost reduction
---

Use this skill when sessions are hitting the context limit faster than expected, when costs spike, or for periodic maintenance.

## Step 1: Diagnose the contributors

Run these to measure each source:

```bash
# Session memory size (if you use an auto-memory system)
wc -l -c ~/.claude/projects/*/memory/MEMORY.md 2>/dev/null

# CLAUDE.md files loaded for this project
find $(git rev-parse --show-toplevel) -name CLAUDE.md -not -path "*/node_modules/*" 2>/dev/null | xargs wc -c 2>/dev/null

# MCP servers configured locally
cat ~/.claude/settings.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('mcpServers',{})), 'MCP servers')"
```

Also inspect the `<system-reminder>` at the top of the conversation. Count how many `mcp__claude_ai_*` entries appear — each connected claude.ai integration injects 2 deferred tool entries.

## Step 2: Known contributors (ordered by impact)

### claude.ai connected integrations (MCP)
Each integration at claude.ai → Settings → Connected apps injects 2 deferred tool entries (`authenticate` + `complete_authentication`) into every Claude Code session. Disconnect any not actively used in Claude Code (Asana, HubSpot, Intercom, Box, Canvas, etc.).

### Session memory too large
If you use an auto-memory or session-notes system, it loads on every session. Keep it lean:
- Move domain-specific entries to on-demand sub-files (e.g. `backend/INDEX.md`, `frontend/INDEX.md`) rather than keeping everything in the root index
- Remove entries for completed work — they're in git history
- Target the root index at ≤50 lines

### Skills list length
Every installed plugin adds its skills to the system-reminder. Hard to reduce without uninstalling plugins.

### Superpowers SessionStart hook
The superpowers plugin embeds the full `using-superpowers` SKILL.md (~5 KB) into context on every session start, `/clear`, and `/compact` — by design, not configurable without forking the plugin.

### CLAUDE.md files
All CLAUDE.md files in the project load on every session. Hard to reduce — they contain real guidelines.

## Step 3: Address rising costs mid-session

- `/compact` — compresses prior conversation (trades tokens for lost detail)
- Pipe bash outputs aggressively: `pytest ... 2>&1 | tail -50`, `git diff HEAD --stat`
- Prefer `Grep`/`Glob`/`Read` directly over spawning Agent subagents for targeted lookups
- Restart the session when switching tickets — don't carry a session across unrelated tasks

If you have hooks configured in `~/.claude/settings.json`, consider adding:
- A warning when spawning Agent (subagents create expensive sub-contexts)
- A periodic suggestion to `/compact` every N tool calls
- A session-age alert after a configurable number of minutes
