---
name: script-first-tool-batching
description: Use when a task would require many sequential tool calls over files or data — batch them into a single script instead of calling tools one at a time
---

# Script-First Tool Batching

## Overview

LLMs are better at writing code than at emitting tool calls — they've seen millions of lines of real code and comparatively few tool-calling traces. For multi-step operations, writing one script that does the work and running it once is cheaper, faster, and more reliable than N sequential tool calls where each result re-enters context.

**Core principle:** If you're about to make 3+ tool calls that could be one script, write the script.

## When to Use

**Use when:**
- Batch file operations (read/transform/grep across many files)
- Data processing (filter, aggregate, summarise structured data)
- Repetitive checks (lint, test, validate across a set)
- Multi-step searches that could be one `find` + `grep` + `sort` pipeline

**Don't use when:**
- Single operations (one read, one edit — just do it)
- Operations requiring different tools (subagents, web search, memory — scripts can't call these)
- Exploratory work where you don't know what you need yet
- The operation requires human judgment at each step

## Core Pattern

### Before: N sequential tool calls (token-heavy, serial)

```
read("config.ts")     → 4K chars in context
read("router.ts")     → 6K chars in context
read("handler.ts")    → 8K chars in context  (18K total now)
grep("TODO")          → 2K chars in context  (20K total)
answer                → model re-reads all 20K
```

Each result stays in context for every subsequent request. A 5-step operation costs 5 round-trips and accumulates ~20K chars permanently.

### After: one script (1 tool call, bounded output)

```bash
node -e "
const files = ['config.ts', 'router.ts', 'handler.ts'];
const results = files.map(f => ({ file: f, lines: require('fs').readFileSync(f,'utf8').split('\n').length, todos: require('child_process').execSync('grep -c TODO ' + f).toString().trim() }));
console.table(results);
"
```

One tool call. The script does the work; only the summary table enters context (~200 chars). The intermediate file contents never touch the model.

## Quick Reference

| Situation | Approach |
|---|---|
| Read + summarise N files | One script that reads all, prints a table |
| Search + filter across a repo | One `find ... -exec grep ...` pipeline |
| Transform N files | One script with a loop, print what changed |
| Count/aggregate data | One script that computes, prints the result |
| Need a specific detail from large output | `grep` or `sed -n 'START,ENDp'` on the output |

## Common Mistakes

| Mistake | Fix |
|---|---|
| Over-scripting simple tasks (2 calls that could be a script) | The threshold is 3+ calls. Below that, just do them. |
| Script fails silently (no error output) | Always `set -e` in bash, check exit codes, print what happened |
| Script produces huge output (defeats the purpose) | Print a summary, not the full data. Use `head`, `wc`, `console.table`. |
| Script can't call pi tools (subagents, memory) | Correct — scripts run in the shell, not the harness. Use individual tool calls for those. |
| Not testing the script before relying on it | Run it on one file first, verify output, then batch. |

## Why This Works

Each tool call in a standard harness re-sends the full conversation context to the model. A 5-call operation with a 20K-token context costs 5 × 20K = 100K prompt tokens. The same work in one script costs 1 × 20K + 0.2K output = 20.2K — an 80% reduction. The savings compound in longer sessions because the intermediate results never enter the transcript.