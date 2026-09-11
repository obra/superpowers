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

- Follow `references/context-safety.md` before reading any file listed here.
- In a subagent transcript, "user" is the parent agent.

## Discovered sources and record meanings

- Sources consulted: <absolute path, tool, help, or documentation source>
- Extraction commands or queries: <bounded commands or tool queries used for each source>
- Target identity evidence: <session id, working directory, timestamps, matching content, and supporting record locations>
- Associated sessions: <session id, relationship, and supporting record locations, or "none found">
- Human messages: <record shape and evidence for its meaning>
- Injected messages and parent dispatches: <record shape and evidence for its meaning>
- Assistant messages: <record shape and evidence for its meaning>
- Tool calls and results: <record shapes, how they match, and evidence for those meanings>
- Usage counters: <fields, incremental or cumulative semantics, units, and evidence, or "unavailable">
- Timing: <fields, units, event boundaries, and evidence, or "unavailable">
- Other relevant records: <models, versions, compactions, or other meanings and evidence>
- Unresolved information: <missing, inaccessible, ambiguous, or absent information, or "none">
