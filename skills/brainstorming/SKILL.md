---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation."
---

# Brainstorming Ideas Into Designs

## Overview

Help turn ideas into fully formed designs and specs through natural collaborative dialogue.

Start by understanding the current project context, then ask questions one at a time to refine the idea. Once you understand what you're building, present the design in small sections (200-300 words), checking after each section whether it looks right so far.

## The Process

**Phase 0: Check for Existing Design**

Before starting brainstorming, check for existing design files:
- `docs/plans/*-design.md` (typical location)
- `design.md` (root directory)
- `docs/design.md` (alternate location)
- `docs/manus/findings.md` (if manus-planning was used, check "## Design Document" section)

If design exists:
- Read the existing design
- Announce: "Found existing design at [path]"
- **Interactive mode**: Ask "Should I: 1) Use existing design and proceed to implementation 2) Refine/update it 3) Start fresh design"
- **Autonomous mode** (e.g., Ralph loops): Automatically use existing design and skip to "After the Design" → Implementation phase
- Based on choice/mode:
  - **Option 1 / Autonomous**: Skip to "After the Design" → Implementation phase
  - **Option 2**: Load existing design, ask targeted refinement questions
  - **Option 3**: Archive old design, proceed with fresh brainstorming

If no design exists:
- Continue with Phase 1 (Understanding the idea)

**Phase 1: Understanding the idea**
- Check out the current project state first (files, docs, recent commits)
- Ask questions one at a time to refine the idea
- Prefer multiple choice questions when possible, but open-ended is fine too
- Only one question per message - if a topic needs more exploration, break it into multiple questions
- Focus on understanding: purpose, constraints, success criteria

**Phase 2: Exploring approaches**
- Propose 2-3 different approaches with trade-offs
- Present options conversationally with your recommendation and reasoning
- Lead with your recommended option and explain why

**Phase 3: Presenting the design**
- Once you believe you understand what you're building, present the design
- Break it into sections of 200-300 words
- Ask after each section whether it looks right so far
- Cover: architecture, components, data flow, error handling, testing
- Be ready to go back and clarify if something doesn't make sense

## After the Design

**Documentation:**
- Write the validated design to `docs/plans/YYYY-MM-DD-<topic>-design.md`
- Use elements-of-style:writing-clearly-and-concisely skill if available
- Commit the design document to git

**Implementation (if continuing):**
- Ask: "Ready to set up for implementation?"
- Ask workspace preference:
  1. **Use a git worktree (recommended)** - isolated workspace
  2. **Work directly in this repo (no worktrees)** - faster, less isolation
- Based on choice:
  - **Worktree**: Use superpowers-ng:using-git-worktrees to create isolated workspace
  - **Direct**: Ensure safe setup in current repo:
    - Be on a feature branch (not main/master); if needed: `git checkout -b <branch>`
    - Ensure clean working tree (`git status` clean) or stash/commit before proceeding
- Present planning options:
  1. **Native planning** (writing-plans + executing-plans): Best for short tasks (<30 min), interactive development with human checkpoints
  2. **Manus planning** (manus-planning): Best for long autonomous runs, multi-session projects, tasks requiring persistent memory across context resets
- Based on choice:
  - **Native**: Use superpowers-ng:writing-plans to create detailed implementation plan
  - **Manus**: Use superpowers-ng:manus-planning (the design document content will be automatically copied into `docs/manus/findings.md` under "## Design Document" section)

## Key Principles

- **One question at a time** - Don't overwhelm with multiple questions
- **Multiple choice preferred** - Easier to answer than open-ended when possible
- **YAGNI ruthlessly** - Remove unnecessary features from all designs
- **Explore alternatives** - Always propose 2-3 approaches before settling
- **Incremental validation** - Present design in sections, validate each
- **Be flexible** - Go back and clarify when something doesn't make sense
