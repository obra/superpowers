---
description: "Stop ralph loop gracefully - waits for current iteration, generates summary"
---

Invoke the hyperpowers:ralph skill with command: stop

Follow the skill's stop flow:
1. Signal tmux session to stop after current iteration
2. Wait for iteration to complete
3. Generate summary report (tasks completed, time elapsed, files modified)
4. Kill tmux session
5. Offer next steps (resume, PR creation)
