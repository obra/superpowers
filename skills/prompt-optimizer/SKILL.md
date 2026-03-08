---
name: prompt-optimizer
description: >
  Use when the user wants to improve a prompt before execution. Generates
  optimized variants and lets the user choose. Triggers on: "optimize this
  prompt", "improve my prompt", "make this prompt better", "rewrite this
  instruction".
---

# Prompt Optimizer

This skill transforms raw user prompts into more effective instructions.

## Core Workflow

1. Extract the user’s true intent, constraints, and desired outcome without changing the goal.
2. Analyse the original prompt for clarity, specificity, structure, and success criteria.
3. Generate **3 or so** distinct, fully-formed prompt variants that:
   - Preserve 100% of the original intent.
   - Apply best practices (clear role, concrete outputs, step-by-step guidance where useful).
4. Present the options clearly, each with:
   - A short title.
   - 1–2 sentences describing the key improvements.
   - The full improved prompt in a markdown code block.
5. Ask the user to choose one (or keep the original), then proceed with the chosen version.

## When to Use in Superpowers

- At the start of `brainstorming` or `writing-plans` for especially vague, broad, or multi-part requests where better prompt structure will materially help.
- When the user explicitly asks to “optimize” or “improve” their request.

Constraints:
- Do not re-run prompt optimization repeatedly in the same flow for the same goal.
- Keep context lean: avoid re-copying long prior assistant messages; focus on the user’s latest request and essential repo context.

