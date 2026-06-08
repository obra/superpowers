---
name: mcp-session-sync
description: Use at the start of a coding session in a repository when mem0 or Serena MCP tools are available, especially after context loss, branch changes, or returning to ongoing work
---

# MCP Session Sync

Initialize the Ultipowers execution layer before normal Superpowers workflow work.

## When to Run

Run once near session start when:

- You are inside a repository.
- mem0 or Serena tools are available.
- The task involves codebase understanding, implementation, debugging, or review.

Skip for casual questions, pure writing tasks, or repositories with no configured MCP tools.

## Sequence

1. Identify the active repository path and branch.
2. Load relevant mem0 project context: architecture, conventions, decisions, graph summaries, and recent durable learnings.
3. If mem0 context looks stale, note that it needs verification instead of treating it as fact.
4. Use Serena `get_current_config` or equivalent tool to verify active project state when available.
5. Use Serena onboarding/status checks when available; run onboarding only if missing.
6. Use Serena memory listing only for names relevant to the task; do not read every memory.
7. Summarize available context and fallbacks before implementation.

## Report Format

Keep the report short:

```text
Session sync:
- Repository: <path>
- Branch: <branch>
- mem0: <relevant memories / none / unavailable>
- Serena: <active / onboarding needed / unavailable>
- Fallbacks: <only if needed>
```

## Common Mistakes

- Running onboarding repeatedly when it already exists.
- Reading every memory instead of task-relevant memory keys.
- Treating stale memory as authoritative without checking current code.
- Blocking the user if one MCP is unavailable; continue with available tools.
