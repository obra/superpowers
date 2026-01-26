---
date: 2026-01-26
tags: [validation, clean-architecture, state-consistency, infrastructure-constraints]
workflow: [code-review, architectural-refactoring]
---

# Infrastructure Constraints Must Be Validated Before Persistence If Failure Would Corrupt Primary Data Store

## Problem

During a validation architecture cleanup session, we removed validation duplication across layers. The initial plan was to move the "active hours interval compatibility" constraint (`intervals > 60 minutes cannot use cron expressions`) from the API layer to the Lambda layer, following the principle that "business rules belong in the domain layer."

This created a critical state consistency vulnerability:

```
Request → API (no validation) → MongoDB UPDATE ✅ → Lambda REJECTS ❌
Result: Invalid config stored in MongoDB, EventBridge schedule never created
```

**The flow would be:**
1. User submits invalid config (120-minute interval + active hours enabled)
2. API passes input validation (format checks)
3. MongoDB accepts and persists the configuration
4. Lambda attempts to create EventBridge schedule
5. Lambda throws: `'Active hours not supported for intervals > 60 minutes'`
6. MongoDB still contains invalid state
7. Every subsequent sync attempt fails silently

**The mistake:** Categorizing all "infrastructure constraints" as belonging in the infrastructure layer, without considering what happens to persistent state if validation fails downstream.

## Solution

**Keep infrastructure constraints at the API layer when they prevent invalid state in the primary data store.**

The constraint was restored to the API route:

```typescript
// route.ts (API layer)
function validateActiveHoursInterval(schedule: {
  intervalMinutes?: number;
  activeHours?: { enabled?: boolean };
}): ValidationResult {
  const errors: string[] = [];

  // IMPORTANT: Must validate BEFORE MongoDB update to prevent inconsistent state
  if (schedule.activeHours?.enabled && schedule.intervalMinutes > 60) {
    errors.push(
      'Active hours are not supported for intervals > 60 minutes. ' +
      'Please use 5, 15, 30, or 60 minute intervals.'
    );
  }

  return buildValidationResult(errors);
}

// In PUT handler, BEFORE MongoDB update:
const intervalValidation = validateActiveHoursInterval({ intervalMinutes, activeHours });
if (!intervalValidation.valid) {
  return NextResponse.json(
    { error: intervalValidation.errors?.[0] },
    { status: 400 }
  );
}

// Only after validation passes:
await updateUserConfig(userId, updates);
```

**What caught the mistake:** A test assertion explicitly documented the timing requirement:

```typescript
test('returns 400 for active hours with interval > 60min BEFORE MongoDB update', async () => {
  // ...
  // CRITICAL: Verify MongoDB was never updated
  expect(updateUserConfig).not.toHaveBeenCalled();
});
```

## Key Principle

**"Validate at the latest safe point, where 'safe' means no invalid state can persist."**

Where validation lives depends on **consistency requirements**, not **constraint origin**.

### Refined Validation Taxonomy

| Validation Type | Layer | Timing | Example |
|----------------|-------|--------|---------|
| **Input Validation** | API | Immediately | Email format, required fields, type checks |
| **Infrastructure Constraints** | API (before persistence) | Before primary data store write | "intervals >60 can't use cron" (AWS limitation) |
| **Business Rules** | Service/Domain | Before domain operations | "Can't delete own account", uniqueness checks |
| **Client Validation** | NEVER (for internal data) | N/A | ❌ Re-validating already-validated data |

### The Critical Distinction

An **infrastructure constraint** (like AWS EventBridge limitations) may need to live in the **API layer** if:
- Its failure would corrupt the primary data store
- Downstream systems cannot self-heal
- Invalid state would persist indefinitely

This is **different** from a business rule, but has the **same placement requirement** due to consistency needs.

## Prevention

### Before Moving Validation

1. **Draw the complete data flow** including ALL persistence points
2. **Identify "point of no return"** (primary data store write)
3. **Ask:** "If validation fails AFTER this point, what state is left behind?"
   - Clean state → Current location acceptable
   - Corrupted state → Validate earlier
4. **Read existing tests** for timing expectations (look for "BEFORE" in test names)

### Code Review Checklist

- [ ] Does this validation move leave any invalid state in persistence?
- [ ] Are downstream systems best-effort or critical path?
- [ ] Is the primary data store the source of truth?
- [ ] What happens to user experience if validation fails at the new location?
- [ ] Are there tests encoding timing requirements?

### Understanding "Trust Internal Data"

**Correct interpretation:**
- API validates → Service trusts it → Client trusts it
- No re-validation of already-validated data flowing through the system

**Incorrect interpretation:**
- ❌ "Skip validation and let downstream catch it"
- ❌ "Move all validation to domain layer for architectural purity"
- ❌ "Persist first, validate later"

**The boundary:**
"Trust Internal Data" means don't re-validate. It does NOT mean skip validation and risk persisting bad state.

### Risk if Missed

- **Silent data corruption** - Invalid configurations saved that will never work
- **Repeated failures** - Every operation attempt fails at runtime
- **User confusion** - UI shows success but nothing happens
- **Poor observability** - Errors only visible in infrastructure logs
- **Manual cleanup required** - Database fixes needed to restore consistency

## Related Concepts

- Clean Architecture validation layering
- State consistency in distributed systems
- Best-effort vs critical-path operations
- Source of truth in system design
- Infrastructure constraints vs business rules

## Tags

#validation #clean-architecture #state-consistency #infrastructure-constraints #architectural-patterns
