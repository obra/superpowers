---
name: brainstorming
description: "Use when starting any creative work - creating features, building components, adding functionality, or modifying behavior"
allowed-tools: Read, Grep, Glob, AskUserQuestion, WebSearch, WebFetch, Task
---

# Brainstorming Ideas Into Designs

## Overview

Help turn ideas into fully formed designs and specs through natural collaborative dialogue.

Start by understanding the current project context, then ask questions one at a time to refine the idea. Once you understand what you're building, present the design in small sections (200-300 words), checking after each section whether it looks right so far.

## When to Use

**Use this skill when:**
- Starting any creative work or new feature
- User says "build", "create", "add", "implement" something new
- Modifying behavior of existing functionality
- Need to explore approaches before committing to one

**Don't use when:**
- Task is purely mechanical (rename, move files)
- Requirements are already fully specified in a plan
- Debugging existing code (use systematic-debugging instead)

## The Process

**Understanding the idea:**
- Check out the current project state first (files, docs, recent commits)
- Ask questions one at a time to refine the idea
- Prefer multiple choice questions when possible, but open-ended is fine too
- Only one question per message - if a topic needs more exploration, break it into multiple questions
- Focus on understanding: purpose, constraints, success criteria

**Exploring approaches:**
- Propose 2-3 different approaches with trade-offs
- Present options conversationally with your recommendation and reasoning
- Lead with your recommended option and explain why

**Presenting the design:**
- Once you believe you understand what you're building, present the design
- Break it into sections of 200-300 words
- Ask after each section whether it looks right so far
- Cover: architecture, components, data flow, error handling, testing
- Be ready to go back and clarify if something doesn't make sense

## After the Design

**Documentation:**
- Write the validated design to `docs/designs/YYYY-MM-DD-<topic>-design.md`
- Do NOT commit (this directory is gitignored - designs are ephemeral)

**Handoff:**
After saving the design, announce completion with copy-paste commands:

```
Design saved to `docs/designs/<actual-filename>.md`.

To continue:
/compact ready to research docs/designs/<actual-filename>.md
/hyperpowers:research docs/designs/<actual-filename>.md
```

Replace `<actual-filename>` with the real filename you just created.

## Key Principles

- **One question at a time** - Don't overwhelm with multiple questions
- **Multiple choice preferred** - Easier to answer than open-ended when possible
- **YAGNI ruthlessly** - Remove unnecessary features from all designs
- **Explore alternatives** - Always propose 2-3 approaches before settling
- **Incremental validation** - Present design in sections, validate each
- **Be flexible** - Go back and clarify when something doesn't make sense

## No Implementation During Brainstorming

**This skill is for DESIGN, not CODING.**

Violations (any of these = stop and restart):
- Opening a code file with intent to modify
- Writing implementation code (even "just a quick prototype")
- Skipping to "let me just try this" without spec approval
- Committing anything except spec/design documents

**If you feel the urge to code:** That's the signal you haven't finished brainstorming. More questions needed.

## Deliverable: design.md

Brainstorming is complete when you have a design document at `docs/designs/YYYY-MM-DD-<topic>-design.md` containing:

1. **Problem Statement**: What problem are we solving? (not "add feature X")
2. **Success Criteria**: How will we know it's done? (measurable)
3. **Constraints**: What must NOT change? What's out of scope?
4. **Approach**: High-level design (not implementation details)
5. **Open Questions**: What do we still not know?

**No design.md = brainstorming not complete = no implementation.**
