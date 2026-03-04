---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation."
license: MIT
metadata:
  author: obra
  version: "1.0"
---

# Brainstorming Ideas Into Designs

## Overview

Help turn ideas into fully formed designs and specs through natural collaborative dialogue.

Start by understanding the current project context, then ask questions one at a time to refine the idea. Once you understand what you're building, present the design in small sections (200-300 words), checking after each section whether it looks right so far.

## The Process

**Understanding the idea:**
- Check out the current project state first (files, docs, recent commits)
- Use the `AskUserQuestion` tool to gather requirements — structured options are faster to answer than open-ended text
- Group related questions (up to 4) in a single AskUserQuestion call rather than asking one at a time
- Use `multiSelect: true` when choices aren't mutually exclusive (e.g., "which features?")
- Put your recommended option first with "(Recommended)" in the label
- Fall back to conversational questions only when the topic is too open-ended for structured options
- Focus on understanding: purpose, constraints, success criteria

**Exploring approaches:**
- Propose 2-3 different approaches using `AskUserQuestion` with trade-offs in the option descriptions
- Lead with your recommended approach as the first option and explain why in the description

**Presenting the design:**
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
- Use using-git-worktrees to create isolated workspace
- Use writing-plans to create detailed implementation plan

## Key Principles

- **Structured over freeform** - Use AskUserQuestion tool for faster, clearer responses
- **Batch related questions** - Group up to 4 related questions per AskUserQuestion call
- **YAGNI ruthlessly** - Remove unnecessary features from all designs
- **Explore alternatives** - Always propose 2-3 approaches before settling
- **Incremental validation** - Present design in sections, validate each
- **Be flexible** - Go back and clarify when something doesn't make sense
