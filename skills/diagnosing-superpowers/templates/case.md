# Case: <session-id>

Workspace: ~/.superpowers/diagnosing-superpowers/<session-id>/
Created: <ISO timestamp>

## Problem statement (agreed with your human partner)

<One paragraph. Names the session(s), the turn range if known, what was
expected, what happened, and the observable that matters: wall-clock,
tokens, repeated actions, a specific unexpected action.>

Goal is a superpowers bug report: yes | no

## Sessions

| Role | Session id | Absolute path | Lines | Bytes | Longest line (bytes) | First prompt (first 120 chars) | First timestamp |
|---|---|---|---|---|---|---|---|
| main | | | | | | | |
| subagent | | | | | | | |

Rejected candidates: <id — path — why rejected>, or "none".

Session still running at read time: yes | no (mtime <ISO>, lines <N>)

## Environment

- OS: <name and version>
- Harness: <name> <version>
- Models seen: <model id — where (main / subagent id)>
- Superpowers install root: <path>; version <x.y.z>; git sha <sha or "not a checkout">
- Skill files read or injected during the session:

| File (relative to install root) | sha1 (current file) | mtime newer than session? |
|---|---|---|

- Other plugins / extensions / MCP servers configured: <list, or "none found">
- Instruction files present (paths only): <list>

## Context-safety rules for every reader of these files

- Check `wc -lc` and long lines (`awk '{ if (length($0) > 100000) print NR, length($0) }'`) before reading.
- Never `cat` or `grep` for content. Line numbers and counts first
  (`grep -n … | cut -d: -f1`), then small fields from specific lines
  (`sed -n Np | jq -c '{…}'` or `| cut -c1-500`).
- Read-only: never modify, move, or delete a session file.
- In a subagent transcript, "user" is the parent agent.

## Harness reference to use

<references/claude-code-sessions.md | references/codex-sessions.md | references/other-harnesses.md>
