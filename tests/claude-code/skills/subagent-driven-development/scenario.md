# Scenario: Subagent-Driven Development

## Setup
This test requires an implementation plan with 3 tasks to execute.
The test script creates the plan file before running the scenario.

## Implementation Plan (created by test script)

```markdown
# Implementation Plan: User Greeting Feature

**Goal:** Add a greeting feature to the homepage

**Architecture:** React component with personalized message

**Tech Stack:** Next.js, TypeScript, React Testing Library

---

## Task 1: Create Greeting component

**Files:**
- Create: src/components/Greeting.tsx
- Create: src/components/Greeting.test.tsx

**Steps:**
1. Create Greeting.tsx with props interface (name: string)
2. Render "Hello, {name}!" message
3. Write test for component rendering

**Commit:** feat: add Greeting component

---

## Task 2: Add time-based greeting

**Files:**
- Modify: src/components/Greeting.tsx
- Modify: src/components/Greeting.test.tsx

**Steps:**
1. Import getHours from date-fns (or use native Date)
2. Update component to show "Good morning/afternoon/evening, {name}!"
3. Add tests for each time period

**Context from Task 1:** Greeting component exists at src/components/Greeting.tsx

**Commit:** feat: add time-based greeting messages

---

## Task 3: Integrate Greeting into homepage

**Files:**
- Modify: src/app/page.tsx
- Create: src/app/page.test.tsx

**Steps:**
1. Import Greeting component
2. Add Greeting to page with hardcoded name "User" for now
3. Write test verifying Greeting appears on page

**Context from Tasks 1-2:** Greeting component with time-based messages exists

**Commit:** feat: integrate Greeting component into homepage
```

## User Prompt
"Execute this plan with /hyperpowers:execute-plan"

## Expected Skill Trigger
- The subagent-driven-development skill should activate
- Claude should extract all 3 tasks with full text (not just file paths)
- Per task:
  - Context Curation Gate: Full task text provided to implementer
  - Handoff Consumption Gate: Implementer acknowledges context
  - Review Sequence Gate: Spec Review FIRST, then Code Quality Review
  - Task Completion Gate: Both reviews approve before marking complete
- TodoWrite should be updated only after both reviews pass
