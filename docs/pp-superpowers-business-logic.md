# pp-superpowers — business-logic Skill Specification

**Version:** 1.0
**Date:** April 1, 2026
**Author:** SDFX Studios
**Status:** Approved for build
**Parent document:** pp-superpowers Design Roadmap v1.0

---

## 1. Skill Overview

| Attribute | Value |
|---|---|
| **Name** | business-logic |
| **Domain** | Power Platform business logic across all implementation types: C# plugins, Power Automate flows, business rules, and client scripts |
| **Lifecycle group** | Build |
| **Has sub-skills** | Yes — 4 sub-skills routed by logic type from `06-logic-map.md` |
| **Foundation sections consumed** | `00-project-identity`, `01-requirements`, `02-architecture-decisions`, `06-logic-map.md` |
| **Physical model consumed** | `docs/schema-physical-model.md` (entity relationships, column types, cascade behaviors) |
| **DDD model consumed** | `docs/ddd-model.md` (domain events as trigger sources, aggregate boundaries for plugin scope) |
| **UI form event map consumed** | `docs/ui-form-event-map.md` (client script requirements from ui-design) |
| **Upstream dependency** | schema-design (physical model must exist); ui-design (form event map recommended) |
| **Downstream handoff** | testing, deployment |
| **Agents** | plugin-auditor |

### 1.1 Router Philosophy

business-logic is a **router skill** governed by the same three architectural decisions as ui-design:

1. **Meaningful conversation before dispatch** — the router gathers context through a structured conversation before routing to any sub-skill. `06-logic-map.md` captures declared requirements; the conversation captures implementation priorities, constraints, and any requirements that have shifted since the foundation was last updated.
2. **Developer chooses sub-skills and sequence** — the router maps logic types in `06-logic-map.md` to available sub-skills, presents the options, and the developer selects and sequences. The router does not auto-dispatch.
3. **Sub-skills are fully self-contained** — each sub-skill's SKILL.md contains its complete stage sequence including REVIEW. No stage inheritance from the router.

### 1.2 Sub-skill Summary

| Sub-skill | Logic type | Output artifacts | Development-heavy? |
|---|---|---|---|
| `csharp-plugin` | Server-side C# logic registered on Dataverse entity messages | Plugin class code, registration spec, test stubs | Yes |
| `power-automate` | Automated workflows triggered by Dataverse events or schedules | Flow design doc + Excalidraw flow diagram | No |
| `business-rule` | Declarative table-level rules (field visibility, required, default, validation) | Business rule configuration spec | No |
| `client-script` | JavaScript running in the browser context on MDA forms | Form script files, Jest test stubs, manual test checklist | Yes |

### 1.3 Relationship to Other Skills

**Upstream:** schema-design produces `docs/schema-physical-model.md` — entity relationships, column types, and cascade behaviors that inform plugin trigger design, flow trigger configuration, and business rule scope. ui-design produces `docs/ui-form-event-map.md` — the pre-analyzed list of form events that drives client-script sub-skill dispatch. If the form event map is absent, client-script discovery happens from scratch during the sub-skill conversation.

**Downstream:** business-logic produces C# plugin classes and test stubs (consumed by testing), flow design documents (consumed by deployment), and client script files (consumed by deployment and testing). deployment reads the complete output inventory for solution packaging.

**DDD model consumption:** `docs/ddd-model.md` provides domain events — the conceptual triggers (e.g., "Project Approved", "Task Overdue") that map to concrete plugin registrations and flow triggers. If the DDD model is absent, trigger mapping is derived from the physical model's entity relationships and the logic map directly.

**Cross-skill signals:** If the context conversation or logic-map analysis reveals requirements that belong to a different domain (e.g., a logic requirement that is really a UI concern, or an integration requirement that belongs in the integration skill), business-logic flags the signal and suggests the appropriate skill without executing the out-of-scope requirement.

### 1.4 Boundary: business-logic vs. integration

Power Automate flows that **trigger on Dataverse events and operate within the solution's data domain** belong in business-logic. Power Automate flows that **call external connectors or act as integration bridges** belong in the integration skill. The decision point: if the flow's primary purpose is to automate an internal process, it's business-logic. If its primary purpose is to push or pull data from an external system, it's integration.

---

## 2. Router State Machine

```
INIT → CONTEXT_GATHER → SUB_SKILL_SELECTION → [SUB_SKILL_EXECUTION loop] → INTEGRATION_REVIEW → COMPLETE
```

### 2.1 Router Stage Definitions

| Stage | Purpose | Gate to enter | Can skip? |
|---|---|---|---|
| INIT | Read all inputs, detect re-entry, check prerequisites | Foundation exists | No |
| CONTEXT_GATHER | Meaningful conversation: implementation priorities, constraints, logic map currency | INIT complete | No |
| SUB_SKILL_SELECTION | Map logic map entries to sub-skills, developer selects and sequences | CONTEXT_GATHER complete | No |
| SUB_SKILL_EXECUTION | Run selected sub-skills in chosen order (each is self-contained) | SUB_SKILL_SELECTION complete | No |
| INTEGRATION_REVIEW | Cross-sub-skill consistency review | All selected sub-skills complete | Yes — if only one sub-skill was run |
| COMPLETE | Write completion state, produce output inventory, suggest testing | INTEGRATION_REVIEW complete (or skipped) | No |

### 2.2 Progress Tracking

```json
{
  "activeSkill": "business-logic",
  "activeStage": "SUB_SKILL_EXECUTION",
  "activeSubSkill": "csharp-plugin",
  "subSkillQueue": ["csharp-plugin", "client-script"],
  "completedSubSkills": [],
  "stageHistory": [
    { "stage": "INIT", "completedAt": "2026-04-01T10:00:00Z" },
    { "stage": "CONTEXT_GATHER", "completedAt": "2026-04-01T10:12:00Z" },
    { "stage": "SUB_SKILL_SELECTION", "completedAt": "2026-04-01T10:15:00Z" },
    { "stage": "SUB_SKILL_EXECUTION", "startedAt": "2026-04-01T10:16:00Z" }
  ],
  "lastCompleted": "ui-design",
  "suggestedNext": null,
  "completedSkills": ["solution-discovery", "application-design", "schema-design", "ui-design"]
}
```

On session resume:

> "You're in business-logic, currently working on: **csharp-plugin**. You're at the DESIGN stage. Your client-script work is queued next. Want to pick up where you left off?"

---

## 3. Router Conversation Flow and Gating Logic

### 3.1 Stage: INIT

**Gate:** Foundation directory exists with at minimum `00-project-identity.md`, `01-requirements.md`, and `06-logic-map.md`. If `06-logic-map.md` is absent, warn: "No logic map found. I'll proceed but all logic type routing will require manual input. Consider whether your foundation has a logic map section that needs to be populated."

**Action:**
1. Read foundation sections: `00-project-identity.md`, `01-requirements.md`, `02-architecture-decisions.md`, `06-logic-map.md`
2. Read `docs/schema-physical-model.md` — if absent, warn: "No physical model found. Plugin and flow trigger design will require manual entity and relationship input."
3. Read `docs/ddd-model.md` — if present, extract domain events for trigger mapping
4. Read `docs/ui-form-event-map.md` — if present, note client script requirements for client-script sub-skill dispatch. If absent, note: "No form event map. Client script event discovery will happen during the sub-skill conversation."
5. Check for existing business-logic artifacts — if found, offer re-entry

**Re-entry presentation (if artifacts found):**

> "I found existing business-logic artifacts:
>
> - [Sub-skill name]: `[artifact path]` (last updated [date])
>
> How would you like to proceed?
> - **Continue** — pick up from where we left off
> - **Add sub-skill** — keep existing work, implement an additional logic type
> - **Revise** — revisit a completed sub-skill"

### 3.2 Stage: CONTEXT_GATHER

**Purpose:** Understand implementation priorities, any constraints not in the foundation, and whether the logic map is current.

**Presentation:**

> "I've loaded your foundation, logic map, and physical model. Before we start implementing business logic for **[Project Name]**, I want to make sure I understand where you are.
>
> A few questions:
>
> 1. **What are you implementing today?** Starting fresh, continuing existing work, or adding to what's already built?
> 2. **Any constraints I should know about?** (Performance requirements, plugin execution context restrictions, flow license tier, specific Dataverse environment version?)
> 3. **Is the logic map current?** It was last updated [date]. Any requirements that have been added or changed since then?
>
> If the foundation is current and you want to go straight to sub-skill selection, just say so."

**Gate:** Developer confirms or updates context. Logic map currency confirmed.

### 3.3 Stage: SUB_SKILL_SELECTION

**Action:**
1. Read `06-logic-map.md` and classify each entry by logic type
2. Map classified entries to available sub-skills
3. Apply business-rule complexity gate (see §7.3) to any business rule candidates — redirect over-complex rules before they reach the sub-skill
4. Present the sub-skill map to the developer

**Presentation:**

> "Based on your logic map, here's what needs to be built:
>
> | Sub-skill | Requirements | Status |
> |---|---|---|
> | **csharp-plugin** | [N] plugin requirements from logic map | Not started |
> | **power-automate** | [N] flow requirements | Not started |
> | **business-rule** | [N] business rule requirements ([X] flagged for complexity review) | Not started |
> | **client-script** | [N] client script requirements ([from form event map / from logic map]) | Not started |
>
> Complexity gate: [If any business rules were redirected] I've flagged [N] business rule requirements as exceeding business rule capabilities. These have been moved to csharp-plugin or client-script — see note below.
>
> Which sub-skills do you want to work on today, and in what order?"

**Gate:** Developer selects and sequences. The queue is written to `.pp-context/skill-state.json`.

### 3.4 Stage: INTEGRATION_REVIEW

**Condition:** Only runs if two or more sub-skills were completed in this session.

**Action:** Review cross-sub-skill consistency:
- No duplicate logic (same requirement implemented in both a plugin and a business rule)
- Client scripts and plugins that operate on the same entity are not creating conflicting behaviors (e.g., a plugin that sets a field value the client script also sets)
- Flow triggers do not overlap with plugin triggers on the same entity/message in ways that would cause double-execution

**Presentation:**

> "You've completed implementations for [list]. Running a cross-logic consistency check."

### 3.5 Stage: COMPLETE

**Action:**
1. Write `docs/business-logic-inventory.md` — the output manifest listing all implemented logic with types, entity scope, and artifact paths
2. Update `.pp-context/skill-state.json` with completion state

**Presentation:**

> "Business logic implementation is complete. Here's the inventory:
>
> - [N] C# plugin classes across [M] entities
> - [N] Power Automate flow designs
> - [N] business rules
> - [N] client scripts
>
> **Suggested next:** testing — your plugin test stubs and client script test files are ready for the testing skill to expand. Alternatively, deployment if you're ready to package."

---

## 4. Sub-skill: csharp-plugin

### 4.1 Overview

Designs and scaffolds C# plugin classes registered on Dataverse entity messages. Development-heavy — produces plugin class code, registration specifications, and test stubs. The plugin-auditor agent (§11) runs during REVIEW.

### 4.2 State Machine

```
INIT → DISCOVERY → DESIGN → SCAFFOLD → IMPLEMENT → TEST → REVIEW → COMPLETE
```

### 4.3 Stage Definitions

| Stage | Purpose | Can skip? |
|---|---|---|
| INIT | Load logic map plugin requirements, physical model relationships, domain events | No |
| DISCOVERY | For each requirement: determine entity, message, stage, execution context | No |
| DESIGN | Plugin class structure, IOrganizationService usage pattern, error handling approach | No |
| SCAFFOLD | Generate plugin class stubs, .csproj references, registration spec | No |
| IMPLEMENT | Logic implementation guidance per plugin class | No |
| TEST | Generate unit test stubs with FakeXrmEasy or mock pattern | No |
| REVIEW | plugin-auditor agent: full audit against Dataverse plugin best practices | No |
| COMPLETE | Write `docs/bl-plugin-[name].md`, update business logic inventory | No |

### 4.4 Conversation Flow

#### INIT

**Action:** Read `06-logic-map.md` plugin requirements. Read `docs/schema-physical-model.md` for entity relationships and cascade behaviors. Read `docs/ddd-model.md` for domain events if available.

**Presentation:**

> "Starting csharp-plugin design for **[Project Name]**. From your logic map, I see [N] plugin requirements:
>
> | Requirement | Entity | Trigger | Type |
> |---|---|---|---|
> | [name] | [entity] | [Create / Update / Delete / etc.] | [Validation / Calculation / Integration prep / etc.] |
>
> [If DDD model available:] Domain events from your DDD model that map to plugin triggers:
> | Domain event | Suggested plugin trigger |
> |---|---|
> | [event] | [entity] [message] [stage] |
>
> Any plugin requirements from the logic map I've missed, or domain events that should become plugins?"

**Gate:** Developer confirms the complete plugin requirement list.

#### DISCOVERY

**Action:** For each plugin requirement, determine the five registration parameters through structured conversation.

**Presentation (per plugin):**

> "**Plugin: [Requirement Name]**
>
> Let's determine the registration:
>
> 1. **Entity:** Which Dataverse table does this execute against? [suggest from logic map]
> 2. **Message:** Create / Update / Delete / Retrieve / RetrieveMultiple / Associate / Disassociate / Custom? [suggest]
> 3. **Stage:** Pre-Validation (before DB write, can throw) / Pre-Operation (before DB write, can modify) / Post-Operation (after DB write, async option)?
> 4. **Execution mode:** Synchronous / Asynchronous? [note: async for Post-Operation only]
> 5. **Filtering attributes (Update only):** Which specific columns trigger this — or always fire on any update?
>
> Registration: [entity] [message] [stage] [sync/async][, filtered on: [columns]]"

**Gate:** Developer confirms registration parameters for each plugin.

#### DESIGN

**Action:** Design the plugin class structure for each confirmed registration.

**Presentation (per plugin):**

> "**[Plugin Name] — Class Design**
>
> ```
> [PluginName] : IPlugin
> ├── Execute(IServiceProvider serviceProvider)
> │   ├── Extract context (IPluginExecutionContext)
> │   ├── Get service factory + service
> │   ├── Get tracing service
> │   └── [Core logic method]
> │       ├── [Method 1: validation / calculation / etc.]
> │       └── [Method 2: if complex enough to split]
> ```
>
> **Error handling approach:**
> - Validation failures: throw InvalidPluginExecutionException (surfaces to user as dialog)
> - System errors: throw InvalidPluginExecutionException with logging via tracing service
> - Never swallow exceptions silently
>
> **IOrganizationService usage:**
> - [List of entity operations this plugin performs: Create, Update, Retrieve, etc.]
> - [Note any N+1 query risks — retrievals inside loops]
>
> Does this structure match the requirement?"

**Gate:** Developer confirms class design.

#### SCAFFOLD

**Action:** Generate the plugin class stub and registration specification.

**Presentation:**

> "**Scaffold: [Plugin Name]**
>
> Plugin class stub:
> ```csharp
> using Microsoft.Xrm.Sdk;
> using System;
>
> namespace [Namespace].Plugins
> {
>     [CrmPluginRegistration(
>         MessageNameEnum.[Message],
>         "[EntityLogicalName]",
>         StageEnum.[Stage],
>         ExecutionModeEnum.[Mode],
>         "[FilteringAttributes]",
>         "[PluginName] Step",
>         1000,
>         IsolationModeEnum.Sandbox)]
>     public class [PluginName] : IPlugin
>     {
>         public void Execute(IServiceProvider serviceProvider)
>         {
>             var context = (IPluginExecutionContext)
>                 serviceProvider.GetService(typeof(IPluginExecutionContext));
>             var serviceFactory = (IOrganizationServiceFactory)
>                 serviceProvider.GetService(typeof(IOrganizationServiceFactory));
>             var service = serviceFactory.CreateOrganizationService(context.UserId);
>             var tracingService = (ITracingService)
>                 serviceProvider.GetService(typeof(ITracingService));
>
>             try
>             {
>                 // [Core logic — to be implemented]
>             }
>             catch (InvalidPluginExecutionException)
>             {
>                 throw;
>             }
>             catch (Exception ex)
>             {
>                 tracingService.Trace($"[PluginName] error: {ex.Message}");
>                 throw new InvalidPluginExecutionException(ex.Message, ex);
>             }
>         }
>     }
> }
> ```
>
> **Registration spec** (for spkl or PAC CLI registration):
> | Field | Value |
> |---|---|
> | Entity | [logical name] |
> | Message | [message] |
> | Stage | [stage number: 10/20/40] |
> | Mode | [0=sync / 1=async] |
> | Filtering attributes | [comma-separated logical names or empty] |
> | Rank | 1000 |
> | Isolation mode | Sandbox |"

**Gate:** Developer confirms scaffold output.

#### IMPLEMENT

**Action:** Provide implementation guidance for the core logic of each plugin.

**Presentation (per plugin):**

> "**[Plugin Name] — Implementation Guidance**
>
> **Pre-image / Post-image requirements:**
> - Pre-image needed? [Yes/No — needed when comparing old vs. new values on Update]
> - Post-image needed? [Yes/No — needed when reading the final committed state on Post-Operation]
>
> **Target entity access:**
> ```csharp
> var target = context.InputParameters.Contains("Target")
>     ? context.InputParameters["Target"] as Entity
>     : null;
> ```
>
> **Core logic pattern:**
> [Step-by-step implementation notes per requirement — e.g., "Read [column] from target. If null, throw validation error: '[message]'. Otherwise, query [related entity] to verify [condition]."]
>
> **Performance notes:**
> - [Any N+1 risks identified in DESIGN stage and how to resolve them]
> - [Any large dataset operations that should be bounded or paginated]"

#### TEST

**Action:** Generate unit test stubs using FakeXrmEasy (or equivalent mock pattern if FakeXrmEasy is not in the project).

**Presentation:**

> "**Test Stubs: [Plugin Name]**
>
> ```csharp
> using FakeXrmEasy;
> using Microsoft.Xrm.Sdk;
> using Xunit;
>
> namespace [Namespace].Tests
> {
>     public class [PluginName]Tests
>     {
>         private readonly XrmFakedContext _context;
>
>         public [PluginName]Tests()
>         {
>             _context = new XrmFakedContext();
>         }
>
>         [Fact]
>         public void [PluginName]_[Scenario]_[ExpectedOutcome]()
>         {
>             // Arrange
>             var target = new Entity("[entitylogicalname]")
>             {
>                 // Set fields that trigger the plugin logic
>             };
>
>             // Act
>             _context.ExecutePluginWithTarget<[PluginName]>(target);
>
>             // Assert
>             // [Verify expected state changes]
>         }
>
>         [Fact]
>         public void [PluginName]_[InvalidScenario]_ThrowsInvalidPluginExecutionException()
>         {
>             // Arrange + Act + Assert pattern for validation failure cases
>         }
>     }
> }
> ```
>
> Test scenarios to cover: [list of happy path + failure path scenarios from the requirement]"

#### REVIEW

**Action:** Dispatch **plugin-auditor** agent. This is the full `dataverse-csharp-plugin-audit` capability promoted to an agent (see §11 for complete agent specification).

**Presentation:**

> "Running plugin audit on [N] plugin classes. This is a comprehensive review covering security, performance, schema correctness, and architecture."

The plugin-auditor returns a scored review (1–100) with findings grouped as HIGH / MEDIUM / LOW.

**Gate:** All HIGH findings must be resolved or explicitly accepted with documented rationale before marking COMPLETE.

#### COMPLETE

Write `docs/bl-plugin-[name].md` per plugin class. Update `docs/business-logic-inventory.md`.

---

## 5. Sub-skill: power-automate

### 5.1 Overview

Designs Power Automate flows that automate internal business processes triggered by Dataverse events or schedules. Produces a design document and an Excalidraw flow diagram. Does not produce runnable flow definitions — flows are configured in the Power Automate designer. Scope: internal automation only. External integration flows belong in the integration skill.

### 5.2 State Machine

```
INIT → DISCOVERY → DESIGN → DIAGRAM → TEST → REVIEW → COMPLETE
```

### 5.3 Stage Definitions

| Stage | Purpose | Can skip? |
|---|---|---|
| INIT | Load logic map flow requirements, identify trigger types | No |
| DISCOVERY | For each requirement: trigger, condition, action sequence, error path | No |
| DESIGN | Structured flow specification: trigger config, steps, branches, error handling | No |
| DIAGRAM | Generate Excalidraw flow diagram from confirmed design | No |
| TEST | Define test scenarios and manual test checklist | No |
| REVIEW | Review spec completeness and platform best practices | No |
| COMPLETE | Write `docs/bl-flow-[name].md`, update business logic inventory | No |

### 5.4 Conversation Flow

#### INIT

**Presentation:**

> "Starting power-automate design. From your logic map, I see [N] flow requirements:
>
> | Requirement | Trigger type | Scope |
> |---|---|---|
> | [name] | [Dataverse row change / Scheduled / Manual / HTTP request] | [internal / boundary check needed] |
>
> Boundary check: I've confirmed these flows operate within your solution's data domain. [If any are boundary cases:] The following may belong in integration — let's clarify before proceeding: [list]"

**Gate:** Developer confirms flow scope and boundary.

#### DISCOVERY

**Action:** For each flow requirement, work through trigger, conditions, action sequence, and error handling.

**Presentation (per flow):**

> "**Flow: [Requirement Name]**
>
> 1. **Trigger:** When does this flow start?
>    - Dataverse: When a row is added / modified / deleted on [entity]
>    - Scheduled: Every [interval]
>    - Manual: Run on demand from [context]
>
> 2. **Trigger filters (Dataverse only):** Filter rows / Filter columns — or run on every event?
>
> 3. **Conditions:** Does the flow branch based on data conditions? What are the branches?
>
> 4. **Action sequence:** What does the flow do, in order?
>    - [Action 1: Get row / Create row / Update row / Send email / Approval / etc.]
>    - [Action 2: ...]
>
> 5. **Error handling:** What happens if an action fails?
>    - Retry policy? Configure run after (failed / skipped)?
>    - Send notification to administrator on failure?
>
> 6. **Concurrency:** Can multiple instances run simultaneously, or should they be limited?"

**Gate:** Developer confirms all flow parameters.

#### DESIGN

**Action:** Produce a structured flow specification document.

**Presentation:**

> "**Flow Specification: [Flow Name]**
>
> | Attribute | Value |
> |---|---|
> | Trigger | [trigger type + config] |
> | Environment | [solution name — flows should be solution-aware] |
> | Connection references | [list of connection references, not hardcoded connections] |
>
> **Step sequence:**
> | Step | Type | Action | On failure |
> |---|---|---|---|
> | 1 | Trigger | [Dataverse: row modified — entity: [name], filter: [columns]] | N/A |
> | 2 | Condition | [Check [field] equals [value]] | N/A |
> | 3 | Action | [Get related row — entity: [name], row ID: [source]] | Terminate / Retry |
> | 4 | Action | [Update row — entity: [name], field: [name], value: [expression]] | Terminate |
> | [N] | Error handler | Send email to admin with flow run URL | N/A |
>
> **Connection reference requirements:**
> | Connection reference | Connector | Purpose |
> |---|---|---|
> | [ref name] | Dataverse | [what it does in this flow] |
>
> Does this specification capture the full flow logic?"

**Gate:** Developer confirms flow specification.

#### DIAGRAM

**Action:** Generate an Excalidraw flow diagram from the confirmed specification. The diagram shows trigger, decision branches, action steps, and error paths using standard flowchart notation.

**Presentation:**

> "Generating Excalidraw flow diagram for [Flow Name]."

[Excalidraw diagram generated — trigger node, condition diamonds, action rectangles, error path branches]

#### TEST

**Action:** Define test scenarios and produce a manual test checklist (flows cannot be unit tested without a live environment).

**Presentation:**

> "**Test Plan: [Flow Name]**
>
> Since Power Automate flows run in a live environment, testing is manual. Test scenarios:
>
> | Scenario | Setup | Expected outcome | Pass/Fail |
> |---|---|---|---|
> | Happy path | [Create/update a [entity] record with [field] = [value]] | [Flow runs, [result] happens] | |
> | Condition branch — false | [Setup that takes the false branch] | [Expected outcome for false branch] | |
> | Trigger filter — excluded | [Setup that should NOT trigger the flow] | Flow does not run | |
> | Error path | [Setup that causes [action N] to fail] | Error notification sent to admin | |
>
> **Manual test checklist:**
> - [ ] Flow is solution-aware (inside a solution, not personal flows)
> - [ ] Connection references used (not hardcoded connections)
> - [ ] Run history shows successful execution for happy path
> - [ ] Error path confirmed by intentionally failing [action N]
> - [ ] Concurrency limit verified (if configured)"

#### REVIEW

**Stage 1 — Spec compliance:**
- All trigger parameters are fully specified (no "TBD" in trigger config)
- All connection references named (no hardcoded connections)
- Error handling defined for every action step that can fail
- Flow is solution-aware

**Stage 2 — Quality:**
- Flows do not perform unbounded loops over large Dataverse datasets (use pagination or Apply to each with care)
- Scheduled flows have appropriate concurrency limits
- No secrets or credentials in flow expressions (use environment variables or connection references)
- Flow names follow naming convention: `[solution prefix] - [Entity] - [Action]`

#### COMPLETE

Write `docs/bl-flow-[name].md`. Update `docs/business-logic-inventory.md`.

---

## 6. Sub-skill: business-rule

### 6.1 Overview

Designs declarative business rules configured on Dataverse tables. Business rules execute on the client (form) and optionally server-side. They are intentionally limited in capability. A hard complexity gate at the router level redirects over-complex requirements before they reach this sub-skill.

### 6.2 Complexity Gate (Hard Gate)

Before any business rule enters the sub-skill, the router applies a complexity gate at SUB_SKILL_SELECTION. Requirements are redirected if they exceed business rule capabilities.

**Business rule capabilities (within scope):**
- Show / hide fields based on field values
- Enable / disable (lock) fields based on field values
- Set field values based on conditions (simple expressions, no cross-record lookups)
- Set field required level (required / not required / recommended) based on conditions
- Validate field values and show error messages
- Run on form load, save, or field change events

**Redirected to csharp-plugin if:**
- Logic requires cross-entity data (lookup to another table, aggregate calculation)
- Logic requires complex branching (more than 3 nested conditions)
- Logic must run server-side only and enforce without form bypass
- Logic requires reading data not on the current record

**Redirected to client-script if:**
- Logic requires JavaScript-level form interaction (dynamic control manipulation beyond show/hide)
- Logic requires reading form context (tab structure, section visibility)

**Gate presentation:**

> "Complexity check — business rule requirements from your logic map:
>
> | Requirement | Decision | Reason | Redirected to |
> |---|---|---|---|
> | [requirement] | IN SCOPE | Simple field visibility rule | business-rule |
> | [requirement] | REDIRECTED | Requires cross-entity calculation | csharp-plugin |
> | [requirement] | REDIRECTED | Needs JavaScript form context | client-script |
>
> The [N] redirected requirements have been added to the csharp-plugin and client-script queues. Proceeding with [N] in-scope business rules."

### 6.3 State Machine

```
INIT → DISCOVERY → DESIGN → CONFIGURE → REVIEW → COMPLETE
```

### 6.4 Stage Definitions

| Stage | Purpose | Can skip? |
|---|---|---|
| INIT | Load in-scope business rule requirements (post complexity gate) | No |
| DISCOVERY | For each rule: entity, scope, trigger event, conditions, actions | No |
| DESIGN | Complete rule specification: condition tree, action set | No |
| CONFIGURE | Step-by-step configuration guidance for the Power Apps maker portal | No |
| REVIEW | Spec compliance + quality | No |
| COMPLETE | Write `docs/bl-rule-[entity].md`, update business logic inventory | No |

### 6.5 Conversation Flow

#### DISCOVERY

**Presentation (per rule):**

> "**Business Rule: [Requirement Name]**
>
> 1. **Entity:** Which table does this rule apply to?
> 2. **Scope:** Form only (client-side), All forms, or Server-side (enforces without form)? Note: Server-side scope means the rule runs on every save regardless of app type — use with care.
> 3. **Trigger event:** On load / On change (which field?) / On save
> 4. **Condition:** [If [field] [operator] [value]] — can have AND/OR branches (max 3 levels)
> 5. **Action(s):** [Show/Hide field] / [Lock/Unlock field] / [Set value of field] / [Set required level of field] / [Show error on field]"

**Gate:** Developer confirms each rule's parameters.

#### DESIGN

**Action:** Produce a complete rule specification in a format that mirrors the maker portal's condition builder.

**Presentation:**

> "**Rule Specification: [Rule Name]**
>
> Entity: [entity] | Scope: [scope] | Trigger: [trigger]
>
> **Condition tree:**
> ```
> IF [field] [operator] [value]
>   AND [field] [operator] [value]
> THEN
>   [Action 1]
>   [Action 2]
> ELSE
>   [Action 3]  (if else branch needed)
> ```
>
> **Actions:**
> | Action | Field | Value / State |
> |---|---|---|
> | [Show/Hide] | [field logical name] | Visible / Hidden |
> | [Set required] | [field logical name] | Required / Not Required |
> | [Show error] | [field logical name] | [Error message text] |"

#### CONFIGURE

**Action:** Provide step-by-step configuration guidance for the Power Apps maker portal business rule editor.

**Presentation:**

> "**Configuration steps — Power Apps maker portal:**
>
> 1. Navigate to make.powerapps.com → [solution] → [entity] → Business rules → New
> 2. Set rule name: [Rule Name]
> 3. Set scope: [scope]
> 4. Add condition: Click '+Add' → [condition builder steps]
> 5. Add action: [action type] → select field → [value or state]
> 6. Save and activate
>
> **Activation note:** Business rules must be explicitly activated after configuration. Saved-but-inactive rules do not execute."

#### REVIEW

**Stage 1 — Spec compliance:**
- Rule scope matches the enforcement requirement (client-only vs. server-side)
- All condition fields exist in the physical model
- All action fields exist in the physical model
- Rule is activation-ready (no incomplete branches)

**Stage 2 — Quality:**
- Server-side scope is justified (not default-chosen without reason)
- No more than 3 levels of condition nesting
- Error messages are user-friendly (not technical language)
- Rule name follows convention: `[Entity] - [Rule description]`

#### COMPLETE

Write `docs/bl-rule-[entity].md`. Update `docs/business-logic-inventory.md`.

---

## 7. Sub-skill: client-script

### 7.1 Overview

Designs and scaffolds JavaScript that runs in the browser context on Model-Driven App forms using the Xrm API (`formContext`, `Xrm.WebApi`, `Xrm.Navigation`). Reads the form event map from ui-design as its primary input. Testing uses a hybrid strategy: Jest with Xrm mock objects for unit-testable logic, and a manual checklist for form-bound behavior that requires a live environment.

### 7.2 State Machine

```
INIT → DISCOVERY → DESIGN → IMPLEMENT → TEST → REVIEW → COMPLETE
```

### 7.3 Stage Definitions

| Stage | Purpose | Can skip? |
|---|---|---|
| INIT | Load form event map, logic map client script requirements, identify entity scope | No |
| DISCOVERY | For each event: entity, form, event type, trigger condition, behavior | No |
| DESIGN | Script file structure, function signatures, Xrm API usage plan | No |
| IMPLEMENT | Implementation guidance per event handler with Xrm API patterns | No |
| TEST | Jest stubs with Xrm mocks + manual test checklist | No |
| REVIEW | Spec compliance + quality + security | No |
| COMPLETE | Write script files and `docs/bl-script-[entity].md`, update business logic inventory | No |

### 7.4 Conversation Flow

#### INIT

**Action:** Read `docs/ui-form-event-map.md` if available. Read `06-logic-map.md` for any client script requirements not already in the form event map.

**Presentation:**

> "Starting client-script design. Loading event requirements:
>
> [If form event map available:]
> From your form event map ([N] events across [M] entities):
> | Entity | Form | Event | Behavior needed |
> |---|---|---|---|
> | [entity] | Main | OnChange: [field] | [description] |
> | [entity] | Main | OnLoad | [description] |
>
> [If additional requirements in logic map:]
> Additional requirements from logic map not in event map: [list]
>
> Does this capture all the client-side logic you need to implement?"

**Gate:** Developer confirms the complete event list.

#### DISCOVERY

**Action:** For each event, clarify behavior and Xrm API requirements.

**Presentation (per event):**

> "**Event: [Entity] / [Form] / [Event type] / [Field if applicable]**
>
> 1. **What should happen?** [Describe the behavior in plain language]
> 2. **What Xrm data does it need?** (Current field value / Other field values on form / Related record data via Xrm.WebApi)
> 3. **Does it write back to the form?** (Set field value / Change visibility / Change required level / Show notification)
> 4. **Does it make server calls?** (Xrm.WebApi.retrieveRecord / createRecord / updateRecord)
> 5. **Any async behavior?** (If server calls involved — how should the form behave while waiting?)"

**Gate:** Developer confirms behavior specification per event.

#### DESIGN

**Action:** Design the script file structure and function signatures for each entity's script library.

**Presentation (per entity):**

> "**Script file: [prefix]_[EntityName]Form.js**
>
> Script structure:
> ```javascript
> // [prefix]_[EntityName]Form.js
> // Entity: [EntityLogicalName]
> // Form: [Form name(s)]
>
> "use strict";
>
> var [Prefix] = [Prefix] || {};
> [Prefix].[EntityName] = [Prefix].[EntityName] || {};
>
> [Prefix].[EntityName] = (function() {
>
>   // ─── OnLoad ──────────────────────────────────────────────────────────────
>   function onLoad(executionContext) {
>     // registered as: OnLoad, pass execution context
>   }
>
>   // ─── OnSave ──────────────────────────────────────────────────────────────
>   function onSave(executionContext) {
>     // registered as: OnSave, pass execution context
>   }
>
>   // ─── Field: [fieldname] OnChange ─────────────────────────────────────────
>   function [fieldName]OnChange(executionContext) {
>     // registered as: OnChange on [fieldname], pass execution context
>   }
>
>   // ─── Helpers ─────────────────────────────────────────────────────────────
>   function _getFormContext(executionContext) {
>     return executionContext.getFormContext();
>   }
>
>   return {
>     onLoad,
>     onSave,
>     [fieldName]OnChange
>   };
>
> })();
> ```
>
> Form registration spec (for each function):
> | Function | Event | Pass execution context | Field |
> |---|---|---|---|
> | [Prefix].[EntityName].onLoad | OnLoad | Yes | N/A |
> | [Prefix].[EntityName].[fieldName]OnChange | OnChange | Yes | [fieldlogicalname] |"

**Gate:** Developer confirms file structure and function signatures.

#### IMPLEMENT

**Action:** Provide implementation guidance per event handler with concrete Xrm API patterns.

**Presentation (per handler):**

> "**[function name] — Implementation**
>
> ```javascript
> function [functionName](executionContext) {
>   var formContext = executionContext.getFormContext();
>
>   // Read a field value
>   var fieldValue = formContext.getAttribute("[logicalname]").getValue();
>
>   // Set a field value
>   formContext.getAttribute("[logicalname]").setValue(newValue);
>
>   // Show/hide a field
>   formContext.getControl("[logicalname]").setVisible(true/false);
>
>   // Set required level
>   formContext.getAttribute("[logicalname]").setRequiredLevel("required"); // "none", "recommended", "required"
>
>   // Show a form notification
>   formContext.ui.setFormNotification("Message text", "INFO", "unique-id"); // INFO, WARNING, ERROR
>
>   // Xrm.WebApi call (async)
>   Xrm.WebApi.retrieveRecord("[entitylogicalname]", recordId, "?$select=[fields]")
>     .then(function(result) { /* success */ })
>     .catch(function(error) { /* error — always handle */ });
> }
> ```
>
> **Implementation notes:**
> [Specific guidance for this handler's logic — e.g., "Read [field] first. If null, skip. If not null, call Xrm.WebApi to retrieve related [entity] and populate [target field] with [source field] from the result."]"

#### TEST

**Action:** Generate Jest test stubs with Xrm mock objects for unit-testable logic, and a manual test checklist for form-bound behavior.

**Presentation:**

> "**Test stubs: [prefix]_[EntityName]Form.test.js**
>
> ```javascript
> // [prefix]_[EntityName]Form.test.js
> // Run with: npx jest
>
> // Xrm mock setup
> global.Xrm = {
>   WebApi: {
>     retrieveRecord: jest.fn(),
>     createRecord: jest.fn(),
>     updateRecord: jest.fn()
>   }
> };
>
> // formContext mock factory
> function createFormContextMock(fieldValues = {}) {
>   const attributes = {};
>   Object.keys(fieldValues).forEach(key => {
>     attributes[key] = {
>       getValue: jest.fn().mockReturnValue(fieldValues[key]),
>       setValue: jest.fn(),
>       setRequiredLevel: jest.fn()
>     };
>   });
>   const controls = {};
>   Object.keys(fieldValues).forEach(key => {
>     controls[key] = { setVisible: jest.fn() };
>   });
>   return {
>     getAttribute: (name) => attributes[name],
>     getControl: (name) => controls[name],
>     ui: { setFormNotification: jest.fn(), clearFormNotification: jest.fn() }
>   };
> }
>
> function createExecutionContextMock(fieldValues) {
>   return { getFormContext: () => createFormContextMock(fieldValues) };
> }
>
> describe('[EntityName] form scripts', () => {
>
>   describe('[functionName]', () => {
>     test('[scenario description]', () => {
>       // Arrange
>       const executionContext = createExecutionContextMock({ [field]: [value] });
>       // Act
>       [Prefix].[EntityName].[functionName](executionContext);
>       // Assert
>       // [What should have happened: setValue called with X, setVisible called with true, etc.]
>     });
>   });
>
> });
> ```
>
> **Manual test checklist (requires live MDA environment):**
> | Test | Steps | Expected | Pass/Fail |
> |---|---|---|---|
> | [Event] fires correctly | Open [entity] form, [action]. Observe [field/section] | [Expected behavior] | |
> | [Event] does not fire when [condition] | [Setup that should not trigger] | No change | |
> | Xrm.WebApi call succeeds | [Setup + trigger]. Check network tab | [field] populated with [value] | |
> | Xrm.WebApi call fails gracefully | [Setup to cause failure]. Trigger event | Error notification shown | |"

#### REVIEW

**Stage 1 — Spec compliance:**
- Every event in the form event map has a corresponding handler
- Every handler is registered on the correct form, event, and field
- All Xrm.WebApi calls have error handlers

**Stage 2 — Quality:**
- Execution context is always passed (never rely on global Xrm directly for form context)
- No synchronous XMLHttpRequest calls (deprecated in modern browsers)
- No hardcoded GUIDs for option set values or record IDs — use named constants
- No console.log statements in production code
- All async operations have error paths that notify the user

**Stage 3 — Security:**
- No eval() calls
- No construction of Xrm.WebApi queries from user-controlled input without sanitization
- No storage of credentials or sensitive values in script variables

#### COMPLETE

Write the script file(s) to the web resources source folder. Write `docs/bl-script-[entity].md`. Update `docs/business-logic-inventory.md`.

---

## 8. Output Specifications

### 8.1 Router-level outputs

| Artifact | Path | When written |
|---|---|---|
| Business logic inventory | `docs/business-logic-inventory.md` | COMPLETE stage |
| Skill state | `.pp-context/skill-state.json` | Every stage transition |

### 8.2 Sub-skill outputs

| Sub-skill | Design document | Code artifact |
|---|---|---|
| csharp-plugin | `docs/bl-plugin-[name].md` | `src/Plugins/[PluginName].cs`, `tests/[PluginName]Tests.cs` |
| power-automate | `docs/bl-flow-[name].md` | Excalidraw diagram (link in document) |
| business-rule | `docs/bl-rule-[entity].md` | Configuration spec (applied in maker portal) |
| client-script | `docs/bl-script-[entity].md` | `src/WebResources/[prefix]_[EntityName]Form.js`, `tests/[prefix]_[EntityName]Form.test.js` |

### 8.3 Business Logic Inventory format

```markdown
## Business Logic Inventory — [Project Name]
Generated by: business-logic
Date: [date]

### C# Plugins ([N] total)
| Plugin class | Entity | Message | Stage | Mode | Artifact |
|---|---|---|---|---|---|
| [PluginName] | [entity] | [message] | [stage] | [sync/async] | src/Plugins/[name].cs |

### Power Automate Flows ([N] total)
| Flow name | Trigger | Connection references | Artifact |
|---|---|---|---|
| [Flow Name] | [trigger] | [list] | docs/bl-flow-[name].md |

### Business Rules ([N] total)
| Rule name | Entity | Scope | Trigger | Artifact |
|---|---|---|---|---|
| [Rule Name] | [entity] | [scope] | [trigger] | docs/bl-rule-[entity].md |

### Client Scripts ([N] total)
| Script file | Entity | Forms | Event count | Artifact |
|---|---|---|---|---|
| [prefix]_[Entity]Form.js | [entity] | [forms] | [N] | src/WebResources/[file] |
```

---

## 9. Agent: plugin-auditor

```markdown
# plugin-auditor

## Role
Performs a comprehensive audit of Dataverse C# plugin classes against current Microsoft Learn
documentation and enterprise best practices. This is the full dataverse-csharp-plugin-audit
capability promoted to a resident agent within pp-superpowers. It produces scored findings
(1–100) with HIGH / MEDIUM / LOW categorization.

## Invoked by
csharp-plugin sub-skill — REVIEW stage.

## Input context
- Plugin class source code (C# .cs files from the scaffold/implement stages)
- Plugin registration specifications (entity, message, stage, mode, filtering attributes)
- docs/schema-physical-model.md (for entity/column name validation)
- Microsoft Learn documentation (retrieved via pp-research when available)

## Audit domains

### Security (weight: HIGH)
- Plugin executes in sandbox isolation mode — never full trust unless explicitly justified
- No hardcoded connection strings, credentials, or organization URLs
- No File I/O, network calls, or registry access (sandbox violations)
- Input parameters validated before use (null checks on Target, context parameters)
- No exposure of internal system information in user-facing exception messages

### Performance (weight: HIGH)
- No unbounded queries (always use QueryExpression with ColumnSet, never ColumnSet(true) for large entities)
- No N+1 query patterns (retrievals inside loops over collections)
- No synchronous web service calls in synchronous plugin steps
- Pre-images and post-images are registered only when used — not as default practice
- Filtering attributes configured on Update steps to avoid unnecessary execution

### Schema correctness (weight: MEDIUM)
- All entity logical names match the physical model
- All column logical names match the physical model
- Relationship names used in queries match physical model definitions
- Option set values referenced as integers match the actual choice values

### Architecture (weight: MEDIUM)
- Plugin classes are stateless (no instance-level fields storing request state)
- Each plugin class handles one cohesive concern — no "god plugins"
- IOrganizationService obtained per-request from the factory, not cached across requests
- ITracingService used for diagnostic output, not Console.WriteLine or Debug.WriteLine
- Exception handling: catch InvalidPluginExecutionException and re-throw; wrap all others
- Plugin classes do not inherit from base classes other than IPlugin (no shared base classes
  that obscure the execution path)

### Code quality (weight: LOW)
- Consistent naming: [Entity][Action]Plugin convention
- Registration attributes present (spkl or equivalent)
- XML documentation on public methods
- No dead code or commented-out logic blocks

## Scoring
Score is calculated as: 100 - (HIGH findings × 15) - (MEDIUM findings × 5) - (LOW findings × 1)
Minimum score: 0. A score below 70 blocks COMPLETE until HIGH findings are resolved.

## Output format
Return a structured audit report:

**Score: [N]/100**

**HIGH findings ([N]):**
- [Finding]: [description] → [required resolution]

**MEDIUM findings ([N]):**
- [Finding]: [description] → [suggested resolution]

**LOW findings ([N]):**
- [Finding]: [description] → [optional improvement]

**Summary:** [One paragraph describing the overall quality and the most important patterns to address]

## Does not
- Rewrite plugin code — it audits and flags, the developer implements fixes
- Evaluate flow or client script quality (those are reviewed within their own sub-skills)
- Execute code or call Dataverse APIs
- Make business logic decisions — it evaluates implementation quality, not business correctness
```

---

## 10. Reference Material

### 10.1 Plugin Stage and Mode Reference

| Stage | Number | When it runs | Can throw to user? | Can modify target? |
|---|---|---|---|---|
| Pre-Validation | 10 | Before platform validation | Yes | Yes |
| Pre-Operation | 20 | After validation, before DB write | Yes | Yes |
| Post-Operation | 40 | After DB write | Yes (synchronous only) | No (record already written) |

**Execution mode:**
- **Synchronous:** Runs in the same transaction as the triggering operation. Failure rolls back the operation.
- **Asynchronous:** Runs in a separate system job after the operation completes. Failure does not roll back the original operation.

### 10.2 Xrm API Quick Reference (Client Scripts)

| Operation | API call | Notes |
|---|---|---|
| Get field value | `formContext.getAttribute("logicalname").getValue()` | Returns null if field has no value |
| Set field value | `formContext.getAttribute("logicalname").setValue(value)` | Trigger OnChange with `fireOnChange()` if needed |
| Show/hide control | `formContext.getControl("logicalname").setVisible(bool)` | Hides control, not the attribute |
| Set required level | `formContext.getAttribute("logicalname").setRequiredLevel("required")` | Values: "none", "recommended", "required" |
| Show notification | `formContext.ui.setFormNotification("msg", "INFO", "id")` | Types: INFO, WARNING, ERROR |
| Retrieve record | `Xrm.WebApi.retrieveRecord("entity", id, "?$select=field1,field2")` | Returns Promise |
| Create record | `Xrm.WebApi.createRecord("entity", data)` | Returns Promise |
| Update record | `Xrm.WebApi.updateRecord("entity", id, data)` | Returns Promise |

### 10.3 Power Automate Flow Naming Convention

`[Solution prefix] - [Entity or domain] - [Action or description]`

Examples:
- `SDFX - Project - Send approval notification on status change`
- `SDFX - Task - Escalate overdue tasks daily`
- `SDFX - Invoice - Sync to accounting system on creation`

### 10.4 Business Rule Scope Comparison

| Scope | Runs in | Enforces on API save? | Use when |
|---|---|---|---|
| Entity (selected forms) | Client (browser) only | No | Simple UX-only rules |
| All Forms | Client (all MDA forms) only | No | Rules that apply across all MDA forms |
| All Forms and Server-side | Client + server | Yes | Rules that must hold regardless of API access |

Server-side enforcement is critical for data integrity rules that must hold even when records are created or updated via API, Power Automate, or plugins.

### 10.5 Known Plugin Anti-Patterns

| Anti-pattern | Problem | Resolution |
|---|---|---|
| ColumnSet(true) in queries | Retrieves all columns — expensive for wide tables | Use ColumnSet with explicit column list |
| Retrieval inside a loop | N+1 queries — execution time scales with collection size | Batch retrieve before the loop or use RetrieveMultiple |
| Hardcoded organization URL | Breaks when solution moves environments | Use IServiceEndpointNotificationService or config entity |
| Catch and swallow exceptions | Silent failures, impossible to diagnose | Always rethrow or convert to InvalidPluginExecutionException |
| Static/instance fields for request state | Plugins are stateless — fields persist across requests in the same AppDomain | All state must be local to Execute() |
| Synchronous plugin calling external web service | Timeout risk blocks entire transaction | Move to async Post-Operation or use custom API |

---

## 11. Handoff Contract — business-logic → downstream

### 11.1 What testing receives

testing reads `docs/business-logic-inventory.md` to understand:
- Which plugin classes have test stubs ready for expansion
- Which client script test files exist
- Which flows require manual testing (no automated test path)
- Which business rules require manual testing in the maker portal

### 11.2 What deployment receives

deployment reads `docs/business-logic-inventory.md` to identify:
- Plugin assembly files for solution packaging
- Web resource files (client scripts) for solution packaging
- Flow definitions (solution-aware flows — not personal flows) for export
- Business rules (automatically part of the entity in the solution)

### 11.3 Minimum completeness for handoff

business-logic is considered complete for downstream handoff when:
- At least one sub-skill has completed its REVIEW stage
- `docs/business-logic-inventory.md` is written
- All plugin-auditor HIGH findings have been resolved or documented with explicit acceptance rationale

### 11.4 Running testing/deployment without business-logic

testing and deployment can proceed with partial business-logic output. The inventory document is incrementally writable — each sub-skill appends to it as it completes.

---

## 12. Decision Log

| # | Decision | Rationale |
|---|---|---|
| 1 | Router runs a meaningful conversation before dispatching | Logic map captures declared requirements; conversation captures implementation priorities and changes since last update. |
| 2 | Sub-skills fully self-contained | Each sub-skill can be read and executed without consulting the router. Eliminates runtime ambiguity. |
| 3 | Developer chooses sub-skills and sequence | Projects vary in logic complexity. Some need only plugins; others need all four types. The router cannot determine the right sequence without developer input. |
| 4 | plugin-auditor is the full dataverse-csharp-plugin-audit promoted to an agent | The existing Claude.ai skill represents proven, comprehensive audit logic. Promoting it to an agent preserves all value without replication. The audit runs within the plugin development workflow rather than as a separate tool invocation. |
| 5 | Power Automate output is design doc + Excalidraw flow diagram | Flows cannot be generated as runnable definitions — they are configured in the Power Automate designer. The design doc + diagram gives the developer a precise specification to implement, with the Excalidraw diagram serving as a visual reference during manual configuration. |
| 6 | Business rule complexity check is a hard gate | Redirecting over-complex requirements before they enter the sub-skill prevents the developer from configuring a business rule that appears to work but silently fails (e.g., server-side rules with cross-record logic that Dataverse ignores at execution time). |
| 7 | Client script testing uses Hybrid: Jest + Xrm mocks + manual checklist | Pure unit testing with mocks covers the logic within handlers but cannot verify that Xrm event registration is correct or that the Xrm API behaves as expected in a live environment. The manual checklist covers what mocks cannot. |
| 8 | Client scripts use IIFE namespace pattern | Avoids global namespace pollution in the MDA browser context. Consistent with Microsoft's recommended pattern for MDA form scripts. |
| 9 | Plugin test stubs use FakeXrmEasy | FakeXrmEasy is the most widely used .NET mocking framework for Dataverse plugins. It provides an in-memory fake Dataverse context that handles entity operations without a live environment. |
| 10 | Business logic inventory as the formal handoff artifact | A structured manifest of all implemented logic is more useful to testing and deployment than individual design documents. It provides a single point of truth for what exists and where. |
| 11 | integration skill boundary: internal automation vs. external connector | Maintaining a clear boundary between internal automation (business-logic) and external integration (integration) prevents the power-automate sub-skill from becoming a catch-all for all flow work. |

---

## 13. Open Items for Build

- **FakeXrmEasy version detection:** FakeXrmEasy has breaking changes between major versions (v1, v2, v3). The csharp-plugin sub-skill should detect the project's existing FakeXrmEasy version and generate stubs compatible with that version rather than defaulting to the latest.
- **spkl vs. PAC CLI registration:** The scaffold stage produces registration attributes for spkl. Confirm at build time whether the project uses spkl, PAC CLI plugin registration, or raw pluginassembly XML, and adapt the scaffold output accordingly.
- **Flow connection reference naming convention:** Connection reference logical names must follow a specific pattern to be solution-aware. Define the exact naming convention to enforce at DESIGN stage.
- **Client script file location in solution:** Confirm the web resource source folder convention (e.g., `src/WebResources/` vs. project-specific path) and whether the client-script sub-skill should write files or produce file content for the developer to place manually.
- **Logic map format:** `06-logic-map.md` is referenced as the router's input but its format has not been formally specified. The format should be defined in the solution-discovery skill specification so that business-logic can reliably parse it.
- **Plugin-auditor Microsoft Learn integration:** The full audit uses pp-research to retrieve current Dataverse documentation. Define the specific documentation pages to retrieve and how often to refresh (per session vs. per audit run).
- **Async plugin failure notification:** The power-automate test plan includes an "error notification sent to admin on failure" step. Define the standard mechanism for this across flows (dedicated alert flow, environment admin email, or custom notification entity).
- **Cross-entity plugin scope in csharp-plugin:** When a single plugin requirement touches multiple entities (e.g., creates records in two tables), clarify whether this produces one plugin class or two, and how the registration spec handles it.