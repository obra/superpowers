---
name: fetch-tickets
description: "Retrieves tickets from external sources Jira and initializes them into the Spectral workspace as local folders and entries in the tasks.json registry."
---

# Fetch Tickets

Retrieve tickets from external sources and normalize them into the Spectral workspace structure.

## Target Structure

- **Ticket Folder**: `.spectral/tasks/{TICKET_ID}/`
- **Ticket File**: `.spectral/tasks/{TICKET_ID}/ticket.md`
- **Registry**: `.spectral/registry/tasks.json`

## Steps

### 1. Fetch Tickets
- Utilize available integrations to retrieve tickets from Jira.
- Extract: `id`, `title`, `description`, `acceptance criteria`, `priority`, and `url`.

### 2. Check for Duplicates
- Open `.spectral/registry/tasks.json`.
- If the `id` already exists, **SKIP** that ticket.

### 3. Create Folder structure
- For each new ticket, create `.spectral/tasks/{TICKET_ID}/`.

### 4. Generate `ticket.md`
- Create `.spectral/tasks/{TICKET_ID}/ticket.md` using the template:

# {TICKET_ID}-{TITLE}

## Status
PENDING

## Source
Jira 

## Priority
{PRIORITY}

## Created At
{CURRENT_TIMESTAMP}

---

## Description
{CLEANED_DESCRIPTION}

---

## Acceptance Criteria
{BULLET_POINTS_OF_AC}

---

## Notes
* 

---

## Links
* {URL}

### 5. Update Registry
- Append to `.spectral/registry/tasks.json`:
```json
{
  "id": "{TICKET_ID}",
  "title": "{TITLE}",
  "status": "PENDING",
  "priority": "{PRIORITY}"
}
```

## Strict Rules
- **Pure Intake**: Do NOT brainstorm, plan, or write code.
- **Data Integrity**: Do NOT overwrite existing folders or modify existing registry entries.
- **No Inference**: Do NOT add assumptions or "clarifications" to the description.
- **Normalization**: Clean and normalize description text; convert ACs to bullet points.
