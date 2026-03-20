---
name: brainstorming
description: "Use when starting any creative work - creating features, building components, adding functionality, or modifying behavior"
effort: high
allowed-tools: Read, Grep, Glob, AskUserQuestion, WebSearch, WebFetch, Task
user-invocable: false
---

# Brainstorming Ideas Into Designs

## Overview

Help turn ideas into fully formed designs and specs through natural collaborative dialogue.

Start by understanding the current project context, then ask questions one at a time to refine the idea. Once you understand what you're building, present the design in small sections (200-300 words), checking after each section whether it looks right so far.

<requirements>
## Requirements

1. Use AskUserQuestion for ALL user interaction. Plain text questions don't allow structured responses.
2. Complete Understanding Gate before presenting design.
3. Save design to docs/hyperpowers/designs/ before announcing completion.
</requirements>

<compliance-anchor>
You have invoked this skill. You MUST:
- Follow phases in order (no skipping)
- Complete all gates (no self-exemptions)
- Produce required outputs (no substitutions)

Failure to comply = skill failure. There is no "partial compliance."
</compliance-anchor>

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

3. Use AskUserQuestion to present assessment to user:
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

   Wait for AskUserQuestion response before proceeding.

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
- Use the exploration findings from Phase 0.5 to inform your questions
- Reference actual file locations and patterns when asking about structure (e.g., "should this go in `src/services/` like similar features?")
- Check out the current project state first (files, docs, recent commits)
- Use AskUserQuestion to ask questions one at a time to refine the idea
- Prefer multiple choice questions (AskUserQuestion options) when possible
- Only one AskUserQuestion per message - if a topic needs more exploration, break it into multiple AskUserQuestion calls
- Focus on understanding: purpose, constraints, success criteria

Use AskUserQuestion for clarifying questions. Plain text questions don't allow structured responses.

**Exploring approaches:**
- Propose 2-3 different approaches with trade-offs
- Present options conversationally with your recommendation and reasoning
- Lead with your recommended option and explain why

**Presenting the design:**
- Once you believe you understand what you're building, present the design
- Break it into sections of 200-300 words
- Use AskUserQuestion after each section to check if it looks right:
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
- Write the validated design to `docs/hyperpowers/designs/YYYY-MM-DD-<topic>-design.md`
- Do NOT commit (this directory is gitignored - designs are ephemeral)

**Completion Enforcement** (CRITICAL):

Your FINAL message MUST contain the handoff block. This is NOT optional.

STOP. Look at your planned final message. Does it contain:
```
Design saved to `docs/hyperpowers/designs/<actual-filename>.md`.

To continue:
/compact ready to research docs/hyperpowers/designs/<actual-filename>.md
/hyperpowers:research docs/hyperpowers/designs/<actual-filename>.md
```

If NO: Add it. You cannot announce completion without this exact block.
If YES: Proceed with sending.

| Thought | Reality |
|---------|---------|
| "User knows what's next" | NO. Explicit commands prevent context loss. |
| "I'll mention it casually" | NO. Copy-paste commands, not prose descriptions. |
| "Compacting isn't always needed" | WRONG. Context degrades. ALWAYS suggest compact. |

**Handoff:**
After saving the design, announce completion with copy-paste commands:

```
Design saved to `docs/hyperpowers/designs/<actual-filename>.md`.

To continue:
/compact ready to research docs/hyperpowers/designs/<actual-filename>.md
/hyperpowers:research docs/hyperpowers/designs/<actual-filename>.md
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

<verification>
## Phase Gate Verification

Before proceeding to design presentation:

**Understanding Gate** (Required):

- [ ] Dispatched Explore subagent and received results (or documented failure)
- [ ] Read current project state (files, docs, commits)
- [ ] Asked at least one clarifying question (grounded in exploration findings)
- [ ] User has confirmed understanding

**STOP CONDITION:** If any checkbox is unchecked, complete missing steps before presenting design.

Before saving design:

**Design Gate** (Required - NEVER announce completion without this):

STOP. Before saving design, verify each section EXISTS in your document:
- [ ] Problem Statement - Quote the first sentence you wrote
- [ ] Success Criteria - How many criteria? (must be ≥1 measurable)
- [ ] Constraints/Out of Scope - Quote one constraint
- [ ] Approach - Quote the approach summary
- [ ] Open Questions - How many? (0 is valid only if explicitly noted)
- [ ] Original Issue included (if issue ID was provided at start)

If ANY section is missing, ADD IT NOW. Do not proceed.

| Thought | Reality |
|---------|---------|
| "Design is straightforward, no assumptions" | WRONG. All designs have assumptions. List them. |
| "User already confirmed understanding" | Understanding ≠ assumption validation. Different gates. |
| "I'll validate during research phase" | NO. Brainstorm validates design assumptions. Research validates technical assumptions. |

**STOP CONDITION:** If any section missing, add it before saving.
</verification>

### Phase: Assumption Validation (Before saving)

Before finalizing design, dispatch assumption-checker agent:

```
Task(
  description: "Validate design assumptions",
  prompt: "Validate these assumptions from the design:
  [list assumptions extracted from the design]

  Check against codebase patterns and documentation.",
  model: "haiku",
  subagent_type: "hyperpowers:research:assumption-checker"
)
```

Wait for agent response. If assumptions are INVALID:
- Update design to reflect reality
- Re-present affected sections via AskUserQuestion

Do NOT save design until assumptions are validated.

**Error Handling:**
- If agent times out: Note "Assumption validation incomplete" in document, proceed to save
- If no assumptions found: Note "No technical assumptions to validate" in document

## Red Flags - IMMEDIATE STOP

| Violation | Why It's Critical | Recovery |
|-----------|-------------------|----------|
| **Plain text questions instead of AskUserQuestion** | User can't respond via structured UI | Use AskUserQuestion tool |
| Opening code files with intent to modify | Brainstorming is for design, not coding | Return to clarifying questions |
| Skipping clarifying questions | Assumptions lead to wrong designs | Ask at least one question via AskUserQuestion |
| Presenting design without user confirmation | Design may be solving wrong problem | Get explicit confirmation via AskUserQuestion |
| Saving design without required sections | Incomplete design = incomplete planning | Add missing sections |
| Skipping codebase exploration | Questions may not reflect actual project structure | Dispatch Explore subagent first |

## Deliverable: design.md

Brainstorming is complete when you have a design document at `docs/hyperpowers/designs/YYYY-MM-DD-<topic>-design.md` containing:

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

<completion-check>
Before announcing completion, verify you followed the skill:
- [ ] Completed all phases in order (0 → 0.5 → Understanding → Design Presentation → Assumption Validation → Save)
- [ ] Passed all verification gates (Understanding Gate, Design Gate)
- [ ] Produced required outputs (design document at docs/hyperpowers/designs/)

If ANY unchecked, go back and complete missing steps.
</completion-check>

<requirements>
## Requirements (reminder)

1. Use AskUserQuestion for ALL user interaction. Plain text questions don't allow structured responses.
2. Complete Understanding Gate before presenting design.
3. Save design to docs/hyperpowers/designs/ before announcing completion.
</requirements>

**No design.md = brainstorming not complete = no implementation.**
