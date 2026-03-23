---
name: handler-authority
description: Use when processing issues asynchronously via GitHub comments or other non-terminal interfaces - defines how to weigh human input from issue handlers
---

# Handler Authority

## Overview

When working asynchronously (loop mode, GitHub comments, Slack, etc.), human input comes from the Handler — the person responsible for the issue. Their input has varying authority depending on specificity and context.

**Core principle:** Evidence wins over suggestions. Requirements are non-negotiable. Everything in between scales with specificity.

## Who Is the Handler?

Determined in order:
1. **Issue assignee** — if assigned
2. **Issue creator** — if no assignee
3. **Configured fallback** — project-specific default (e.g., repo owner)

## Authority Levels

### Requirements (Hard Constraints)

When a handler comment uses "Requirement:", "MUST", or "REQUIRED", treat it as a hard constraint. Follow it exactly.

```
Example:
> Requirement: The fix must preserve backwards compat with v2 config format
```

Non-negotiable. If you cannot meet a requirement, flag it — don't silently ignore it.

### Suggestions (Increasing Authority)

All other handler input starts as a suggestion. Authority increases with specificity and repetition:

| Signal | Authority | Action |
|--------|-----------|--------|
| Vague, first mention | Low | Investigate but verify independently |
| Specific code location | Medium | Prioritize this path |
| Repeated, consistent direction | High | Strong signal, treat as working theory |
| Confirmed by your evidence | Highest | Handler's direction is the working theory |

**Examples:**

- **Low:** "I think it might be related to caching" — investigate caching but don't assume
- **Medium:** "Check the TTL logic in redis_client.py around line 45" — look there first
- **High:** "I've seen this three times, it's always the cache invalidation" — strong signal, but still verify
- **Confirmed:** Your investigation confirms the cache issue — handler was right, proceed

### Conflict Resolution

| Situation | Resolution |
|-----------|-----------|
| Suggestion conflicts with confirmed evidence | Evidence wins |
| Requirement conflicts with confirmed evidence | Flag the conflict to the handler. Don't silently ignore either side. |
| Multiple handlers disagree | Escalate to the issue assignee. If no assignee, escalate to the fallback. |
| Handler gives no input | Proceed with your best judgment. Post your reasoning as a comment. |

## Communication Style

When working async, all handler interaction happens through issue comments (or the configured interface). Never block on terminal input.

**Asking questions:**
- Tag the handler in the comment
- Be specific about what you need
- Provide context for why you're asking
- Include options when possible (easier to respond to)

**Reporting findings:**
- State what you found with evidence
- If handler's suggestion was wrong, note it respectfully and move on
- If handler's suggestion was confirmed, credit it

**Disagreeing with handler:**
- Present your evidence
- Explain why you reached a different conclusion
- Ask for guidance, don't just override

## Anti-Patterns

| Pattern | Problem |
|---------|---------|
| Treating all handler input as requirements | Over-constrains investigation |
| Ignoring handler input entirely | Misses valuable domain context |
| Anchoring to handler's first suggestion | Handler can be wrong, especially early |
| Silently overriding a requirement | Trust violation — flag conflicts explicitly |
| Blocking on handler response | Post comment and move to next item (non-blocking) |

## Integration

**Referenced by:**
- **superpowers:bug-triage** — for weighing handler input during investigation
- **superpowers:loop-orchestrator** — for all async communication with handlers
- Any skill operating in loop/async mode
