# Workflow Hooks

Extend superpowers workflow skills by registering external skills to be invoked at specific points.

## Overview

Workflow hooks allow skill packs (like `dev-ethos`) to integrate into the superpowers workflow without modifying superpowers itself. When a workflow skill reaches a hook point, it checks the hooks configuration and invokes any registered skills.

## Configuration

Create a hooks configuration file at one of these locations (checked in order):
1. `.claude/workflow-hooks.yaml` (project-specific)
2. `~/.claude/workflow-hooks.yaml` (global)

## Hook Points

| Hook | Workflow Skill | When |
|------|---------------|------|
| `before_design` | brainstorming | Start of design process |
| `after_design` | brainstorming | After design validated, before saving |
| `before_plan` | writing-plans | Start of planning |
| `after_plan` | writing-plans | After plan saved, before execution choice |
| `before_execute` | subagent-driven-development | Start of execution, after reading plan |
| `before_task` | subagent-driven-development | Before dispatching implementer |
| `after_task` | subagent-driven-development | After task + reviews complete |
| `before_review` | subagent-driven-development | Before dispatching reviewers |
| `after_execute` | subagent-driven-development | After all tasks, before finishing |

## Configuration Format

```yaml
# .claude/workflow-hooks.yaml

hooks:
  before_design:
    - skill: dev-ethos:ux-design-principles
      condition: if_ui
    - skill: dev-ethos:domain-driven-design

  after_design:
    - skill: dev-ethos:architecture-decision-records

  before_execute:
    - skill: dev-ethos:project-quality-setup
      mode: enforce

  after_task:
    - skill: dev-ethos:boy-scout-rule
    - skill: dev-ethos:visual-feedback-loop
      condition: if_ui_changed

  before_review:
    - skill: dev-ethos:functional-core-imperative-shell
      mode: inject
    - skill: dev-ethos:react-best-practices
      condition: if_react
      mode: inject

# Condition definitions (optional - these are built-in)
conditions:
  if_ui:
    match: "files contain *.tsx, *.jsx, *.vue, *.svelte, or components/"
  if_ui_changed:
    match: "git diff includes UI file patterns"
  if_react:
    match: "git diff includes .tsx or .jsx files"
```

## Hook Modes

| Mode | Behavior |
|------|----------|
| `invoke` (default) | Invoke skill, follow its guidance |
| `check` | Verify skill criteria are met, warn if not |
| `enforce` | Block workflow until skill criteria are met |
| `inject` | Add skill criteria to subagent prompts |

## Built-in Conditions

| Condition | Matches When |
|-----------|-------------|
| `always` (default) | Always invoke |
| `if_ui` | Current task/design involves UI files |
| `if_ui_changed` | Git diff includes UI file changes |
| `if_react` | Git diff includes .tsx or .jsx files |
| `if_backend` | Current task involves backend/API code |
| `if_new_project` | No existing source files detected |

## How Workflow Skills Check Hooks

Each workflow skill includes a hook check at defined points:

```markdown
**[HOOK: before_design]** Check workflow hooks configuration:
1. Look for `.claude/workflow-hooks.yaml` or `~/.claude/workflow-hooks.yaml`
2. If `before_design` hooks are defined:
   - For each hook, evaluate the condition
   - If condition passes, invoke the skill using the Skill tool
   - Apply the skill's guidance before proceeding
3. If no config found, proceed without hooks
```

## Example: dev-ethos Integration

With `dev-ethos` installed and this configuration:

```yaml
hooks:
  after_task:
    - skill: dev-ethos:boy-scout-rule
    - skill: dev-ethos:visual-feedback-loop
      condition: if_ui_changed
```

After each task completes in subagent-driven-development:
1. `boy-scout-rule` is always invoked - apply refactoring checklist
2. `visual-feedback-loop` is invoked only if the task changed UI files

## Creating Hook-Compatible Skills

Skills work with hooks if they:
1. Have clear entry/exit points
2. Can be invoked mid-workflow without disrupting state
3. Provide actionable guidance (not just information)

For `inject` mode, skills should have a "criteria" or "checklist" section that can be added to reviewer prompts.
