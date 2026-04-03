# Testing Codex-Only Superpowers

This guide describes how to validate the Codex-only fork during the reorganization. It avoids legacy plugin workflows and translated tool models.

## Validation Model

- Run checks from the repository root.
- Prefer targeted validation after each task instead of waiting for one final sweep.
- Treat lingering non-Codex platform names and translated tool aliases in active files as failures.
- Use Codex-native smoke tests rather than plugin-era harness tests.

## Manual Repository Checks

### Root identity

Verify that the canonical root files are Codex-only:

```bash
rg -n 'CLAUDE.md|Claude Code|Harness|superpowers:writing-skills' \
  AGENTS.md package.json .github/ISSUE_TEMPLATE/bug_report.md .github/PULL_REQUEST_TEMPLATE.md
```

Expected: no matches

### Public docs

Verify that the public install docs do not reference removed platforms or plugin commands:

```bash
rg -n 'Claude Code|Cursor|OpenCode|Gemini|Copilot|/plugin|/add-plugin|marketplace' \
  README.md docs/README.codex.md .codex/INSTALL.md
```

Expected: no matches

### Skill rewrites

As each skill is rewritten, run the task-specific grep checks from the active implementation plan. Typical forbidden legacy terms include:

- `Task tool`
- `TodoWrite`
- `Skill tool`
- non-Codex platform names in active skill content

## Codex Smoke Test

Run a real Codex CLI session in this repository and confirm:

1. `AGENTS.md` is read as the root instruction file.
2. Skills are discovered and can be triggered natively.
3. Workflow responses use Codex-native concepts such as `update_plan` and `spawn_agent`.

## Final Validation

The reorganization is not complete until the dedicated validation scripts land. When available, run:

```bash
scripts/validate-codex-only.sh
```

If the script does not exist yet, the repository is still in the middle of the Codex-only migration.
