---
date: 2026-01-27
tags: [validation, api, security, best-practices]
workflow: [code-review]
---

# Validate User Input Immediately, Not in Code Review

## Problem

Implemented API endpoint for user context configuration without validation:
- No length limit on text field → could accept megabytes → MongoDB bloat
- No format validation on Drive file ID → unnecessary API calls with invalid IDs

These were flagged as "Critical Issues" during Opus code review, requiring a fix commit.

## Solution

**Add validation BEFORE feature logic in API routes:**

```typescript
// PATCH /api/users/[userId]/config/prompts
if (body.context.text && body.context.text.length > 50000) {
  return NextResponse.json(
    { error: 'Context text exceeds 50,000 character limit' },
    { status: 400 }
  );
}

if (driveFileId && !/^[a-zA-Z0-9_-]+$/.test(driveFileId)) {
  return NextResponse.json(
    { error: 'Invalid Drive file ID format' },
    { status: 400 }
  );
}
```

**Validation checklist for user input:**
- [ ] **Length limits** - Prevent DoS, storage bloat (text: 50k, file content: 100k)
- [ ] **Format validation** - Prevent bad data, unnecessary API calls (regex patterns)
- [ ] **Business rules** - Domain-specific constraints (e.g., interval compatibility)
- [ ] **Type checking** - Ensure correct types (string, number, boolean)

## Prevention

**During implementation planning:**

1. **For each user input field, ask:** "What's the worst case input?"
   - Empty string? Null? Undefined?
   - Maximum length? (1MB text?)
   - Invalid format? (special characters in ID?)
   - Malicious input? (SQL injection, XSS, etc.)

2. **Add validation as explicit task step:**
   ```
   Task: Implement PATCH /api/users/[userId]/config/prompts

   Step 1: Add validation
     - Text length: max 50k chars
     - Drive file ID: alphanumeric + dash/underscore only

   Step 2: Implement feature logic
     - Fetch Drive file if provided
     - Update MongoDB
   ```

3. **Validate at the boundary:** API routes are the system boundary - validate there, not in services

**Red flag:** If you write `body.fieldName` without first checking length/format/type, you're missing validation.

## When to Apply

- **API routes** accepting user input (POST, PATCH, PUT)
- **Form handlers** processing user submissions
- **File uploads** (size, type, content validation)
- **Configuration endpoints** (limits, format constraints)

## Related Patterns

- **Fail fast:** Validate input at API boundary before spending resources
- **DDD validation strategy:** Input validation (API) vs business validation (domain)
- **Security:** Always validate, never trust client-side validation alone

## Example from Session

**Missing validation caught in review:**
- Implemented feature: User context prompts (text + Drive file)
- Code review: Opus flagged missing length/format validation
- Fix commit: Added validation (50k text limit, alphanumeric file ID)
- Learning: Should have been in initial implementation, not a fix

**Cost:** Extra commit, review round, potential production issue if not caught.
