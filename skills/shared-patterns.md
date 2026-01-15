# Shared Reinforcement Patterns

> **Usage:** Reference these patterns when writing discipline-enforcing skills.
> **Version:** 1.0 (2026-01-15)

## Pattern 1: Gate Structure

Use exact format. Deviation reduces recognition.

<example>
**[Gate Name] Gate** (Required):

- [ ] First requirement
- [ ] Second requirement

**STOP CONDITION:** If ANY unchecked, do NOT proceed. [Recovery action].
</example>

**Key elements:**
- "Required" keyword (softer than COMPULSORY, still clear)
- Checkbox format (visual tracking)
- STOP CONDITION with specific recovery

---

## Pattern 2: Red Flags Table

3-column format triggers agent recognition.

<example>
## Red Flags - STOP

| Violation | Why It's Critical | Recovery |
|-----------|-------------------|----------|
| [Observable behavior] | [Consequence] | [Fix action] |
</example>

**Key elements:**
- Header: "Red Flags - STOP" (urgency without caps lock)
- Column 1: Observable behavior (not abstract concepts)
- Column 3: Recovery action (escape path)

---

## Pattern 3: Self-Check Questions

Help agents recognize rationalization.

<example>
| Thought | Reality |
|---------|---------|
| "[Rationalization in first person]" | [Counter statement] |
</example>

---

## Pattern 4: Handoff Consumption

Enforce citation when receiving handoffs.

<example>
**[Source] Consumption Gate** (Required):

- [ ] Source path explicitly stated
- [ ] Key findings quoted
- [ ] Decisions traced to findings

**STOP CONDITION:** If not citing findings, STOP. Quote specific sections.
</example>

---

## Pattern 5: Counter-Rationalization

Pre-written counters for predictable excuses.

<example>
| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence ≠ evidence |
</example>

---

## Pattern 6: Evidence Requirements

For verification-focused skills.

<example>
**Evidence Required:**
- Show [command] output
- Show [specific result]

"[Weak claim]" is NOT evidence. [Strong evidence] required.
</example>

---

## Pattern 7: Beginning-End Anchoring

<example>
## Overview
[Brief description]

<requirements>
1. Requirement 1
2. Requirement 2
</requirements>

[... middle content ...]

<requirements>
## Requirements (reminder)
1. Requirement 1
2. Requirement 2
</requirements>

## Deliverable
</example>

---

## Anti-Patterns

| Anti-Pattern | Problem | Instead |
|--------------|---------|---------|
| ALL CAPS FOR EMPHASIS | Claude 4.x ignores | Logical consequence statement |
| "MUST/CRITICAL/COMPULSORY" × 12 | Signal dilution | 3-4 per skill max |
| Checklist after action | Too late to catch violations | Checklist BEFORE action |
| "No exceptions" repeated | Loses meaning | One explicit "No exceptions" list |
| Long prohibition lists | Distracts from core task | Focus on what TO do |
