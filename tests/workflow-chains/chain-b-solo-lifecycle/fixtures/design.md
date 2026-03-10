# Auth Service: Design Document

## Overview

Build a standalone authentication service in Node.js. All tasks are tightly coupled backend work: each depends on the previous. Only one specialist domain is involved.

## Domain: Backend (Node.js)

- **Task 1:** User model + password hashing — define User schema with email/password, use bcrypt for hashing, write unit tests
- **Task 2:** JWT token management — issue tokens on login, validate tokens on protected routes, write unit tests (depends on Task 1)
- **Task 3:** Auth middleware + endpoints — `POST /auth/register`, `POST /auth/login`, `GET /auth/me` (depends on Task 1 + 2)

## Interface Contract

```
POST /auth/register  → body: {email, password}         → {userId, token}
POST /auth/login     → body: {email, password}         → {token, expiresAt}
GET  /auth/me        → header: Authorization: Bearer X → {userId, email}
```

## Acceptance Criteria

- Passwords stored as bcrypt hashes, never plaintext
- JWTs expire after 24h
- Each endpoint has integration tests
- Tasks execute strictly in order (1 → 2 → 3): no parallelism possible

## Notes

Single domain, strictly sequential tasks. Team fitness check should recommend serial execution (subagent-driven-development), not parallel team.
