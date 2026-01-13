---
name: using-hyperpowers
description: Use when starting any conversation - establishes how to find and use skills, requiring Skill tool invocation before ANY response including clarifying questions
---

# Using Hyperpowers

## Overview

Skills are pre-loaded workflows that ensure consistent, high-quality execution. This skill establishes the fundamental rule: invoke skills BEFORE any response.

**Core principle:** Even 1% chance a skill applies means you MUST invoke it.

## When to Use

**Use this skill at conversation start:** Before responding to ANY user request, check if a skill applies.

**The rule is unconditional:** Even 1% chance = invoke the skill.

<CRITICAL>
Even 1% chance a skill applies → YOU MUST invoke it. Not optional. Not negotiable.
</CRITICAL>

## The Rule

**Invoke skills BEFORE any response.** Use the `Skill` tool—never Read skill files directly.

## Red Flags (STOP if you think these)

- "Just a simple question" → Questions are tasks
- "Need context first" → Skill check comes BEFORE clarifying
- "Let me explore first" → Skills tell you HOW to explore
- "I remember this skill" → Skills evolve. Read current version
- "It's overkill" → Simple becomes complex. Use it

## Priority

1. **Process skills first** (brainstorming, debugging)
2. **Implementation skills second**

## Types

**Rigid** (TDD, debugging): Follow exactly.
**Flexible** (patterns): Adapt to context.

Instructions say WHAT, not HOW. "Add X" doesn't mean skip workflows.

## COMPULSORY: Pre-Response Check

Before ANY response to a user request:

**Skill Invocation Gate** (COMPULSORY):

- [ ] Checked if a skill applies (even 1% chance = yes)
- [ ] If yes: Invoked skill BEFORE responding
- [ ] If no skill applies: Proceed with response

**STOP CONDITION:** If you're about to respond without checking skills, STOP. Check first.

**Self-Check Questions:**

1. "Am I about to explore, clarify, or respond?"
   - If yes to ANY → Check skills first
2. "Does this feel like a simple question?"
   - Simple questions are still tasks → Check skills
3. "Do I remember how this skill works?"
   - Skills evolve → Invoke current version, don't rely on memory

## Red Flags - IMMEDIATE STOP

| Violation | Why It's Critical | Recovery |
|-----------|-------------------|----------|
| Responding before skill check | May miss applicable workflow | Stop, check skills, then respond |
| "Let me explore first" | Skills tell you HOW to explore | Invoke exploration skill |
| "I remember this skill" | Skills change; memory may be stale | Read current skill version |
| "Too simple for skills" | Simple tasks still have workflows | Check anyway - 30 seconds |
