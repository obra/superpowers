---
name: api-edr-validation
description: Use when a code-writing agent needs to verify API contracts, EDR documents, or variable naming before implementing — prevents agents from inventing API shapes and variable names. Also manages creation and updates of API documentation in docs/api/.
---

# API/EDR Validation

## Overview

Code-writing agents frequently invent API endpoints, variable names, and request/response shapes without checking documentation. This causes cross-task inconsistencies and broken integrations. This skill forces code-writing workers to check `docs/api/` for all API contracts and variable declarations before writing any code.

**Core principle:** `docs/api/` 디렉토리의 문서가 single source of truth. 모든 에이전트가 직접 참조합니다. No code-writing agent declares API endpoints, EDR variables, or shared data structures without checking `docs/api/` first.

**Announce at start:** "I'm using the api-edr-validation skill to confirm API contracts before coding."

<HARD-GATE>
Every code-writing agent MUST check `docs/api/` BEFORE writing any API-related code.
- No endpoint can be implemented without checking `docs/api/` first
- No API shape can be assumed or invented — it must come from `docs/api/`
- No new endpoint can be implemented without creating its `docs/api/[domain].md` entry
- "I already know the API shape" is NEVER a valid reason to skip checking `docs/api/`

Violation of this gate means the task CANNOT pass audit verification.
</HARD-GATE>

## When to Use

- Before implementing any task that involves API calls or endpoint creation
- Before creating or using EDR variables and event schemas
- Before declaring shared variables, types, or data models
- When modifying existing API contracts or variable names
- When uncertain about request/response shapes
- When creating a new API endpoint (to document it in `docs/api/`)
- When modifying an existing API endpoint (to update its documentation)
- **Any time you are about to write code that references an API or declares a variable used across boundaries**

## The Validation Process

```dot
digraph validation {
    "Worker starting task" [shape=box];
    "Task involves APIs or shared data?" [shape=diamond];
    "Read docs/api/ for relevant contracts" [shape=box style=filled fillcolor=lightblue];
    "Relevant docs exist?" [shape=diamond];
    "Create docs/api/[domain].md" [shape=box style=filled fillcolor=orange];
    "Contracts clear?" [shape=diamond];
    "Ask Team Lead for clarification" [shape=box];
    "Implement using documented contracts" [shape=box style=filled fillcolor=lightgreen];
    "Proceed without API check" [shape=box];
    "New or changed API?" [shape=diamond];
    "Update docs/api/[domain].md" [shape=box style=filled fillcolor=orange];

    "Worker starting task" -> "Task involves APIs or shared data?";
    "Task involves APIs or shared data?" -> "Read docs/api/ for relevant contracts" [label="yes"];
    "Task involves APIs or shared data?" -> "Proceed without API check" [label="no — pure logic only"];
    "Read docs/api/ for relevant contracts" -> "Relevant docs exist?";
    "Relevant docs exist?" -> "Contracts clear?" [label="yes"];
    "Relevant docs exist?" -> "Create docs/api/[domain].md" [label="no"];
    "Create docs/api/[domain].md" -> "Implement using documented contracts";
    "Contracts clear?" -> "Implement using documented contracts" [label="yes"];
    "Contracts clear?" -> "Ask Team Lead for clarification" [label="no"];
    "Ask Team Lead for clarification" -> "Implement using documented contracts";
    "Implement using documented contracts" -> "New or changed API?";
    "New or changed API?" -> "Update docs/api/[domain].md" [label="yes"];
    "New or changed API?" -> "Task complete" [label="no"];
    "Proceed without API check" -> "Task complete";
    "Update docs/api/[domain].md" -> "Task complete";
    "Task complete" [shape=doublecircle];
}
```

## Validation Steps for Workers

### 1. Check `docs/api/` for Existing Contracts

Before writing any API-related code, read the relevant files in `docs/api/`:

```
docs/api/
├── auth.md              # Authentication endpoints
├── users.md             # User management endpoints
├── payments.md          # Payment endpoints
├── events.md            # EDR / event schemas
└── shared-types.md      # Shared type definitions
```

Search for:
1. What endpoints/events are relevant to your task?
2. What are the exact request/response schemas?
3. What shared variables/types should you use?
4. Are there any constraints or edge cases documented?

### 2. Create API Documentation (New Endpoints)

If no documentation exists for the API domain you're implementing, create `docs/api/[domain].md` using the standard format below **before** writing implementation code.

### 3. Update API Documentation (Changed Endpoints)

If you modify an existing API endpoint, update the corresponding `docs/api/[domain].md` to reflect the changes. Add a changelog entry at the top of the file.

## API Document Standard Format

Every file in `docs/api/` follows this format:

```markdown
# [Domain] API

> Last updated: YYYY-MM-DD
> Updated by: [agent name or task reference]

## Changelog
- YYYY-MM-DD: [description of change]

## Endpoints

### [METHOD] [path]

**Description:** [what this endpoint does]

**Request:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| field | type | yes/no   | description |

**Response (200):**
```json
{
  "field": "type — description"
}
```

**Error Responses:**
| Code | Description |
|------|-------------|
| 400  | [when this happens] |
| 401  | [when this happens] |
| 404  | [when this happens] |

---

## Events

### [event-type]

**Trigger:** [what causes this event]
**Payload:**
```json
{
  "field": "type — description"
}
```

---

## Shared Types

### [TypeName]
```typescript
interface TypeName {
  field: type; // description
}
```

**Used by:** [list of endpoints/events that use this type]
```

## EDR Document Management

For Event-Driven Records (events, webhooks, pub/sub):

1. Document event schemas in `docs/api/events.md` or domain-specific files
2. Include: event type, trigger condition, payload schema, consumer list
3. When adding new events, check for existing events that overlap in purpose
4. Never create duplicate event types for the same trigger

## Red Flags - STOP and Confirm

**Never:**
- Implement API calls without checking `docs/api/` first
- Assume endpoint shapes from memory or convention
- Create duplicate endpoints for the same resource
- Use different variable names for the same concept across tasks
- Modify existing contracts without updating `docs/api/`
- Create a new endpoint without documenting it in `docs/api/[domain].md`

## Integration

**Called by:**
- **superpowers:team-driven-development** — Workers follow this skill before implementing API-related code
- **superpowers:executing-plans** — API validation before implementation

**Pairs with:**
- **superpowers:audit-verification** — Audit Agent checks API consistency against `docs/api/`
- **superpowers:verification-before-completion** — Final verification includes API doc check

## Wiki Integration

When `docs/wiki/` exists in the project, use the wiki as the **primary API reference** before exploring code. This reduces redundant codebase exploration by leveraging pre-compiled knowledge.

### Guard

If `docs/wiki/` does not exist, skip this section entirely and proceed with the normal validation workflow above.

### Steps

1. **Check `docs/wiki/api-contracts.md` first** — Before reading `docs/api/` files or exploring code, check `docs/wiki/api-contracts.md` for a summarized view of all API contracts. This is faster than scanning individual `docs/api/` files.
2. **Use wiki as primary reference** — When answering questions about API shapes, endpoints, or shared types, prefer `docs/wiki/api-contracts.md` and related wiki pages over direct code exploration. Only fall back to code when the wiki lacks the needed information.
3. **Update `docs/wiki/api-contracts.md` if new info found from code** — If you had to explore code because the wiki was incomplete, reflect your findings back into `docs/wiki/api-contracts.md` so future agents benefit from the discovery.
4. **Append to `docs/wiki/log.md`** — After any wiki update, append an entry in the format: `- YYYY-MM-DD HH:MM: [updated] api-contracts.md (reason: [description of what was added/changed])`
