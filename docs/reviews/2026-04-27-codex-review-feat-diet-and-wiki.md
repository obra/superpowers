# Codex review — feat/diet-and-wiki

- Date: 2026-04-27
- Model: gpt-5.5 / xhigh
- Duration: 450s, 64 execs, 1.49M tokens
- Verdict: needs-attention
- Branch: feat/diet-and-wiki @ 5608f70

## Critical

### C1 — Project wiki writes follow symlinks out of the repo
`resolve_out_dir()` creates and probes `<cwd>/.claude/wiki/sessions` with normal
`Path.mkdir()`, `touch()`, `unlink()` calls, then later writes JSON/MD/index/seed
files with normal open/write APIs. A repo can make `.claude`, `wiki`, `sessions`,
`index.md`, `decisions.md`, or `gotchas.md` symlinks, causing private transcript
archives to be written outside the project. This does not match the diet flag's
symlink bar. Sites: `hooks/wiki-archive.py:73-83, 517-518, 589, 619-627, 685-686`.

Fix: Refuse symlinked path components and target files before writing; fall
back to the central directory when project symlinks are present.

## Important

### I1 — Central sidecar fan-out can delete another project's session
Filenames are only `YYMMDD_HH-MM_Event.{json,md}`. Central fan-out unlinks
anything at `~/.claude/sessions/<name>` and creates a symlink. Two different
projects ending in the same minute with the same event overwrite each other.
Site: `hooks/wiki-archive.py:643-648`.

Fix: include project hash + short session id in central link name; never
unlink an existing real file.

### I2 — Blocking Bash hook has no timeout around external rewriter
`PreToolUse:Bash` runs on every Bash call. `cmd-rewrite.sh` invokes both
`$REWRITER --version` and `$REWRITER rewrite` synchronously with no timeout.
A slow/hung rewriter stalls all Bash use.
Site: `hooks/hooks.json:39-46`.

Fix: add `"timeout": <small>` on the hook entry; skip per-call version probe.

### I3 — Tool results matched by order; source IDs ignored
`_collect_tool_result()` ignores `tool_use_map` and `sourceToolAssistantUUID`,
attaching Bash stdout to the most recent command with `stdout is None`. Multi-
tool turns or reordered results can mis-attach. Dead ID plumbing at
`hooks/wiki-archive.py:143-145, 196, 232-235`. Order-based attachment at
`hooks/wiki-archive.py:428-433`.

Fix: either use the source tool ID to associate, or delete the dead ID maps
and document the ordering contract.

### I4 — Bash failures without stderr archived as success
`_infer_exit_code()` returns 0 unless interrupted or stderr matches a regex.
Commands that fail with no stderr (e.g. `test -f missing`) get stored as
`exit_code: 0`. Site: `hooks/wiki-archive.py:481-486`.

Fix: store `None` when the exit code can't be determined.

### I5 — One-shot diet modes can become persistent defaults
`commit`, `review`, `compress` are in `VALID_MODES`, accepted by activate +
track, and reinforced every turn. Contradicts `diet-track.js:33-37` which
says one-shots must not clobber persistent intensity. Also points `compress`
at `/diet-compress` though the command is `compress-memory`.
Site: `hooks/_diet-config.js:21`.

Fix: persistent modes = `off|lite|full|ultra`. One-shot skills handled
purely via slash commands.

## Minor

### M1 — Unused archive scaffolding
`count_tool_uses()` never called. `request_contents`, `request_meta`
populated but never read or emitted. Sites: `hooks/wiki-archive.py:109-117`.

Fix: delete.

### M2 — Diet activation regex misreads negatives/questions
`don't be terse` activates diet (only stop/off treated as negatives). Broad
`diet ... off` text deactivates from non-imperative phrasing.
Sites: `hooks/diet-track.js:23-30`.

Fix: require imperative shape; explicit negative guards.
