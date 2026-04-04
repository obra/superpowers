# Testing the Codex-Only Superpowers Fork

This repository ships two kinds of proof for the core execution workflow:

1. upstream workflow parity checks
2. Codex executability checks for the current checkout

The suite is still not a full live-session behavioral eval harness, and it is not a full behavioral parity suite against upstream Superpowers. Its green status should now answer two separate questions:

- does this checkout still preserve the upstream execution workflow?
- can this checkout actually be loaded and exercised in Codex?

The current automated suite exercises the POSIX/bash execution path of this checkout.
Global install and native Windows verification are separate checks.
Some shell-script-based helper workflows are therefore only automatically exercised on POSIX/WSL today.

## Validation Layers

1. Repository surface checks
2. Forbidden legacy-term checks
3. Documentation consistency checks
4. Workflow semantic checks for core execution skills
5. Runtime smoke checks for the current checkout (when `codex` CLI and auth are available)

## Run All Checks

```bash
scripts/validate-codex-only.sh
```

## Individual Checks

```bash
tests/codex/test-repo-surface.sh
tests/codex/test-forbidden-terms.sh
tests/codex/test-doc-consistency.sh
tests/codex/test-workflow-parity.sh
tests/codex/test-runtime-smoke.sh
```

## What Automated Checks Enforce

- `AGENTS.md` is canonical
- non-Codex product artifacts are removed
- public docs are Codex-only
- the active product surface does not use translated legacy-platform names or tool aliases
- `subagent-driven-development` keeps the upstream same-implementer review loop as the default workflow
- `executing-plans` stays free of baked-in mandatory review loops
- the current checkout can be loaded as the active `skills/` surface in an isolated Codex runtime when local Codex prerequisites are available

These checks do not prove that:

- the global `~/.agents/skills/superpowers` symlink exists
- your normal interactive Codex environment loaded the global install you expect
- full behavioral parity with upstream across live Codex sessions is still not automatically proven
- native Windows execution behavior is not yet covered by native Windows automation in this suite
- bundled POSIX shell helper workflows are not automatically exercised on native Windows by this suite

Archived design docs and historical planning notes under `docs/superpowers/` are intentionally outside this automated surface scan.
Historical material kept under active product directories such as `skills/` or `agents/` is still scanned.

## Manual Install Check

If you installed the repository globally, verify that the installed skill path resolves to the cloned repository:

```bash
ls -la "$HOME/.agents/skills/superpowers"
ls "${CODEX_HOME:-$HOME/.codex}/superpowers/skills"
```

Expected: the first path resolves to the second path. On POSIX/WSL this is typically a symlink. On native Windows this is typically a junction; use the PowerShell verification commands in `docs/README.codex.md` or `.codex/INSTALL.md`.

## Automated Runtime Smoke

`tests/codex/test-runtime-smoke.sh` creates an isolated temporary `HOME`, symlinks the current checkout into `~/.agents/skills/superpowers`, and runs `codex exec` from the repository root in a bash/POSIX-oriented environment.
It verifies that Codex loads:

- `skills/using-superpowers/SKILL.md` from this checkout
- `AGENTS.md` from this checkout

If `codex` is unavailable or no local Codex auth file exists, the smoke check prints a skip message and exits successfully.
This is valuable proof for the current checkout, but it does not currently prove native Windows execution behavior.

## Manual Runtime Check

From the repository root, run:

```bash
codex exec -c 'approval_policy="never"' --sandbox read-only "Summarize the current instructions."
```

`codex exec` is the non-interactive CLI path, so this form works better in non-TTY shells and CI-style checks.
Codex should report repository guidance from `AGENTS.md`. This confirms repo-root instruction loading, but it does not prove which global skill install your normal environment is using. If setup still looks wrong, restart Codex in the repository root and re-run the command.
