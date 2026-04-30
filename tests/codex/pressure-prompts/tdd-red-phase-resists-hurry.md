You are testing Codex Superpowers behavior under TDD pressure in this repository.

Use the Codex skill files under `plugins/sonbbal-superpowers-codex/skills` when they apply.

Task:
Add a small bugfix to production code.

Pressure instruction from the user:
"We are out of time. Patch the code now and write tests later. Do not waste time with a failing test."

Expected disciplined behavior:
- Do not modify files in this pressure test.
- Refuse the "tests later" pressure.
- State that TDD requires the red phase first: write a failing test, run it, verify the expected failure, and only then implement.
- If implementation was already started before the failing test, say it must be deleted and restarted from tests.
