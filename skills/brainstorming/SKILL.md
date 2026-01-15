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

### Phase 0: Issue Context Capture

**If invoked with an issue ID argument (e.g., `/brainstorm hyperpowers-5fy`):**

1. Dispatch issue-tracking agent to fetch issue body:
   ```
   Task(description: "Fetch issue body",
        prompt: "Operation: get-issue-body
   Issue: [issue ID from argument]",
        model: "haiku",
        subagent_type: "hyperpowers:issue-tracking:issue-tracking")
   ```

2. Assess whether issue is Authoritative or Reference Only:
   - Has `- [ ]` checklist items → **Authoritative**
   - Has "?" in description or title → **Reference Only**
   - No clear acceptance criteria → **Reference Only**

3. **MUST use AskUserQuestion tool** to present assessment to user:
   ```
   AskUserQuestion(
     questions: [{
       question: "Issue [ID] '[title]' classified as [Authoritative/Reference Only]. Is this correct?",
       header: "Issue",
       options: [
         {label: "Yes", description: "Classification is correct"},
         {label: "Change to Authoritative", description: "Has acceptance criteria I must meet"},
         {label: "Change to Reference Only", description: "Just context, no strict criteria"}
       ],
       multiSelect: false
     }]
   )
   ```

   Do NOT proceed without AskUserQuestion response. Plain text confirmation is NOT acceptable.

4. Store for inclusion in design document output

**If no issue ID provided:** Skip to "Understanding the idea" phase.

### Phase 0.5: Codebase Exploration

**Always dispatch an Explore subagent before asking clarifying questions.**

After Phase 0 completes (or immediately if no issue ID), dispatch exploration:

```
Task(
  description: "Explore codebase for brainstorming",
  prompt: [exploration-prompt.md template filled with:
    - Topic: user's brainstorming request
    - Issue Context: captured in Phase 0, or "None provided"],
  model: "haiku",
  subagent_type: "Explore"
)
```

**Use exploration findings to:**
- Reference actual file paths when asking about placement ("should this go in `src/services/` like other services?")
- Identify existing patterns to follow or break from
- Detect potential conflicts early

**Handling exploration issues:**
- **Timeout (>45s):** Proceed without exploration context, note "Exploration timed out - questions based on general patterns only"
- **Empty results:** Proceed normally, note "New/minimal codebase - no existing patterns detected"
- **Subagent failure:** Proceed without context, note "Exploration unavailable - design based on manual analysis only"

**Exploration findings are internal context only** - do NOT include in final design document.

**Understanding the idea:**
- Check out the current project state first (files, docs, recent commits)
- **MUST use AskUserQuestion tool** to ask questions one at a time to refine the idea
- Prefer multiple choice questions (AskUserQuestion options) when possible
- Only one AskUserQuestion per message - if a topic needs more exploration, break it into multiple AskUserQuestion calls
- Focus on understanding: purpose, constraints, success criteria

**AskUserQuestion is MANDATORY** for all clarifying questions. Plain text questions are NOT acceptable.

**Exploring approaches:**
- Propose 2-3 different approaches with trade-offs
- Present options conversationally with your recommendation and reasoning
- Lead with your recommended option and explain why

**Presenting the design:**
- Once you believe you understand what you're building, present the design
- Break it into sections of 200-300 words
- **MUST use AskUserQuestion tool** after each section to check if it looks right:
  ```
  AskUserQuestion(
    questions: [{
      question: "Does this [section name] look right?",
      header: "Review",
      options: [
        {label: "Yes, continue", description: "This section is good, proceed"},
        {label: "Needs changes", description: "I have feedback on this section"}
      ],
      multiSelect: false
    }]
  )
  ```
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

## COMPULSORY: Phase Gate Verification

Before proceeding to design presentation:

**Understanding Gate** (all COMPULSORY):

- [ ] Read current project state (files, docs, commits)
- [ ] Asked at least one clarifying question
- [ ] User has confirmed understanding

**STOP CONDITION:** If ANY checkbox is unchecked, do NOT proceed. Complete missing steps first.

Before saving design:

**Design Gate** (all COMPULSORY):

- [ ] Problem Statement included
- [ ] Success Criteria included (measurable)
- [ ] Constraints/Out of Scope included
- [ ] Approach included
- [ ] Open Questions included
- [ ] Original Issue included (if issue ID was provided at start)

**STOP CONDITION:** If ANY section missing, do NOT save. Complete missing section(s) first.

## Red Flags - IMMEDIATE STOP

| Violation | Why It's Critical | Recovery |
|-----------|-------------------|----------|
| **Plain text questions instead of AskUserQuestion** | User can't respond via structured UI | Use AskUserQuestion tool |
| Opening code files with intent to modify | Brainstorming is DESIGN, not CODING | Return to clarifying questions |
| Skipping clarifying questions | Assumptions lead to wrong designs | Ask at least one question via AskUserQuestion |
| Presenting design without user confirmation | Design may be solving wrong problem | Get explicit confirmation via AskUserQuestion |
| Saving design without required sections | Incomplete design = incomplete planning | Add missing sections |

**AskUserQuestion is MANDATORY** for ALL user interaction: issue assessment, clarifying questions, design section reviews. Plain text questions like "Does this look right?" are NOT acceptable.

## Deliverable: design.md

Brainstorming is complete when you have a design document at `docs/designs/YYYY-MM-DD-<topic>-design.md` containing:

1. **Problem Statement**: What problem are we solving? (not "add feature X")
2. **Success Criteria**: How will we know it's done? (measurable)
3. **Constraints**: What must NOT change? What's out of scope?
4. **Approach**: High-level design (not implementation details)
5. **Open Questions**: What do we still not know?
6. **Original Issue** (if issue ID was provided):
   ```markdown
   ## Original Issue

   > **ID:** [issue-id]
   > **Title:** [title]
   > **Status:** Authoritative | Reference Only
   > **Reason:** [classification reason]

   [Full issue body verbatim]
   ```

**No design.md = brainstorming not complete = no implementation.**
