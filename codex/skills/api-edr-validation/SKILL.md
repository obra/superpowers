---
name: api-edr-validation
description: Use before implementing or changing API endpoints, events, schemas, shared types, cross-boundary variables, or event-driven records
---

# API And EDR Validation

## Overview

API endpoints, event schemas, shared variables, and cross-boundary types must come from documented contracts or verified source-of-truth code. Do not invent shapes from memory or convention.

Core principle: validate contracts before writing API-related code.

## When To Use

Use before:
- Implementing or calling an API endpoint.
- Creating or consuming events, webhooks, pub/sub messages, or event-driven records.
- Declaring shared variables, shared types, DTOs, request/response models, or cross-service schemas.
- Modifying an existing endpoint or event contract.
- Reviewing work that touches API or shared-data boundaries.

If the task is pure internal logic with no cross-boundary data, note that API validation is not applicable and continue.

## Source Of Truth Order

Use the first applicable source:

1. Task-specific contract or user-provided spec.
2. `docs/wiki/api-contracts.md` or related wiki pages, when present.
3. Relevant files under `docs/api/`, when present.
4. Existing implementation and tests, when docs are absent or stale.
5. User clarification, when sources conflict or the intended contract is unclear.

Do not edit wiki, docs, or root documentation unless the current task explicitly owns those paths.

## Validation Process

1. Determine whether the task touches APIs, events, or shared data.
2. Search contract docs before implementation:

```bash
find docs/api -type f 2>/dev/null
rg -n "<endpoint|event|type|field>" docs/api docs/wiki 2>/dev/null
```

3. Read the relevant contract files completely enough to capture:
   - Endpoint method and path.
   - Request fields, response fields, and error responses.
   - Event type, trigger, payload, and consumers.
   - Shared type names and field names.
   - Version, migration, or compatibility notes.

4. Compare contract sources against existing code and tests if docs are incomplete.
5. Ask the user before implementing if sources conflict or the contract is missing and the task does not own docs.
6. Implement using the validated contract.
7. If a contract is changed, update the owned documentation only when the task permits it; otherwise report the required doc update as a blocker or follow-up.
8. Include contract validation in final verification.

## Documentation Standard

When the task explicitly owns API documentation and a new or changed contract needs documenting, use this structure:

~~~markdown
# <Domain> API

> Last updated: YYYY-MM-DD
> Updated by: <task or author>

## Changelog
- YYYY-MM-DD: <change>

## Endpoints

### <METHOD> <path>

**Description:** <purpose>

**Request:**
| Field | Type | Required | Description |
| --- | --- | --- | --- |
| field | type | yes/no | description |

**Response (200):**
```json
{
  "field": "type - description"
}
```

**Error Responses:**
| Code | Description |
| --- | --- |
| 400 | <case> |

## Events

### <event-type>

**Trigger:** <trigger>
**Payload:**
```json
{
  "field": "type - description"
}
```

## Shared Types

### <TypeName>
```typescript
interface TypeName {
  field: string;
}
```
~~~

## EDR Checks

For event-driven records:
- Confirm event names are unique and not duplicates of existing triggers.
- Confirm producer and consumer expectations match.
- Confirm payload fields, optionality, IDs, timestamps, and ordering semantics.
- Confirm retry, idempotency, and versioning behavior when relevant.
- Confirm tests cover producer and consumer contract expectations where feasible.

## Red Flags

Stop and confirm before coding when:
- An endpoint or event shape is assumed from memory.
- Two docs disagree.
- Code and docs disagree and ownership does not include docs.
- A new cross-boundary field name is introduced without checking existing terminology.
- A duplicate endpoint or event appears to serve the same purpose.
- A contract change would break existing consumers.

## Completion Standard

For API or EDR work, report:
- Which contract sources were checked.
- The validated endpoint, event, or type names used.
- Any docs updated, or why docs were not changed.
- Verification commands and current pass/fail status.
