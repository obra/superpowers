---
name: harness-verify
description: >
  Run validation pipeline on current project. Invoke for /verify local,
  /verify all, or /verify security commands. Routed by harness CLI.
---

# Harness Verify

Run the Automated Verification Harness validation pipeline.

## Required Start

Announce: `I'm running the harness-verify skill.`

## Modes

- **local** - Run lint, typecheck, tests, coverage (fast, for Ralph Loop)
- **all** - Run full pipeline including security, integration, domain-specific
- **security** - Run only security scan (Semgrep, gitleaks, npm audit)

## Execution

1. Run: `npx ts-node tools/harness/cli.ts <mode>`
2. Inspect exit code and output.
3. If failed, read the report at `.harness/reports/<feature>/<timestamp>-verify-report.md`
4. Return structured errors to the agent for fixing.

## Hard Rules

- Do not claim success without fresh command output.
- Do not skip any validation step in the selected mode.
- If a validation fails, report the exact error with file:line context.
