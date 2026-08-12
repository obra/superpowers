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
