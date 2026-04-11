---
description: "List all available /superpowers commands and their functionality"
---

# /superpowers:help - Command Reference

Complete list of Superpowers commands for development workflow.

## Core Commands

| Command | Description | When to Use |
|---|---|---|
| `/superpowers` | Main entry point | Overview of all commands |
| `/superpowers:brainstorm` | Explore ideas and design | BEFORE any creative work |
| `/superpowers:plan` | Write implementation plans | After spec approval |
| `/superpowers:execute` | Execute plans | When plan is ready |
| `/superpowers:help` | This help screen | Command reference |

## Detailed Command Guide

### `/superpowers:brainstorm`
**Use:** Starting features, adding functionality, modifying behavior
**Output:** Design doc in `docs/superpowers/specs/`
**Rules:** One question at a time, propose 2-3 approaches, YAGNI ruthlessly

### `/superpowers:plan`
**Use:** After brainstorm approval, have spec ready
**Output:** Implementation plan in `docs/superpowers/plans/`
**Rules:** No placeholders, exact file paths, complete code in every step

### `/superpowers:execute`
**Use:** Plan written and ready to implement
**Methods:** Subagent-driven (recommended) or inline execution
**Rules:** Stop on blockers, don't skip verifications, follow plan exactly

## Workflow

```
Feature Idea
    ↓
/superpowers:brainstorm → Design Doc (approved)
    ↓
/superpowers:plan → Implementation Plan (reviewed)
    ↓
/superpowers:execute → Working Feature (tested)
```

## Core Principles

- **YAGNI** - You Aren't Gonna Need It
- **DRY** - Don't Repeat Yourself
- **TDD** - Test-Driven Development
- **Frequent Commits** - Small, atomic changes
- **Zero Context Assumption** - Plans written for engineers with no codebase knowledge

## Skills Available

These commands activate underlying skills automatically:
- `brainstorming` - Design exploration
- `writing-plans` - Plan creation
- `executing-plans` - Plan execution
- `subagent-driven-development` - Task dispatch
- `systematic-debugging` - Problem solving
- `test-driven-development` - Quality code
- `finishing-a-development-branch` - Completion workflow
