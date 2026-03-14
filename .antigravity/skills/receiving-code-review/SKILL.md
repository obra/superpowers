---
name: receiving-code-review
description: Use when receiving code review feedback from users or external reviewers - requires technical evaluation before implementing, verify against codebase, push back when wrong
---

# Receiving Code Review

> **This skill mirrors the `/receiving-code-review` workflow.**

## Overview
**Core principle:** Verify before implementing. Ask before assuming. Technical correctness over social comfort.

## Response Pattern
1. **READ** complete feedback without reacting
2. **UNDERSTAND** — restate requirement (or ask)
3. **VERIFY** against codebase reality
4. **EVALUATE** — technically sound for THIS codebase?
5. **RESPOND** — technical acknowledgment or reasoned pushback
6. **IMPLEMENT** — one item at a time, test each

## Handling Unclear Feedback
If ANY item is unclear → STOP, ask for clarification on ALL unclear items before implementing anything.

## When to Push Back
- Suggestion breaks existing functionality
- Reviewer lacks full context
- Violates YAGNI
- Conflicts with user's architectural decisions

## Acknowledging Correct Feedback
- ✅ "Fixed. [Brief description]"
- ✅ Just fix it and show the result
- ❌ Performative agreement ("Great point!", "You're absolutely right!")
