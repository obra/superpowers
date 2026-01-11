---
name: feedback
description: Use when user provides feedback on a design, research, or plan document, or invokes /hyperpowers:feedback
allowed-tools: Read, Grep, Glob, Edit, Write, AskUserQuestion, WebSearch, WebFetch, Task
---

# Feedback Skill

## Overview

Enable iterative refinement of design, research, and plan documents through natural language feedback. Each change is shown as a diff with individual approval before application.

**Announce at start:** "I'm using the feedback skill to refine [document path]."

**Core principle:** User maintains full control - every change requires explicit approval.

## When to Use

**Use this skill when:**
- User explicitly invokes `/hyperpowers:feedback <path>`
- User provides feedback-like input after a document was just created in the same session
- User says "actually", "change", "instead", "add", "remove", "update", "modify" in reference to a document

**Don't use when:**
- Feedback is about code files (this skill is for design artifacts only)
- User wants to start fresh with a new design (use brainstorming instead)
- Document doesn't exist in `docs/designs/`, `docs/research/`, or `docs/plans/`

## The Process

### Phase 1: Parse Feedback

Read the target document and parse the user's natural language feedback.

**Identify:**
1. Which section(s) the feedback applies to
2. Whether the request is clear or needs clarification
3. Whether research is needed to fulfill the request

**Document Detection:**
- `docs/designs/` → design document → next stage is `/hyperpowers:research`
- `docs/research/` → research document → next stage is `/hyperpowers:writing-plans`
- `docs/plans/` → plan document → next stage is `/hyperpowers:subagent-driven-development`

**If document not found:** Stop and inform user: "Document not found at [path]. Please provide a valid path to a design, research, or plan document."

**If unsupported location:** Stop and inform user: "Feedback skill only supports documents in docs/designs/, docs/research/, or docs/plans/."

## Red Flags - STOP

- Applying changes without user approval
- Modifying code files (design artifacts only)
- Skipping clarification when feedback is ambiguous
- Restructuring document format (add content, don't restructure)
- Dispatching full research for simple feedback
