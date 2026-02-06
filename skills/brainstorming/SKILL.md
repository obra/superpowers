---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation. This is the recommended starting point for most productive sessions."
---

# Brainstorming Ideas Into Designs

## Overview

Help turn ideas into fully formed designs and specs through natural collaborative dialogue. This is the central starting point for most sessions — it gathers context, explores the problem, designs the solution, identifies which Amplifier agents will handle each phase, and routes to the right execution workflow.

Start by understanding the current project context, then ask questions one at a time to refine the idea. Once you understand what you're building, present the design in small sections (200-300 words), checking after each section whether it looks right so far.

## Session Start

Before diving into the idea:

1. **Context gathering** — Check project state (files, docs, recent commits, open branches, existing plans)
2. **Memory consultation** — Search episodic memory for related past conversations, decisions, and lessons learned (use episodic-memory:search-conversations if available)
3. **Agent awareness** — Identify which Amplifier agents are relevant for this task (consult `AMPLIFIER-AGENTS.md` in the superpowers plugin directory for the full mapping)

Surface the relevant agents early: "For this task, we'll likely use zen-architect for design, modular-builder for implementation, and test-coverage for verification."

## The Process

**Understanding the idea:**
- Ask questions one at a time to refine the idea
- Prefer multiple choice questions when possible, but open-ended is fine too
- Only one question per message - if a topic needs more exploration, break it into multiple questions
- Focus on understanding: purpose, constraints, success criteria

**Exploring approaches:**
- Propose 2-3 different approaches with trade-offs
- Present options conversationally with your recommendation and reasoning
- Lead with your recommended option and explain why
- Note which Amplifier agents each approach would involve

**Presenting the design:**
- Once you believe you understand what you're building, present the design
- Break it into sections of 200-300 words
- Ask after each section whether it looks right so far
- Cover: architecture, components, data flow, error handling, testing
- Be ready to go back and clarify if something doesn't make sense

## Agent Allocation Section

Every design MUST include an Agent Allocation section before handoff. This tells writing-plans which agents to assign to each task.

```markdown
## Agent Allocation

| Phase | Agent | Responsibility |
|-------|-------|---------------|
| Architecture | zen-architect | System design, module boundaries |
| Implementation | modular-builder | Build from specs |
| Testing | test-coverage | Test strategy and coverage |
| Security | security-guardian | Pre-deploy review |
| Cleanup | post-task-cleanup | Final hygiene pass |
```

Adjust the table based on what the design actually needs. Not every project needs every agent. Only list agents that will be used.

## After the Design

**Documentation:**
- Write the validated design to `docs/plans/YYYY-MM-DD-<topic>-design.md`
- Include the Agent Allocation section in the design doc
- Use elements-of-style:writing-clearly-and-concisely skill if available
- Commit the design document to git

**Workflow routing — recommend the right execution path:**
- **Simple task** (1-2 files, clear requirements) → implement directly with the appropriate Amplifier agent
- **Medium task** (3-10 files, multiple steps) → write plan with superpowers:writing-plans → execute with superpowers:subagent-driven-development
- **Complex task** (10+ files, independent subsystems) → write plan → use superpowers:dispatching-parallel-agents for independent pieces
- **Investigation** (bugs, failures, unknowns) → dispatch bug-hunter or parallel specialists via superpowers:dispatching-parallel-agents

**Implementation (if continuing):**
- Ask: "Ready to set up for implementation?"
- Use superpowers:using-git-worktrees to create isolated workspace
- Use superpowers:writing-plans to create detailed implementation plan (it will use the Agent Allocation to assign agents per task)

## Key Principles

- **One question at a time** - Don't overwhelm with multiple questions
- **Multiple choice preferred** - Easier to answer than open-ended when possible
- **YAGNI ruthlessly** - Remove unnecessary features from all designs
- **Explore alternatives** - Always propose 2-3 approaches before settling
- **Incremental validation** - Present design in sections, validate each
- **Be flexible** - Go back and clarify when something doesn't make sense
- **Agent-aware design** - Know which specialists are available and plan for their use
