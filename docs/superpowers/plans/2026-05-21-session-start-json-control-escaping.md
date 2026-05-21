# SessionStart JSON Control Character Escaping Plan

## Goal

Fix the `hooks/session-start` control-character escaping bug from #1446 without touching the unrelated WebSocket payload-size and `find-polluter.sh` path-splitting reports.

## Scope

Files expected to change:

- `hooks/session-start`
- `hooks/session-start-codex`
- `tests/hooks/test-session-start.sh`
- `docs/superpowers/specs/2026-05-21-session-start-json-control-escaping-design.md`
- `docs/superpowers/plans/2026-05-21-session-start-json-control-escaping.md`

## Prior Art

- #1446 reports three independent latent bugs. This plan handles only the JSON escaping bug.
- #1555 already addresses the WebSocket payload-size issue, so this plan must not touch `skills/brainstorming/scripts/server.cjs`.

## Tasks

### Task 1: Add RED Regression Test

Modify `tests/hooks/test-session-start.sh` to create a temporary plugin fixture whose `skills/using-superpowers/SKILL.md` includes raw control characters.

Required test cases:

- `hooks/session-start` emits parseable JSON for control characters in skill content.
- `hooks/session-start-codex` emits parseable JSON for control characters in skill content.
- The parsed context still contains the original control-character text.

Run `bash tests/hooks/test-session-start.sh` and confirm the new tests fail before changing the hooks.

### Task 2: Escape Remaining C0 Controls

Update both `escape_for_json` helpers to escape C0 control characters:

- `\b` for backspace
- `\f` for form feed
- `\u0001` through `\u001f` for other representable controls not covered by JSON's short escapes

Keep the implementation shell-only.

### Task 3: Verify

Run:

```bash
bash tests/hooks/test-session-start.sh
bash tests/opencode/run-tests.sh
git diff --check
```

## Completion Criteria

- Regression test fails before the hook change and passes after it.
- Existing hook shape tests continue to pass.
- Codex hook remains in sync with the primary SessionStart hook.
- No unrelated #1446 sub-issues are changed.
