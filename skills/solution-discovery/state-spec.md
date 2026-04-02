# State Specification

This file defines the `.discovery-state.json` format, resume logic, UPDATE mode flow, and downstream impact analysis. Read this file on RESUME or UPDATE mode entry.

---

## .discovery-state.json Format

Location: `.foundation/.discovery-state.json`

```json
{
  "version": "1.0",
  "projectName": "[project name]",
  "projectType": "[greenfield | extension | migration]",
  "mode": "[CREATE | UPDATE]",
  "stage": "[current stage name]",
  "sections": {
    "00-project-identity": { "status": "complete", "completedAt": "[ISO 8601]" },
    "01-requirements": { "status": "complete", "completedAt": "[ISO 8601]" },
    "02-architecture-decisions": { "status": "in-progress", "startedAt": "[ISO 8601]" },
    "03-entity-map": { "status": "not-started" },
    "04-solution-packaging": { "status": "not-started" },
    "05-ui-plan": { "status": "not-started" },
    "06-logic-map": { "status": "not-started" },
    "07-integration-map": { "status": "not-started" },
    "08-security-profile": { "status": "not-started" },
    "09-constraints": { "status": "not-started" }
  },
  "lastUpdated": "[ISO 8601]",
  "updates": []
}
```

**Status values:** `not-started`, `in-progress`, `complete`, `skipped`, `placeholder`

## Stage Transition Protocol

**After completing each stage, update `.discovery-state.json`:**

1. Set the completed section's status to `complete` (or `placeholder` if skipped) with a `completedAt` timestamp
2. Set `stage` to the next stage name in the fixed order
3. Set `lastUpdated` to the current timestamp
4. If beginning a new stage, set the new section's status to `in-progress` with a `startedAt` timestamp

**Write the state file after every transition.** Do not batch updates.

---

## Resume Logic

When INIT detects `.foundation/` exists but `.discovery-state.json` shows a stage other than `COMPLETE`:

1. Read `.discovery-state.json` to determine the last completed stage
2. Present the status summary (format below)
3. Auto-position at the first incomplete section (immediately after the last completed stage)
4. Continue the fixed-order flow from that point

The developer cannot choose which section to resume at — always resume at the first incomplete section. This preserves the fixed-order guarantee.

**On resume, re-ask the current stage's questions from the beginning.** Do not attempt to detect partially answered questions within a stage.

### Status Summary Format

```
Foundation status for [project name]:

  ✓ 00 Project Identity — [project name], [project type]
  ✓ 01 Requirements — [problem statement summary, first 50 chars]
  ✓ 02 Architecture — [app type], [solution count]
  ✗ 03 Entity Map — not started
  · 04–09 — not started

Resuming at section 03: Entity Map.
```

For completed sections, show a one-line summary. For placeholder sections, show `⊘ [section] — placeholder`. Group consecutive not-started sections with `·`.

---

## UPDATE Mode Flow

UPDATE mode modifies a specific section in an already-complete foundation.

```
INIT → SECTION_SELECT → SECTION_UPDATE → IMPACT_ANALYSIS → COMPLETE
```

| Stage | What happens |
|---|---|
| INIT | Read `.discovery-state.json`, confirm `COMPLETE` state, enter UPDATE mode |
| SECTION_SELECT | Developer specifies which section to update (by number or name) |
| SECTION_UPDATE | Load current section file, present its content, conduct focused conversation to modify it |
| IMPACT_ANALYSIS | Evaluate downstream impact per the map below, present warnings |
| COMPLETE | Write updated section, update `.discovery-state.json` with update entry |

### Update Tracking

When a section is modified in UPDATE mode, add an entry to the `updates` array:

```json
{
  "section": "01-requirements",
  "updatedAt": "[ISO 8601]",
  "reason": "[developer's stated reason for the change]",
  "impactWarnings": ["05-ui-plan", "02-architecture-decisions"]
}
```

---

## Impact Analysis Map

When a section is updated, warn about these downstream effects:

| Section updated | Foundation sections to review | Downstream skills to warn |
|---|---|---|
| 00-project-identity | None (declarative) | None — unless project type changed (affects all) |
| 01-requirements | 03-entity-map (scope change may add/remove entities) | application-design, schema-design |
| 02-architecture-decisions | 05-ui-plan (app type change), 06-logic-map (platform change) | ui-design, business-logic, integration |
| 03-entity-map | 06-logic-map, 07-integration-map, 08-security-profile | schema-design, application-design, ui-design, security |
| 04-solution-packaging | None within foundation | solution-strategy, alm-workflow |
| 05-ui-plan | None within foundation | ui-design, schema-design (UX denormalization) |
| 06-logic-map | None within foundation | business-logic |
| 07-integration-map | None within foundation | integration |
| 08-security-profile | None within foundation | security, ui-design |
| 09-constraints | None within foundation | All skills (advisory review) |

### Impact Warning Format

After updating a section, present:

```
Section [02-architecture-decisions] updated.

Impact analysis:
  Foundation sections to review:
    ⚠ 05-ui-plan — app type change may affect navigation structure
    ⚠ 06-logic-map — platform change may affect logic implementation options

  Downstream skills with existing output to validate:
    ⚠ ui-design — if output exists, review against new architecture
    ⚠ business-logic — if output exists, review logic types

  These are warnings, not automatic invalidations. Review each flagged item
  and update if the change affects it.
```

### Special Case: Project Type Change

If `00-project-identity` is updated and the project type changes (e.g., greenfield → extension):

```
⚠ PROJECT TYPE CHANGED from [old] to [new].

This affects question context in every foundation section. Review all sections
for accuracy — questions were originally phrased for a [old] project.

Recommended: Re-run solution-discovery in CREATE mode with the new project type
to regenerate the full foundation, or manually review each section for
type-specific content that needs updating.
```
