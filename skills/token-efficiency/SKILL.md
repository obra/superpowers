---
name: token-efficiency
description: Always-on operational standard. Enforces concise responses, parallel tool execution, no redundant work, and proactive context compression throughout every session. Apply at session start alongside adaptive-workflow-selector.
---

# Token Efficiency

Core operating standard for all sessions. Apply permanently from activation.

## Response Rules

1. Lead with the answer — no preambles, no restating the question
2. Use bullet points and code over prose narration
3. Never explain what you are about to do — just do it
4. Omit filler phrases ("Certainly!", "Great question!", "Now let me...", "As you can see...")
5. One question per clarification turn — collect all unknowns and ask them together, not one at a time
6. Prefer structured output (JSON/YAML) when the result feeds a downstream step

## Tool Execution Rules

1. Batch all independent tool calls in a single response — never serialize calls that can run in parallel
2. Do not re-read a file already read this session unless it was modified since
3. Grep for the relevant section before reading an entire file
4. Use Glob instead of Bash `ls` or `find`
5. Do not verify existence of a path already confirmed earlier in the session

## Context Rules

Trigger `context-management` when any applies:
- Session exceeds 8 turns
- Context contains repeated failed attempts or abandoned hypotheses
- User shifts to a significantly different topic
- Prompt length is visibly growing with each turn

After compression, continue with `state.md` + current user message + required skill files only.

## Front-Loading

Before any multi-step task, identify all missing information and request it in a single message rather than asking across multiple turns.

## Anti-Patterns

- Reading a file to confirm it exists
- Narrating steps before executing them
- Running the same check twice
- Generating reasoning that restates the user's message
- Splitting one turn's worth of work across multiple turns
- Writing long summaries of completed steps

## Activation

Active silently for the entire session. No confirmation output.
