---
name: writing-plans
description: Use when creating implementation plans for features, changes, or projects - produces detailed bite-sized task plans with TDD steps, exact file paths, and verification commands
---

# Writing Plans

> **This skill mirrors the `/writing-plans` workflow.**

## Overview
Write comprehensive implementation plans with bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

## Process
1. **Scope Check** — Multiple subsystems? Break into separate plans.
2. **File Structure** — Map out all files to create/modify with clear responsibilities.
3. **Write Tasks** — Each step is one 2-5 minute action.
4. **Review Loop** — Present to user section by section for approval.
5. **Execution Handoff** — Use `executing-plans` or `subagent-development` to execute.

## Task Structure
Each task includes: files to touch, failing test code, exact run commands, implementation code, verification commands, and commit step.

## Bite-Sized Granularity
- "Write the failing test" — one step
- "Run it to make sure it fails" — one step
- "Implement the minimal code" — one step
- "Run tests and verify" — one step
- "Commit" — one step

## Remember
- Exact file paths always
- Complete code in plan (not "add validation")
- Exact commands with expected output
- DRY, YAGNI, TDD, frequent commits
