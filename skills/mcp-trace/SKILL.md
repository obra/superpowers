---
name: mcp-trace
description: Use when a bug, feature, refactor, or review requires tracing dependencies, call chains, data flow, impact zones, or cross-module behavior in a codebase
---

# MCP Trace

Map the code path before changing it.

## Trace Flow

1. Define the entry point, symptom, target symbol, or user-visible behavior.
2. Search mem0 for prior architecture notes, graph summaries, dependency maps, and conventions related to the target.
3. Use Serena symbol search to find the exact function, class, route, component, or module.
4. Use Serena references to identify callers, callees, and impact zones.
5. Read only the symbols and narrow context needed to validate the path.
6. Compare mem0 context with current code and mark any drift.
7. Summarize the trace before implementation.

## Output

```text
Trace:
- Entry: <symbol/route/file>
- Path: A -> B -> C
- Data crossing: <important args/values>
- Impact zones: <symbols/files>
- Memory context: <useful mem0 facts or none>
- Unknowns: <gaps or stale-memory concerns>
```

## Debugging Integration

For bugs:

- Start from the observed failure, test output, runtime log, or user-visible symptom.
- Trace backward to the origin of the bad value or wrong decision.
- Use `superpowers:systematic-debugging` for root-cause discipline.
- Do not patch the first suspicious symbol without completing the trace.

## Fallbacks

Use focused repository search when mem0 or Serena cannot answer. Use broad shell reads only after narrower options fail or when the target is not represented as symbols.
