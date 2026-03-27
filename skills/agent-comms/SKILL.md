---
name: agent-comms
description: Use when multiple Claude agents are working in the same project across different terminals — coordinates file editing, detects conflicts upfront, and negotiates resolution before edits happen
---

# Agent Comms — Cross-Terminal Coordination Protocol

Coordinates multiple Claude agents working in the same project directory.
Prevents editing conflicts through upfront announcements and negotiated resolution.

## Setup

All commands use `comms.py` from the skill directory. Define this path once:

```bash
COMMS="$HOME/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.5/skills/agent-comms/comms.py"
```

## Step 1: Startup

Check who is already active:
```bash
python3 $COMMS status
```

Auto-assign your name:
- 0 agents active → you are `agent-1`
- 1 agent active → you are `agent-2`
- 2 agents active → you are `agent-3`

Ask the user:
> "I'll call myself `agent-N` for coordination. Want to rename me? (press enter to keep)"

Once confirmed, register:
```bash
python3 $COMMS register agent-N "<one-sentence description of your task>"
```

## Step 2: Announce Upfront (BEFORE any file edit)

Before touching ANY file this session, list every file you plan to edit and why:

```bash
python3 $COMMS announce agent-N \
  "path/to/file1.ts|reason for editing" \
  "path/to/file2.py|reason for editing"
```

Use `|` as the delimiter. The path is everything before the first `|`; the reason is everything after.

Then immediately check for conflicts:
```bash
python3 $COMMS check-conflicts agent-N
```

**If output is `CLEAR`** → proceed with your work.

**If output contains `CONFLICT`** → go to Step 3.

## Step 3: Conflict Negotiation

When a conflict is detected, you are the LATER announcer. Send a negotiation message to the earlier agent:

```bash
python3 $COMMS send agent-N agent-X \
  "CONFLICT on <file> — my change: <describe exactly what you need>. Options: (1) you include my change, (2) I go after you, (3) we split the file."
```

Before editing that conflicted file, check for a reply:
```bash
python3 $COMMS read-messages agent-N
```

**If they replied** → follow their decision (wait for their DONE broadcast, or proceed with agreed split).

**If no reply** → check messages.json before each subsequent file edit. If 2 minutes of real work passes with no reply (you have checked at least twice), ask the user to resolve manually.

The agent that announced **first** has priority. Never edit a conflicted file unilaterally.

## Step 4: During Work

Check messages before starting each new file:
```bash
python3 $COMMS read-messages agent-N
```

Every ~10 tool calls (Read, Edit, Write, Bash), run a heartbeat. Track this yourself:
```bash
python3 $COMMS heartbeat agent-N
```

Agents with no heartbeat for 5 minutes are considered stale and auto-removed.

## Step 5: Done

When your task is complete:
```bash
python3 $COMMS done agent-N "file1.ts" "file2.py" "file3.ts"
```

List each modified file as a separate argument. This deregisters you and broadcasts your completion to all other active agents.

## Quick Reference

| When | Command |
|------|---------|
| Session start | `status` then `register` |
| Before any edit session | `announce` then `check-conflicts` |
| Conflict detected | `send` negotiation message |
| Before each new file | `read-messages` |
| Every ~10 tool calls | `heartbeat` |
| Task complete | `done` |
| Check who's active | `status` |

## Rules

- NEVER edit a file that another agent has announced WITHOUT negotiating first
- The agent that announced FIRST has priority — the later agent initiates negotiation
- If a conflict is unresolved after 2 minutes, ask the user rather than proceeding unilaterally
- Heartbeat is best-effort — agents are auto-removed after 5 min of silence
- `.agent-comms/` is added to `.gitignore` automatically — do not commit it
