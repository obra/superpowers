# Project-Level Meta-Memory & Behavioral Self-Evolution  
*(Lightweight, file-mediated reflection and prompt-distillation system)*

**Status:** Proposed / High-priority innovation candidate  
**Estimated effort:** 2–4 developer days for MVP  
**Target release:** vNext or v1.x.y (post-stability polish)

## One-Sentence Summary

Enable the plugin to gradually learn — and persistently remember — how this specific user prefers to collaborate and how this specific codebase should be handled, by distilling behavioral priors, style preferences, architectural tastes, critique standards, and safety boundaries into compact, versioned, file-based memory artifacts that are automatically injected into future sessions at minimal token cost.

## Motivation

The current implementation already provides excellent cross-session continuity through `state.md` and `known-issues.md`, enforces disciplined workflows, and mitigates hallucinations via red-team + auto-fix loops and self-consistency reasoning.

However, it still treats every new session largely as a fresh context with static skills. Over weeks or months of usage on the same project, users typically develop strong, recurring preferences regarding:

- Naming conventions and architectural patterns  
- Testing style and coverage expectations  
- Commit message format and granularity  
- Preferred error-handling idioms  
- Communication tone, verbosity, and hedging avoidance  
- Response structure and critique focus  
- Risk tolerance for certain classes of changes  

Manually reminding the agent of these preferences is tedious and token-expensive. Fine-tuning is not feasible in this open-source, local-first context.

A lightweight, auditable, file-based reflection system can close this gap, creating the perception — and partial reality — of an agent that visibly improves at collaborating with *this* user and *this* codebase over time.

## Core Mechanism

1. **Reflection & Distillation Phase**  
   After completion of full-complexity tasks (or on explicit user request), a dedicated `meta-reflection-distiller` skill runs a structured meta-review of:  
   - the most recent conversation turns  
   - red-team findings  
   - code-review comments  
   - final code diff  
   - user feedback (if any)  

   It extracts concise, reusable statements in the form:  
   “Prefers X over Y in context Z”  
   “Avoids proposing A because user consistently rejects it”  
   “Expects B testing pattern on domain logic”  
   etc.

2. **Persistent Storage**  
   Distilled statements are **appended** (with timestamps and task references) to one or more versioned files in the project root or `.superpowers/` directory:

   - `project-preferences.md`     (user taste, style, communication)  
   - `effective-patterns.md`      (architecture, idioms, patterns that survive review)  
   - `user-style-guide.md`        (tone, verbosity, structure preferences)  
   - `safety-boundaries.md`       (evolving risk thresholds, allowed/blocked patterns)

3. **Low-Cost Injection**  
   At session start (or before planning/review/red-team phases), a lightweight hook reads the most recent and/or most frequently referenced distillates (limited to ~400–800 tokens total) and injects them at the beginning of the system/user prompt in compact bullet-list form:

Active project priors:
• Prefer functional error handling with early returns
• Use Conventional Commits; keep subject < 60 chars
• Avoid inline console.log; prefer structured logging
• Critique focus: highest-leverage issues only (2–3 max)
• Never propose global mutable state


## Expected Benefits

| Aspect                        | Before                              | After                                      |
|-------------------------------|-------------------------------------|--------------------------------------------|
| Cross-session personalization | Facts & issues only                 | Facts + evolving behavioral priors         |
| Adaptation to user taste      | Manual reminders required           | Automatic, incremental refinement          |
| Token efficiency              | Excellent baseline                  | Further improved via compact priors        |
| Hallucination & drift         | Mitigated via red-team & consistency| Further reduced via accumulated taste      |
| User experience               | Highly disciplined                  | Increasingly feels “this agent gets me”    |
| Differentiation               | Among safest & most structured      | One of few agents that visibly learns over time |

## Minimal Viable Implementation Outline

1. New skill file  
`skills/intelligence/meta-reflection-distiller.md`  
- Trigger: end of full pipeline, periodic (every N tasks), or explicit command (`reflect`, `distill now`)  
- Output: append-only blocks to the preference files above

2. New or extended hook  
`hooks/session-start/inject-project-priors.*` or `pre-planning`  
- Read most recent distillates  
- Format as compact list  
- Prepend to prompt context

3. User control commands  
- `show preferences`  
- `show effective patterns`  
- `forget preference <keyword>`  
- `pin preference <text>` (prevents future overwrite)  
- `distill now`

4. Safety & auditability  
- All changes are append-only with timestamps and task references  
- User can manually edit or delete lines  
- Optional `meta-preferences.md` to tune reflection aggressiveness

## Risks & Mitigations

- **Overfitting / noise accumulation**  
→ Timestamped entries + manual forget/pin commands + periodic human review

- **Token creep**  
→ Strict token cap on injected priors + relevance ranking

- **Privacy**  
→ Everything stays in project files; no external transmission

## Next Steps (if proceeding)

1. Finalize file schema for the three/four preference documents  
2. Draft `meta-reflection-distiller` skill markdown  
3. Prototype injection hook logic  
4. Define first 6–8 high-value preference dimensions to target  
5. Add user-facing commands and documentation

This feature would represent one of the most meaningful steps toward truly personalized, long-lived agent collaboration while preserving the plugin’s core philosophy of being lightweight, transparent, file-based, and model-agnostic.

Feedback and prioritization welcome.