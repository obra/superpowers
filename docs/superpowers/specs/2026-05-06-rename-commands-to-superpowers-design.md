# Design Spec: Renaming Commands to Superpowers

## Goal
Rename all `sp-` prefixed commands to use the full name `superpowers-` to improve clarity and branding.

## Changes

### 1. Rename Command Files
Rename the files in `hooks/junie/commands/`:
- `sp-brainstorm.md` -> `superpowers-brainstorm.md`
- `sp-debug.md` -> `superpowers-debug.md`
- `sp-plan.md` -> `superpowers-plan.md`
- `sp-review.md` -> `superpowers-review.md`
- `sp-tdd.md` -> `superpowers-tdd.md`
- `sp.md` -> `superpowers.md`

### 2. Update Documentation
Update all references to `/sp-` and `/sp` in:
- `README.md` (if any, though none were found in earlier search)
- `docs/README.junie.md`
- `skills/using-superpowers/references/junie-tools.md`

### 3. Update Scripts
Update `scripts/uninstall-junie.sh` to remove both `sp-` and `superpowers-` commands (to clean up old installations).

### 4. Update Tests
Update `tests/junie/test-bootstrap.sh` to check for `superpowers-*.md` instead of `sp-*.md`.

## Verification Plan
1. Run `tests/junie/test-install.sh` to ensure the new command files are symlinked correctly.
2. Run `tests/junie/test-bootstrap.sh` to ensure uninstall works correctly.
3. Manually verify the content of `docs/README.junie.md` and `skills/using-superpowers/references/junie-tools.md`.
