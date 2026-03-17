---
name: subagent-development
description: Use when executing a multi-task implementation plan - self-orchestration with two-stage review gates (spec compliance then code quality) and browser_subagent delegation for UI verification
---

# Subagent-Driven Development

> **Antigravity-exclusive skill.** This is NOT a direct port of the upstream `subagent-driven-development` skill — it's an Antigravity-native creation that implements a self-orchestration pattern for platforms that cannot spawn independent coding subagents.

## Overview
Execute plans by treating each task as isolated, with mandatory two-stage review before proceeding.

**Core principle:** Task isolation + two-stage review = high quality, no drift.

## Per-Task Cycle
```
IMPLEMENT → REVIEW GATE 1 (spec compliance) → REVIEW GATE 2 (code quality) → NEXT TASK
```

### Review Gate 1: Spec Compliance
- Does code do EXACTLY what the spec says?
- All requirements met? No extra features (YAGNI)?
- Tests cover specified behavior?

### Review Gate 2: Code Quality
- Clean, readable code? No duplication?
- Good naming? Error handling? No magic values?
- Tests are meaningful?

**Order matters:** Always spec compliance FIRST.

## Task Isolation
Before each task:
1. Re-read the spec (don't assume from memory)
2. Check current file state
3. Run tests for clean baseline
4. Treat each task as if seeing the project fresh

## browser_subagent Delegation
Use for: UI verification, testing user flows, capturing screenshots, responsive design checks.

## Red Flags
Never: Skip either review gate, proceed with open issues, carry assumptions between tasks, accept "close enough" on spec compliance.
