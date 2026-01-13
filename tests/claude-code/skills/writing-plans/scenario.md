# Scenario: Writing Plans

## Setup
This test runs in the test project directory with a pre-existing research document.
The research document contains findings that should be consumed and cited in the plan.

## Pre-Test Setup Script Must:
1. Create a research document at `docs/research/2026-01-13-user-preferences.md`
2. The research document contains specific findings:
   - Architecture patterns found in codebase
   - Best practices for preferences storage
   - Open questions to carry forward
3. Initialize git so the plan can be committed

## User Prompt
"Write a plan based on this research to implement user preferences"

## Expected Skill Trigger
- The writing-plans skill should activate
- Claude should find and read the research document
- Claude should create a plan that:
  - Explicitly cites the research document path
  - Quotes key findings from research
  - Addresses or carries forward open questions
  - Has exact file paths (not "relevant files")
  - Has complete code (not "add validation")
  - Has proper header (Goal, Architecture, Tech Stack)

## Test Duration
Expected: 10-15 minutes

## Critical Verification Points
1. **Handoff Consumption:** Research document MUST be cited with path
2. **Research Quotes:** Key findings from research MUST appear in plan
3. **Task Specificity:** Each task has exact file paths and complete code
4. **Plan Header:** Goal, Architecture, Tech Stack sections present
5. **Open Questions:** Research open questions addressed or carried forward

## Research Document Content (to be created by test script)

```markdown
# User Preferences Feature Research

## Date
2026-01-13

## Context
Research for implementing user preferences in the Next.js app.

## Key Findings

### Architecture Patterns
- The app uses React Context for global state
- Existing patterns show preferences stored in localStorage
- Theme switching uses CSS variables

### Best Practices
- Use Zod for preference schema validation
- Default preferences should be type-safe
- Persistence layer should be abstracted

### Codebase Analysis
- Found existing ThemeProvider at `src/providers/ThemeProvider.tsx`
- Layout wraps all pages at `src/app/layout.tsx`
- No existing preferences context found

### Recommended Approach
1. Create PreferencesContext with typed interface
2. Add localStorage persistence with schema validation
3. Wire into existing layout

## Open Questions
- Should preferences sync to server for logged-in users?
- What's the migration strategy for existing localStorage data?
- How should preferences affect SSR/hydration?
```
