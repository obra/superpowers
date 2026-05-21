# SessionStart JSON Control Character Escaping Design

## Problem

Issue #1446 reports that `hooks/session-start` escapes backslash, double quote, newline, carriage return, and tab before embedding skill text in JSON, but does not escape the rest of the C0 control range.

JSON strings cannot contain raw U+0000 through U+001F control characters. If `skills/using-superpowers/SKILL.md` ever contains a raw backspace, form feed, vertical tab, or similar control character, the hook emits invalid JSON. Claude Code then cannot parse the SessionStart payload and Superpowers may silently fail to activate.

`hooks/session-start-codex` has the same escape helper and should be kept in sync.

## Goals

- Keep the hook dependency-free and shell-based.
- Escape all C0 control characters that Bash strings can carry.
- Preserve existing escaped forms for common controls: `\n`, `\r`, `\t`, `\b`, and `\f`.
- Cover both Claude/Cursor/Copilot hook output (`hooks/session-start`) and Codex hook output (`hooks/session-start-codex`).
- Add a regression test that parses real hook output as JSON.

## Non-Goals

- Do not rewrite the hook in Python, Node, jq, or Perl.
- Do not change hook output shape.
- Do not change skill-loading behavior.
- Do not address the other #1446 sub-issues in this PR.

## Design

Extend `escape_for_json` with Bash parameter substitutions for C0 controls:

- `\b` for U+0008
- `\f` for U+000C
- `\n`, `\r`, `\t` as before
- `\u00XX` for the remaining representable control characters

Bash variables cannot carry NUL bytes, so U+0000 is not representable in this hook path. The function still covers all control characters that can appear in the loaded text.

## Test Strategy

Extend `tests/hooks/test-session-start.sh` with a temporary plugin fixture:

1. Copy the hook under test into a temp plugin root.
2. Write a temporary `skills/using-superpowers/SKILL.md` containing every representable C0 control character from U+0001 through U+001F.
3. Run the hook through the existing `assert_command_output` helper.
4. Parse the real hook output with `JSON.parse`.
5. Assert that the parsed context still contains the original control-character text.

Repeat for `hooks/session-start-codex`.
