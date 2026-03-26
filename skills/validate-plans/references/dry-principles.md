# DRY Principles - Detailed Guidelines

## Table of Contents

- [What is DRY?](#what-is-dry)
- [DRY Violation Types](#dry-violation-types)
- [Codebase Scanning Checklist](#codebase-scanning-checklist)
- [Common Reuse Opportunities](#common-reuse-opportunities)
- [Plan Validation Questions](#plan-validation-questions)
- [Red Flags in Plans](#red-flags-in-plans)
- [Resolution Strategies](#resolution-strategies)
- [Examples](#examples)

## What is DRY?

**Don't Repeat Yourself (DRY)** is a principle stating that every piece of knowledge must have a single, unambiguous, authoritative representation within a system.

## DRY Violation Types

### 1. Code Duplication

**Symptoms:**
- Copy-pasted code blocks
- Similar functions with minor variations
- Same logic in multiple places

**Detection:**
```python
# ❌ DRY Violation: Same validation in multiple places
def validate_user_email(email):
    if not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email):
        raise ValueError("Invalid email")

def validate_admin_email(email):
    if not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email):
        raise ValueError("Invalid email")
```

```python
# ✅ DRY: Single source of truth
EMAIL_REGEX = r'^[\w\.-]+@[\w\.-]+\.\w+$'

def validate_email(email):
    if not re.match(EMAIL_REGEX, email):
        raise ValueError("Invalid email")
```

### 2. Knowledge Duplication

**Symptoms:**
- Business rules defined in multiple locations
- Same validation logic in frontend and backend
- Configuration scattered across files

**Detection:**
- Search for magic numbers/strings
- Check for parallel validation logic
- Look for configuration duplication

### 3. Structural Duplication

**Symptoms:**
- Similar component structures
- Repeated patterns without abstraction
- Boilerplate without templates/generics

## Codebase Scanning Checklist

When validating a plan, scan the codebase for:

### Utilities & Helpers
- [ ] Existing validation functions
- [ ] Date/time formatting utilities
- [ ] String manipulation helpers
- [ ] Number/currency formatters
- [ ] API request wrappers
- [ ] Error handling patterns

### Components & UI
- [ ] Input components
- [ ] Button variants
- [ ] Modal/dialog patterns
- [ ] Form wrappers
- [ ] List/table components
- [ ] Card/container patterns

### Business Logic
- [ ] Authentication/authorization
- [ ] Permission checks
- [ ] Data transformations
- [ ] Business rule validators
- [ ] State management patterns

### Infrastructure
- [ ] Database queries
- [ ] Cache implementations
- [ ] Logging patterns
- [ ] Configuration loading

## Common Reuse Opportunities

### 1. Form Validation

```typescript
// Check for existing validation schemas
// - Zod schemas
// - Yup validations
// - Joi validations
// - Class-validator decorators
```

### 2. API Clients

```typescript
// Check for:
// - Axios instances
// - Fetch wrappers
// - GraphQL clients
// - gRPC clients
```

### 3. UI Components

```typescript
// Check for component libraries:
// - shadcn/ui
// - Material-UI
// - Ant Design
// - Custom design system
```

### 4. Hooks & Composables

```typescript
// Check for:
// - useFetch / useApi
// - useForm
// - useAuth
// - useLocalStorage
// - useDebounce
```

## Plan Validation Questions

For each proposed task in a plan, ask:

1. **Does functionality already exist?**
   ```bash
   grep -r "function_name" src/
   find . -name "*similar*" -type f
   ```

2. **Can we use existing utilities?**
   ```bash
   ls src/utils/ src/lib/ src/helpers/
   ls src/common/ src/shared/
   ```

3. **Are there similar patterns?**
   ```bash
   git log --oneline --all -- "*similar-feature*"
   grep -r "similar_pattern" src/ --include="*.ts"
   ```

4. **Is this the right place?**
   - Check project structure conventions
   - Verify file organization patterns
   - Confirm naming conventions

## Red Flags in Plans

### High Priority
- Creating new utilities without checking existing ones
- Implementing validation logic from scratch
- Creating new API clients
- Writing auth logic when auth system exists

### Medium Priority
- Not using shared types/interfaces
- Creating similar components without extending existing ones
- Duplicating configuration patterns
- Not leveraging existing hooks

### Low Priority
- Not using shared constants
- Missing opportunity for shared styling
- Not utilizing existing error handling

## Resolution Strategies

### When DRY Violation Found

1. **Identify the existing implementation**
   - File location
   - Function/component name
   - How to import/use it

2. **Determine the right approach**
   - Use existing implementation directly
   - Extend existing implementation
   - Refactor to share common logic
   - Keep separate (if legitimately different)

3. **Update the plan**
   - Replace with reuse instructions
   - Add reference to existing code
   - Update file paths

## Examples

### Example 1: Form Validation

**Plan says:**
```markdown
Create email validation logic in LoginForm
```

**DRY Check:**
```bash
$ grep -r "validateEmail\|email.*validation" src/
src/utils/validation.ts: export const validateEmail = (email: string) => ...
```

**Recommendation:**
```markdown
Use existing validation from `src/utils/validation.ts`:
```typescript
import { validateEmail } from '@/utils/validation';
```
```

### Example 2: API Client

**Plan says:**
```markdown
Create fetch wrapper for API calls
```

**DRY Check:**
```bash
$ ls src/lib/
api.ts  axios.ts  client.ts
```

**Recommendation:**
```markdown
Use existing API client from `src/lib/api.ts`:
```typescript
import { apiClient } from '@/lib/api';
```
```
