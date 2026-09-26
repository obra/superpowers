# Ticket body schema

Use with the `creating-tickets` skill. Every issue body includes these sections in order:

## Background
Why this work exists (link prior decisions/issues). Brief.

## Overview
What the ticket delivers, at behaviour altitude.

## Scope
In-scope work. Bullets.

## Acceptance criteria
Checklist the implementer and reviewer share. Testable.

## Out of scope
Explicit exclusions.

## Depends on
Optional. Soft dependencies as `#N` issue references. Coordinator checks before dispatch; not a full graph.

---

**Labels (required):** `project:<slug>`, `status:ready`, and exactly one of `severity:high|medium|low`.

Create repo-wide labels once:

```bash
for s in ready in-progress blocked held done; do gh label create "status:$s" --force 2>/dev/null || true; done
for s in high medium low; do gh label create "severity:$s" --force 2>/dev/null || true; done
```
