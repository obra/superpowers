---
name: designing-for-agent-autonomy
description: Use when architecting features or systems - ensures AI agents can observe, test, and troubleshoot without requiring screenshots or manual intervention
---

# Designing for Agent Autonomy

## Overview

Design software so your AI agent can close its own feedback loops, thus running self-sufficiently.

**Core principle:** Every implementation decision should answer: "Can the agent observe this without human checking for them?"

Your agent can tail terminal output, read files, and use browser automation. Your agent CANNOT see browser DevTools console, mobile device logs, or logs scattered across multiple processes.

**Design for what your agent can actually observe.**

## The Iron Law

```
EVERY LOG MUST BE AGENT-ACCESSIBLE
```

If the agent can't see it, it can't debug it. If debugging requires a screenshot, the architecture failed.

## When to Use

**During design/architecture phases:**
- Starting a new project
- Adding major features
- Designing logging or observability
- Planning multi-component systems
- Setting up development environment

**Ask before every design decision:**
- Can the agent access the output of this component?
- If something breaks, can the agent see why without a screenshot?
- Can the agent reset to a known state and retry?

## Unified Log Observability

**The principle:** Route ALL logs from ALL components to ONE location the agent can access.

### Web Applications

**Problem:** Frontend console.log goes to browser DevTools. Agent can't see it.

**Solution A - Frontend to Backend:**
```javascript
// Tiny dev-mode shim - bridge console to server
if (process.env.NODE_ENV === 'development') {
  const original = console.log;
  console.log = (...args) => {
    original(...args);
    fetch('/dev/log', {
      method: 'POST',
      body: JSON.stringify({ level: 'log', args })
    });
  };
  // Same for console.error, console.warn
}
```

Agent tails server log, sees everything.

**Solution B - Backend to Frontend:**
Stream server logs to a debug panel in the UI that browser automation can read.

### Desktop/Electron Apps

**Problem:** Main process, renderer, and child processes log to different places.

**Solution:** Consolidate to single log file:
```javascript
const logPath = path.join(app.getPath('userData'), 'debug.log');
// All processes write here
```

Agent reads one file.

### Mobile Development

**Problem:** Device logs require connecting to device, using platform-specific tools.

**Solutions:**
- Forward device logs to local server the agent can access
- Build debug panel in the app that accumulates logs visibly
- Use `adb logcat` (Android) or Xcode console bridge to local file

### Multi-Service Architectures

**Problem:** Logs scattered across containers, services, processes.

**Solutions:**
- Shared log volume all services write to
- Centralized log endpoint
- Debug dashboard aggregating all sources

### Quick Reference

| Platform | Agent Observes | Route Logs To |
|----------|---------------|---------------|
| Web (SPA) | Server terminal | Server-side log file or endpoint |
| Desktop | File system | Single log file |
| Mobile | Local server | HTTP endpoint or bridged file |
| Multi-service | Terminal or file | Shared volume or aggregator |

## Exhaust Automation Before Screenshots

When the agent needs to verify something:

1. **First:** Log everything the agent CAN observe
2. **Check:** All automated paths (logs, API endpoints, health checks)
3. **If screenshot unavoidable:** The issue should already be isolated
4. **Error messages:** Include enough context for the agent to act on what it sees

**Design goal:** Screenshots should be last resort, not first resort.

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| Logs only in browser DevTools | Agent can't see them | Bridge to server log or file |
| Scattered logs across services | Agent can't correlate | Aggregate to one location |
| No state reset mechanism | Agent can't reproduce issues | Add dev reset command |
| Generic error messages | Agent can't diagnose | Include actionable context |
| Requires manual setup for each test | Agent wastes time | Create dev shortcuts |

## Red Flags - STOP and Redesign

If you catch yourself thinking:
- "I'll ask the user what they see, and to verify for me"
- "Logs are in the browser console"
- "You'll need to manually set up the state first"
- "That error is in a different process"
- "There's no way to reset to clean state"

**ALL of these mean: Redesign before implementing.**

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Logs in DevTools is fine" | Agent can't see DevTools. Route to terminal or file. |
| "Too much work to aggregate logs" | 20-line shim. Hours saved in debugging. |
| "Screenshots when needed" | Screenshots should be last resort, not default. |
| "This is internal tooling" | You'll debug this. Agent will debug this. Design for it. |

## Integration with Other Skills

- **superpowers:systematic-debugging** - Unified observability makes root cause tracing possible
- **superpowers:brainstorming** - Apply these principles during design refinement
- **superpowers:test-driven-development** - Observable systems enable faster TDD cycles
