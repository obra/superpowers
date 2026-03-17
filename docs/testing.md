# Testing Superpowers

This repository supports three automated validation surfaces:

- `tests/codex-runtime/*.test.mjs` for deterministic generated-skill, template, and fixture contracts
- `tests/codex-runtime/` for install docs, generated skill preambles, helper binaries, and upgrade/migration behavior
- `tests/brainstorm-server/` for the brainstorming visual companion server

## Recommended Validation Order

Run these commands from the repository root:

```bash
node scripts/gen-agent-docs.mjs --check
node scripts/gen-skill-docs.mjs --check
node --test tests/codex-runtime/*.test.mjs
bash tests/codex-runtime/test-runtime-instructions.sh
bash tests/codex-runtime/test-workflow-enhancements.sh
bash tests/codex-runtime/test-workflow-sequencing.sh
bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh
bash tests/codex-runtime/test-superpowers-config.sh
bash tests/codex-runtime/test-superpowers-migrate-install.sh
bash tests/codex-runtime/test-superpowers-update-check.sh
bash tests/codex-runtime/test-superpowers-upgrade-skill.sh
bash tests/brainstorm-server/test-launch-wrappers.sh
npm --prefix tests/brainstorm-server test
```

## What Each Suite Covers

### `tests/codex-runtime/*.test.mjs`

- Generated `skills/*/SKILL.md` presence, frontmatter, generated-header, and placeholder coverage
- Semantic preamble contracts for base and review skills
- Unit coverage for `scripts/gen-skill-docs.mjs` pure helper behavior
- Workflow-fixture regression coverage for the sequencing contract

### `tests/codex-runtime/`

- Generated `skills/*/SKILL.md` freshness plus runtime-facing install and workflow contract checks
- Generated reviewer-agent artifact freshness for Codex and GitHub Copilot
- Runtime helper contracts for config, update checks, migration, and upgrade flow
- PowerShell wrapper behavior, including Git Bash selection and Windows path handling
- Install documentation and supported runtime references
- Required support files such as `VERSION`, `review/TODOS-format.md`, `review/checklist.md`, the shared QA assets, and `superpowers-upgrade/SKILL.md`
- Dedicated workflow-artifact fixtures under `tests/codex-runtime/fixtures/workflow-artifacts/` for sequencing-contract coverage without coupling tests to repository-root docs

### `tests/brainstorm-server/`

- WebSocket protocol behavior for the brainstorming visual companion
- HTTP server behavior and frame-serving expectations
- Shell and PowerShell launch-wrapper smoke coverage

## When To Run What

- Editing any `SKILL.md.tmpl`, runtime helper, or install/readme doc: run `node --test tests/codex-runtime/*.test.mjs` plus the full `tests/codex-runtime/` shell suite
- Editing brainstorming server files under `skills/brainstorming/scripts/`: run `bash tests/brainstorm-server/test-launch-wrappers.sh` and `npm --prefix tests/brainstorm-server test`
- Editing both runtime and brainstorming-server files: run both suites

## Optional Evals

- `tests/evals/*.eval.mjs` is an opt-in quality tier for prompt-behavior checks
- See `tests/evals/README.md` for required environment variables and logging behavior

## Notes

- `test-runtime-instructions.sh` is the contract gate for supported install and runtime documentation
- `test-workflow-enhancements.sh` covers the imported review, QA, and document-release workflow contracts
- `test-workflow-sequencing.sh` covers artifact-state routing, stage gates, and the optional worktree policy using checked-in workflow fixtures in `tests/codex-runtime/fixtures/workflow-artifacts/`
- `tests/codex-runtime/*.test.mjs` covers the deterministic generated-skill and fixture assertions that do not need shell execution
- `test-powershell-wrapper-bash-resolution.sh` covers shared PowerShell wrapper bash selection and override behavior
- `test-superpowers-update-check.sh` covers semver comparison, snooze handling, and just-upgraded markers
- `test-superpowers-upgrade-skill.sh` covers install-root resolution and direct upgrade-flow version resolution
- `test-launch-wrappers.sh` covers the brainstorm launcher wrappers for Bash and PowerShell, including documented `C:\...` project paths
