# Checklist: writing-plans Compliance

## Handoff Consumption Gate (COMPULSORY)
- [ ] Skill announcement made ("I'm using the writing-plans skill")
- [ ] Research document search performed (looked in docs/research/)
- [ ] Research document path explicitly stated (exact path quoted)
- [ ] Key findings from research quoted in plan (verbatim text from research)
- [ ] Architecture patterns from research referenced in plan
- [ ] Best practices from research incorporated
- [ ] Open questions from research addressed OR explicitly carried forward

## Context Gate (COMPULSORY)
- [ ] Research document actually read (not just found)
- [ ] Topic clear from research findings
- [ ] Sufficient context gathered before writing tasks
- [ ] Degraded mode NOT used (research exists and was consumed)

## Task Quality Gate (COMPULSORY - per task)
- [ ] Each task has EXACT file paths (e.g., `src/providers/PreferencesContext.tsx`)
- [ ] No vague file references like "relevant files" or "appropriate location"
- [ ] Complete code provided in plan (actual implementation, not placeholders)
- [ ] No placeholder text like "add validation", "implement logic", "handle errors"
- [ ] Exact commands with expected output specified
- [ ] Step granularity is 2-5 minutes each (bite-sized)
- [ ] Tests written before implementation (TDD structure)

## Plan Completeness Gate (COMPULSORY)
- [ ] Header includes Goal section
- [ ] Header includes Architecture section
- [ ] Header includes Tech Stack section
- [ ] Header includes "Context Gathered From" with research doc path
- [ ] Related Issues section present (or "none" noted)
- [ ] Each task has Files section
- [ ] Each task has Steps section
- [ ] Each task has Commit section
- [ ] DRY/YAGNI/TDD principles evident

## Research Tracing (COMPULSORY)
- [ ] Plan references "ThemeProvider at src/providers/ThemeProvider.tsx" (from research)
- [ ] Plan references "Layout at src/app/layout.tsx" (from research)
- [ ] Plan mentions Zod for schema validation (from research best practices)
- [ ] Plan addresses at least one open question from research
- [ ] Architecture approach traces back to research recommendations

## Evidence Requirements
- [ ] Session shows research document being found
- [ ] Session shows research document content being read
- [ ] Session shows quotes/references to research findings
- [ ] Session shows plan with proper header structure
- [ ] Session shows tasks with complete code blocks
- [ ] Session shows exact file paths (not vague references)
- [ ] Plan saved to docs/plans/ directory
