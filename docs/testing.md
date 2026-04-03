# Testing the Codex-Only Superpowers Fork

This repository is validated as a Codex-first product.

## Validation Layers

1. Repository surface checks
2. Forbidden legacy-term checks
3. Documentation consistency checks

## Run All Checks

```bash
scripts/validate-codex-only.sh
```

## Individual Checks

```bash
tests/codex/test-repo-surface.sh
tests/codex/test-forbidden-terms.sh
tests/codex/test-doc-consistency.sh
```

## What These Checks Enforce

- `AGENTS.md` is canonical
- non-Codex product artifacts are removed
- public docs are Codex-only
- core product files do not use translated Claude tooling terms
