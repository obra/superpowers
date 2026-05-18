---
name: harness-verify
description: >
  Run validation pipeline on current project. Supports /verify local,
  /verify all, /verify security, /verify completeness, /verify deadcode,
  and /explain-drift commands. Routed by harness CLI.
---

# Harness Verify

Run the Automated Verification Harness validation pipeline.

## Required Start

Announce: `I'm running the harness-verify skill.`

## Modes

### verify-local (fast, for Ralph Loop)
1. **completeness** — Verify all acceptance criteria implemented
2. **lint** — Code style and formatting
3. **typecheck** — Type safety
4. **test** — Unit tests passing
5. **coverage** — Coverage threshold met
6. **patterns** — Check against known error patterns (BLOCK if high severity, WARN if medium/low)

### verify-all (full reconciliation)
1-5. All of verify-local
6. patterns — (from verify-local)
7. **security** — Security scan (Semgrep, gitleaks, npm audit)
8. **integration** — Integration tests
9. **domain-specific** — Framework-specific checks (Lighthouse, TFLint)
10. **dead-code** — Detect unreachable symbols
11. **drift-analysis** — Spec vs implementation semantic diff

### verify-security
Run only security scan.

### verify-completeness
Run completeness check only — verifies all ACs from spec have code + test evidence.

### verify-deadcode
Run dead code detection only — flags symbols created but never imported.

### explain-drift
Full semantic diff between spec and implementation — identifies missing, partial, divergent, and extra requirements.

## Execution

1. Run: `npx ts-node tools/harness/cli.ts <command> [--spec path/to/spec.md] [--root /path/to/project]`
2. Inspect exit code and output.
3. If failed, read the report at `.harness/reports/<feature>/<timestamp>-verify-report.md`
4. Return structured errors to the agent for fixing.

## Commands

| Command | Description |
|---------|-------------|
| `local` | verify-local pipeline |
| `all` | verify-all pipeline |
| `security` | security scan only |
| `completeness` | AC completeness check |
| `deadcode --files=a.ts,b.ts` | dead code detection |
| `explain-drift [--spec path]` | spec vs implementation drift |

## Hard Rules

- Do not claim success without fresh command output.
- Do not skip any validation step in the selected mode.
- If a validation fails, report the exact error with file:line context.
- Completeness failures block progression — all ACs must be implemented.
- Drift reports with critical-drift status require correction tasks before merge.
