---
name: executing-plans
description: Use when you have a written implementation plan to execute - load plan, review critically, execute all tasks with verification checkpoints
---

# Executing Plans

> **This skill mirrors the `/executing-plans` workflow.**

## Overview
Load plan, review critically, execute all tasks, report when complete.

## Process
1. **Load and Review** — Read plan, identify concerns. Raise with user before starting.
2. **Execute Tasks** — For each: mark in-progress, follow steps exactly, verify, mark complete.
3. **Verify Completion** — Run full test suite. Use `verification-before-completion` skill.

## When to Stop
- Hit a blocker (missing dependency, unclear instruction)
- Verification fails repeatedly
- Plan has critical gaps

**Ask for clarification rather than guessing.**

## Remember
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Stop when blocked, don't guess
- Never start on main/master without user consent
