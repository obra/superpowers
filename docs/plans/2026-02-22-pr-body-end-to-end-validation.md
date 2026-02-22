## What
Add `end-to-end-validation` skill + minimal smoke check.

## Why
Addresses issue #455: workflow gap for real user-path validation.

## How
- New skill file with deterministic command contract
- README skills list update
- Shell smoke check for skill structure

## Non-goals
- No framework-wide behavior change

## Verification
- `bash tests/skills/test-end-to-end-validation-skill.sh`
