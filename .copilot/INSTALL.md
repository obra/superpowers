# Installing Superpowers for GitHub Copilot (VS Code)

Enable Superpowers workflow in Copilot through project instructions.

## Prerequisites

- Visual Studio Code
- GitHub Copilot + Copilot Chat enabled
- A repository workspace

## Installation

1. **Create or open project instructions file:**
   - `.github/copilot-instructions.md`

2. **Add this Superpowers workflow block** (append; do not delete existing project rules):

```md
## Superpowers Workflow (Copilot)

When handling development tasks, follow this sequence unless the user explicitly asks otherwise:

1. **Brainstorming / Spec**
   - Ask concise clarifying questions when requirements are ambiguous.
   - Produce a short spec with goals, constraints, non-goals, and acceptance criteria.
   - Get confirmation before large changes.

2. **Planning**
   - Create a concrete implementation plan with small steps.
   - For each step, include exact file paths and verification commands.
   - Prefer YAGNI and DRY; avoid speculative abstractions.

3. **Execution**
   - Execute one small step at a time.
   - Keep diffs minimal and scoped to the approved plan.
   - Do not silently broaden scope.

4. **Test-Driven Development**
   - RED: add/adjust a failing test for behavior change.
   - GREEN: implement the smallest code change to pass.
   - REFACTOR: improve structure while keeping tests green.

5. **Code Review Mindset**
   - When asked to review, report findings first, ordered by severity.
   - Include file references and concrete risk descriptions.
   - Keep summary brief and secondary to findings.

6. **Verification Before Completion**
   - Run relevant build/typecheck/tests.
   - If anything is not run, state it explicitly.
   - Do not claim completion without evidence.
```

3. **Start a new Copilot Chat session** to ensure updated instructions are applied.

## Verify

Ask Copilot:

- "Help me plan this feature using Superpowers workflow."
- "Use RED-GREEN-REFACTOR for this bugfix."

You should see: clarification -> spec -> plan -> test-first execution -> verification.

## Updating

Update this repository and refresh your local instruction block when needed.

## Uninstalling

Remove the Superpowers block from `.github/copilot-instructions.md`.
