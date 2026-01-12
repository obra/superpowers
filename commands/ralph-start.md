---
description: "Start ralph loop in tmux - validates setup, checks model, launches background session"
---

Invoke the hyperpowers:ralph skill with command: start

Follow the skill's start flow:
1. Full validation (files exist, parseable, tasks actionable)
2. Check model (strongly warn if not Haiku)
3. Check environment (git clean, tests passing, tmux available)
4. Launch tmux session: ralph-<project>
5. Report session name and monitoring instructions
