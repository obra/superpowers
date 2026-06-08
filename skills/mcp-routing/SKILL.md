---
name: mcp-routing
description: Use when working in a codebase with mem0 or Serena MCP tools available and the task requires code discovery, editing, debugging, review, or implementation
---

# MCP Routing

Use Superpowers as the workflow controller, then route codebase operations to the best available structured tool.

## Core Rule

Prefer durable context and symbol tools over broad raw file reading when those tools are available.

| Need | First choice | Fallback |
|------|--------------|----------|
| Architecture overview | mem0 project memories for architecture maps, decisions, and prior graph summaries | README/docs and focused repository search |
| Graph intelligence | mem0 memories for dependency maps, call-flow notes, prior impact traces, and conventions | Serena references plus focused `rg` |
| Find functions/classes/routes | Serena `find_symbol`, `get_symbols_overview`, and project symbol search | `rg` for literals or unsupported languages |
| Trace references/impact | Serena `find_referencing_symbols` plus mem0 prior trace memories | focused source reads and tests |
| Read symbol source | Serena symbol reads/overview | narrow file reads around the symbol |
| Edit symbol bodies | Serena `replace_symbol_body`, `insert_before_symbol`, `insert_after_symbol` | `apply_patch` for non-symbol, Markdown, JSON, shell, or broad edits |
| Diagnostics | Serena diagnostics for edited source files | project analyzer, compiler, linter, or test output |
| Persist reusable context | mem0 write/remember for durable architecture, conventions, and graph learnings | project docs when explicitly requested |

## Hard Constraints

- Do not start code discovery with broad `grep`, `cat`, `sed`, or whole-file reads when mem0 or Serena can answer the question.
- Use shell search for string literals, config files, generated artifacts, missing MCP coverage, or when structured tools are insufficient.
- Do not force MCP usage for Markdown docs, JSON manifests, shell scripts, CI config, or assets.
- Do not treat memory as authoritative when current code contradicts it. Verify drift with Serena, focused reads, or tests.
- Do not invent tool results. If a tool is unavailable or fails, state the fallback and continue.
- Store only reusable context in mem0. Routine progress, temporary status, and obvious file paths do not belong in memory.

## Execution Layer Sequence

Before implementation:

1. Load relevant mem0 context for architecture, prior decisions, coding conventions, and graph/impact notes.
2. If Serena is active, verify the current project and onboarding state before code navigation.
3. Use Serena overview/symbol search for target modules before reading source.
4. Summarize the current understanding before making behavior changes.

During implementation:

1. Locate definitions with Serena before opening large files.
2. Trace impact with Serena references and mem0 graph notes.
3. Edit with Serena symbol tools when the change maps cleanly to a symbol.
4. Use `apply_patch` for docs, manifests, scripts, generated-free text, or multi-symbol edits.

After each logical unit:

1. Run Serena diagnostics on edited source files when available.
2. Run the verification command required by the active Superpowers workflow.
3. Write mem0 memory only for durable architecture, graph, convention, or surprising-debugging learnings.

## Subagent Instructions

When dispatching implementer or reviewer subagents, include:

```text
Use structured code tools first when available. Prefer mem0 for architecture
context, prior decisions, graph intelligence, and durable project learnings.
Prefer Serena for symbol navigation, references, diagnostics, and symbol edits.
Use shell reads/search only when MCP tools are unavailable or insufficient, and
explain the fallback.
```

## Red Flags

- Starting code discovery with broad `find`, `grep`, or `cat`.
- Reading entire files when a symbol query would answer the question.
- Editing by line number when a symbol edit is available.
- Writing memories for every step instead of only reusable context.
- Using old mem0 context without checking whether the code has drifted.
