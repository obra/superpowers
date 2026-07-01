---
name: acceptance-criteria
description: Use after brainstorming a feature design and before writing an implementation plan — when an approved spec exists but testable criteria for individual behaviors have not been written yet
---

# Acceptance Criteria

## Overview

A spec without acceptance criteria is a wishlist. Acceptance criteria turn design decisions into verifiable, pass/fail contracts that development and review can use as ground truth.

**Core principle:** Every behavior the system must exhibit needs a statement that tells you exactly when it passes and when it fails.

**Announce at start:** "I'm using the acceptance-criteria skill to write testable acceptance criteria for this feature."

## When to Use

Use this skill after `superpowers:brainstorming` completes and the spec is approved — before invoking `superpowers:writing-plans`. If a spec exists but has no ACs, or has vague ones like "the UI should be responsive," run this skill before planning begins.

**Don't use this skill:**
- Before the design is approved (ACs written on an unapproved design will be rewritten)
- As a substitute for the spec itself (ACs describe behavior, not architecture or approach)
- For statements that can't be expressed as testable behaviors (aesthetic preferences, opinions)

## The Standard: SMART ACs

Each acceptance criterion must be:

| Property | Meaning | Ask Yourself |
|----------|---------|--------------|
| **Specific** | One behavior, no ambiguity | Could two developers implement this differently and both be "correct"? |
| **Measurable** | Clear pass/fail boundary | Can a test give a definitive answer? |
| **Achievable** | Implementable in this scope | Is it grounded in the spec? |
| **Relevant** | Tied to a user or system need | Would anyone notice if this broke? |
| **Testable** | Can be verified automatically or manually | Can you write the test right now? |

If any property fails, the AC must be rewritten before it's used.

## Format: Given/When/Then

Every AC follows this structure:

```
**AC-N: [Short behavior name]**
- Given: [system state / preconditions]
- When: [user action or system event]
- Then: [observable outcome]
```

**Good AC:**
```
**AC-3: Cart preserves items across sessions**
- Given: A user has added 2 items to their cart and is logged in
- When: The user closes the browser and reopens the site 24 hours later
- Then: Their cart still contains those 2 items
```

**Bad AC:**
```
**AC-3: Shopping cart works well**
- The cart should be reliable and user-friendly
```

The bad AC is untestable. No implementation can definitively satisfy it, and no test can definitively verify it. Rewrite or delete.

## The Process

### Step 1: Read the Spec

Read the approved spec document before writing a single AC. Do not rely on memory of the brainstorming conversation. Look for:

- **User-facing behaviors** — what can users do?
- **System responses** — what does the system do in response to events?
- **Boundary conditions** — what happens at edges (min, max, empty, limit)?
- **Error conditions** — what happens when inputs are invalid or dependencies fail?
- **Explicit non-goals** — scope boundaries that someone might otherwise assume are included

### Step 2: Extract Behaviors

List every behavior the spec describes. Include all paths: happy path, alternate paths, error paths, boundary conditions. Don't filter yet — write them all down first.

If a behavior appears implicitly in the spec (described but not explicitly stated), write it down and flag it for your human partner's confirmation.

### Step 3: Write Given/When/Then

For each behavior, write a complete Given/When/Then statement. One behavior = one AC. If you find yourself writing "and" in the **Then** clause, split it into two ACs.

**Numbering:** AC-1, AC-2, AC-3... in spec order.

**Precision rules:**
- **Given** describes observable state — not internal implementation state
- **When** describes a single triggering event — not a sequence
- **Then** describes observable output: a UI change, an API response, a database state, a message sent

### Step 4: SMART Check

Run each AC through the SMART table. For each criterion that fails, rewrite the AC or flag it as unverifiable.

**Common failures and fixes:**

| Failure | Fix |
|---------|-----|
| "Then: displays an appropriate error" | Specify the exact error text or error code |
| "When: user interacts with the form" | Specify which interaction (submit, blur, keystroke) |
| "Given: the system is in a good state" | Specify what observable conditions define "good state" |
| "Then: the page loads quickly" | Specify max acceptable time in milliseconds |
| "Then: the experience feels smooth" | Delete — this is aesthetic, not behavioral |

### Step 5: Coverage Check

Map each section of the spec to at least one AC. Gaps fall into two categories:

- **Architectural section** — describes how, not what. No AC needed.
- **Behavioral section with no AC** — you missed a behavior. Add the AC.

Flag any behavioral spec requirement with no corresponding AC and confirm with your human partner before proceeding.

### Step 6: Write the AC Document

Append the ACs to the spec document in a new section, organized by path type:

```markdown
## Acceptance Criteria

### Happy Path

**AC-1: [Behavior name]**
- Given: ...
- When: ...
- Then: ...

### Alternate Paths

**AC-N: [Behavior name]**
- Given: ...
- When: ...
- Then: ...

### Error Conditions

**AC-N: [Behavior name]**
- Given: ...
- When: ...
- Then: ...

### Boundary Conditions

**AC-N: [Behavior name]**
- Given: ...
- When: ...
- Then: ...
```

Commit the updated spec.

### Step 7: Review with Your Human Partner

Present the ACs and ask:

> "I've written N acceptance criteria and added them to the spec. Please review — any behaviors I missed, or any ACs that don't capture what you intended?"

Wait for the response. If they request changes, update and re-commit. Only proceed once they approve.

### Step 8: Hand Off to writing-plans

After approval, invoke `superpowers:writing-plans`. The ACs become the implementation plan's test contract — every AC must map to at least one test case in the plan, and every test case must trace back to an AC.

## Red Flags — STOP

- Writing ACs before the spec is approved
- ACs containing any unmeasurable adjective: "appropriate," "reasonable," "user-friendly," "fast," "smooth," "helpful," "clear," "intuitive," "meaningful" — if you cannot put a number or specific observable state on it, it does not belong in a Then clause
- ACs with multiple outcomes in Then — whether written with "and," commas, or bullet points. One Then = one observable outcome. Split the rest into separate ACs.
- ACs that describe internal implementation rather than observable behavior
- ACs that require reading source code to verify
- Skipping error path ACs ("we'll handle errors later")
- Writing ACs from memory instead of reading the spec
- Any AC where you cannot immediately write the test for it

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "The behavior is obvious from the spec" | If it's obvious, write it down. Tests don't read specs. |
| "We'll figure out edge cases during implementation" | Implementation follows ACs. Missing ACs = missing features. |
| "ACs are too formal for this small feature" | Small features have small ACs. Write them. |
| "This error case will never happen" | Every unchecked error that "never happens" eventually does. |
| "This AC is untestable, but it's important" | If you can't test it, you can't verify it. Rewrite or delete. |
| "The PM will write ACs later" | Write them now. Plans without ACs produce features without tests. |
| "We do ACs after we ship to validate" | Post-ship ACs are not acceptance criteria. They're incident reports. |

## Quick Reference

| AC Type | Given | When | Then |
|---------|-------|------|------|
| Happy path | Normal preconditions | Expected user action | Successful outcome |
| Alternate path | Non-default preconditions | Valid action with different starting state | Correct outcome for that state |
| Error path | Invalid input or failed dependency | Triggering event | Specific error: message, code, or UI state |
| Boundary | Value at min, max, or limit | Action at boundary | Correct behavior at that boundary |
| Async | Long-running operation in progress | Check during / callback fires | Correct eventual state |
| Auth | User is / is not authenticated | Attempt on protected resource | Correct allow or deny behavior |

## Integration

**Called after:**
- **superpowers:brainstorming** — spec must be approved before writing ACs

**Calls next:**
- **superpowers:writing-plans** — ACs become the test contract that tasks in the plan must satisfy

**Pairs with:**
- **superpowers:test-driven-development** — ACs map directly to tests written in the RED phase
- **superpowers:verification-before-completion** — ACs are the checklist verified before claiming a feature complete
- **superpowers:feature-ship** — ACs are Gate 2 of the release checklist
