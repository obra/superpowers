# Superpowers for GitHub Copilot (VS Code)

Guide for using Superpowers workflow in GitHub Copilot via instruction-driven setup.

## Quick Install

Tell Copilot:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.copilot/INSTALL.md
```

## Manual Installation

### Prerequisites

- Visual Studio Code
- GitHub Copilot + Copilot Chat enabled
- A project workspace you want to use Superpowers in

### Steps

1. Create a project instruction file:
   - Path: `.github/copilot-instructions.md`
   - If it already exists, append the Superpowers section instead of replacing existing project rules.

2. Add Superpowers workflow rules to that file (see `.copilot/INSTALL.md` for a ready-to-paste block).

3. Start a new Copilot Chat session so the updated instructions are picked up.

4. Optional: Add prompt files for repeatable workflows in `.github/prompts/` (for example: planning, TDD, and review prompts).

## How It Works in Copilot

Copilot does not currently load Superpowers as a native plugin/marketplace extension.

Instead, Superpowers is applied through:

- Project instructions (`.github/copilot-instructions.md`)
- Reusable prompt files (`.github/prompts/*.prompt.md`)
- Normal Copilot tool usage (edits, tests, verification)

This reproduces the same operating model:

1. Brainstorm/spec first
2. Produce an implementation plan
3. Execute in small tasks
4. Enforce test-first behavior
5. Run review and verification before completion

## Suggested Skill Mapping

- `brainstorming` -> ask clarifying questions and produce a structured spec
- `writing-plans` -> output explicit, file-by-file task plan with verification steps
- `test-driven-development` -> RED-GREEN-REFACTOR loop
- `requesting-code-review` -> findings-first review with severity ordering
- `verification-before-completion` -> run checks/tests before declaring done

## Usage

After setup, try prompts like:

- "Help me plan this feature using Superpowers workflow."
- "Start with a spec, then give me a test-first implementation plan."
- "Execute task 1 only, with RED-GREEN-REFACTOR."
- "Review this change with findings first, ordered by severity."

## Updating

Pull the latest Superpowers docs and refresh your instruction block if needed:

```bash
git pull
```

## Uninstalling

Remove the Superpowers block from:

- `.github/copilot-instructions.md`
- any optional `.github/prompts/superpowers-*.prompt.md` files you added

## Troubleshooting

### Copilot ignores workflow

1. Confirm `.github/copilot-instructions.md` exists in the current workspace.
2. Start a new Copilot chat session.
3. Make sure your prompt explicitly asks to use Superpowers workflow.

### Existing project instructions conflict

Keep project-specific rules first, then add Superpowers as a workflow layer.
If there is a hard conflict, project safety/build rules should win.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
