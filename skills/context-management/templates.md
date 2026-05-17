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

## Global Router Template (for Domain Isolation)

Use this instead of the standard Global Template when setting up domain isolation.

```markdown
# Persistent Context for [Name]

> **Global router** — read at session start, then load relevant sub-context files.
> Last updated: [date]

---

## Who am I
- Name:
- Email:
- Team:

## Preferences
- Language:
- Style:
- Agent name: [optional — a name the agent uses to refer to itself]

---

## Domain Architecture

Load one sub-context per session based on topic:

| Sub-Context | File | When to Load |
|-------------|------|-------------|
| 💼 **Work** | `context-work.md` | Work repos, team topics, on-call |
| 🚀 **Innovation** | `context-innovation.md` | Side projects, experiments |
| 🧑 **Personal** | `context-personal.md` | Personal topics |

### Rules
1. **Identity + preferences** (this file) → always loaded
2. **Domain selection** → present choices or auto-detect from first message
3. **Domain lock** → no switching mid-session, start new session to change
4. **Keyword index** inside each sub-context → loads project files within that domain

### Project Files
| Directory | Contents |
|-----------|----------|
| `contexts/work/` | Work project files |
| `contexts/innovation/` | Innovation project files |
| `contexts/archived/` | Completed projects |
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
