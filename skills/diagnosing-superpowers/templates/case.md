# Case: <session-id>

Workspace: ~/.superpowers/diagnosing-superpowers/<session-id>/
Created: <ISO timestamp>

Local diagnostic record. Preserve the original session metadata and evidence
here; this file is not a public issue or a scrubbed bundle. Redact only a copy
made for export. Keep the source transcripts unchanged.

## Problem statement (agreed with your human partner)

<One paragraph. Names the session(s), the turn range if known, what was
expected, what happened, and the observable that matters: wall-clock,
tokens, repeated actions, a specific unexpected action. Record the agreed
statement exactly, even if it contains private context.>

Goal is a superpowers bug report: yes | no

## Sessions

| Role | Session id | Absolute path | Lines | Bytes | Longest line (bytes) | First initiating message source location | First timestamp |
|---|---|---|---|---|---|---|---|
| main | | | | | | | |
| subagent | | | | | | | |

Record the main session's complete first human prompt and each subagent's
complete parent dispatch below, with their exact source locations. Preserve
line breaks and wording; do not summarize or truncate. Follow the
context-safety rules when extracting them.

### First initiating messages (local only)

<session id — main human prompt or subagent parent dispatch — source path:line — complete text>

Rejected candidates: <id — path — why rejected>, or "none".

Session still running at read time: yes | no (mtime <ISO>, lines <N>)

## Environment

- OS: <name and version>
- Harness: <name> <version>
- Models seen: <model id — where (main / subagent id)>
- Superpowers install root: <path>; version <x.y.z>; git sha <sha or "not a checkout">
- Skill files read or injected during the session:

| Skill / source path | sha1 or unavailable | Provenance | Supporting location |
|---|---|---|---|

Label environment and skill observations as historical evidence, unverified
snapshot, current observation, or unknown. Check supplied provenance notes,
archives and captured skill bodies before declaring historical information
unavailable. Missing original paths do not erase retained copies. Current
versions/mtimes do not establish historical versions; one captured skill body
does not authenticate an entire installation.

- Other plugins / extensions / MCP servers observed in session evidence: <preserve all entries already present in examined records with source and whether instructions were loaded/injected, invoked, materially instructing, implicated, or merely listed; "none found" or "unknown" if appropriate>. Do not query a full installed-plugin inventory solely for diagnosis or infer loading or use from installation.
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
