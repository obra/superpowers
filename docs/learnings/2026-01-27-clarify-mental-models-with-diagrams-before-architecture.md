---
date: 2026-01-27
tags: [architecture, communication, planning]
workflow: [brainstorming]
---

# Clarify Mental Models with Diagrams Before Architecture

## Problem

User had clear vision for how prompts should compose:
- System instructions = system.md + context + calendarInstructions
- First user message = schedule prompt

But I proposed architecture options (A, B, C) based on my interpretation, leading to:
- Multiple clarifying questions ("where do calendar instructions come from?")
- Back-and-forth to align understanding
- Implementation that initially mismatched user's intent

**Root cause:** Jumped to technical solutions without first understanding user's conceptual model.

## Solution

**Step 1: Ask for user's mental model FIRST**

"Before I propose solutions, let me understand your mental model:
- What's immutable (system instructions)?
- What's configurable per user?
- What's configurable per schedule?
- How do these compose?"

**Step 2: Draw diagram showing "what goes where"**

```
System Prompt (to Gemini):
┌─────────────────────────────────────┐
│ [system.md - base behavior]         │
│ [user context - domain knowledge]   │
│ [output schema - format rules]      │
└─────────────────────────────────────┘

User Messages (to Gemini):
┌─────────────────────────────────────┐
│ Message 1: [schedule prompt - task]│
│ Message 2: [calendar instructions] │
│ Message 3: [events JSON]           │
└─────────────────────────────────────┘
```

**Step 3: Get explicit sign-off**

"Does this match your vision? Any corrections?"

**Step 4: THEN propose implementation**

Once conceptual model is aligned, propose technical implementation.

## Pattern

### Questions to Ask (Mental Model Discovery)

**For prompt/config architecture:**
- "What's immutable vs configurable?"
- "What takes precedence when both are set?"
- "Do these compose or replace each other?"
- "Who can change each piece (user, admin, system)?"

**For data flow:**
- "Where does each piece come from?"
- "In what order are they processed?"
- "What happens if one is missing?"

**For user expectations:**
- "What should happen if user sets both?"
- "Should this be automatic or explicit?"
- "What's the default behavior?"

### Diagram Types

**Architecture diagrams:**
```
Component A
    ↓
Component B (which uses A)
    ↓
Component C (which uses B)
```

**Prompt composition:**
```
System Prompt:
├── Base (immutable)
├── User Context (optional)
└── Schema (immutable)

User Messages:
├── Task (required)
├── Instructions (required)
└── Data (required)
```

**Config precedence:**
```
User Config (lowest)
    ↓ (overrides)
Schedule Config (medium)
    ↓ (overrides)
System Config (highest)
```

## When to Apply

**Red flags indicating model misalignment:**
- User asks "wait, where does X come from?"
- Multiple options proposed, none feel right to user
- User says "no, that's not what I meant"
- Back-and-forth clarifications
- Implementation gets rewritten after review

**Apply this when:**
- Designing architecture for new feature
- User describes vision using their own terminology
- Multiple valid interpretations exist
- Feature touches existing complex system

## Prevention Checklist

Before proposing architecture:

- [ ] Ask user to describe their mental model
- [ ] Draw diagram showing "what goes where"
- [ ] Label each component (immutable? configurable? by whom?)
- [ ] Show data flow / composition order
- [ ] Get explicit "yes, that's exactly right" before coding

**Don't skip this** even if you think you understand - confirmation is cheap, rework is expensive.

## Example from Session

**User's vision:**
- System instructions = system.md + context + calendarInstructions
- Schedule prompt = first user message

**My initial interpretation:**
- calendarInstructions = user message (not in system)
- Led to confusion and multiple clarifications

**What I should have done:**
1. Draw diagram showing "System Prompt contains: ..." and "User Messages contain: ..."
2. Ask "Does this match your vision?"
3. Correct any misalignments BEFORE implementing

**Cost:** Multiple rounds of clarification, implementation that needed correction.

## Related Patterns

- **Brainstorming skill:** Use this phase for mental model discovery
- **AskUserQuestion:** Ask clarifying questions about model before implementation
- **Plan validation:** Show architecture diagram in plan, get approval before execution
- **Documentation:** Put final architecture diagram in CLAUDE.md or design doc

## Success Criteria

You know you have alignment when:
- ✅ User says "yes, exactly right"
- ✅ No further clarifying questions
- ✅ Implementation matches user's expectations first try
- ✅ Code review has no "wait, this should be..." comments
