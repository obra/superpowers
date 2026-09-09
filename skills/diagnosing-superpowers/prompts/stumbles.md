Read `prompts/analyst-common.md` first; it gives your role, inputs,
context-safety rules, and the return format. This file adds the dimension.

Dimension: Stumbles

Find every point where the session stopped going forward.

Sources, each using the case file's evidenced record meanings and extraction
commands to locate line numbers:
- tool results marked as errors, non-zero exits, or explicit failure records;
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
- permission denials, hook failures, API errors, rate limits, aborted turns,
  and context overflow or compaction triggered mid-task.

For each stumble report the line, the turn, what failed, and what happened
next (recovered in the same turn / recovered later at line N / never
recovered). Group identical repeated failures into one finding with a
count.
