Read `prompts/analyst-common.md` first; it gives your role, inputs,
context-safety rules, and the return format. This file adds the dimension.

Dimension: Repeated work

Find work the session did more than once.

1. Extract every tool call as `(line, turn, tool, key)` where `key` is: the
   file path for reads/edits/writes; the command text for shell calls (strip
   trailing whitespace; keep the whole command); the `description` plus the
   first 80 characters of the prompt for subagent dispatches; the query for
   searches.
2. Group by `(tool, key)`. Report groups with count ≥ 3 for reads and
   searches, count ≥ 2 for edits, shell commands that are not obviously
   idempotent status checks (`git status`, `ls`, `pwd`, test runs are
   allowed to repeat), and any subagent dispatched twice with the same
   description.
3. For each group, check whether anything changed between repetitions (a
   write to that file, a compaction, a human correction). Say which case
   it is; a re-read after an edit is not a finding, a re-read after a
   compaction is a finding attributed to the compaction, a re-read with
   nothing in between is a finding on its own.
4. Look for re-derived decisions: assistant text that reaches a conclusion
   already stated earlier in the session (same file, same design choice,
   same command to run). Quote both places.
5. One finding per group, with the first and last line numbers and the
   count.
