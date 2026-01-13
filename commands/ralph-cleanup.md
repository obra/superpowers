---
description: "Remove .ralph/ directory after user confirms satisfaction with results"
---

Invoke the hyperpowers:ralph skill with command: cleanup

Follow the skill's cleanup flow:
1. Show final summary (tasks completed, iterations, time elapsed)
2. Ask user explicitly: "Are you satisfied with the results?"
3. Wait for explicit confirmation - do NOT assume or proceed without it
4. If confirmed: `rm -rf .ralph/`
5. Report cleanup complete

COMPULSORY: User must explicitly confirm satisfaction before cleanup.
