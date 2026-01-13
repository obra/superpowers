---
description: "Initialize ralph loop - creates .ralph/ directory with specs, plan, guardrails, and progress files"
---

Invoke the hyperpowers:ralph skill with command: init

Follow the skill's init flow:
1. Check for existing .ralph/ directory - warn and confirm if exists
2. Create .ralph/ directory structure
3. Add .ralph/ to .gitignore if not already present
4. Check for existing documents (design doc, PRD, notes)
5. Recommend brainstorm → research → write-plan if no plan exists
6. Generate template files in .ralph/:
   - .ralph/specs/ (directory for spec files)
   - .ralph/IMPLEMENTATION_PLAN.md
   - .ralph/GUARDRAILS.md
   - .ralph/progress.txt
7. Validate structure and report readiness
