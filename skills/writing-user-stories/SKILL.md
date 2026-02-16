---
name: writing-user-stories
description: Use when writing user stories from scratch, reviewing existing stories for quality, or posting refined stories as GitHub issues — applies INVEST criteria, BDD acceptance scenarios, and anti-pattern detection to any markdown file
---

# Writing User Stories

## Overview

Quality-check and author user stories that are implementable, testable, and ready for GitHub issue tracking. Works with any markdown file — spec-kit specs, hand-written docs, or stories created from scratch in conversation.

**Core principle:** Every story must pass INVEST criteria and have Given/When/Then acceptance scenarios before posting as a GitHub issue.

## When to Use

- User asks to write user stories for a feature or idea
- User asks to review, improve, or quality-check existing stories
- User has a markdown file with stories to refine (spec-kit spec.md or any format)
- User wants to post stories as GitHub issues
- Stories exist but lack acceptance criteria, are too vague, or smell like tasks

**When NOT to use:**
- Implementation planning (use superpowers:writing-plans)
- Feature brainstorming before stories exist (use superpowers:brainstorming first, then this skill)
- Bug reports without a user story angle

## Process

### Phase 1: Determine Mode

Ask the user or infer from context:

| Signal | Mode |
|--------|------|
| User points to an existing markdown file | **Review** — read and assess |
| User describes a feature idea or asks to write stories | **Create** — draft stories from scratch |
| User says "post to GitHub" with stories already reviewed | **Publish** — skip to Phase 4 |

### Phase 2: Write or Review Stories

#### Creating from scratch

1. Understand the feature (ask clarifying questions if needed — who benefits, what problem it solves, what "done" looks like)
2. Draft stories in the user's markdown file using this format:

```markdown
## User Story: [Short descriptive title]

**As a** [specific user role],
**I want** [concrete action or capability],
**So that** [measurable business value or outcome].

### Acceptance Scenarios

**Scenario: [Happy path name]**
- **Given** [precondition]
- **When** [action]
- **Then** [observable outcome]

**Scenario: [Edge case or alternate path]**
- **Given** [precondition]
- **When** [action]
- **Then** [observable outcome]
```

3. Write the stories directly into the user's file (in-place editing)

#### Reviewing existing stories

1. Read the markdown file
2. Assess each story against the INVEST checklist (see below)
3. Check acceptance scenarios against BDD standards
4. Scan for anti-patterns
5. Present findings to the user as a summary table:

```
| Story | INVEST | Acceptance Criteria | Issues |
|-------|--------|-------------------|--------|
| Login | ✅✅✅⚠️✅✅ | 2 scenarios, missing edge case | Negotiable: prescribes UI |
```

### Phase 3: Iterate with User

Present the assessment and proposed improvements. The user decides what to change. Apply accepted changes in-place to the original file.

**Do NOT silently rewrite stories.** Always show what you'd change and why, then edit after approval.

Repeat Phase 2–3 until the user is satisfied or all stories pass the quality gate.

### Phase 4: Publish to GitHub Issues

When the user says stories are ready:

1. **Ask once per project** (not per story): "Should issues include assignees, milestones, or project boards? Default is type + labels only."
2. Map each story to a GitHub issue type:

| Issue Type | When to Use |
|------------|-------------|
| **Epic** | Large feature requiring multiple stories — becomes parent issue |
| **Feature** | User-facing capability that delivers value independently |
| **Task** | Technical work supporting a feature (not user-facing) |
| **Bug** | Defect in existing behavior |
| **Question** | Uncertainty requiring team input before implementation |

3. **Decide granularity** based on story size:
   - Single stories → one issue each
   - Large features with sub-stories → Epic issue with sub-issues
   - Don't force structure — let the content determine the shape

4. **Compose issue body** from the story:
   - Title: story title (concise, action-oriented)
   - Body: "As a / I want / So that" + acceptance scenarios
   - Labels: derive from story content (e.g., `enhancement`, `frontend`, `api`)
   - Type: from the table above

5. **Post using MCP GitHub tools** (activate issue/comment management tools first)
6. **Report back** with links to created issues

## INVEST Quality Checklist

Evaluate every story against all six criteria. A story must pass all to be considered ready.

| Criterion | Question | Fail Signal |
|-----------|----------|-------------|
| **I**ndependent | Can this story be implemented and delivered without waiting on other stories? | "After story X is done..." or shared state dependencies |
| **N**egotiable | Does it describe *what* and *why* without prescribing *how*? | Mentions specific UI elements, database tables, API endpoints, or implementation details |
| **E**stimable | Could a developer estimate this in a sprint planning session? | Too vague ("improve performance") or too large to reason about |
| **S**mall | Can it be completed in one sprint (ideally 1–3 days of work)? | Multiple acceptance scenarios spanning different features |
| **T**estable | Do the acceptance scenarios define clear pass/fail criteria? | "System should be fast" or "User has a good experience" |
| **V**aluable | Does it deliver value to a user or stakeholder (not just developers)? | "Refactor the database layer" with no user-facing outcome stated |

### Applying INVEST Pragmatically

- **Don't block on perfection.** Flag violations, suggest fixes, let the user decide.
- **Negotiable ≠ no technical context.** Mentioning an API is fine if the story is about API behavior. Prescribing `POST /api/v2/users` with JSON schema is not.
- **Valuable for Tasks.** Tasks (technical work) may not directly serve end users — they're valuable if they enable a Feature story. State which Feature they support.

## Acceptance Scenario Standards

Every story needs at least:
- **1 happy path** scenario (the main success case)
- **1 edge case or error** scenario (what happens when things go wrong)

### Good vs Bad Scenarios

```markdown
# ✅ GOOD: Observable, testable, specific
**Scenario: Successful login**
- Given a registered user with valid credentials
- When they submit the login form
- Then they are redirected to the dashboard
- And they see a welcome message with their name

# ❌ BAD: Vague, untestable
**Scenario: Login works**
- Given a user
- When they log in
- Then it works correctly

# ❌ BAD: Implementation detail, not behavior
**Scenario: JWT token creation**
- Given valid credentials
- When POST /api/auth is called
- Then a JWT with 24h expiry is returned in the response body
```

### Scenario Smells

- **"Should work correctly"** — not testable, needs specific outcome
- **"The system processes..."** — system as actor, rewrite from user perspective
- **Technical verbs** (POST, SELECT, render) — focus on behavior, not mechanism
- **No Given** — missing preconditions make scenarios ambiguous

## Anti-Pattern Detection

Flag these when reviewing stories. Each one includes the fix.

| Anti-Pattern | Example | Fix |
|---|---|---|
| **System-as-user** | "As a system, I want to sync data" | Rewrite: who benefits from the sync? "As an analyst, I want data refreshed hourly so that reports reflect current state" |
| **Task disguised as story** | "As a developer, I want to refactor the auth module" | Convert to Task issue type. State which Feature it supports. |
| **UI prescription** | "As a user, I want a blue button in the top-right corner" | Strip UI details: "As a user, I want to quickly access my settings from any page" |
| **Epic masquerading as story** | "As a user, I want a complete reporting system" | Split into independent stories: generate report, filter report, export report, schedule report |
| **No value clause** | "As a user, I want to click the submit button" | Add "so that": what outcome does clicking achieve? |
| **Compound story** | "As a user, I want to search AND filter AND sort results" | One story per capability. Each independently deliverable. |
| **Solution-first** | "As a user, I want Redis caching so pages load faster" | Focus on need: "As a user, I want pages to load within 2 seconds" |

## Working with spec-kit

When the input file is a spec-kit spec.md (in `.specify/specs/` directory):

- Stories follow spec-kit's priority format (P1/P2/P3) — preserve priority markers
- Functional Requirements (FR-001) and Success Criteria (SC-001) can inform acceptance scenarios
- Don't restructure the spec-kit format — work within it, improving story quality in-place
- If spec-kit's scenarios are already in Given/When/Then, validate rather than rewrite

## Key Principles

- **In-place editing** — one source of truth, edit the user's file directly
- **Show before changing** — never silently rewrite; present assessment, get approval, then edit
- **Flexible issue structure** — let content determine whether to use Epics with sub-issues or flat issues
- **Minimal defaults** — type + labels only; ask user once per project about additional metadata
- **Stories describe needs, not solutions** — enforce Negotiable criterion consistently
