---
description: Generate complete project scaffolding based on project type — creates CLAUDE.md, directory structure, skills, agents, hooks, and config from YAML templates
disable-model-invocation: true
---

Invoke the scaffolding skill and follow it exactly as presented to you.

Arguments:
- First argument: project type (software, claude-code-plugin, course, content, business, personal)
- Second argument: project name
- `--dry-run`: Preview what would be generated without creating files
- Example: `/scaffold software my-app`
- Example: `/scaffold claude-code-plugin my-plugin --dry-run`
