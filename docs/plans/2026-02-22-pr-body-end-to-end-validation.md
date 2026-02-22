## What
Add `end-to-end-validation` skill + minimal smoke check.

## Why
Addresses issue #455: workflow gap for real user-path validation.

This PR is inspired by OpenAI's harness engineering write-up:
https://openai.com/index/harness-engineering/

## How
- New skill file with deterministic command contract
- README skills list update
- Shell smoke check for skill structure

## Non-goals
- No framework-wide behavior change
- No cross-repo/plugin coupling in this PR

## Verification
- `bash tests/skills/test-end-to-end-validation-skill.sh`
