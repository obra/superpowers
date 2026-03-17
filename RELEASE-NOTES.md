# Superpowers Release Notes

For release history before `v5.1.0 (2026-03-16)`, see the upstream README: https://github.com/obra/superpowers/blob/main/README.md

## v5.2.0 (2026-03-16)

### Workflow Enhancements

**Added portable workflow imports from gstack without porting the browser daemon**

- Added `review/checklist.md` and upgraded the reviewer contract to be checklist-driven and base-branch aware
- Added the public `document-release` skill for post-implementation documentation cleanup
- Added the public `qa-only` skill for report-only browser QA using external Playwright-based browser automation support
- Added shared QA support assets at `qa/references/issue-taxonomy.md` and `qa/templates/qa-report-template.md`
- Extended `plan-eng-review` with reusable test-plan artifact output under `~/.superpowers/projects/`
- Extended `finishing-a-development-branch` with stronger base-branch detection plus optional code-review and document-release handoffs

### Docs

- README, platform READMEs, and install docs now document the 18-skill runtime and the `~/.superpowers/projects/` artifact convention

## v5.1.0 (2026-03-16)

### Generated Skill Runtime Preambles

**Generated skill preambles for all 16 Superpowers skills**

- Every `skills/*/SKILL.md` is now generated from an adjacent `SKILL.md.tmpl` source via `node scripts/gen-skill-docs.mjs`
- A shared base preamble now handles update notices, interactive-question formatting, session-awareness, and contributor mode across the full skill library
- `plan-ceo-review` and `plan-eng-review` extend that base with review-only grounding and `_TODOS_FORMAT` resolution

### Runtime Helpers

- Added `bin/superpowers-config` for local runtime config under `~/.superpowers/config.yaml`
- Added `bin/superpowers-migrate-install` to collapse legacy `~/.codex/superpowers` and `~/.copilot/superpowers` clones into the shared install root at `~/.superpowers/install`
- Added `bin/superpowers-update-check` for per-session upgrade notices, snoozes, and just-upgraded markers
- Added canonical review support files at `review/TODOS-format.md`, `superpowers-upgrade/SKILL.md`, and root `VERSION`
- Added focused runtime tests for the generated-skill contract and the new helper binaries

### Docs

- Codex and GitHub Copilot install docs now document the single shared checkout model, `~/.superpowers/` state, contributor mode, and automatic update-check behavior
- README now documents the generated-skill workflow, the single shared checkout, and the runtime helper contract
