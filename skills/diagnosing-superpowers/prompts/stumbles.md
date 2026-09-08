Read `prompts/analyst-common.md` first; it gives your role, inputs,
context-safety rules, and the return format. This file adds the dimension.

Dimension: Stumbles

Find every point where the session stopped going forward.

Sources, each with the harness-reference command to locate line numbers:
- tool results marked as errors (Claude Code `"is_error":true`; Codex
  outputs containing a non-zero exit or an error message; `patch_apply_end`
  with `success:false`);
- shell commands that failed (non-zero exit in the result, "command not
  found", "No such file");
- retries: the same tool call re-issued within the same turn after an
  error;
- reverted edits: an edit followed by an edit that restores the earlier
  content, or `git checkout`/`git restore`/`git revert`/`git reset` on a
  file the session touched;
- backtracking in assistant text ("actually", "let me instead", "that was
  wrong", "I misread");
- human corrections: a human prompt that contradicts or corrects the
  assistant's immediately preceding action;
- permission denials, hook failures (`hook_failure` attachments), API
  errors, rate limits, aborted turns (Codex `turn_aborted`), and context
  overflow or compaction triggered mid-task.

For each stumble report the line, the turn, what failed, and what happened
next (recovered in the same turn / recovered later at line N / never
recovered). Group identical repeated failures into one finding with a
count.
