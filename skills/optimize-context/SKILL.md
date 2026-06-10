---
name: optimize-context
description: Use when sessions hit the context limit faster than expected, costs spike unexpectedly, or for periodic maintenance to reduce per-session token overhead.
---

# Optimize Context

## Overview

Diagnose context bloat before reaching for session habits. The largest wins come from one-time structural fixes that pay off on every future session.

**Core principle:** Measure first. Fix the highest-impact source. Context compression is the last resort, not the first.

## Step 1: Diagnose the contributors

Measure each source before acting:

- **Session memory**: size of your harness's project memory files (Superpowers auto-memory)
- **Instruction files**: total size of CLAUDE.md / GEMINI.md / AGENTS.md in the project tree
- **Skills**: count of installed plugins and their skills
- **Claude Code:** count `mcp__claude_ai_*` entries in the session startup context — each connected claude.ai integration injects at least 2 deferred tool entries; full-featured integrations (e.g. Honeydew, Notion) inject dozens more. Also count MCP servers in harness settings.

## Step 2: Known contributors (ordered by impact)

### Superpowers SessionStart hook
The superpowers plugin embeds the full `using-superpowers` SKILL.md (~5 KB) into context on every session start and context reset — by design, not configurable without forking the plugin.

### Session memory too large
If you use an auto-memory or session-notes system, it loads on every session. Keep it lean:
- Move domain-specific entries to on-demand sub-files (e.g. `backend/INDEX.md`, `frontend/INDEX.md`) rather than keeping everything in the root index
- Remove entries for completed work — they're in git history
- Target the root index at ≤50 lines

### Skills list length
Every installed plugin adds its skills to the session context. Hard to reduce without uninstalling plugins.

### Harness instruction files
All harness instruction files (CLAUDE.md, GEMINI.md, AGENTS.md) in the project load on every session. Hard to reduce — they contain real guidelines.

### Claude Code: claude.ai connected integrations
Each integration at claude.ai → Settings → Connected apps injects deferred tool entries into every session — at minimum 2 (`authenticate` + `complete_authentication`), but full-featured integrations inject many more (e.g. a data platform integration may inject 40+). Disconnect any not actively used in Claude Code (Asana, HubSpot, Intercom, Box, Canva, etc.).

## Step 3: Address rising costs mid-session

- Use your harness's context compression command (`/compact` in Claude Code) — trades tokens for lost detail
- Truncate or filter verbose command output — capture only the last N lines or filter to errors/failures only
- Prefer native file search tools (e.g. Grep/Glob/Read in Claude Code) over spawning Agent subagents for targeted lookups
- Restart the session when switching tickets — don't carry a session across unrelated tasks

Ensure large generated files, vendor directories, and build artifacts are listed in `.gitignore` — the harness respects it to avoid reading them into context.

If you have hooks configured in your harness settings (e.g. `~/.claude/settings.json` in Claude Code), consider adding:
- A warning when spawning Agent (subagents create expensive sub-contexts)
- A periodic suggestion to compress context every N tool calls
- A session-age alert after a configurable number of minutes
