# Context Management Templates

## Global Template (`context.md`)

```markdown
# Persistent Context for [Name]

> Global context — auto-loaded every session.
> Project contexts in `contexts/`. Load when user mentions a project.
> Last updated: [date]

---

## Who am I
- Name:
- Email:
- Team:

## Repos & Local Paths
| Repo | Local Path | Branch |
|------|-----------|--------|

**Boundary rule:** Only list `main branch` + one active feature branch per repo. PR numbers, merge status, multi-branch details belong in the relevant `contexts/<project>.md` file, not here.

## Environment
[Cloud accounts, deploy targets — skip if N/A]

## Team & Key People
[Name, role, what they own]

## Historical Lessons
[Cross-project gotchas — things you'd warn a new teammate about]

---

## Active Projects

**Auto-load:** See "Load Flow" in SKILL.md for matching rules.

| Context File | Keywords | What's Inside |
|-------------|----------|---------------|
| `contexts/example.md` | auth, login, JWT | Token refresh, OAuth flow, session expiry handling |

**Done:** `mv contexts/x.md contexts/archived/`, remove row.
**New:** Create `contexts/x.md`, add row.

---

## Preferences
- Language:
- Style:
- Agent name: [optional — a name the agent uses to refer to itself, e.g. "小诸葛", "Jarvis"]

## Custom Sections (optional)
[Users may add sections not in this template — Key Documents, Data Pipeline, etc. Do not remove during updates or prune unless user requests it.]
```

## Project Template (`contexts/<name>.md`)

```markdown
# [Project Name]

**Status:** In Progress | Waiting | Done
**Last updated:** [date]
**PRD:** [link or description]

---

## Overview
[2-3 sentences]

## Architecture
- **Services:** [repos involved]
- **Data flow:** [A → B → C]
- **Key files:** [paths, not code]

## Key Decisions
- [date] [decision] — [why]

## Current Progress
- [x] Done thing
- [ ] Next thing — blocked on [what]

## Action Items
- [ ] [specific next action]

## Notes
[Gotchas, meeting notes, anything else]
```
