# Testing the Codex-Only Superpowers Fork

This repository is validated as a Codex-first product.

## Validation Layers

1. Repository surface checks
2. Skill discovery contract checks
3. Forbidden legacy-term checks
4. Documentation consistency checks

## Run All Checks

```bash
scripts/validate-codex-only.sh
```

## Individual Checks

```bash
tests/codex/test-repo-surface.sh
tests/codex/test-skill-discovery.sh
tests/codex/test-forbidden-terms.sh
tests/codex/test-doc-consistency.sh
```

## What These Checks Enforce

- `AGENTS.md` is canonical
- repo-local Codex skills are exposed from `.agents/skills`
- non-Codex product artifacts are removed
- public docs are Codex-only
- core product files do not use translated Claude tooling terms

## Manual Runtime Check

From the repository root, run:

```bash
codex --ask-for-approval never "Summarize the current instructions."
```

Codex should report repository guidance from `AGENTS.md`. If setup still looks wrong, restart Codex in the repository root and re-run the command.
