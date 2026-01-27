---
date: 2026-01-27
tags: [refactoring, code-hygiene, technical-debt]
workflow: [refactoring]
---

# Remove Dead Code in Same Commit as Refactoring

## Problem

Refactored `buildPrompts()` to use inline logic instead of helper functions `getCalendarInstructions()` and `getPrepGenerationPrompt()`. But left these functions exported.

Result:
- Functions exported but never called anywhere
- Required separate cleanup commits to remove
- Cluttered API surface

**Root cause:** Didn't immediately verify function usage after refactoring made them obsolete.

## Solution

**After refactoring, immediately check for dead code:**

```bash
# Search for all calls to the function
grep -rn "functionName(" packages/ --include="*.js" \
  | grep -v "function functionName" \
  | grep -v "module.exports"

# If output is empty → function is never called → remove it
```

**Remove in the SAME commit as the refactoring:**
```bash
# Commit message
refactor: inline prompt composition logic

- buildPrompts() now composes prompts inline
- Removed getCalendarInstructions() (no longer used)
- Removed getPrepGenerationPrompt() (no longer used)
```

## Pattern

### Step 1: Identify Potentially Dead Code

**After these changes, check for orphans:**
- Extracting inline logic → old helper function unused
- Changing data structure → old accessor methods unused
- Replacing library → old wrapper functions unused
- Consolidating APIs → old endpoints unused

### Step 2: Verify Function is Dead

```bash
# Check for function calls (not just definition/export)
grep -rn "functionName(" . \
  | grep -v "function functionName" \
  | grep -v "export.*functionName" \
  | grep -v ".aws-sam" \
  | grep -v ".next"

# If no results → safe to remove
```

### Step 3: Remove in Same Commit

```bash
# Remove function definition
# Remove from exports
git add .
git commit -m "refactor: [main change] + removed unused [functionName]"
```

**Don't create separate "cleanup" commit** - that's a sign you should have checked earlier.

### Step 4: Update Exports

```javascript
// Before
module.exports = {
  functionA,
  functionB,  // ← removed
  functionC,
};

// After
module.exports = {
  functionA,
  functionC,
};
```

## When to Apply

**Refactoring triggers that often create dead code:**
- Inlining helper functions
- Replacing abstraction layers
- Consolidating duplicate logic
- Changing data access patterns
- Upgrading libraries (old wrappers)

**Red flags:**
- Function is exported but `grep` finds no callers
- Function exists only for "convenience" but nothing uses it
- Comment says "legacy" or "deprecated"
- Test coverage shows function never executed

## Prevention Checklist

After refactoring:

- [ ] Grep for all calls to functions you changed
- [ ] Check if any became orphans (exported but never called)
- [ ] Remove dead functions in same commit
- [ ] Update module.exports
- [ ] Run tests to ensure nothing broke
- [ ] Commit with clear message about removal

**Don't skip this** - dead code accumulates technical debt.

## Example from Session

**Refactoring:** Changed `buildPrompts()` to compose inline instead of calling `getCalendarInstructions()`

**Dead code:** `getCalendarInstructions()` exported but never called

**What happened:** Left in codebase, removed in separate commit later

**What should have happened:**
```bash
# Immediately after refactoring
grep -rn "getCalendarInstructions(" packages/ | grep -v "function\|export"
# Result: empty → function is dead

# Remove in same commit
git commit -m "refactor: inline calendar instructions composition

buildPrompts() now appends output schema inline.
Removed getCalendarInstructions() (no longer used)."
```

**Cost:** Extra commit, potential confusion about API surface, missed opportunity for clean refactoring.

## Related Patterns

- **Code hygiene:** Keep API surface minimal
- **Boy Scout Rule:** Leave code cleaner than you found it
- **Refactoring:** Always includes cleanup, not just restructuring
- **Technical debt:** Unused code is debt that accrues interest

## Common Mistakes

❌ **"I'll clean it up later"** → Never happens, accumulates debt

❌ **"Someone might use it"** → If no one uses it now, remove it. Git history preserves it if needed.

❌ **"It's just one function"** → Death by a thousand cuts. Many "just one" functions = cluttered codebase.

✅ **"Refactor = change + cleanup"** → Both in one commit

## Success Criteria

After refactoring:
- ✅ Grep for old function names returns zero callers
- ✅ Module exports only actively-used functions
- ✅ No comments saying "deprecated" or "legacy"
- ✅ Tests verify all exported functions are covered
- ✅ API surface is minimal (principle of least exposure)
