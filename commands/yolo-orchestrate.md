---
description: Run the full SDLC pipeline in autonomous mode — no judgment gates, no stopping, full send
disable-model-invocation: true
---

Invoke the orchestration skill with `--auto` mode and follow it exactly as presented to you.

This is autonomous mode:
- Skip ALL judgment gates
- Log P1 findings to `docs/pm/review-findings/` with REQUIRES_ATTENTION flag
- Run the full pipeline end-to-end without stopping
- Present a summary at the end with all findings
