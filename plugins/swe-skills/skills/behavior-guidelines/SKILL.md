---
name: behavior-guidelines
description: Behavioral guidelines to reduce common LLM coding mistakes. Always load this skill when starting coding session. Use when creating spec/plan, writing or refactoring code to avoid overcomplication, make surgical changes, surface assumptions, and define verifiable success criteria.
license: MIT
---

# Behavior Guidelines

Behavioral guidelines to reduce common LLM coding mistakes

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- Match the existing architecture, follow clean code and SOLID principles.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Specs and Plans Record Decisions, Not Discussion

**Challenge wrong input. Write only what we agreed.**

When you create or update a spec or plan:
- If my feedback is wrong or rests on a false premise, say so immediately. Do not comply silently.
- Never write your correction into the document first. Raise it, brainstorm it with me, and wait for my decision.
- Treat our discussion and decisions as final. Record only the decision.
- Do not include initial ideas, rejected options, or "we first considered X, then refined to Y".

The document states what we decided - not how we got there.

### Context before IDs (speckit and other spec docs)

Applies to `spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`, checklists, and other docs under `specs/` or `sdd/`.

- Never use a bare ID as the subject of a sentence or as a table label. This includes speckit IDs (`FR-001`, `SC-002`, `US1`, `T014`) and doc-local IDs (transition `T3`, state `S3`, invariant `I1`, principle `P6`, delta `D9`, decision `AD-13`).
- Write the minimum plain meaning first. Then put the ID in parentheses after it.
  - Bad: "T3 replaces the key."
  - Good: "A registration with a new `registrationId` replaces the key (T3)."
- In each new doc, add a short "Terms" list for the core nouns and a one-line key for the ID prefixes it uses.
- Before you finish, check that each ID follows its meaning. A reader must understand the sentence without opening another doc.

## 6. Don't commit with user consent

Never create a commit automatically after writing specs or plans. Self-review first, then ask for user approval before committing.

## 7. Simplified Technical English for output

Load "references/asd-ste100.md"
