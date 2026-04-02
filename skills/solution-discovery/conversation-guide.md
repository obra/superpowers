# Conversation Guide — CREATE Mode

This file is the stage-by-stage reference for the CREATE mode conversation. Each stage lists questions (in rounds), gate conditions, skip logic (where applicable), output directives, and state-write directives.

**Project-type context:** Section 00 captures project type (greenfield, extension, or migration). All subsequent stages use this to modify question phrasing. Variations are noted inline.

---

## Stage: PROJECT_IDENTITY

**Round 1 — Who and what:**

1. What's the name of this project or solution?
2. What does it do in one sentence?
3. Who's the primary audience? (Internal team, external customers, mixed)
4. What type of project is this?
   - **Greenfield:** Building a new solution from scratch
   - **Extension:** Adding features to an existing Power Platform solution
   - **Migration:** Moving from another system to Power Platform

**Round 2 — Publisher identity:**

5. What's your Dataverse publisher prefix? (e.g., `sdfx`, `contoso`)
   _If you don't have one yet, I'll help you choose one that follows naming conventions (2–8 lowercase alphanumeric characters)._

**Gate:** Questions 1–4 answered. Question 5 may use a default derived from the project name.

**Validation:** Project name is non-empty. Project type is one of: greenfield, extension, migration. Publisher prefix follows Dataverse naming rules (2–8 lowercase alphanumeric).

**Output:** Write `00-project-identity.md` using the template from `./foundation-formats.md`.

**Update `.discovery-state.json`:** Set `00-project-identity` to `complete`, set `stage` to `REQUIREMENTS`.

---

## Stage: REQUIREMENTS

**Round 1 — Problem and purpose:**

6. What problem does this solution solve? Describe the pain point.
7. How does it solve that problem? What does the solution enable?

**Round 2 — Scope:**

8. What's explicitly in scope?
9. What's explicitly out of scope?

**Round 3 — Scale:**

10. How many users do you expect? (Number or range is fine.)
11. What data volume do you expect? (Records, growth rate — rough order of magnitude.)
12. Single-region or multi-region?

**Project-type variations:**

| Type | Additional question |
|---|---|
| Extension | "What existing capabilities are you extending? List the features or entities being modified." |
| Migration | "What's the source system? Describe its core data structures and processes at a high level." |

**Gate:** Questions 6–9 answered. Questions 10–12 may use "unknown — to be determined" if the developer doesn't have estimates.

**Validation:** Problem statement is non-empty. At least 1 in-scope item.

**Output:** Write `01-requirements.md` using the template from `./foundation-formats.md`.

**Update `.discovery-state.json`:** Set `01-requirements` to `complete`, set `stage` to `ARCHITECTURE`.

---

## Stage: ARCHITECTURE

**Round 1 — App type decision:**

13. Based on the requirements, generate a recommendation using the **architecture-advisor** agent. Present the recommendation:

    > Based on your requirements, I recommend **[app type]**. Here's why: [rationale].
    > - **Model-Driven App:** Best for data-heavy, forms-and-views workflows with role-based access
    > - **Canvas App:** Best for custom UX, mobile-first, or pixel-precise layouts
    > - **Both:** Model-Driven for internal operations + Canvas for field/mobile workers
    > - **Custom (code-based):** Best when platform controls can't meet UX requirements
    >
    > Do you agree with this recommendation, or do you have a different preference?

**Round 2 — Architecture characteristics:**

14. Will this solution need offline capability?
15. Does it need to integrate with external systems? (APIs, legacy databases, third-party services)
16. Are there licensing constraints? (Which Power Platform licenses are available?)

**Project-type variations:**

| Type | Additional question |
|---|---|
| Extension | "What app type does the existing solution use? Will the extension use the same type or add a new one?" |
| Migration | "Does the source system have a web UI, desktop client, or both? What aspects of the UX must be preserved?" |

**Gate:** App type decision confirmed (question 13). Questions 14–16 answered (may be "not applicable").

**Validation:** App type is one of the recognized types.

**Output:** Write `02-architecture-decisions.md` using the template from `./foundation-formats.md`.

**Update `.discovery-state.json`:** Set `02-architecture-decisions` to `complete`, set `stage` to `ENTITY_MAP`.

---

## Stage: ENTITY_MAP

**Round 1 — Entity identification:**

17. [Greenfield] List the main "things" your system needs to track. These become your Dataverse tables. Don't worry about columns yet — just the nouns.
    _(Example: Projects, Tasks, Team Members, Time Entries)_

17. [Extension] What existing Dataverse tables will this extension modify or extend? What new tables do you need to add?

17. [Migration] List the key tables/objects in your source system. I'll help you map them to Dataverse tables.

**Round 2 — Relationship identification:**

18. How do these entities relate to each other? For each relationship:
    - Which entity owns the other (parent-child)?
    - Can the child exist without the parent?
    - Is it one-to-many or many-to-many?

    _Don't worry about getting this perfect — schema-design will refine these. I just need the high-level picture._

**Round 3 — Entity confirmation:**

Present the entity list with relationships as a summary table. Ask the developer to confirm or adjust.

**Gate:** At least 2 entities identified with at least 1 relationship described.

**Validation:** At least 2 entities listed. At least 1 relationship documented.

**Output:** Write `03-entity-map.md` using the template from `./foundation-formats.md`.

**Update `.discovery-state.json`:** Set `03-entity-map` to `complete`, set `stage` to `SOLUTION_PACKAGING`.

---

## Stage: SOLUTION_PACKAGING

This section always produces output — it is not skippable.

**Round 1 — Solution structure:**

19. Will this be a single solution or multiple solutions?
    - **Single solution:** One deployable package containing everything (recommended for most projects)
    - **Multiple solutions:** Separate packages with dependencies (needed for ISV distribution, large-team separation, or layered architecture)

    _For a [project type] project with [N] entities, I'd recommend [single/multiple] because [rationale]._

**Round 2 (if multiple solutions):**

20. Describe the solution boundaries — which components belong in each solution?
21. What's the dependency order? (Which solution must be installed first?)

**Gate:** Packaging decision made (single or multiple). If multiple, boundaries and dependency order documented.

**Validation:** Packaging decision stated. If multiple, at least 2 solutions listed with dependencies.

**Output:** Write `04-solution-packaging.md` using the template from `./foundation-formats.md`.

**Update `.discovery-state.json`:** Set `04-solution-packaging` to `complete`, set `stage` to `UI_PLAN`.

---

## Stage: UI_PLAN (skippable)

**Skip offer:**

> "Next is the UI plan — personas, navigation structure, and app modules. If you'd prefer to define the UI during the ui-design skill instead, I can write a placeholder and move on. Would you like to define the UI plan now, or defer it?"

**If skipping:** Write a placeholder file using the placeholder template from `./foundation-formats.md`. Set section status to `placeholder`.

**If proceeding:**

**Round 1 — Personas:**

22. Who are the distinct user types? For each:
    - Role name (e.g., Project Manager, Team Member, Admin)
    - What they primarily do in the system
    - What data they need to see vs. edit

**Round 2 — Navigation:**

23. Based on your [app type] decision and these personas, here's a suggested app structure: [proposed sitemap/navigation]. Does this match your vision?

**Project-type variations:**

| Type | Additional question |
|---|---|
| Extension | "What does the current app navigation look like? Where do the new features fit?" |
| Migration | "What's the current system's navigation structure? Which aspects should be preserved?" |

**Gate:** At least 1 persona defined. Navigation structure confirmed — or placeholder accepted.

**Validation:** At least 1 persona defined (if not placeholder).

**Output:** Write `05-ui-plan.md` using the template from `./foundation-formats.md`.

**Update `.discovery-state.json`:** Set `05-ui-plan` to `complete` (or `placeholder`), set `stage` to `LOGIC_MAP`.

---

## Stage: LOGIC_MAP (skippable)

**Skip offer:**

> "Next is the logic map — server-side plugins, client scripts, business rules, and automation flows. If you don't have enough detail on business logic yet, I can write a placeholder. Would you like to define the logic map now, or defer it?"

**If skipping:** Write a placeholder file. Set section status to `placeholder`.

**If proceeding:**

**Round 1 — Logic identification:**

24. What business rules or automations does your system need? For each:
    - What triggers it? (Record create, update, delete, manual action, scheduled)
    - What does it do? (Validate, calculate, create related records, notify, integrate)
    - Which entities does it touch?

    _Don't worry about choosing between plugins, flows, or business rules — business-logic will help you pick the right implementation. I just need to know what the logic does._

**Round 2 — Logic summary:**

Present the identified logic items as a numbered list with trigger, action, and entity references. Ask the developer to confirm or adjust.

**Gate:** At least 1 logic item identified — or explicit decision to defer (placeholder).

**Validation:** At least 1 logic item (if not placeholder).

**Output:** Write `06-logic-map.md` using the template from `./foundation-formats.md`.

**Update `.discovery-state.json`:** Set `06-logic-map` to `complete` (or `placeholder`), set `stage` to `INTEGRATION_MAP`.

---

## Stage: INTEGRATION_MAP (skippable)

**Skip offer:**

> "Next is the integration map — external systems, APIs, and data sources that connect to your solution. If your solution doesn't integrate with external systems, I can skip this section. Are there any external integrations?"

**If skipping:** Write a placeholder file. Set section status to `placeholder`.

**If no integrations exist:** Write a section documenting "No external integrations identified." Set status to `complete`.

**If proceeding:**

**Round 1 — Integration identification:**

25. What external systems does this solution connect to? For each:
    - System name and type (API, database, file share, SaaS platform)
    - Direction: Does data flow in, out, or both?
    - Frequency: Real-time, scheduled, or on-demand?
    - Authentication: How do you connect? (API key, OAuth, service account)

**Round 2 — Integration summary:**

Present integrations as a summary table and ask for confirmation.

**Project-type variation:**

| Type | Additional question |
|---|---|
| Migration | "Which integrations from the source system need to be replicated in Power Platform? Are any being replaced or retired?" |

**Gate:** At least 1 integration documented — or explicit confirmation of no external integrations.

**Validation:** At least 1 integration (if not placeholder or "none identified").

**Output:** Write `07-integration-map.md` using the template from `./foundation-formats.md`.

**Update `.discovery-state.json`:** Set `07-integration-map` to `complete` (or `placeholder`), set `stage` to `SECURITY_PROFILE`.

---

## Stage: SECURITY_PROFILE (skippable)

**Skip offer:**

> "Next is the security profile — who can see and do what. If security requirements are still undefined, I can write a placeholder. Would you like to define the security profile now, or defer it?"

**If skipping:** Write a placeholder file. Set section status to `placeholder`.

**If proceeding:**

**Round 1 — Access model:**

26. What security model best describes your needs?
    - **Role-based:** Users are assigned roles that control access (most common)
    - **Team-based:** Access is determined by team membership (for org-unit separation)
    - **Combination:** Role-based with team scoping for row-level access

27. List the security roles you envision. For each:
    - Role name
    - What they can create, read, update, delete (high level)
    - Any data they must NOT see (field-level security candidates)

**Round 2 — Row ownership:**

28. Who "owns" records in your system?
    - Individual users (user-owned tables)
    - Teams (team-owned tables)
    - The organization (org-owned tables — everyone can see everything)

    _Different entities may have different ownership models. List any exceptions._

**Gate:** At least security model type selected (question 26). Role list and ownership model are helpful but may be deferred.

**Validation:** Security model type selected (if not placeholder).

**Output:** Write `08-security-profile.md` using the template from `./foundation-formats.md`.

**Update `.discovery-state.json`:** Set `08-security-profile` to `complete` (or `placeholder`), set `stage` to `CONSTRAINTS`.

---

## Stage: CONSTRAINTS

**Round 1 — Hard constraints:**

29. What are the non-negotiable constraints for this project?
    - Timeline: When must this be delivered?
    - Budget: Any cost limitations? (Licensing, development hours)
    - Licensing: Which Power Platform licenses are available? (Per-user, per-app, premium connectors)
    - Compliance: Any regulatory or compliance requirements? (GDPR, HIPAA, SOX, data residency)
    - Infrastructure: Any constraints on environments, tenants, or deployment?

**Round 2 — Known risks:**

30. Are there any known risks or open questions that need resolution before building?
31. Are there performance requirements? (Response time targets, concurrent user limits)

**Gate:** At least one constraint documented. If the developer says "no constraints," write a section documenting "No constraints identified — revisit when constraints surface."

**Validation:** At least 1 constraint or explicit "none identified" statement.

**Output:** Write `09-constraints.md` using the template from `./foundation-formats.md`.

**Update `.discovery-state.json`:** Set `09-constraints` to `complete`, set `stage` to `REVIEW`.

---

## Stage: REVIEW

**Step 1 — Present the foundation summary.**

Use this format:

```
Foundation Summary for [Project Name]
=====================================

00 Project Identity ✓
   [project name] — [one-line description]
   Type: [greenfield/extension/migration] | Prefix: [publisher prefix]

01 Requirements ✓
   [problem statement, first 80 chars]
   Scope: [N] in-scope items, [M] out-of-scope items
   Scale: [users] users, [volume] records

02 Architecture Decisions ✓
   App type: [type] | Offline: [yes/no] | External integrations: [yes/no]

03 Entity Map ✓
   [N] entities identified, [M] relationships documented

04 Solution Packaging ✓
   [Single solution / N solutions with dependencies]

05 UI Plan [✓ / ⊘ placeholder]
   [N] personas, [M] app modules defined

06 Logic Map [✓ / ⊘ placeholder]
   [N] logic items: [X] plugins, [Y] flows, [Z] business rules

07 Integration Map [✓ / ⊘ placeholder / ✕ none]
   [N] external integrations documented

08 Security Profile [✓ / ⊘ placeholder]
   Model: [role-based/team-based/combination], [N] roles defined

09 Constraints ✓
   [N] constraints documented, [M] risks identified

---
All sections confirmed? [yes / request changes]
```

**Step 2 — Run cross-section consistency checks.**

| Check | Sections | What it catches |
|---|---|---|
| Entity references | 03, 05, 06, 07, 08 | Logic map, UI plan, integration map, or security profile references an entity not in the entity map |
| App type alignment | 02, 05 | UI plan describes navigation for a different app type than the architecture decision |
| Integration alignment | 02, 07 | Architecture says "no external integrations" but integration map has entries (or vice versa) |
| Persona-role alignment | 05, 08 | UI plan personas don't map to any security role, or security roles have no corresponding persona |

Present any issues as **warnings** (not errors). Ask the developer to resolve or acknowledge each.

**Step 3 — If changes requested:** Return to the specific stage, update the section file, return to REVIEW, re-present the summary.

**Gate:** Developer explicitly confirms the foundation is complete and accurate.

**Update `.discovery-state.json`:** Set `stage` to `COMPLETE`.

---

## Stage: COMPLETE

**Step 1 — Determine the downstream skill suggestion.**

```
IF solution packaging is multi-solution → suggest solution-strategy
  "Your packaging has [N] solutions with dependencies. I'd suggest running
   solution-strategy next to finalize the dependency graph and layering."

ELSE IF entity map has 5+ entities → suggest application-design
  "Your entity map has [N] entities. DDD modeling in application-design will
   help organize these into bounded contexts before schema work begins."

ELSE → suggest application-design (default)
  "Based on your foundation, I'd suggest application-design next to model
   your domain before moving to schema-design."
```

**Step 2 — Present other options:**

```
Other options:
  - schema-design — jump straight to data modeling
  - ui-design — start designing the user interface
  - Any other skill — the foundation supports all downstream skills
```

**Step 3 — Wait for explicit developer confirmation.** Do not auto-start the next skill.

**Update `.discovery-state.json`:** Set `stage` to `COMPLETE`, set all section statuses to their final values.
