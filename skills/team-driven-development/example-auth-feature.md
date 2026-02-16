# Example: Authentication Feature with Agent Teams

This is a complete walkthrough of using team-driven-development to implement an authentication feature with 8 tasks, 4 agents, and inter-agent coordination.

## Project Context

**Goal:** Add user authentication to an existing web application

**Requirements:**
- JWT-based token authentication
- Login/logout endpoints
- Token refresh mechanism
- Login UI component
- Secure password handling
- Session management

**Team Size:** 4 agents
- 1 Lead (orchestrator)
- 2 Implementers (backend + frontend)
- 1 Reviewer (security focus)

**Estimated Cost:** ~$180 (vs ~$70 for subagents)
**Why Teams Justified:** Security critical, backend/frontend coordination needed, adversarial review valuable

## Step 1: Prerequisites

### Enable Agent Teams

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
claude --version  # Verify Opus 4.6+
```

### Set Up Git Worktree

```bash
# Using superpowers:using-git-worktrees
git worktree add ../auth-feature -b feature/authentication
cd ../auth-feature
```

### Review Implementation Plan

Plan already exists at `docs/plans/authentication-feature.md` with 8 tasks:
1. Password hashing utilities
2. JWT token generation
3. Login API endpoint
4. Logout API endpoint
5. Token refresh endpoint
6. Session middleware
7. Login UI component
8. Logout UI button

## Step 2: Initialize Team

### Create Team Directory Structure

```bash
mkdir -p ~/.claude/teams/auth-feature/inboxes
```

### Create Initial Task List

File: `~/.claude/teams/auth-feature/tasks.json`

```json
{
  "team_name": "auth-feature",
  "created_at": "2026-02-16T10:00:00Z",
  "tasks": [
    {
      "id": "task-1",
      "name": "Password hashing utilities",
      "description": "Implement bcrypt-based password hashing and verification functions with proper salt handling",
      "status": "available",
      "dependencies": [],
      "assignee": null,
      "focus_area": "backend",
      "estimated_tokens": 3000,
      "requires_coordination": false
    },
    {
      "id": "task-2",
      "name": "JWT token generation",
      "description": "Create JWT token generation and validation with access tokens (15m) and refresh tokens (7d). Use environment variables for signing keys.",
      "status": "available",
      "dependencies": [],
      "assignee": null,
      "focus_area": "backend",
      "estimated_tokens": 5000,
      "requires_coordination": false
    },
    {
      "id": "task-3",
      "name": "Login API endpoint",
      "description": "POST /api/auth/login endpoint - validates credentials, generates tokens, returns user info and tokens",
      "status": "available",
      "dependencies": ["task-1", "task-2"],
      "assignee": null,
      "focus_area": "backend",
      "estimated_tokens": 6000,
      "requires_coordination": true
    },
    {
      "id": "task-4",
      "name": "Logout API endpoint",
      "description": "POST /api/auth/logout endpoint - invalidates refresh token, clears session",
      "status": "available",
      "dependencies": ["task-2"],
      "assignee": null,
      "focus_area": "backend",
      "estimated_tokens": 3000,
      "requires_coordination": false
    },
    {
      "id": "task-5",
      "name": "Token refresh endpoint",
      "description": "POST /api/auth/refresh endpoint - validates refresh token, issues new access token",
      "status": "available",
      "dependencies": ["task-2"],
      "assignee": null,
      "focus_area": "backend",
      "estimated_tokens": 4000,
      "requires_coordination": true
    },
    {
      "id": "task-6",
      "name": "Session middleware",
      "description": "Express middleware to verify JWT on protected routes, attach user to request",
      "status": "available",
      "dependencies": ["task-2"],
      "assignee": null,
      "focus_area": "backend",
      "estimated_tokens": 4000,
      "requires_coordination": false
    },
    {
      "id": "task-7",
      "name": "Login UI component",
      "description": "React login form with email/password fields, error handling, loading states. Calls login API.",
      "status": "available",
      "dependencies": ["task-3"],
      "assignee": null,
      "focus_area": "frontend",
      "estimated_tokens": 7000,
      "requires_coordination": true
    },
    {
      "id": "task-8",
      "name": "Logout UI button",
      "description": "React logout button in nav bar, calls logout API, redirects to login",
      "status": "available",
      "dependencies": ["task-4"],
      "assignee": null,
      "focus_area": "frontend",
      "estimated_tokens": 3000,
      "requires_coordination": false
    }
  ]
}
```

## Step 3: Spawn Team Members

### Lead Agent (You)

You're already active as the lead. Initialize inboxes:

```bash
echo '[]' > ~/.claude/teams/auth-feature/inboxes/lead.json
echo '[]' > ~/.claude/teams/auth-feature/inboxes/backend-impl.json
echo '[]' > ~/.claude/teams/auth-feature/inboxes/frontend-impl.json
echo '[]' > ~/.claude/teams/auth-feature/inboxes/security-reviewer.json
```

### Spawn Backend Implementer

```
Task tool (general-purpose):
  description: "Backend implementer for auth feature"
  prompt: |
    [Use team-implementer-prompt.md template]
    
    Team: auth-feature
    Role: backend-impl
    Focus: Backend (Node.js/Express)
    Plan: docs/plans/authentication-feature.md
    
    You're responsible for tasks 1-6 (backend implementation).
    Coordinate with frontend-impl on API contracts.
    Security-reviewer will review all your work.
```

### Spawn Frontend Implementer

```
Task tool (general-purpose):
  description: "Frontend implementer for auth feature"
  prompt: |
    [Use team-implementer-prompt.md template]
    
    Team: auth-feature
    Role: frontend-impl
    Focus: Frontend (React)
    Plan: docs/plans/authentication-feature.md
    
    You're responsible for tasks 7-8 (UI implementation).
    Coordinate with backend-impl on API contracts.
    Security-reviewer will review your work for XSS, CSRF.
```

### Spawn Security Reviewer

```
Task tool (general-purpose):
  description: "Security reviewer for auth feature"
  prompt: |
    [Use team-reviewer-prompt.md template]
    
    Team: auth-feature
    Role: security-reviewer
    Focus: Security (auth, validation, XSS, CSRF)
    Plan: docs/plans/authentication-feature.md
    
    Review all implementations for:
    - Password security (hashing, salts)
    - Token security (signing, expiry, storage)
    - Input validation
    - XSS prevention
    - CSRF protection
    - Session management
```

## Step 4: Team Execution (Simulated Timeline)

### T+0min: Initial Task Claims

**backend-impl claims task-1** (password hashing)

Update `tasks.json`:
```json
{
  "id": "task-1",
  "status": "in-progress",
  "assignee": "backend-impl",
  "claimed_at": "2026-02-16T10:05:00Z"
}
```

**backend-impl claims task-2** (JWT tokens)

Update `tasks.json`:
```json
{
  "id": "task-2",
  "status": "in-progress",
  "assignee": "backend-impl",
  "claimed_at": "2026-02-16T10:06:00Z"
}
```

> Note: backend-impl can work on both since they're independent

**frontend-impl waits** (tasks 7-8 depend on backend completing tasks 3-4)

### T+15min: Task 1 Complete, Review Requested

**backend-impl → security-reviewer:**
```
Subject: Review needed: task-1 (Password hashing)

Completed task-1. Please review:

Files:
- src/auth/password.ts
- tests/auth/password.test.ts

Commits: abc123..def456

Implementation:
- Using bcrypt with 12 rounds
- Proper salt generation per password
- Timing-safe comparison for verification

Focus areas:
- Salt rounds sufficient?
- Any timing attack vectors?
```

### T+20min: Task 2 Complete, Review Requested

**backend-impl → security-reviewer:**
```
Subject: Review needed: task-2 (JWT tokens)

Completed task-2. Please review:

Files:
- src/auth/jwt.ts
- tests/auth/jwt.test.ts

Implementation:
- Access tokens: 15m expiry
- Refresh tokens: 7d expiry
- Signing keys from environment variables
- Token payload includes: userId, email, iat, exp

Focus areas:
- Token expiry appropriate?
- Payload secure (no sensitive data)?
- Signing key management correct?
```

### T+22min: Security Review - Task 1 Issues Found

**security-reviewer → backend-impl:**
```
Subject: Re: task-1 - Issues found

Reviewed task-1. Issues:

CRITICAL:
- bcrypt rounds hardcoded (password.ts:8) - Should be configurable via env var
  Fix: Add BCRYPT_ROUNDS env var with default 12

IMPORTANT:
- Error messages leak user existence (password.ts:45)
  Current: "User not found" vs "Invalid password"
  Fix: Use generic "Invalid credentials" for both cases

Please fix and request re-review.
```

### T+25min: Security Review - Task 2 Issues Found

**security-reviewer → backend-impl:**
```
Subject: Re: task-2 - Issues found

Reviewed task-2. Issues:

CRITICAL:
- No refresh token rotation (jwt.ts:78) - Reusing same refresh token
  Fix: Generate new refresh token on each refresh, invalidate old one
  
- Token signing key fallback to default (jwt.ts:12)
  Current: `const key = process.env.JWT_SECRET || 'default-secret'`
  Fix: Throw error if JWT_SECRET not set (fail fast, don't use default)

IMPORTANT:
- No token revocation mechanism (jwt.ts overall)
  Recommendation: Add token blacklist or versioning

Please fix CRITICAL issues and request re-review.
```

### T+30min: Backend Fixes Issues

**backend-impl fixes task-1:**
- Made bcrypt rounds configurable
- Unified error messages

**backend-impl fixes task-2:**
- Implemented refresh token rotation
- Removed default secret fallback
- Added token revocation via blacklist

**backend-impl → security-reviewer:**
```
Subject: Re-review: tasks 1 & 2 (fixes applied)

Fixed all CRITICAL issues:

Task-1:
- BCRYPT_ROUNDS env var added (defaults 12)
- Error messages now generic "Invalid credentials"

Task-2:
- Refresh token rotation implemented
- JWT_SECRET required (throws if missing)
- Token blacklist added for revocation

Please re-review both tasks.
```

### T+35min: Security Approval

**security-reviewer → backend-impl:**
```
Subject: Tasks 1 & 2 - Approved ✅

Both tasks approved after fixes:

Task-1 (Password hashing):
- Strengths: Proper bcrypt usage, good test coverage
- All issues resolved

Task-2 (JWT tokens):
- Strengths: Solid token lifecycle, good security practices
- All CRITICAL issues fixed
- Token revocation is good addition

You can mark both complete and proceed to task-3.
```

**security-reviewer → lead:**
```
Subject: Tasks 1-2 approved

Tasks 1 and 2 have been reviewed and approved.
Backend-impl can mark complete and proceed to task-3.
```

**backend-impl updates tasks.json:**
```json
{
  "id": "task-1",
  "status": "complete",
  "completed_at": "2026-02-16T10:35:00Z"
},
{
  "id": "task-2",
  "status": "complete",
  "completed_at": "2026-02-16T10:35:00Z"
}
```

### T+40min: Coordination Before Task 3

**backend-impl → frontend-impl:**
```
Subject: API contract for task-3 (Login endpoint)

About to implement task-3 (Login API). Here's the contract for task-7:

POST /api/auth/login
Request:
{
  "email": "user@example.com",
  "password": "plaintextPassword"
}

Response (200):
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name"
  },
  "accessToken": "jwt...",
  "refreshToken": "jwt..."
}

Response (401):
{
  "error": "Invalid credentials"
}

Store tokens in httpOnly cookies for security.
Let me know if you need changes.
```

**frontend-impl → backend-impl:**
```
Subject: Re: API contract

Looks good! A few questions:

1. Cookie names? (for reference in frontend)
2. CSRF token handling? Should I include CSRF token in requests?
3. CORS headers needed?

Will start on task-7 once task-3 is complete and reviewed.
```

**backend-impl → frontend-impl:**
```
Subject: Re: API contract - Answers

1. Cookie names: `accessToken`, `refreshToken`
2. CSRF: Yes, include `X-CSRF-Token` header from cookie
3. CORS: Already configured for localhost:3000 (dev) and our prod domain

Proceeding with task-3 implementation now.
```

### T+50min: Task 3 Complete

**backend-impl** completes task-3, requests review from security-reviewer

**backend-impl** also claims and implements task-4 (logout) and task-5 (refresh) in parallel since dependencies met

### T+60min: All Backend Tasks Complete & Reviewed

After review cycles:
- Tasks 3, 4, 5, 6 all implemented, reviewed, and approved
- Total time for backend: ~60 minutes

**backend-impl → frontend-impl:**
```
Subject: All backend tasks complete - You're unblocked

All backend implementation done and reviewed:
✅ Task-3: Login API (/api/auth/login)
✅ Task-4: Logout API (/api/auth/logout)
✅ Task-5: Refresh API (/api/auth/refresh)
✅ Task-6: Session middleware

You can proceed with tasks 7 & 8.

API docs summary:
[Provides complete API reference]

Let me know if questions come up during implementation.
```

### T+65min: Frontend Implementation Begins

**frontend-impl claims task-7** (Login UI)

Implements React login form with:
- Email/password inputs
- Form validation
- Error handling
- Loading states
- Calls POST /api/auth/login
- Stores tokens (via cookies, backend handles)
- Redirects on success

### T+85min: Frontend Review - Issues Found

**security-reviewer → frontend-impl:**
```
Subject: Re: task-7 - Issues found

Reviewed task-7 (Login UI). Issues:

CRITICAL:
- Password visible in browser console (LoginForm.tsx:67)
  Current: console.log('Submitting:', { email, password })
  Fix: Remove console.log or exclude password

IMPORTANT:
- No XSS protection on error messages (LoginForm.tsx:45)
  Current: {error} (renders raw HTML)
  Fix: Use text content, not innerHTML

- No rate limiting indication (LoginForm.tsx overall)
  After 3 failed attempts, should show message about rate limiting
  Coordinate with backend-impl on rate limit headers

Please fix and request re-review.
```

**frontend-impl → backend-impl:**
```
Subject: Rate limit headers?

Security-reviewer wants rate limit indication in UI.
Does the backend send rate limit headers?
If not, can you add them?
```

**backend-impl → frontend-impl:**
```
Subject: Re: Rate limit headers

Good catch. I'll add rate limiting to task-3 implementation:
- X-RateLimit-Remaining header
- X-RateLimit-Reset header

Give me 10 min to add and re-test.
```

**backend-impl** adds rate limiting, security-reviewer approves update

**frontend-impl** fixes issues and adds rate limit UI

### T+100min: All Tasks Complete

**lead consolidates:**
```
Team Status: All Complete ✅

Backend (6 tasks): ✅ Complete
Frontend (2 tasks): ✅ Complete

Total implementations: 8 tasks
Review cycles: 12 reviews (some tasks reviewed multiple times)
Issues found: 8 (all fixed)
Time: ~100 minutes
```

### T+105min: Final Integration Test

**lead runs full test suite:**
```bash
npm run test
# All 47 tests pass ✅

npm run test:integration
# Integration tests pass ✅
```

**lead → human:**
```
Authentication feature implementation complete!

Summary:
- 8 tasks implemented and reviewed
- Security-focused review caught 8 issues (all fixed)
- Backend/frontend coordination smooth (5 coordination messages)
- All tests passing

Ready for superpowers:finishing-a-development-branch
```

## Step 5: Team Completion

Use `finishing-a-development-branch` skill to:
1. Review final state
2. Create PR or merge
3. Clean up worktree
4. Document what was accomplished

## Outcomes

### What Agent Teams Enabled

✅ **Real-time coordination:** Backend/frontend aligned on API contract before implementation

✅ **Adversarial review:** Security reviewer challenged implementations, found 8 issues

✅ **Parallel work:** Backend tasks 1-2 done simultaneously, frontend unblocked early

✅ **Quick iteration:** Review feedback loop was fast (implementer + reviewer in same session)

✅ **Emergent improvements:** Rate limiting added based on frontend needs (discovered during review)

### Comparison with Subagents

**With subagents (estimated):**
- Time: ~180 minutes (sequential: task 1 → review → task 2 → review → ...)
- Cost: ~$70 (8 tasks × 3 subagents × $3)
- Coordination: Manual through lead agent (slower)
- Issues found: Likely fewer (no adversarial discussion)

**With agent teams (actual):**
- Time: ~105 minutes (parallel work, real-time coordination)
- Cost: ~$180 (4 agents × $45)
- Coordination: Direct agent-to-agent (faster)
- Issues found: 8 security issues (adversarial review)

**Verdict:** Teams justified for this security-critical coordinated work
- 75 min time savings
- Higher quality (security issues caught)
- $110 extra cost worth it for auth feature

## Key Takeaways

1. **Coordination messages are efficient:** Only 5 coordination messages needed, directly between relevant agents

2. **Adversarial review adds value:** Security reviewer challenged implementations, found issues that would have been missed

3. **Parallel work saves time:** Backend implementer worked on multiple tasks while waiting for reviews

4. **Emergent improvements:** Rate limiting was added based on cross-team discussion (not in original plan)

5. **Cost justified for high-stakes work:** Authentication is security-critical, $110 premium worth it

## When to Use This Pattern

Use agent teams like this when:
- Security/quality critical (auth, payments, data handling)
- Multiple layers need coordination (backend + frontend)
- Adversarial review adds significant value
- Time savings worth 2-4x cost multiplier
- Emergent requirements likely during implementation

Stick to subagents when:
- Independent tasks with clear specs
- No coordination needed
- Budget constrained
- Sequential execution acceptable
