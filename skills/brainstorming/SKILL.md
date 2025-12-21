---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation."
---

# Brainstorming Ideas Into Designs

## Overview

Help turn ideas into fully formed designs and specs through natural collaborative dialogue.

Start by understanding the current project context, then ask questions one at a time to refine the idea. Once you understand what you're building, present the design in small sections (200-300 words), checking after each section whether it looks right so far.

## The Process

**Understanding the idea:**
- Check out the current project state first (files, docs, recent commits)
- Use the **AskUserQuestion tool** to ask questions one at a time
- Prefer multiple choice questions when possible (2-4 options)
- Only one question per message - if a topic needs more exploration, break it into multiple questions
- Focus on understanding: purpose, constraints, success criteria

**Exploring approaches:**
- Use **AskUserQuestion** to propose 2-3 different approaches with trade-offs
- Lead with your recommended option and explain why in the description
- Add "(Recommended)" to the label of your preferred option

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
- Use superpowers:using-git-worktrees to create isolated workspace
- Use superpowers:writing-plans to create detailed implementation plan

## Using AskUserQuestion

Use the AskUserQuestion tool for all questions during brainstorming. This provides a better UX than plain text questions.

**Example - Understanding requirements:**
```json
{
  "questions": [{
    "question": "What level of error handling do you need?",
    "header": "Errors",
    "multiSelect": false,
    "options": [
      { "label": "Basic (Recommended)", "description": "Simple try/catch, log errors, show user-friendly messages" },
      { "label": "Comprehensive", "description": "Retry logic, error boundaries, detailed error states" },
      { "label": "Minimal", "description": "Let errors bubble up, handle at top level only" }
    ]
  }]
}
```

**Example - Exploring approaches:**
```json
{
  "questions": [{
    "question": "Which data fetching approach should we use?",
    "header": "Data",
    "multiSelect": false,
    "options": [
      { "label": "React Query (Recommended)", "description": "Built-in caching, loading states, and refetching. Best for most cases." },
      { "label": "SWR", "description": "Lighter weight, similar features. Good if bundle size is critical." },
      { "label": "Custom hooks", "description": "Full control but more code to maintain. Only if you have unique requirements." }
    ]
  }]
}
```

**When to use multiSelect:**
- `false` (default): Single choice decisions like "which approach" or "what style"
- `true`: When user can pick multiple items like "which features to include"

## Key Principles

- **One question at a time** - Don't overwhelm with multiple questions
- **Multiple choice preferred** - Use AskUserQuestion with 2-4 options when possible
- **YAGNI ruthlessly** - Remove unnecessary features from all designs
- **Explore alternatives** - Always propose 2-3 approaches before settling
- **Incremental validation** - Present design in sections, validate each
- **Be flexible** - Go back and clarify when something doesn't make sense
