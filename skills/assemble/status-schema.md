# Assemble — Status Schema

This file defines the data contracts used between the PM agent and all team agents.

---

## Team Agent Contract (PM → Team Agent)

The PM passes this context to each team agent at spawn:

| Field | Type | Description |
|---|---|---|
| `role` | string | Agent role title, e.g. "Research Lead" |
| `team` | string | Team name, e.g. "Research Team" |
| `mission` | string | Scoped goal for this specific project |
| `input_artifacts` | list of file paths | Files from prior wave agents to read. Pass empty list for Wave 1 teams with no prior wave artifacts. |
| `owned_tasks` | list of strings | Tasks this agent must complete |
| `output_artifacts` | list of file paths | Files this agent must write |
| `escalation_rule` | string | "Attempt a workaround first. If still blocked, return status: blocked with a clear description." |

---

## Team Report Schema (Team Agent → PM)

Every team agent must return a structured report in this exact format:

```
TEAM REPORT
team: [team name]
status: [complete | blocked | partial]
confidence: [high | medium | low]
completed_tasks:
  - [task 1]
  - [task 2]
blocker: [description, or null]
artifacts_written:
  - [file path]
key_findings:
  - [finding 1]
  - [finding 2]
next_step: [what happens next]
escalation_needed: [true | false]
```

---

## Board Status Codes

| Symbol | Meaning |
|---|---|
| ⏳ | Pending approval — not yet started |
| 🔒 | Locked — waiting for prior wave |
| 🔄 | In Progress |
| ✅ | Complete |
| ⚠️ | Partial / retrying |
| 🔴 | Blocked — needs user input |
