# Gap Analysis Guide

## Table of Contents

- [Overview](#overview)
- [Analysis Framework](#analysis-framework)
- [Codebase Intelligence](#codebase-intelligence)
- [Gap Categories](#gap-categories)
- [Analysis Process](#analysis-process)
- [Common Gaps by Category](#common-gaps-by-category)
- [Report Template](#report-template)
- [Integration with Other Validations](#integration-with-other-validations)

## Overview

Gap analysis identifies missing requirements, potential disasters, and opportunities to prevent implementation failures before they happen.

## Analysis Framework

### 1. Technical Specification Gaps

#### Missing File Paths
**What to check:**
- Are all file paths exact and specific?
- Do paths follow project conventions?
- Are line numbers provided for modifications?

**Examples:**
```markdown
❌ "Create component file"
✅ "Create: `src/components/UserProfile.tsx`"

❌ "Update the service"
✅ "Modify: `src/services/user.ts:45-67`"
```

#### Vague Acceptance Criteria
**What to check:**
- Can success be objectively verified?
- Are edge cases defined?
- Are error conditions specified?

**Examples:**
```markdown
❌ "Implement user authentication"
✅ "User can log in with email/password. On success: redirect to /dashboard. On failure: show specific error message."
```

#### Missing Implementation Details
**What to check:**
- Are algorithms specified?
- Are data structures defined?
- Are validation rules clear?

### 2. Architecture Gaps

#### Project Structure Violations
**Questions to ask:**
- Does the plan follow existing directory structure?
- Are files in the right location?
- Does it match established patterns?

**Check:**
```bash
# Common patterns to verify
src/components/     # UI components
src/services/       # Business logic
src/utils/          # Utilities
src/hooks/          # React hooks
src/lib/            # Shared libraries
tests/              # Test files
```

#### Integration Gaps
**What to check:**
- How does this connect to existing systems?
- Are API contracts defined?
- Are database changes specified?
- Are environment variables documented?

#### Security Gaps
**What to check:**
- Authentication requirements
- Authorization rules
- Input validation
- Output sanitization
- Secrets management

### 3. Disaster Prevention

#### Breaking Changes
**What to detect:**
- API contract changes
- Database schema modifications
- Configuration changes
- Dependency updates

**Questions:**
- Will this break existing functionality?
- Is there a migration strategy?
- Are backward compatibility concerns addressed?

#### Performance Disasters
**What to check:**
- N+1 query patterns
- Unbounded data loading
- Missing pagination
- Inefficient algorithms
- Memory leaks

#### Error Handling Gaps
**What to check:**
- Are failure modes identified?
- Is there error recovery?
- Are retry strategies defined?
- Is there graceful degradation?

## Codebase Intelligence

### Previous Story Intelligence

When story_num > 1, extract:
- **Dev notes and learnings**
- **Review feedback**
- **Files created/modified**
- **Testing approaches**
- **Problems encountered**

### Git History Analysis

Look for patterns:
```bash
# Recent changes in related areas
git log --oneline --all -- "src/feature/"

# Files frequently modified together
git log --name-only --oneline | grep -A5 "feature"

# Code conventions from existing files
head -50 src/existing-similar-file.ts
```

### Existing Pattern Discovery

**Search for:**
1. Similar implementations
2. Shared utilities
3. Common patterns
4. Established conventions

## Gap Categories

### Critical (Must Fix)

**Definition:** Issues that will cause implementation failure or significant problems.

**Examples:**
- Missing critical requirements
- Wrong technical approach
- Breaking changes not addressed
- Security vulnerabilities
- Missing error handling

### Warning (Should Fix)

**Definition:** Issues that could cause problems or reduce quality.

**Examples:**
- Incomplete acceptance criteria
- Missing edge cases
- Vague implementation details
- Missing tests for error conditions

### Info (Nice to Have)

**Definition:** Suggestions for improvement.

**Examples:**
- Performance optimization hints
- Better naming suggestions
- Additional documentation
- Alternative approaches

## Analysis Process

### Step 1: Load All Context

1. **Load the plan file**
2. **Load related epics/requirements**
3. **Load architecture documentation**
4. **Scan codebase for patterns**

### Step 2: Systematic Review

For each task in the plan:
1. Check for exact file paths
2. Verify test-first approach
3. Validate acceptance criteria
4. Check for DRY violations
5. Check for YAGNI violations
6. Identify missing requirements

### Step 3: Cross-Reference

1. **Against requirements:** Is everything covered?
2. **Against architecture:** Does it fit?
3. **Against patterns:** Is it consistent?
4. **Against previous work:** Are learnings applied?

### Step 4: Generate Findings

Document each finding with:
- **Location:** Where in the plan
- **Issue:** What's missing or wrong
- **Impact:** Critical/Warning/Info
- **Recommendation:** How to fix it

## Common Gaps by Category

### Frontend Implementation

**Often Missing:**
- Loading states
- Error boundaries
- Empty states
- Responsive considerations
- Accessibility requirements
- Analytics/tracking

**Check for:**
- Form validation feedback
- API error handling
- State management approach
- Component composition

### Backend Implementation

**Often Missing:**
- Input validation
- Error response format
- Rate limiting
- Logging strategy
- Transaction boundaries
- Database indexing

**Check for:**
- Authentication/authorization
- API versioning
- Pagination
- Caching strategy

### Database Changes

**Often Missing:**
- Migration scripts
- Rollback strategy
- Index considerations
- Data migration
- Constraint definitions

**Check for:**
- Schema documentation
- Relationship definitions
- Cascade rules
- Audit trail

### Testing

**Often Missing:**
- Edge case tests
- Error condition tests
- Integration tests
- Performance tests
- Accessibility tests

**Check for:**
- Test data setup
- Mock strategy
- Coverage requirements
- CI/CD integration

## Report Template

```markdown
## Gap Analysis: [Feature Name]

### Critical Gaps
1. **[Location]:** [Issue]
   - **Impact:** [Why this matters]
   - **Fix:** [Specific recommendation]

### Warning Gaps
1. **[Location]:** [Issue]
   - **Impact:** [Why this matters]
   - **Fix:** [Specific recommendation]

### Info Gaps
1. **[Location]:** [Issue]
   - **Suggestion:** [Improvement idea]

### Codebase Context
- **Reusable components:** [List]
- **Established patterns:** [List]
- **Previous learnings:** [List]
```

## Integration with Other Validations

### DRY + Gap Analysis
- Check for missing reuse opportunities
- Identify where existing patterns should be applied

### YAGNI + Gap Analysis
- Detect missing scope boundaries
- Identify premature abstractions

### TDD + Gap Analysis
- Find missing test cases
- Identify untested error conditions
- Check for missing test infrastructure
