# Codex Code Review Example

This example shows a complete code review workflow using Codex delegation.

## Scenario

You've just implemented Task 3 from a plan: "Add user authentication system"

## Workflow

### Step 1: Complete Implementation

```markdown
[Implementation complete]

Files changed:
- src/auth/AuthService.ts
- src/auth/AuthController.ts
- tests/auth/AuthService.test.ts

Tests: 12/12 passing
Commit: abc123def (HEAD)
Previous commit: 789xyz456 (before task)
```

### Step 2: Request Code Review

```markdown
You: "I'm using requesting-code-review to validate this implementation"

System checks config:
- codex_enabled: true ✓
- code_review.delegate_to_codex: true ✓

System: "Using Codex delegation for code review"
```

### Step 3: Codex Delegation

**codex-delegator skill activates:**

1. **Load template** from config:

```
Review the following code changes:

Base SHA: {BASE_SHA}
Head SHA: {HEAD_SHA}

What was implemented:
{WHAT_WAS_IMPLEMENTED}

Plan/Requirements:
{PLAN_OR_REQUIREMENTS}

Provide:
1. Strengths (what was done well)
2. Issues (Critical/Important/Minor with specific examples)
3. Assessment (ready to proceed / needs fixes)
4. Reasoning for each issue identified
```

2. **Fill template:**

```
Review the following code changes:

Base SHA: 789xyz456
Head SHA: abc123def

What was implemented:
User authentication system with JWT tokens, password hashing with bcrypt,
session management, and logout functionality. Includes 12 comprehensive tests.

Plan/Requirements:
Task 3 from docs/plans/2025-11-15-auth-system.md:
- Implement JWT-based authentication
- Hash passwords with bcrypt
- Session management
- Login/logout endpoints
- Full test coverage

Provide:
[... validation requirements ...]
```

3. **Call Codex:**

```
mcp__codex__spawn_agent({
  "prompt": [filled template]
})
```

### Step 4: Codex Response

```
STRENGTHS:
- Proper use of bcrypt for password hashing with appropriate work factor (12 rounds)
- JWT tokens include expiration and proper payload structure
- Comprehensive test coverage (12 tests covering happy paths and error cases)
- Error handling includes specific error messages for debugging
- Session management properly handles concurrent sessions

ISSUES:

CRITICAL:
- AuthService.ts:45 - JWT secret is hardcoded as "my-secret-key"
  Reasoning: Hardcoded secrets are a critical security vulnerability.
  Secret should be loaded from environment variables and never committed to code.

IMPORTANT:
- AuthService.ts:78 - No rate limiting on login attempts
  Reasoning: Without rate limiting, the system is vulnerable to brute force attacks.
  Should implement exponential backoff or account lockout after N failed attempts.

- AuthController.ts:23 - Password validation only checks length > 8
  Reasoning: Weak password requirements increase vulnerability to dictionary attacks.
  Should require mix of characters, numbers, special characters per OWASP guidelines.

MINOR:
- AuthService.test.ts:67 - Magic number "3600" for token expiration in tests
  Reasoning: Should use constant TOKEN_EXPIRY_SECONDS for clarity and maintainability.

- AuthController.ts:56 - Console.log for debugging left in production code
  Reasoning: Debug logs should be removed or use proper logging framework.

ASSESSMENT:
Needs fixes - Critical security issue with hardcoded secret must be addressed before proceeding.
Important issues should be fixed before merge.

REASONING:
The implementation is architecturally sound with good test coverage, but contains a critical
security vulnerability (hardcoded JWT secret) that must be fixed immediately. The important
issues (rate limiting, password strength) are standard security measures that should be
implemented before this code reaches production. Minor issues are stylistic and can be
addressed during refactoring.
```

### Step 5: Validation

**codex-response-validator.sh executes:**

```bash
Checking STRENGTHS section: ✓ Present
Checking ISSUES section: ✓ Present
Checking ASSESSMENT section: ✓ Present
Checking REASONING section: ✓ Present (required by config)
Checking concrete findings: ✓ All issues have file:line references

Validation: PASSED
```

### Step 6: Claude Integration

**Claude receives validated response and structures it:**

```markdown
Code review complete. Codex identified:

CRITICAL Issues (must fix):
1. Hardcoded JWT secret (AuthService.ts:45)
   → Move to environment variable

IMPORTANT Issues (should fix before merge):
2. No rate limiting on login attempts (AuthService.ts:78)
   → Add exponential backoff or lockout
3. Weak password validation (AuthController.ts:23)
   → Implement OWASP-compliant password requirements

MINOR Issues (can address later):
4. Magic number in tests (AuthService.test.ts:67)
5. Debug console.log (AuthController.ts:56)

Assessment: NEEDS FIXES (Critical issue blocks proceeding)
```

### Step 7: Fix Issues

**Claude dispatches fix subagent:**

```markdown
You: "I'm dispatching a subagent to fix the Critical and Important issues"

[Task tool - general-purpose agent]
Prompt: |
  Fix the following issues identified in code review:

  CRITICAL:
  1. Move hardcoded JWT secret to environment variable (AuthService.ts:45)

  IMPORTANT:
  2. Add rate limiting for login attempts (AuthService.ts:78)
  3. Strengthen password validation requirements (AuthController.ts:23)

  Leave Minor issues for later. Follow TDD: update tests first, then fix.

[Subagent executes fixes]
```

### Step 8: Verify Fixes

```markdown
[Subagent completes fixes]

Files changed:
- src/auth/AuthService.ts (JWT secret from env, rate limiting added)
- src/auth/AuthController.ts (password validation improved)
- src/config/env.ts (new env var handling)
- tests/auth/AuthService.test.ts (tests updated for new behavior)

Tests: 15/15 passing (3 new tests for rate limiting)
Commit: updated789

You: "Fixes applied. Moving to next task."
```

### Step 9: Final Verification

**Optional: Request another review of fixes**

```markdown
You: "Let me verify the fixes with another review"

[codex-delegator runs again on updated code]

Codex: "STRENGTHS: All critical issues resolved. JWT secret now from env.
ASSESSMENT: Ready to proceed"
```

## Key Takeaways

1. **Transparent**: Workflow identical to traditional Claude review
2. **Validated**: All Codex findings checked before presentation
3. **Actionable**: Issues have specific file:line references and reasoning
4. **Integrated**: Feedback flows into standard superpowers workflow
5. **Safe**: Critical issues block proceeding, maintaining quality gates
