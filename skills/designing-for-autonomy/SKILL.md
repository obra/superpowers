---
name: designing-for-autonomy
description: Use when architecting features, designing logging/observability, setting up dev environments, or building multi-component systems where agent feedback loops matter
---

# Designing for Autonomy

## Overview

**Core principle:** Every design decision must answer: "Can the agent observe this without a human checking for them?"

Agents can tail terminals, read files, and automate browsers. Agents CANNOT see browser DevTools (console.log is invisible), mobile device logs, or logs scattered across processes. If debugging requires a screenshot, the architecture failed.

## When to Use

Apply during design/architecture: new projects, major features, logging systems, multi-component architectures, dev environment setup.

**Three questions for every design decision:**
1. Can the agent access this component's output?
2. If something breaks, can the agent see why without a screenshot?
3. Can the agent reset to a known state?

## Log Routing

**Principle:** Route ALL logs to ONE agent-accessible location. A 20-line shim saves hours of debugging.

**Web apps:** Browser console.log is invisible to agents. In dev mode, shim console.log to POST to `/dev/log` on your server.
**Desktop/Electron:** Multiple processes → single log file
**Mobile:** Device logs → forward to local server or HTTP endpoint
**Multi-service:** Scattered containers → shared volume or aggregator

| Platform | Route Logs To |
|----------|---------------|
| Web (SPA) | Server-side endpoint |
| Desktop | Single log file |
| Mobile | HTTP endpoint |
| Multi-service | Shared volume |

## Dev Endpoints

Build endpoints the agent can curl to verify state without screenshots:

```javascript
if (process.env.NODE_ENV === 'development') {
  app.get('/dev/health', (req, res) => res.json({ status: 'ok', db: db.isConnected() }));
  app.get('/dev/state', (req, res) => res.json({ users: users.count(), sessions: sessions.active() }));
  app.post('/dev/reset', (req, res) => { resetDatabase(); res.json({ reset: true }); });
}
```

**Pattern:** `/dev/health` for status, `/dev/state` for inspection, `/dev/reset` for clean slate.

## Verbose Errors

Errors must contain what was attempted, what failed, why, and what to try next.

**Bad:** `Error: Connection failed`
**Good:** `Error: DB connection failed. Host: localhost:5432, User: app_user, Reason: ECONNREFUSED. Try: pg_isready -h localhost -p 5432`

Never swallow errors silently—surface them where the agent can see.

## Browser Testing Hierarchy

1. **Exhaust non-browser paths first:** Logs, API calls, and terminal are faster than browser automation
2. **Use browser automation for what requires it:** Visual rendering, user flows, JS behavior—don't ask humans to test what the agent's browser can verify
3. **Browser as proxy:** Even for desktop/mobile apps, test logic via browser first (Electron renderer, debug UI for APIs, web version of mobile flows)

**Design goal:** Close every feedback loop before asking the human. Screenshots are last resort.

## Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| Logs in browser DevTools only | Bridge to server/file |
| Scattered logs across services | Aggregate to one location |
| No state reset mechanism | Add `/dev/reset` endpoint |
| Generic error messages | Include context + next steps |
| Manual setup for each test | Create dev shortcuts |

## Red Flags

If you think any of these, **redesign before implementing:**
- "I'll ask the user what they see"
- "Logs are in the browser console"
- "You'll need to manually set up the state"
- "That error is in a different process"
- "There's no way to reset"
