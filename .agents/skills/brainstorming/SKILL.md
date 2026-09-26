---
name: brainstorming
description: Use before any creative work - creating features, building components, or modifying behavior. Explore intent and design before implementation, with explicit approval gates.
---

# Brainstorming Ideas Into Designs

Use this before writing code for a feature or behavior change. The outcome is a design your human
partner can recognize and correct.

## Establish shared understanding

1. **Discover intent.** From the request and context, identify the intended outcome, who it is for,
   and what success looks like. If that's missing, ask ONE focused question about purpose or
   intended use before proposing an approach.
2. **Write back your understanding.** Summarize the outcome, constraints, and success criteria in a
   short note. Separate what they said from your assumptions. Invite correction and incorporate it
   before treating this as the design brief.
3. **Carry intent into the design.** Preserve the agreed understanding in the design artifact.

## Classify the request

Say which path this needs, then gate the work at each stage. A reply approves only the stage
actually presented.

- **Spike** — human approves the question + probe (cheapest path to insight).
- **Bounded** — human approves the short in-chat design.
- **Architectural** — human reviews + approves the written spec, then reviews the written
  implementation plan and selects its execution method.

<HARD-GATE>
Before any implementation action (writing code, scaffolding, installing dependencies, creating a
project), complete the selected path's prerequisites. Approval of an idea does not approve
artifacts that don't exist yet. Read-only exploration is always allowed while gates are incomplete.
</HARD-GATE>

## When requirements are already clear

If the request already supplies purpose and constraints, reflect that understanding instead of
re-asking. Keep the note concise; its accuracy and the chance to correct it are what matter.

## Design as sections

Present the design in digestible sections for sign-off rather than one wall of text. Confirm each
section before moving to the next.
