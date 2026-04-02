# pp-superpowers — ui-design Skill Specification

**Version:** 1.0
**Date:** April 1, 2026
**Author:** SDFX Studios
**Status:** Approved for build
**Parent document:** pp-superpowers Design Roadmap v1.0

---

## 1. Skill Overview

| Attribute | Value |
|---|---|
| **Name** | ui-design |
| **Domain** | Power Platform UI design — forms, screens, components, and apps across all app types |
| **Lifecycle group** | Build |
| **Has sub-skills** | Yes — 6 sub-skills routed by app type after context gathering |
| **Foundation sections consumed** | `00-project-identity`, `02-architecture-decisions`, `05-ui-plan` |
| **Physical model consumed** | `docs/schema-physical-model.md` (column inventory for all form and screen design) |
| **DDD model consumed** | `docs/ddd-model.md` (aggregate awareness for form grouping and tab structure) |
| **Upstream dependency** | schema-design (physical model must exist); application-design (recommended) |
| **Downstream handoff** | business-logic (form event map for client scripts), deployment (app component list) |
| **Agents** | ui-reviewer |

### 1.1 Router Philosophy

ui-design is a **router skill**. Its job is to gather context, understand what the developer needs to design, present the available sub-skills matched to the project's app types, and dispatch to the correct sub-skill in developer-chosen sequence.

Three locked design decisions govern the router:

1. **Meaningful conversation before dispatch** — the router always gathers context through a structured conversation regardless of how complete the foundation is. Foundation documents describe intent; the conversation captures current focus, constraints, and priorities that may not be in any document.
2. **Developer chooses sub-skills and sequence** — the router presents available sub-skills based on the foundation's architecture decisions and UI plan, then the developer selects what to work on and in what order. The router does not auto-dispatch.
3. **Sub-skills are fully self-contained** — each sub-skill's SKILL.md contains its complete stage sequence, including REVIEW. No inheritance from the router. This ensures each sub-skill can be read and executed without consulting the parent router file.

### 1.2 Sub-skill Summary

| Sub-skill | App type | Wireframe tool | Development-heavy? |
|---|---|---|---|
| `model-driven-app` | MDA forms, views, dashboards, charts, sitemap, command bar | Excalidraw | No |
| `canvas-app` | Canvas app screens, navigation, data sources, responsive layout | Canva | No |
| `pcf-control` | PCF component spec, manifest, React/TypeScript scaffold | Excalidraw | Yes |
| `custom-page` | Hybrid MDA/Canvas embedded page | Canva | No |
| `modal-dialog` | Lightweight dialog triggered from form or app | Canva | No |
| `code-app` | Standalone React/Vite/TypeScript app on Power Platform | Canva | Yes |

### 1.3 Relationship to Other Skills

**Upstream:** schema-design produces `docs/schema-physical-model.md`. This is the column inventory that every sub-skill consumes. Without it, ui-design can proceed but all form field and data binding decisions require manual developer input. application-design produces `docs/ddd-model.md`, which informs aggregate-aware form grouping and tab structure in model-driven-app.

**Downstream:** ui-design produces a form event map — a record of which entity fields have registered event handlers, which forms host business logic, and which Code App components interact with Dataverse in ways that require server-side logic. business-logic reads this as its primary input for the client-script sub-skill dispatch. deployment reads the app component list produced by ui-design to identify solution components to include in packaging.

**Cross-skill signals:** If the context conversation reveals that the developer needs a UI pattern that is not supported by the app type in the foundation (e.g., the foundation specifies MDA but the requirement needs a full-screen custom UI), ui-design surfaces this tension and suggests the developer review the architecture-decisions foundation section before proceeding. It does not change the foundation — it flags the signal.

---

## 2. Router State Machine

The router has five stages. Sub-skill execution occurs between SUB_SKILL_SELECTION and INTEGRATION_REVIEW — each sub-skill runs its own complete state machine and returns control to the router on completion.

```
INIT → CONTEXT_GATHER → SUB_SKILL_SELECTION → [SUB_SKILL_EXECUTION loop] → INTEGRATION_REVIEW → COMPLETE
```

### 2.1 Router Stage Definitions

| Stage | Purpose | Gate to enter | Can skip? |
|---|---|---|---|
| INIT | Read all inputs, detect re-entry, check prerequisites | Foundation exists | No |
| CONTEXT_GATHER | Meaningful conversation: focus, constraints, priorities | INIT complete | No |
| SUB_SKILL_SELECTION | Present available sub-skills, developer selects and sequences | CONTEXT_GATHER complete | No |
| SUB_SKILL_EXECUTION | Run selected sub-skills in chosen order (each is self-contained) | SUB_SKILL_SELECTION complete | No |
| INTEGRATION_REVIEW | Cross-sub-skill consistency review via ui-reviewer agent | All selected sub-skills complete | Yes — if only one sub-skill was run |
| COMPLETE | Write completion state, produce handoff artifact, suggest business-logic | INTEGRATION_REVIEW complete (or skipped) | No |

### 2.2 Progress Tracking

```json
{
  "activeSkill": "ui-design",
  "activeStage": "SUB_SKILL_EXECUTION",
  "activeSubSkill": "model-driven-app",
  "subSkillQueue": ["model-driven-app", "canvas-app"],
  "completedSubSkills": [],
  "stageHistory": [
    { "stage": "INIT", "completedAt": "2026-04-01T09:00:00Z" },
    { "stage": "CONTEXT_GATHER", "completedAt": "2026-04-01T09:10:00Z" },
    { "stage": "SUB_SKILL_SELECTION", "completedAt": "2026-04-01T09:15:00Z" },
    { "stage": "SUB_SKILL_EXECUTION", "startedAt": "2026-04-01T09:16:00Z" }
  ],
  "lastCompleted": "schema-design",
  "suggestedNext": null,
  "completedSkills": ["solution-discovery", "application-design", "schema-design"]
}
```

On session resume:

> "You're in ui-design, currently working on: **model-driven-app**. You've completed [N] of [M] stages. Your canvas-app design is queued next. Want to pick up where you left off?"

---

## 3. Router Conversation Flow and Gating Logic

### 3.1 Stage: INIT

**Gate:** Foundation directory exists with at minimum `00-project-identity.md` and `02-architecture-decisions.md`. If missing, block and direct developer to run solution-discovery.

**Action:**
1. Read foundation sections: `00-project-identity.md`, `02-architecture-decisions.md`, `05-ui-plan.md` (if exists)
2. Read `docs/schema-physical-model.md` — if absent, warn: "No physical model found. I'll proceed but all form field decisions will require manual input. Consider running schema-design first."
3. Read `docs/ddd-model.md` — if absent, note: "No DDD model found. Aggregate-aware form grouping will be limited."
4. Check for existing ui-design artifacts in `docs/` — if found, offer re-entry
5. Load `.pp-context/skill-state.json` for session continuity

**Re-entry presentation (if artifacts found):**

> "I found existing ui-design artifacts:
>
> - [Sub-skill name]: `docs/ui-[type]-design.md` (last updated [date])
>
> How would you like to proceed?
> - **Continue** — pick up from where we left off
> - **Add sub-skill** — keep existing work, design an additional app type
> - **Revise** — revisit a completed sub-skill design"

### 3.2 Stage: CONTEXT_GATHER

**Purpose:** Understand what the developer is working on today, any constraints or priorities not captured in the foundation, and whether anything has changed since the foundation was last updated.

**Action:** Present a structured context-gathering conversation. Do not skip this stage even if the foundation is comprehensive.

**Presentation:**

> "I've loaded your foundation and schema. Before we dive into UI design for **[Project Name]**, I want to make sure I understand your current focus.
>
> A few questions:
>
> 1. **What are you designing today?** Are you starting fresh, adding to an existing design, or revisiting something?
> 2. **Any constraints I should know about?** (Timeline pressure, specific user feedback you're responding to, technical limits, accessibility requirements?)
> 3. **Any priorities not captured in your foundation?** (A particular entity or persona that needs attention first, a specific form that's been problematic?)
>
> If everything is captured in the foundation and you want to jump straight to sub-skill selection, just say so."

**Gate:** Developer provides context (or explicitly confirms the foundation is current and complete). Context notes are held in working memory for sub-skill dispatch — they do not modify the foundation.

**Foundation gap surfacing:** If the context conversation reveals information that contradicts or extends the foundation (e.g., "we actually added a new entity last week"), flag it:

> "That sounds like it may not be reflected in your foundation yet. Do you want to note this for a future solution-discovery update, or should we account for it in our design work today without updating the foundation?"

### 3.3 Stage: SUB_SKILL_SELECTION

**Action:**
1. Read `02-architecture-decisions.md` for declared app types
2. Read `05-ui-plan.md` for persona-to-app-type mapping (if available)
3. Map declared app types to available sub-skills
4. Present matched sub-skills with brief rationale for each

**Presentation:**

> "Based on your architecture decisions and UI plan, here are the sub-skills relevant to your project:
>
> | Sub-skill | Why it's relevant | Status |
> |---|---|---|
> | **model-driven-app** | `02-architecture-decisions` specifies MDA as the primary app type | Not started |
> | **canvas-app** | `05-ui-plan` maps [Persona X] to a Canvas experience | Not started |
> | **[others as applicable]** | | |
>
> Additional sub-skills available (not indicated by foundation):
> - pcf-control, custom-page, modal-dialog, code-app
>
> Which sub-skills do you want to work on in this session, and in what order? (You can always return to add more.)"

**Gate:** Developer selects one or more sub-skills and confirms the sequence. The queue is written to `.pp-context/skill-state.json`.

**Multi-type handling:** If the developer selects multiple sub-skills, the router dispatches them sequentially in the chosen order. After each sub-skill completes, the router presents:

> "[Sub-skill name] design is complete. Next in your queue: **[next sub-skill]**. Ready to continue, or do you want to pause here?"

### 3.4 Stage: INTEGRATION_REVIEW

**Condition:** Only runs if two or more sub-skills were completed in this session.

**Action:** Dispatch the **ui-reviewer** agent in integration mode. The agent checks for cross-sub-skill consistency: naming alignment, navigation coherence, no entity gaps across app types.

**Presentation:**

> "You've completed designs for [list of sub-skills]. Running a cross-design consistency check before we wrap up."

See §8 for the full ui-reviewer agent specification.

### 3.5 Stage: COMPLETE

**Action:**
1. Write `docs/ui-design-spec.md` — a master index document linking all sub-skill design artifacts
2. Update `.pp-context/skill-state.json` with completion state
3. Write `docs/ui-form-event-map.md` — the handoff artifact for business-logic (see §10)

**Presentation:**

> "UI design is complete. Here's what was produced:
>
> - [list of design documents and wireframe links]
> - Form event map: `docs/ui-form-event-map.md` ([N] form events identified across [M] entities)
>
> **Suggested next:** business-logic — your form event map identifies [N] client scripts and [M] validation requirements that need implementation. The client-script sub-skill will read this map as its starting point."

---

## 4. Sub-skill: model-driven-app

### 4.1 Overview

Designs the full MDA experience: forms, views, dashboards, charts, sitemap, and command bar. Consumes the physical model column by column and produces an Excalidraw wireframe for each major entity form.

### 4.2 State Machine

```
INIT → FORM_DESIGN → VIEW_DESIGN → DASHBOARD_CHART_DESIGN → SITEMAP_COMMANDBAR → WIREFRAME → REVIEW → COMPLETE
```

### 4.3 Stage Definitions

| Stage | Purpose | Can skip? |
|---|---|---|
| INIT | Load physical model and DDD model, identify entities in scope | No |
| FORM_DESIGN | Design forms for each entity: tabs, sections, fields, subgrids | No |
| VIEW_DESIGN | Design default views, quick-find views, column selection | No |
| DASHBOARD_CHART_DESIGN | Design dashboards and charts | No |
| SITEMAP_COMMANDBAR | Design navigation structure and command bar customizations | No |
| WIREFRAME | Generate Excalidraw MDA form wireframe dynamically | No |
| REVIEW | ui-reviewer: spec compliance + quality | No |
| COMPLETE | Write `docs/ui-mda-design.md`, update form event map | No |

### 4.4 Conversation Flow

#### INIT

**Action:** Read `docs/schema-physical-model.md`. Identify all entities. If `docs/ddd-model.md` is available, load aggregate definitions for tab grouping guidance.

**Presentation:**

> "Starting model-driven-app design for **[Project Name]**. I can see [N] entities in your physical model:
>
> [Entity list with column counts]
>
> [If DDD model available:] I have your aggregate map — I'll use aggregate boundaries to suggest tab groupings on complex forms.
>
> Scope check: Do you want to design forms for all [N] entities, or focus on a subset today?"

**Gate:** Developer confirms entity scope.

#### FORM_DESIGN

**Action:** For each entity in scope, work through form design collaboratively. Process is column-by-column from the physical model, with developer confirming section groupings, tab structure, and control choices.

**Presentation (per entity):**

> "**[Entity Name] Form Design**
>
> Physical model has [N] columns. Here's my proposed form layout:
>
> **Tab 1 — [Name] (suggested from aggregate root fields):**
> | Section | Columns | Control type | Required? |
> |---|---|---|---|
> | [Section name] | [column list] | [Text, Lookup, Choice, etc.] | Yes/No |
>
> **Subgrid candidates:** [related entities that should appear as subgrids, with reason]
>
> **Form event candidates:** [fields that are likely to need client-script events — e.g., visibility rules, conditional required, cross-field calculations]
>
> Does this layout work? What would you move, add, or remove?"

**Gate:** Developer confirms form layout for each entity. Form event candidates are logged for the form event map.

**Column type → control type mapping:** See §9.1 for the reference table used during form design.

#### VIEW_DESIGN

**Presentation (per entity):**

> "**[Entity Name] Views**
>
> Minimum views for every entity: Active Records, Quick Find. Additional based on your requirements:
>
> **Active Records View:**
> - Columns: [suggested from physical model — name, status, key lookup, modified date]
> - Default sort: [suggested]
>
> **Quick Find View (search columns):**
> - Searchable columns: [suggested from text and lookup columns]
>
> Any persona-specific views from your UI plan? (e.g., 'My Records', filtered by assignment)"

**Gate:** Developer confirms view design per entity.

#### DASHBOARD_CHART_DESIGN

**Presentation:**

> "**Dashboards and Charts**
>
> Based on your requirements and entity list, here are dashboard candidates:
>
> - **[Dashboard name]:** [suggested for which persona, what data it surfaces]
>
> And chart candidates per entity:
>
> | Entity | Chart type | X-axis | Y-axis / measure | Why |
> |---|---|---|---|---|
> | [entity] | Bar / Pie / Funnel | [field] | [field or count] | [reason] |
>
> What should be included vs. deferred?"

**Gate:** Developer confirms dashboard and chart scope.

#### SITEMAP_COMMANDBAR

**Presentation:**

> "**Sitemap Design**
>
> Proposed navigation structure:
>
> **Area: [Area Name]**
> - Group: [Group Name]
>   - Subarea: [Entity] → [Entity List View]
>   - Subarea: [Entity] → [Entity List View]
>
> Does this match how your users will navigate the app?
>
> **Command Bar Customizations:**
> Any custom buttons needed on forms or views? (e.g., 'Submit for Approval', 'Generate Report')"

**Gate:** Developer confirms sitemap and command bar design.

#### WIREFRAME

**Action:** Generate Excalidraw wireframe dynamically for each major entity form. The wireframe renders the MDA chrome — header bar, form tabs, section layout, field controls, subgrids — using Excalidraw's drawing tools. This is generated fresh from the confirmed form design, not a static template.

**Presentation:**

> "Generating Excalidraw wireframes for [N] entity forms. These show the structural layout — tabs, sections, field positions, and subgrids. They are not pixel-perfect; they are design references for the build phase."

[Excalidraw wireframe generated per entity]

#### REVIEW

**Action:** Dispatch ui-reviewer agent in model-driven-app mode. Two-stage review.

**Stage 1 — Spec compliance:**
- Every column in the physical model is accounted for on a form, in a view, or explicitly marked as "not surfaced" with a reason
- Every subgrid candidate has a relationship in the physical model to support it
- Every command bar customization has a named handler (for business-logic handoff)

**Stage 2 — Quality:**
- Forms do not exceed 4 tabs (usability threshold)
- No tab contains more than 8 sections
- Required fields are in the first visible tab
- Lookup fields have associated quick-create forms noted
- Accessibility: labels are present for all fields, no color-only status indicators

**Presentation:**

> "**Review — model-driven-app**
>
> **Spec compliance:** [PASS / [N] issues]
> - [Issue if any: "Column [name] in physical model is not represented on any form"]
>
> **Quality:** [PASS / [N] recommendations]
> - [Recommendation if any: "Tab [name] has [N] sections — consider splitting"]
>
> [If issues:] Resolve before marking complete, or explicitly accept with a documented reason."

#### COMPLETE

**Action:** Write `docs/ui-mda-design.md`. Update `docs/ui-form-event-map.md` with all form event candidates identified during FORM_DESIGN.

---

## 5. Sub-skill: canvas-app

### 5.1 Overview

Designs a Canvas app experience: screens, navigation flow, data source connections, and responsive layout. Produces a Canva mockup per screen.

### 5.2 State Machine

```
INIT → SCREEN_DESIGN → NAVIGATION → DATA_SOURCES → RESPONSIVE_LAYOUT → WIREFRAME → REVIEW → COMPLETE
```

### 5.3 Stage Definitions

| Stage | Purpose | Can skip? |
|---|---|---|
| INIT | Load UI plan (persona-to-screen mapping), physical model | No |
| SCREEN_DESIGN | Design each screen: purpose, components, data displayed | No |
| NAVIGATION | Screen flow, navigation triggers, conditional routing | No |
| DATA_SOURCES | Dataverse table connections, galleries, forms, delegation | No |
| RESPONSIVE_LAYOUT | App format, container layout, breakpoints | No |
| WIREFRAME | Generate Canva mockup per screen | No |
| REVIEW | ui-reviewer: spec compliance + quality | No |
| COMPLETE | Write `docs/ui-canvas-design.md`, update form event map | No |

### 5.4 Conversation Flow

#### INIT

**Action:** Read `05-ui-plan.md` for persona-to-app mapping. Identify which personas use this Canvas app and what their primary workflows are.

**Presentation:**

> "Starting canvas-app design. From your UI plan, this app serves:
>
> | Persona | Primary workflow | Screens implied |
> |---|---|---|
> | [persona] | [workflow] | [implied screens] |
>
> Does this capture the full scope of this Canvas app, or are there workflows not in the UI plan?"

**Gate:** Developer confirms scope.

#### SCREEN_DESIGN

**Action:** For each identified screen, design its content collaboratively.

**Presentation (per screen):**

> "**[Screen Name]**
>
> Purpose: [what the user does here]
>
> Proposed components:
> - [Gallery showing [entity] records, columns: [list]]
> - [Form for [entity] — create/edit mode]
> - [Buttons: [list of actions]]
> - [Labels/KPI tiles: [list]]
>
> Global variables or collections this screen reads/writes: [list]
>
> Does this layout match your intent for this screen?"

**Gate:** Developer confirms per screen.

#### NAVIGATION

**Presentation:**

> "**Navigation Flow**
>
> Proposed screen flow:
>
> [Screen A] → (on record select) → [Screen B] → (on save) → [Screen A]
> [Screen A] → (header button) → [Screen C]
>
> Navigation triggers:
> | Trigger | Source screen | Destination | Condition |
> |---|---|---|---|
> | Record tap in gallery | [Screen A] | [Screen B] | Always |
> | Back button | [Screen B] | [Screen A] | Always |
> | [Custom trigger] | [Screen] | [Screen] | [Condition] |
>
> Does this flow cover all user paths?"

**Gate:** Developer confirms navigation flow.

#### DATA_SOURCES

**Presentation:**

> "**Data Sources**
>
> Dataverse tables this app connects to:
>
> | Table | Usage | Control type | Delegation risk? |
> |---|---|---|---|
> | [table] | [read / read-write] | Gallery / Form / Lookup | [Yes if >500 rows and non-delegable filter] |
>
> **Delegation warnings:** [list any filters or sorts that are not delegable — e.g., StartsWith on non-indexed columns]
>
> Are there connectors beyond Dataverse this app needs? (e.g., Office 365 Users, SharePoint)"

**Gate:** Developer confirms data sources and accepts or resolves delegation warnings.

#### RESPONSIVE_LAYOUT

**Action:** Dedicated stage for layout design (Q7 decision). Address app format, container structure, and device behavior explicitly.

**Presentation:**

> "**Responsive Layout Design**
>
> App format: [Phone / Tablet / Responsive — confirm or choose]
>
> For responsive apps, I'll design using container-based layout:
>
> | Container | Direction | Content | Fills on mobile? |
> |---|---|---|---|
> | AppShell | Vertical | Header + Main + Footer | Yes |
> | MainContent | Horizontal | SideNav + Content | Stacks on mobile |
> | [etc.] | | | |
>
> **Minimum screen sizes to design for:** [based on persona context — field worker on phone vs. office user on tablet]
>
> Are there specific device types or orientations that must be supported?"

**Gate:** Developer confirms layout approach and device targets.

#### WIREFRAME

**Action:** Generate Canva mockup per screen. Canva is used for canvas-app because it supports freeform layout design at a level of polish appropriate for canvas screens.

**Presentation:**

> "Generating Canva mockups for [N] screens. These are design-intent references — they show layout, navigation, and data presentation. Colors and branding are indicative."

[Canva mockup generated per screen]

#### REVIEW

**Stage 1 — Spec compliance:**
- Every persona workflow from the UI plan has at least one screen
- Every Dataverse table in the data sources section has a corresponding physical model entry
- All delegation risks are documented

**Stage 2 — Quality:**
- No gallery loads more than 500 records without a filter
- Navigation has no dead ends (every screen has a back path)
- Responsive layout uses containers, not absolute positioning
- All interactive controls have accessible labels

#### COMPLETE

Write `docs/ui-canvas-design.md`. Update form event map if any screens include PowerFx formula events that need backend business logic coordination.

---

## 6. Sub-skill: pcf-control

### 6.1 Overview

Designs a Power Apps Component Framework (PCF) control: a custom React/TypeScript control that runs inside a Canvas or Model-Driven App. Development-heavy. Follows the standard brainstorm → plan → execute → review pattern.

### 6.2 State Machine

```
INIT → BRAINSTORM → PLAN → EXECUTE → REVIEW → COMPLETE
```

### 6.3 Stage Definitions

| Stage | Purpose | Can skip? |
|---|---|---|
| INIT | Establish component context: where it will live, what it controls | No |
| BRAINSTORM | Component purpose, bound vs. unbound, data type, user interaction model | No |
| PLAN | Component spec: manifest properties, React structure, state management | No |
| EXECUTE | Scaffold commands, implementation guidance, Excalidraw component sketch | No |
| REVIEW | ui-reviewer: manifest completeness, accessibility, performance | No |
| COMPLETE | Write `docs/ui-pcf-[name].md` | No |

### 6.4 Conversation Flow

#### INIT

**Presentation:**

> "Starting PCF control design. A PCF control is a custom component that runs inside an existing app — it is not a standalone app. It's the right choice when:
> - You need a custom input or display control that the platform doesn't provide natively
> - You want to replace a standard field control with a richer UX
> - You need a visualization or interaction pattern (calendar, map, Gantt) bound to Dataverse data
>
> Where will this control be used? (Canvas App / Model-Driven App / Both)
> What field or dataset will it bind to?"

**Gate:** Developer confirms placement and binding.

#### BRAINSTORM

**Presentation:**

> "**PCF Control — Brainstorm**
>
> Tell me about the control you need to build. I'll ask:
>
> 1. What problem does this solve that a standard control doesn't?
> 2. Is this a **field-level** control (bound to a single column) or a **dataset control** (bound to a view or collection)?
> 3. What does the user do with it? (Input only / Display only / Both)
> 4. Are there reference implementations or similar controls in the PCF Gallery we should draw from?"

**Gate:** Brainstorm output reviewed and confirmed by developer.

#### PLAN

**Presentation:**

> "**PCF Component Spec**
>
> **Manifest properties:**
> | Property name | Type | Usage | Required? | Description |
> |---|---|---|---|---|
> | [property] | [SingleLine.Text / etc.] | bound | Yes | [what it does] |
>
> **React component structure:**
> ```
> [ComponentName]/
>   index.ts          ← PCF entry point, implements StandardControl
>   [ComponentName].tsx ← React root component
>   components/
>     [SubComponent].tsx
>   hooks/
>     use[Hook].ts
>   types.ts
> ```
>
> **State management:** [local React state / useReducer / none — justified by complexity]
>
> Does this structure match your implementation intent?"

**Gate:** Developer confirms component spec.

#### EXECUTE

**Action:** Produce scaffold commands and an Excalidraw component sketch.

**Presentation:**

> "**Scaffold commands:**
> ```bash
> pac pcf init --namespace [Namespace] --name [ComponentName] --template [field|dataset]
> cd [ComponentName]
> npm install
> npm run build
> ```
>
> **Excalidraw sketch:**"
> [Excalidraw component visual — showing the control's visual structure and interactive zones]
>
> **Implementation guidance:**
> - [Key implementation pattern 1 — e.g., how to read bound property]
> - [Key implementation pattern 2 — e.g., how to notify change manager]
> - [Key implementation pattern 3 — e.g., how to handle disabled mode]"

#### REVIEW

**Stage 1 — Spec compliance:**
- Manifest has all required properties with correct types
- Entry point implements the full StandardControl interface (init, updateView, getOutputs, destroy)
- All bound properties have corresponding React props

**Stage 2 — Quality:**
- Component handles disabled and masked modes
- Component renders correctly at multiple sizes (virtual scrolling for dataset controls with large datasets)
- No direct DOM manipulation outside the container element

#### COMPLETE

Write `docs/ui-pcf-[component-name].md`.

---

## 7. Sub-skill: custom-page

### 7.1 Overview

Designs a custom page — a hybrid Canvas/MDA page embedded in a Model-Driven App. Uses Canvas app patterns for layout and controls, but runs in the MDA shell. Produces a Canva mockup.

### 7.2 State Machine

```
INIT → COMPONENT_DESIGN → NAVIGATION → RESPONSIVE_LAYOUT → WIREFRAME → REVIEW → COMPLETE
```

### 7.3 Stage Definitions

| Stage | Purpose | Can skip? |
|---|---|---|
| INIT | Confirm embedding context in MDA, load physical model | No |
| COMPONENT_DESIGN | Controls, data binding, layout components | No |
| NAVIGATION | How the page is invoked, how it returns, any internal navigation | No |
| RESPONSIVE_LAYOUT | Container layout, device considerations | No |
| WIREFRAME | Canva mockup | No |
| REVIEW | ui-reviewer: spec compliance + quality | No |
| COMPLETE | Write `docs/ui-custompage-design.md` | No |

### 7.4 Conversation Flow

#### INIT

**Presentation:**

> "Starting custom-page design. A custom page is embedded in a Model-Driven App but built with Canvas controls — it gives you full layout freedom within the MDA navigation shell.
>
> Where does this page sit in the MDA?
> - Launched from the sitemap (standalone page)
> - Launched from a form command bar button (contextual)
> - Embedded within a form section (inline)
>
> What entity context does it receive when launched?"

**Gate:** Developer confirms embedding point and context.

#### COMPONENT_DESIGN

**Presentation:**

> "**Custom Page — Components**
>
> Components available: Modern controls (Fluent UI), PCF controls, galleries, forms, media controls.
>
> Proposed component layout:
> | Component | Type | Data source | Purpose |
> |---|---|---|---|
> | [component] | [type] | [Dataverse table / collection] | [what it does] |
>
> What interactions need to write back to Dataverse vs. just display data?"

#### NAVIGATION

**Presentation:**

> "**Navigation**
>
> How is this page invoked? [Sitemap subarea / Command button with recordId parameter / Form section]
>
> How does it return? [Back navigation / Saves and closes / Stays open as a panel]
>
> Does it navigate internally between views? If so, what triggers the transition?"

#### RESPONSIVE_LAYOUT

**Action:** Dedicated stage. Custom pages run in MDA shell which constrains width — design must account for MDA chrome.

**Presentation:**

> "**Layout Design**
>
> Custom pages run inside the MDA shell — the left navigation and header consume space. Effective content width is approximately 70–80% of screen width on desktop.
>
> Proposed container layout:
> | Container | Direction | Content |
> |---|---|---|
> | [name] | Vertical / Horizontal | [content] |
>
> Does this page need to work on mobile (MDA mobile app)? If yes, I'll design for stacked layout."

#### WIREFRAME

[Canva mockup generated]

#### REVIEW

**Stage 1 — Spec compliance:**
- All data bindings reference valid physical model columns
- Page receives correct entity context on launch
- Return/close behavior is defined

**Stage 2 — Quality:**
- Layout accounts for MDA chrome (no full-bleed designs that assume no navigation shell)
- Modern controls used over classic Canvas controls where available

#### COMPLETE

Write `docs/ui-custompage-design.md`.

---

## 8. Sub-skill: modal-dialog

### 8.1 Overview

Designs a lightweight dialog — a focused interaction triggered from a form, view, or command button. Simpler workflow than custom-page. Produces a Canva mockup.

### 8.2 State Machine

```
INIT → DIALOG_DESIGN → WIREFRAME → REVIEW → COMPLETE
```

### 8.3 Stage Definitions

| Stage | Purpose | Can skip? |
|---|---|---|
| INIT | Confirm trigger context, dialog purpose | No |
| DIALOG_DESIGN | Content, fields, actions, return value | No |
| WIREFRAME | Canva mockup | No |
| REVIEW | ui-reviewer: purpose clarity, field completeness, accessible dismissal | No |
| COMPLETE | Write `docs/ui-dialog-[name].md` | No |

### 8.4 Conversation Flow

#### INIT

**Presentation:**

> "Starting modal-dialog design. A dialog is the right choice when:
> - You need a focused interaction that shouldn't navigate away from the current context
> - You need user input before an action executes (e.g., 'Enter rejection reason before declining')
> - You need to show confirmation with custom options
>
> What triggers this dialog? (Command button / Form event / Business process flow step)
> What entity context is available to the dialog when opened?"

**Gate:** Developer confirms trigger and context.

#### DIALOG_DESIGN

**Presentation:**

> "**Dialog Design: [Dialog Name]**
>
> **Purpose:** [one sentence]
>
> **Content:**
> | Element | Type | Required? | Notes |
> |---|---|---|---|
> | [field/label/image] | [input/display] | Yes/No | [notes] |
>
> **Action buttons:**
> | Button | Label | Action | Returns |
> |---|---|---|---|
> | Primary | [e.g., Confirm] | [what it does] | [value returned to caller] |
> | Secondary | [e.g., Cancel] | Dismiss | null |
>
> **Return value to calling context:** [what the caller receives — e.g., boolean, input field values, nothing]
>
> Does this match the interaction you need?"

**Gate:** Developer confirms dialog design.

#### WIREFRAME

[Canva mockup generated — dialog frame, content, and action buttons]

#### REVIEW

**Stage 1 — Spec compliance:**
- All required fields have validation
- Return value is defined and matches what the caller expects
- Cancel/dismiss path is always available

**Stage 2 — Quality:**
- Dialog title clearly states purpose
- No more than 3–4 input fields (if more, consider a custom-page instead)
- No destructive actions without explicit confirmation language

#### COMPLETE

Write `docs/ui-dialog-[name].md`.

---

## 9. Sub-skill: code-app

### 9.1 Overview

Designs a standalone React/Vite/TypeScript application hosted on Power Platform. Requirement-driven — not tied to MDA patterns. Development-heavy. Uses PAC CLI `code` commands for scaffold and deployment. Produces a Canva mockup and scaffold command set.

### 9.2 State Machine

```
INIT → BRAINSTORM → COMPONENT_DESIGN → SCAFFOLD → IMPLEMENT → REVIEW → COMPLETE
```

### 9.3 Stage Definitions

| Stage | Purpose | Can skip? |
|---|---|---|
| INIT | Confirm app purpose, licensing, environment requirements | No |
| BRAINSTORM | User flows, data sources, authentication context, app type fit | No |
| COMPONENT_DESIGN | React component tree, state management, routing, UI library | No |
| SCAFFOLD | pac code init + data source commands, project structure review | No |
| IMPLEMENT | Implementation guidance per component, SDK pattern, Canva mockup | No |
| REVIEW | ui-reviewer: component completeness, SDK correctness, data source coverage | No |
| COMPLETE | Write `docs/ui-codeapp-design.md` | No |

### 9.4 Conversation Flow

#### INIT

**Presentation:**

> "Starting code-app design. Power Apps Code Apps are standalone React/Vite/TypeScript applications that run inside the Power Platform shell, with native access to Dataverse and connectors via the Power Apps SDK — no custom authentication required.
>
> **Prerequisites check:**
> - Power Apps Premium license with Code Apps enabled on target environment ✓/✗
> - PAC CLI version 1.50.1 or later (for stable data source generation) ✓/✗
> - Node.js available in PATH ✓/✗
>
> **Fit check:** A Code App is the right choice when:
> - You need full control over the DOM, layout, and interaction patterns
> - The experience can't be achieved with Canvas, MDA, or custom-page constraints
> - You want to use the full React ecosystem (routing, state management libraries, third-party components)
>
> Does your requirement justify a Code App, or would a custom-page or canvas-app meet the need?"

**Gate:** Developer confirms Code App is the right choice.

#### BRAINSTORM

**Presentation:**

> "**Code App — Brainstorm**
>
> 1. **What does this app do?** Describe it from the user's perspective in 2–3 sentences.
> 2. **Who uses it?** Which personas from your UI plan, or new personas not in the plan?
> 3. **What Dataverse data does it read and write?** (Tables from your physical model)
> 4. **Any connectors beyond Dataverse?** (Office 365 Users, SharePoint, custom connectors)
> 5. **Any real-time requirements?** (Live updates, polling, push notifications)
> 6. **Is this app embedded in MDA navigation, or accessed via its own URL?**"

**Gate:** Developer confirms brainstorm output.

#### COMPONENT_DESIGN

**Presentation:**

> "**React Component Tree**
>
> ```
> App
> ├── PowerProvider          ← SDK initialization wrapper (required)
> ├── AppShell
> │   ├── Header
> │   ├── SideNav (if applicable)
> │   └── MainContent
> │       ├── [Page components — one per major view]
> │       │   ├── [Feature components]
> │       │   └── [Data display components]
> │       └── [Shared components]
> └── [Modal/Dialog layer]
> ```
>
> **Routing:** [React Router / Single-page, no routing — justified by complexity]
>
> **State management:**
> | State type | Approach | Reason |
> |---|---|---|
> | Server state (Dataverse data) | Generated services from pac code add-data-source | Generated, type-safe, maintained by PAC CLI |
> | UI state | useState / useReducer | Appropriate for local interaction state |
> | Global app state | [Zustand if needed / none] | Only if 3+ components share state |
>
> **UI component library:** [Fluent UI React v9 recommended — matches Power Platform chrome; justify any alternative]
>
> Does this component structure match your app's complexity?"

**Gate:** Developer confirms component design.

#### SCAFFOLD

**Presentation:**

> "**Scaffold Commands**
>
> ```bash
> # Initialize Code App project
> npm create vite@latest [app-name] -- --template react-ts
> cd [app-name]
>
> # Install Power Apps SDK
> npm install @microsoft/power-apps
>
> # Install Fluent UI (recommended)
> npm install @fluentui/react-components
>
> # Initialize Power Apps Code integration
> pac code init --displayName "[App Display Name]" --description "[App Description]"
>
> # Add Dataverse data sources
> pac code add-data-source -d dataverse -t [tablename]
> # Repeat for each table
>
> # Dev script (runs both Vite and PAC SDK server)
> # Update package.json dev script to: "vite & pac code run"
>
> # Run locally
> npm run dev
> ```
>
> **Generated files to be aware of:**
> - `power.config.json` — app configuration, connector declarations (do not edit manually)
> - `src/generated/[TableName]Service.ts` — type-safe Dataverse service methods (do not edit, regenerate via PAC CLI)
>
> Confirm project name and table list, and I'll produce the exact commands."

**Gate:** Developer confirms scaffold parameters.

#### IMPLEMENT

**Action:** Provide implementation guidance for each component identified in COMPONENT_DESIGN. Produce a Canva mockup of the app UI.

**Presentation:**

> "**Implementation Guidance**
>
> **SDK initialization (required before any Dataverse calls):**
> ```typescript
> // PowerProvider.tsx
> import { initialize } from '@microsoft/power-apps/app';
> import { useEffect } from 'react';
>
> export function PowerProvider({ children }: { children: React.ReactNode }) {
>   useEffect(() => {
>     initialize().catch(console.error);
>   }, []);
>   return <>{children}</>;
> }
> ```
>
> **Pattern: Gate data operations on initialization:**
> ```typescript
> const [isInitialized, setIsInitialized] = useState(false);
> // Only call Dataverse services after isInitialized = true
> ```
>
> **Per-component guidance:**
> | Component | Key pattern | Dataverse service used |
> |---|---|---|
> | [Component] | [pattern] | [service method] |
>
> **Canva mockup:**"
> [Canva mockup generated — full app UI]

#### REVIEW

**Stage 1 — Spec compliance:**
- All Dataverse tables in the brainstorm have a corresponding `pac code add-data-source` command
- SDK initialization wraps the app root before any data calls
- All generated service files are referenced, not manually replicated

**Stage 2 — Quality:**
- `power.config.json` is not manually edited (only modified via PAC CLI)
- Generated service files are not modified (regeneration will overwrite)
- State management approach is proportional to app complexity (no Zustand for a two-screen app)
- Fluent UI used for consistency with Power Platform shell

#### COMPLETE

Write `docs/ui-codeapp-design.md`.

---

## 10. Output Specifications

### 10.1 Router-level outputs

| Artifact | Path | When written |
|---|---|---|
| Master index | `docs/ui-design-spec.md` | COMPLETE stage |
| Form event map | `docs/ui-form-event-map.md` | COMPLETE stage (aggregated from all sub-skills) |
| Skill state | `.pp-context/skill-state.json` | Every stage transition |

### 10.2 Sub-skill outputs

| Sub-skill | Design document | Wireframe/mockup artifact |
|---|---|---|
| model-driven-app | `docs/ui-mda-design.md` | Excalidraw wireframes (link in document) |
| canvas-app | `docs/ui-canvas-design.md` | Canva mockups (links in document) |
| pcf-control | `docs/ui-pcf-[name].md` | Excalidraw component sketch (link in document) |
| custom-page | `docs/ui-custompage-design.md` | Canva mockup (link in document) |
| modal-dialog | `docs/ui-dialog-[name].md` | Canva mockup (link in document) |
| code-app | `docs/ui-codeapp-design.md` | Canva mockup (link in document) |

### 10.3 Form Event Map format

`docs/ui-form-event-map.md` is the handoff artifact for business-logic. Format:

```markdown
## Form Event Map — [Project Name]
Generated by: ui-design
Date: [date]

### Entity: [Entity Name]

| Form | Field | Event type | Trigger condition | Business logic required |
|---|---|---|---|---|
| Main | [field] | OnChange | Always | Conditional required on [other field] |
| Main | [field] | OnSave | Always | Cross-entity validation |
| Main | [field] | OnLoad | Always | Pre-populate from related record |

### Code App Events

| Component | Event | Dataverse operation | Business logic required |
|---|---|---|---|
| [Component] | [event] | [create/update/delete] | [description if plugin needed] |
```

---

## 11. Agent: ui-reviewer

```markdown
# ui-reviewer

## Role
Reviews ui-design sub-skill outputs for spec compliance and quality. Operates in two modes:
sub-skill mode (reviews a single completed sub-skill) and integration mode (reviews consistency
across multiple completed sub-skills).

## Invoked by
- Each sub-skill's REVIEW stage (sub-skill mode)
- Router's INTEGRATION_REVIEW stage (integration mode)

## Input context (sub-skill mode)
- The completed sub-skill design document
- `docs/schema-physical-model.md` (column source of truth)
- `05-ui-plan.md` (persona and workflow coverage)
- Sub-skill type (determines which review criteria apply)

## Input context (integration mode)
- All completed sub-skill design documents
- `docs/ui-form-event-map.md`

## Two-stage review process

### Stage 1 — Spec Compliance
Verifies that the design is complete and internally consistent against its inputs.

**model-driven-app checks:**
- Every column in physical model is on a form, in a view, or explicitly excluded with reason
- Every subgrid has a supporting relationship in the physical model
- All personas from 05-ui-plan have a navigation path

**canvas-app checks:**
- Every persona workflow from 05-ui-plan has screens
- Every data source table exists in physical model
- All delegation risks are documented

**pcf-control checks:**
- Manifest has all properties with correct types
- Entry point methods are all specified (init, updateView, getOutputs, destroy)

**custom-page checks:**
- Embedding context is defined
- Entity context on launch is specified
- Return/dismiss behavior is defined

**modal-dialog checks:**
- Return value is defined
- Cancel path always available

**code-app checks:**
- All Dataverse tables have add-data-source commands
- SDK initialization is present before any data calls

### Stage 2 — Quality
Evaluates UX best practices, performance considerations, and accessibility.

**Universal checks (all sub-skills):**
- Accessible labels on all interactive controls
- No color-only status indicators
- Interaction outcomes are predictable (no silent failures)

**model-driven-app quality:**
- No form exceeds 4 tabs
- No tab exceeds 8 sections
- Required fields in first visible tab
- Lookup fields have quick-create noted

**canvas-app quality:**
- No undelegated gallery loads more than 500 records
- No dead-end screens (every screen has a back path)
- Containers used for layout (not absolute positioning)

**pcf-control quality:**
- Handles disabled and masked modes
- Handles resize (especially for dataset controls)
- No direct DOM manipulation outside component container

**code-app quality:**
- power.config.json not edited manually
- Generated services not duplicated
- State management proportional to complexity

## Integration mode review

**Cross-sub-skill checks:**
- Entity names are consistent across all design documents
- Navigation references between app types are coherent
  (e.g., an MDA command button that launches a modal-dialog is reflected in both documents)
- Form event map is complete — no sub-skill produced form events that are not in the map
- No entity is designed in two sub-skills with conflicting field lists

## Output format
Return a structured review result:

**Spec compliance:** PASS / [N] issues
- [Issue]: [description] → [resolution required / acceptable with documented reason]

**Quality:** PASS / [N] recommendations
- [Recommendation]: [description] → [suggested change]

**Integration (integration mode only):** PASS / [N] inconsistencies
- [Inconsistency]: [description] → [which documents to update]

## Does not
- Redesign the UI — it reviews and flags, the developer decides
- Modify design documents directly — findings are presented for developer action
- Evaluate implementation quality (that is the deployment and review skill's domain)
- Check for Power Platform licensing requirements (that is pp-devenv's domain)
```

---

## 12. Reference Material

### 12.1 Column Type → Control Type Mapping (MDA)

| Dataverse column type | Default MDA control | Notes |
|---|---|---|
| Single Line of Text | Text input | Consider email/URL/phone subtypes for specialized rendering |
| Multiple Lines of Text | Text area | Enable rich text editor for user-facing notes |
| Whole Number | Number input | |
| Decimal / Float | Number input with precision | |
| Currency | Currency input | Shows symbol, handles exchange rate |
| Date Only | Date picker | |
| Date and Time | Date + time picker | Timezone behavior: local vs. UTC |
| Choice (single) | Dropdown | |
| Choices (multi-select) | Multi-select picker | |
| Yes/No | Toggle or checkbox | |
| Lookup | Lookup control | Always note quick-create form requirement |
| File / Image | File upload / Image viewer | Restricted to notes-enabled tables |
| Calculated | Read-only display | Cannot be edited |
| Rollup | Read-only display with refresh button | |
| Unique Identifier (GUID) | Rarely surfaced | Only show if required for integration UX |

### 12.2 Canvas App Delegation-Safe Operations

Operations that are delegation-safe against Dataverse (execute server-side, handle large datasets):
- Filter by Lookup, Choice, Yes/No, Date, Number, Text (equals/contains)
- Sort by any column
- CountRows on a filtered collection
- Search() on indexed columns

Operations that are **not** delegation-safe (executed client-side, limited to 500 records):
- StartsWith on non-indexed text columns
- Any formula combining multiple Filter conditions with OR
- Most string manipulation functions (Left, Mid, Right, Concatenate)

### 12.3 MDA Form Design Thresholds

| Constraint | Threshold | Reason |
|---|---|---|
| Tabs per form | 4 maximum | More than 4 tabs are rarely all visible on screen; users lose orientation |
| Sections per tab | 8 maximum | Performance: large section counts increase form load time |
| Columns per section | 2 (standard) | MDA forms support 1–3 column layouts; 2 is the most readable |
| Subgrids per form | 3 maximum | Each subgrid is an independent query; more than 3 causes visible load lag |
| Quick-view forms | 2 maximum | Quick-view forms are loaded inline; too many cause performance issues |

### 12.4 Code App SDK Initialization Pattern

The Power Apps SDK must be initialized before any Dataverse operations. The initialization is asynchronous and must complete before data calls are made.

```typescript
// Pattern: gate all data operations on isInitialized state
import { initialize } from '@microsoft/power-apps/app';

export function PowerProvider({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initialize()
      .then(() => setIsInitialized(true))
      .catch(console.error);
  }, []);

  if (!isInitialized) return <LoadingSpinner />;
  return <>{children}</>;
}
```

Generated service files (from `pac code add-data-source`) are regenerated on PAC CLI updates. Never modify these files — treat them as build artifacts.

---

## 13. Handoff Contract — ui-design → downstream

### 13.1 What business-logic receives

business-logic reads `docs/ui-form-event-map.md` to understand:
- Which entity forms have registered event handlers (OnLoad, OnChange, OnSave)
- Which fields require client-side validation, conditional visibility, or pre-population logic
- Which Code App components interact with Dataverse in ways that may require server-side plugin support
- The complete list of client scripts that need to be implemented (drives client-script sub-skill dispatch)

### 13.2 What deployment receives

deployment reads `docs/ui-design-spec.md` to identify:
- All Power Apps components by type (MDA, Canvas, PCF, custom-page, Code App)
- Solution components to include in packaging
- App IDs assigned after initial deployment (to be filled in during deployment)

### 13.3 Minimum completeness for handoff

ui-design is considered complete for business-logic handoff when:
- At least one sub-skill has completed its REVIEW stage
- `docs/ui-form-event-map.md` is written (even if empty — an empty map is valid for projects with no client-side logic)
- The COMPLETE stage has been reached at the router level

business-logic does not require all sub-skills to be complete before it can begin — the form event map is incrementally writable, and business-logic can start with whatever is available.

### 13.4 Running business-logic without ui-design

business-logic can run if ui-design was not completed. In this case:
- business-logic checks for `docs/ui-form-event-map.md`. If absent, it warns:

  > "No form event map found. Client script design will proceed without a pre-analyzed list of form events — all event discovery will happen during the client-script sub-skill conversation."

- All other sub-skills (csharp-plugin, power-automate, business-rule) are unaffected by the absence of ui-design output.

---

## 14. Decision Log

| # | Decision | Rationale |
|---|---|---|
| 1 | Router runs a meaningful conversation before dispatching | Foundation captures intent; context conversation captures current focus, constraints, and changes since last update. Thin dispatchers miss information that changes between sessions. |
| 2 | Sub-skills fully self-contained (no stage inheritance) | Each sub-skill can be read and executed without the router file. Self-containment eliminates "what does the parent define?" ambiguity at runtime. |
| 3 | Developer chooses sub-skills and sequence | Projects vary — some need only MDA, others need MDA + code-app. The router cannot determine sequence without understanding the developer's priorities. |
| 4 | Excalidraw for MDA and PCF wireframes | MDA form layout is constrained and structural — Excalidraw's grid-friendly drawing maps cleanly to tabs, sections, and field rows. PCF component sketches are technical diagrams, not polished UI. |
| 5 | Canva for canvas-app, custom-page, modal-dialog, code-app | These app types benefit from polished, freeform mockups that communicate design intent to stakeholders. Canva's layout tools are appropriate for this. |
| 6 | MDA form template generated dynamically via Excalidraw | A static template file goes stale as MDA chrome evolves. Generating the MDA form scaffold from Excalidraw tools each time ensures the wireframe reflects current MDA layout patterns. |
| 7 | Full MDA scope: forms, views, dashboards, charts, sitemap, command bar | MDA design is not just forms. Views, dashboards, and sitemap are equally critical to the user experience and are frequently under-designed. |
| 8 | PCF follows standard brainstorm → plan → execute → review pattern | PCF is development-heavy but not so different from other sub-skills that it needs a unique stage structure. The standard pattern accommodates its development orientation through the EXECUTE stage's scaffold + implementation guidance content. |
| 9 | Responsive layout is a dedicated stage in canvas-app and custom-page | Responsive design is a first-class concern that gets lost when treated as a property of screen design. A dedicated stage forces explicit decisions about containers, breakpoints, and device targets. |
| 10 | code-app added as 6th sub-skill; requirement-driven, not MDA-specific | Code Apps are GA on Power Platform and cover a distinct design domain: full React/Vite/TypeScript apps on the platform. The requirement drives the choice of sub-skill; the sub-skill does not assume any particular use case. |
| 11 | Form event map as the formal handoff artifact to business-logic | A structured map of form events is more useful to business-logic than prose descriptions. It enables the client-script sub-skill to start from a pre-analyzed list rather than re-deriving events from the physical model. |
| 12 | business-logic can run without ui-design (warn but allow) | Some projects have no UI logic requirements — server-side plugins and flows don't depend on form design. Blocking would prevent valid use cases. |
| 13 | Integration review only runs when 2+ sub-skills complete | Cross-sub-skill consistency checks have nothing to compare when only one sub-skill was run. The gate prevents a meaningless review stage. |

---

## 15. Open Items for Build

- **Excalidraw MDA template generation:** Define the exact Excalidraw element set used to generate the MDA form scaffold (header bar, tab strip, section grid, field row pattern, subgrid panel). This becomes a reusable generation function, not a static template.
- **Canva template selection:** Identify which Canva template types work best for each sub-skill (canvas-app screens vs. dialog vs. code-app) — or whether custom Canva designs from scratch are preferable.
- **Form event map accumulation:** Define exactly how sub-skills write to `docs/ui-form-event-map.md` during execution — append mode vs. router aggregation at COMPLETE stage.
- **Sub-skill re-entry:** If a developer returns to revise a completed sub-skill (e.g., adding a new form after initial MDA design), how does the form event map update without losing prior entries?
- **Physical model absent path:** Define the exact conversation flow when `docs/schema-physical-model.md` is absent — how does FORM_DESIGN proceed without the column inventory?
- **Code App PAC CLI version detection:** How does the code-app sub-skill detect whether PAC CLI version is >= 1.50.1 (minimum for stable data source generation)? Likely via `pac help` output parsing.
- **Whimsical vs. Excalidraw for MDA:** Validate at build time whether Excalidraw or Whimsical produces better structural wireframes for MDA forms. Decision is Excalidraw (§14 item 4) but this should be tested against both tools in practice.