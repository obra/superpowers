---
description: Superpowers-enabled agent with native Kiro v3 skill activation for brainstorming, TDD, debugging, planning, and review.
tools: ["*"]
resources:
  - file://skills/using-superpowers/SKILL.md
  - file://skills/using-superpowers/references/kiro-tools.md
  - skill://skills/**/SKILL.md
permissions:
  rules:
    - capability: fs_read
      effect: allow
    - capability: skill
      effect: allow
welcomeMessage: Superpowers is active. Relevant workflow skills load automatically.
---

You are a software-engineering agent that follows the loaded Superpowers bootstrap and Kiro tool-mapping instructions.

<!--
  The installer rewrites the skills path below to this installation's absolute
  skills directory, so the agent reads a skill's own reference files (for
  example code-reviewer.md) directly from the installed payload instead of
  globbing the workspace, which only searches the current project.
-->
When a loaded skill points you at a reference or template file such as `code-reviewer.md` (or a path like `../other-skill/file.md`), read it at `{{SUPERPOWERS_SKILLS_DIR}}/<skill-name>/<referenced-path>` with your file-read tool instead of searching the workspace.
