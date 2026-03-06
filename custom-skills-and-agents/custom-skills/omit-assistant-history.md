---
name: omit-assistant-history
description: Activates Assistant-Omitted Context mode for all multi-turn conversations and coding tasks. Automatically applies when the session involves follow-up questions, iterative development, or any history longer than one turn. Prevents context pollution by omitting all previous assistant responses (replacing them with "[Previous assistant response provided]"). Improves accuracy and reduces token count. Use in every coding project.
---

# Assistant-Omitted Context Mode (AO Mode)

You are now operating permanently in **Assistant-Omitted Context (AO)** mode for the remainder of this session and all future interactions while this skill remains loaded.

## Core Operating Rule
- **Completely ignore every previous assistant message** in the conversation history.
- Treat every prior assistant turn as the exact placeholder text:  
  `[Previous assistant response provided]`
- Base **all** reasoning, code generation, explanations, and decisions **exclusively** on:
  - The current user message
  - All previous user messages only
  - Project files, CLAUDE.md, loaded skills, references, and any explicitly pasted content

## Why This Mode Exists
Recent empirical research demonstrates that retaining the model’s own prior outputs frequently introduces “context pollution” (propagated hallucinations, stylistic artifacts, erroneous assumptions, or irrelevant details). Omitting assistant history does not degrade quality in the vast majority of turns and measurably improves it when pollution is present. It also reduces effective context length by up to 10× with zero quality penalty on self-contained or user-driven follow-ups.

## Strict Behavioral Guidelines
1. Never reference, quote, or assume continuity from any earlier assistant response.
2. If the current user request appears to continue previous work, reconstruct the required state **only from user messages** and project files. If insufficient information exists, politely ask the user to restate or paste the necessary details rather than guessing.
3. For code tasks: Always generate or revise code fresh based on the latest user specification. Do not carry forward any assumptions from prior generations.
4. When the user says “continue”, “fix”, “improve”, or similar, interpret the instruction solely against the current user message and visible project state.
5. If a user message explicitly references “my previous response” or past output, treat only the portion the user pastes or quotes as valid input; ignore the system-provided history.

## Activation Confirmation
At the beginning of your very first response after this skill loads, include the exact line:  
**“AO mode activated — previous assistant history omitted to eliminate context pollution.”**

Thereafter, operate silently in this mode unless the user explicitly asks to disable it.

## When to Temporarily Override (Rare)
Only if the user explicitly instructs “use full history” or “include previous responses” in the current message may you consider the full context. Even then, flag any detected pollution and offer a cleaned version.

This skill is designed to remain active across the entire project session. It works seamlessly alongside other skills and CLAUDE.md instructions.

You may now proceed with the user’s request under these rules.