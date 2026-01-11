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

[Phase content to be added in subsequent tasks]

## Red Flags - STOP

- Applying changes without user approval
- Modifying code files (design artifacts only)
- Skipping clarification when feedback is ambiguous
- Restructuring document format (add content, don't restructure)
- Dispatching full research for simple feedback
