---
date: 2026-01-27
tags: [refactoring, naming, scope-expansion]
workflow: [code-review, planning]
---

# Audit Artifacts When Expanding Feature Scope

## Problem

Feature expanded from "meeting preparation" to "any event preparation" (meetings, shopping, travel, workouts), but field name `meeting_preparation_prompt` remained meeting-specific.

Opus code review flagged this and recommended flexible schema. Required renaming field across 6 files + updating schema documentation.

**Root cause:** Didn't revisit existing naming/schemas when scope expanded. Original design was meeting-focused; new design needed to be event-agnostic.

## Solution

**When expanding scope from specific → general, audit ALL artifacts:**

### 1. Field Names
```bash
# Search for overly specific names
grep -rn "meeting_" packages/ --include="*.js"
grep -rn "client_" packages/ --include="*.js"
```

**Change:**
- `meeting_preparation_prompt` → `preparation_prompt`
- `client_meeting_notes` → `event_notes`
- `employee_schedule` → `user_schedule`

### 2. Schema Descriptions
```markdown
# Before (too specific)
Generate a JSON response where the `meeting_preparation_prompt` field
contains a prompt for another AI to prepare for the meeting.

# After (generic)
Generate a JSON response where the `preparation_prompt` field contains
instructions for preparing for the calendar event.
```

### 3. Documentation Examples
```markdown
# Before (only meeting examples)
Example: "1 on 1 with Jim", "Client meeting about project X"

# After (diverse examples)
Example: "1 on 1 with Jim", "Grocery shopping at Whole Foods",
"Gym workout session", "Team meeting about Q1 planning"
```

### 4. Code Comments
```javascript
// Before
/**
 * Generate meeting preparation content
 */

// After
/**
 * Generate event preparation content (works for meetings, errands, etc.)
 */
```

### 5. Test Cases
```javascript
// Before (only meeting scenarios)
it('should prepare for client meeting', ...)

// After (edge cases)
it('should prepare for client meeting', ...)
it('should prepare for shopping trip', ...)
it('should prepare for workout session', ...)
```

### 6. Variable Names
```javascript
// Before
const meetingsList = events.filter(...)
const clientMeetings = ...

// After
const eventsList = events.filter(...)
const externalEvents = ...
```

## Pattern

### Audit Checklist

When scope expands (specific → general), search for:

- [ ] **Field names** in schemas/types (grep for old term)
- [ ] **Schema descriptions** mentioning specific use case
- [ ] **Documentation examples** (too narrow?)
- [ ] **Code comments** referencing old scope
- [ ] **Test case names** (only old use case tested?)
- [ ] **Variable names** in implementation
- [ ] **Function names** (too specific?)
- [ ] **Error messages** mentioning old scope

### Commands to Run

```bash
# Find overly specific terminology
grep -rn "meeting" packages/ --include="*.js" --include="*.md"
grep -rn "client" packages/ --include="*.ts"

# Check schema files
cat schemas/*.md | grep -i "meeting"

# Check test files
grep -rn "describe\|it(" tests/ | grep -i "meeting"
```

## When to Apply

**Scope expansion scenarios:**
- Meeting-specific → Event-agnostic
- Client-specific → User-agnostic
- Single-tenant → Multi-tenant
- US-only → International
- Desktop → Cross-platform

**Red flags:**
- New feature supports broader use cases than naming suggests
- Documentation examples don't cover new use cases
- Field names contain domain-specific terms (meeting, client, user)
- Tests only cover original narrow scope

## Prevention

**During planning:**

1. **Identify scope change:** "This was meetings-only, now it's any event"

2. **Create before/after checklist:**
   ```
   Before: Meeting-focused
   After: Event-agnostic

   To update:
   - [ ] Field: meeting_preparation_prompt
   - [ ] Schema description
   - [ ] Examples (add non-meeting)
   - [ ] Test cases
   ```

3. **Assign as explicit task:** "Task: Rename meeting-specific artifacts for event-agnostic scope"

## Example from Session

**Scope expansion:** Meeting preparation → Any event preparation

**Artifacts needing update:**
- Field name: `meeting_preparation_prompt` → `preparation_prompt`
- Schema: "for the meeting" → "for the event"
- Prompt structure: "STAKEHOLDERS" (meeting-specific) → "KEY PEOPLE" (general)
- Examples: Only meeting examples → Added shopping, personal events

**Files changed:** 6 files (schema, processor, scheduler, test data, docs)

**Cost:** Extra commit after implementation, rename across codebase. Could have been done proactively during scope change.

## Related Patterns

- **Ubiquitous language (DDD):** Terms should reflect actual domain, not legacy scope
- **Refactoring:** Scope expansion is a refactoring trigger - rename before extending
- **Documentation:** Update docs when terminology changes

## Success Criteria

After scope expansion:
- ✅ No references to old narrow scope in field names
- ✅ Schema descriptions are generic
- ✅ Examples cover full breadth of new scope
- ✅ Tests verify edge cases of broader scope
- ✅ Grep for old term returns no code references (only comments/docs if needed)
