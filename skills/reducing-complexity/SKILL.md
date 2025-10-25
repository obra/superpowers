---
name: reducing-complexity
description: Use when refactoring functions with high cyclomatic complexity (>10), before making changes - systematic approach to reduce complexity while maintaining functionality, with zero tolerance for missed functions and strict type safety
---

# Reducing Cyclomatic Complexity

## Overview

Transform complex functions into clean, maintainable code with cyclomatic complexity ≤ 10.

**Core principle:** Exhaustive investigation + Type-safe refactoring + Zero missed functions.

**Announce at start:** "I'm using the reducing-complexity skill to refactor high-complexity functions."

## CRITICAL REQUIREMENT

**ZERO TOLERANCE FOR MISSED FUNCTIONS:** You MUST find and address EVERY function in the file. Missing even one function = complete failure, start over.

## Finding Complex Files

### Global Complexity Scan

```bash
# Find ALL files with complexity issues
pnpm lint 2>&1 | grep "complexity of [3-9][0-9]\|complexity of [1-9][0-9][0-9]" | cut -d: -f1 | sort -u

# Count total files with high complexity
pnpm lint 2>&1 | grep "complexity of [3-9][0-9]\|complexity of [1-9][0-9][0-9]" | cut -d: -f1 | sort -u | wc -l

# Get specific complexity scores for a file
pnpm lint [filepath] 2>&1 | grep "complexity"
```

### Priority Order

1. **CRITICAL**: complexity > 50
2. **HIGH**: complexity 40-50
3. **MEDIUM**: complexity 30-40
4. **Focus**: Frequently modified files (check git history)
5. **Check**: Related files and dependencies

## The Process

### Phase 1: Type System Understanding (MUST DO FIRST)

Before touching ANY code:

1. **Read all type definition files**:
   - `*.d.ts` files
   - `types/*.ts` files
   - Interface definitions

2. **Understand the types**:
   - Interfaces, types, and enums
   - Union types and generics
   - Type guards and constraints
   - Input/output types

3. **Map type requirements**:
   - Expected parameters
   - Return types
   - Type validation needs

**Why:** Prevents creating type errors during refactoring.

### Phase 2: Create Reference Copy

At the TOP of the file, add:

```typescript
/*
 * ORIGINAL COMPLEXITY METRICS:
 * - functionA: complexity 45
 * - functionB: complexity 32
 * - functionC: complexity 28
 * Total functions with complexity > 10: 3
 * Refactoring target: All functions below 10
 */

/*
 * REFACTORING CHECKLIST:
 * [ ] functionA: 45 -> target <10
 * [ ] functionB: 32 -> target <10
 * [ ] functionC: 28 -> target <10
 * VERIFICATION: All functions checked ✓
 */
```

### Phase 3: Triple-Check Investigation

**FIRST PASS**: Run `pnpm lint` - identify ALL high-complexity functions

**SECOND PASS**: Manually scan ENTIRE file top to bottom

**THIRD PASS**: Cross-reference findings with lint report

**If ANY discrepancy found**: Start over.

### Phase 4: Deep Analysis

For each function:

1. **Map logic flow**:
   - All conditional branches
   - All loops
   - All decision points

2. **Identify elements**:
   - Dependencies
   - Side effects
   - Return patterns
   - Related files/functions

3. **Document**:
   - Function purpose
   - Expected behavior
   - Edge cases

### Phase 5: Complexity Assessment

For each function:

1. Calculate current complexity
2. Identify complexity drivers:
   - Nested conditions
   - Multiple branches
   - Switch statements
   - Loop complexity
3. Find duplicate logic
4. Spot simplification opportunities

### Phase 6: Refactoring Strategy

Apply these techniques:

**Guard Clauses**:
```typescript
// Before (nested)
if (condition) {
  if (anotherCondition) {
    // logic
  }
}

// After (early return)
if (!condition) return;
if (!anotherCondition) return;
// logic
```

**Method Extraction**:
```typescript
// Before (complex function)
function process(data) {
  // 50 lines of validation
  // 50 lines of transformation
  // 50 lines of storage
}

// After (extracted)
function process(data) {
  const validated = validateData(data);
  const transformed = transformData(validated);
  return storeData(transformed);
}
```

**Parameter Objects**:
```typescript
// Before
function create(name, email, age, address, phone) { }

// After
function create(user: UserInput) { }
```

**Decompose Conditionals**:
```typescript
// Before
if (user.age > 18 && user.verified && user.country === 'US') { }

// After
if (isEligibleUser(user)) { }

function isEligibleUser(user: User): boolean {
  return user.age > 18 && user.verified && user.country === 'US';
}
```

**Replace Switch with Map**:
```typescript
// Before
switch(type) {
  case 'A': return handlerA();
  case 'B': return handlerB();
  // ... 20 more cases
}

// After
const handlers = {
  'A': handlerA,
  'B': handlerB,
  // ...
};
return handlers[type]?.() ?? defaultHandler();
```

### Phase 7: Implementation

**Guidelines**:
- Preserve ALL original functionality
- Maintain or improve type safety (NO `any` types)
- Follow project naming conventions
- Add JSDoc comments for new functions
- Keep related functions grouped
- Each function has ONE clear responsibility

**Preservation** (for complexity > 30):
```typescript
/*
 * ORIGINAL FUNCTION (complexity 45):
 * [paste original here for reference]
 */
```

### Phase 8: Quality Assurance

Verify:
- ✓ Identical results to original
- ✓ All error handling preserved/improved
- ✓ No performance degradation
- ✓ Cyclomatic complexity ≤ 10 for each function
- ✓ Improved readability

## Testing Protocol

### CRITICAL: Type Safety First

```bash
# ALWAYS check types BEFORE proceeding
pnpm typecheck

# Fix type errors immediately:
# 1. Read relevant type definition files
# 2. Understand expected types/interfaces
# 3. Fix without changing functionality
# 4. NEVER use 'any' or '@ts-ignore'
```

### Immediate Validation

```bash
# Verify complexity reduced
pnpm lint [filepath] 2>&1 | grep "complexity"

# Re-check types (catch regressions)
pnpm typecheck

# Run tests if they exist
pnpm test [testfile]
```

### Manual Testing Checklist

- [ ] All code paths work
- [ ] Error handling unchanged
- [ ] Performance not degraded
- [ ] No runtime errors
- [ ] Documentation updated

## Common High-Complexity Patterns

### API Route Handlers (30-60 complexity)

**Split into**:
- Validation functions
- Authorization checks
- Business logic services
- Database operations
- Error handling utilities

### Form Components (25+ complexity)

**Extract**:
- Field validators
- Field configuration objects
- Rendering logic from state
- Event handlers

### Deeply Nested Conditionals

**Apply**:
- Invert conditions + early returns
- Extract to named boolean functions
- Optional chaining (`?.`)
- Nullish coalescing (`??`)

### Long Functions (200+ lines)

**Break down**:
- Identify logical sections
- Create function pipeline
- Separate data prep from processing

## STRICT ENFORCEMENT RULES

**NON-NEGOTIABLE - MUST FOLLOW:**

### ❌ ABSOLUTELY FORBIDDEN

**NO type shortcuts**:
- ❌ NO `as any` type assertions
- ❌ NO `any` types
- ❌ NO `unknown` then cast workaround
- ✓ USE proper types, interfaces, unions

**NO nulls**:
- ❌ NO `null` values
- ✓ USE `undefined` instead
- ✓ HANDLE nulls, convert to `undefined`

**NO suppressions**:
- ❌ NO `// eslint-disable-next-line`
- ❌ NO `/* eslint-disable */`
- ❌ NO `// @ts-ignore`
- ❌ NO `// @ts-expect-error`
- ❌ NO `// @ts-nocheck`
- ✓ FIX the actual issue

**NO lazy fixes**:
- ❌ NO `!` (non-null assertion) without checks
- ❌ NO empty catch blocks
- ❌ NO files added to `.eslintignore`
- ❌ NO modifying configs to be less strict

**NO hacks**:
- ❌ NO temporary workarounds
- ❌ NO bulk edits or scripts
- ✓ ONLY permanent, best-practice solutions
- ✓ ALL fixes applied manually, one by one

**NO database changes**:
- ❌ NO schema changes
- ❌ NO migrations
- ❌ NO Prisma file modifications
- ✓ ONLY TypeScript/linting fixes

## Final Verification Protocol

After refactoring:

```bash
# Run lint on refactored file
pnpm lint [filepath]

# Compare against ORIGINAL COMPLEXITY METRICS
# Ensure EVERY function addressed
```

**Create final report**:
```
REFACTORING COMPLETE:
- Functions refactored: X
- Original max complexity: XX
- New max complexity: XX
- All functions verified: YES
- Missed functions: NONE
- Type errors: 0
- Lint errors: 0
```

**FAILURE CONDITIONS**:
- Missing even ONE function = FAILED, redo
- ANY type errors = FAILED, fix first
- ANY `as any` or `@ts-ignore` = FAILED, remove

## Output Format

When refactoring, provide:

1. **ORIGINAL COMPLEXITY METRICS** comment block
2. **ALL functions** listed with complexity scores
3. **Analysis** of each function's complexity
4. **Strategy** outline with specific techniques
5. **Refactored code** with clear separation
6. **Summary** of improvements and reduction
7. **Verification** report confirming all functions addressed

## Related Skills

**REQUIRED SUB-SKILL:** Use bestpractice:test-driven-development when tests exist - write tests for complex functions before refactoring to ensure behavior preservation.

**Complementary skills:**
- verification-before-completion - Verify refactoring maintains behavior
- systematic-debugging - If refactoring introduces bugs
