# Foundation Formats

This file contains the exact templates for all `.foundation/` output files. Read this file before writing any section file. Use these templates verbatim — replace `[bracketed]` values with actual content.

---

## Foundation Directory Structure

```
.foundation/
  .discovery-state.json          ← state tracker
  00-project-identity.md
  01-requirements.md
  02-architecture-decisions.md
  03-entity-map.md
  04-solution-packaging.md
  05-ui-plan.md
  06-logic-map.md
  07-integration-map.md
  08-security-profile.md
  09-constraints.md
```

## Standard Header

Every section file begins with this header:

```markdown
# [Section Title]

**Status:** [Complete | Placeholder — not yet completed]
**Written by:** solution-discovery [CREATE | UPDATE], [date]
**Project:** [project name]

---
```

---

## Section Templates

### 00-project-identity.md

```markdown
# Project Identity

**Status:** Complete
**Written by:** solution-discovery CREATE, [date]
**Project:** [project name]

---

**Project name:** [name]
**Solution prefix:** [publisher prefix, e.g., sdfx_]
**One-line description:** [what it does]
**Primary audience:** [internal | external | mixed]
**Project type:** [greenfield | extension | migration]
```

### 01-requirements.md

```markdown
# Requirements

**Status:** Complete
**Written by:** solution-discovery CREATE, [date]
**Project:** [project name]

---

## Problem Statement

[What pain point this solution addresses]

## Purpose

[How the solution solves the problem]

## Scope

### In Scope

- [explicit list]

### Out of Scope

- [explicit list]

## Scale

- Expected users: [number or range]
- Expected data volume: [records, growth rate]
- Geographic distribution: [single region | multi-region]

## Extension Context
_(Extension projects only — omit for greenfield)_

- Existing capabilities being extended: [list]
- Entities being modified: [list]

## Migration Context
_(Migration projects only — omit for greenfield)_

- Source system: [name and type]
- Core source data structures: [high-level description]
```

### 02-architecture-decisions.md

```markdown
# Architecture Decisions

**Status:** Complete
**Written by:** solution-discovery CREATE, [date]
**Project:** [project name]

---

## App Type

**Decision:** [Model-Driven App | Canvas App | Both | Custom (code-based)]
**Rationale:** [why this type was chosen]

## Platform Characteristics

- Offline capability: [yes | no | not determined]
- External integrations: [yes | no]
- Licensing tier: [per-user | per-app | premium | not determined]

## Architecture Notes

[Any additional architecture context — integration patterns, known constraints, migration-specific UX preservation needs]
```

### 03-entity-map.md

```markdown
# Entity Map

**Status:** Complete
**Written by:** solution-discovery CREATE, [date]
**Project:** [project name]

---

## Entities

| Entity Name | Description | Ownership |
|---|---|---|
| [name] | [what it represents] | [user | team | org] |

## Relationships

| Parent | Child | Type | Cascade | Notes |
|---|---|---|---|---|
| [parent entity] | [child entity] | [1:N | N:N] | [TBD — refined in schema-design] | [context] |
```

### 04-solution-packaging.md

```markdown
# Solution Packaging

**Status:** Complete
**Written by:** solution-discovery CREATE, [date]
**Project:** [project name]

---

## Packaging Decision

**Structure:** [Single solution | Multiple solutions]
**Rationale:** [why this structure was chosen]

## Solutions
_(For multi-solution only — single-solution lists one entry)_

| Solution Name | Contains | Dependencies |
|---|---|---|
| [name] | [component types / entity groups] | [prerequisite solutions] |

## Deployment Notes

[Any packaging-specific notes — ISV considerations, layering strategy, managed vs. unmanaged]
```

### 05-ui-plan.md

```markdown
# UI Plan

**Status:** [Complete | Placeholder — not yet completed]
**Written by:** solution-discovery CREATE, [date]
**Project:** [project name]

---

## Personas

| Persona | Role | Primary Activities | Data Access |
|---|---|---|---|
| [name] | [role title] | [what they do] | [what they see / edit] |

## Navigation Structure

[App modules, sitemap areas, navigation description — varies by app type]

## Extension Notes
_(Extension projects only)_

- Current navigation: [description]
- Where new features fit: [placement within existing navigation]
```

### 06-logic-map.md

```markdown
# Logic Map

**Status:** [Complete | Placeholder — not yet completed]
**Written by:** solution-discovery CREATE, [date]
**Project:** [project name]

---

## Logic Items

| # | Trigger | Action | Entities | Notes |
|---|---|---|---|---|
| 1 | [what triggers it] | [what it does] | [which entities] | [context] |

_Implementation type (plugin, flow, business rule, client script) is determined by the business-logic skill — this map captures what the logic does, not how it's implemented._
```

### 07-integration-map.md

```markdown
# Integration Map

**Status:** [Complete | Placeholder — not yet completed | No external integrations identified]
**Written by:** solution-discovery CREATE, [date]
**Project:** [project name]

---

## Integrations

| # | System | Type | Direction | Frequency | Auth |
|---|---|---|---|---|---|
| 1 | [system name] | [API/DB/SaaS/file] | [in/out/both] | [real-time/scheduled/on-demand] | [method] |

## Migration Integration Notes
_(Migration projects only)_

- Integrations being replicated: [list]
- Integrations being retired: [list]
```

### 08-security-profile.md

```markdown
# Security Profile

**Status:** [Complete | Placeholder — not yet completed]
**Written by:** solution-discovery CREATE, [date]
**Project:** [project name]

---

## Security Model

**Type:** [role-based | team-based | combination]

## Roles

| Role | Create | Read | Update | Delete | Notes |
|---|---|---|---|---|---|
| [role name] | [scope] | [scope] | [scope] | [scope] | [field-level restrictions, special access] |

_Scope values: all, own, business unit, none, or entity-specific overrides._

## Record Ownership

| Entity | Ownership Type | Rationale |
|---|---|---|
| [entity name] | [user | team | organization] | [why this model] |
```

### 09-constraints.md

```markdown
# Constraints

**Status:** Complete
**Written by:** solution-discovery CREATE, [date]
**Project:** [project name]

---

## Hard Constraints

- **Timeline:** [delivery date or "not defined"]
- **Budget:** [cost limitations or "not defined"]
- **Licensing:** [available licenses or "not determined"]
- **Compliance:** [regulatory requirements or "none identified"]
- **Infrastructure:** [environment/tenant constraints or "none identified"]

## Performance Requirements

- Response time targets: [if defined]
- Concurrent user limits: [if defined]

## Known Risks

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| 1 | [description] | [what happens if it occurs] | [how to address] |
```

---

## Placeholder Template

Use this template for any skipped section. Downstream skills detect placeholders by checking for the `**Status:** Placeholder` line.

```markdown
# [Section Title]

**Status:** Placeholder — not yet completed
**Skipped during:** solution-discovery CREATE, [date]
**Reason:** [developer's stated reason or "deferred to later"]

---

_This section will be completed when the developer runs solution-discovery in UPDATE mode or when the consuming skill requests it._
```
