# Movie review fixes implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Repair the reproduced findings on #2214/#2275 while retaining the existing movie workflow.

**Architecture:** Keep the recorder and five media tools. Refuse reused take directories before sending input; publish only accepted narration in the manifest. Correct the Windows recipes and missing-capability test handling.

**Tech Stack:** Python, unittest, uv, ttyd, Chromium, PowerShell and Git Bash.

**Spec:** `docs/superpowers/specs/2026-09-09-proof-movie-windows-completion-design.md`

## Global constraints

- Native Windows 11 x64: PowerShell 5.1, PowerShell 7, Git Bash; invoking and recorded shells match.
- Preserve the Unix recipe, existing CLI interfaces, media formats, and verification policy.
- Drew approved the necessary third-party dependencies on 2026-09-11: "those deps are normal and fine". Remove only the unused `websockets` test dependency.
- Drew personally watches the movies for final acceptance. Do not run movie checkers, audio transcription, or image inspection for this repair pass. Mock external media boundaries in code-contract tests.
- Preserve old takes and failed audio as evidence. Do not delete user output directories.
- No new framework, backwards compatibility layer, merge, or external review comment.

### Task 1: Repair reusable output and missing-capability contracts

**Files:**
- Modify `skills/proving-it-works-with-a-movie/examples/film-terminal.py` and `scripts/narrate`.
- Modify `tests/proving-it-works-with-a-movie/test_terminal.py`, `test_narration.py`, `test_subtitles.py`, and `run-tests.py`.

**Interfaces:** Existing recorder `film`, `run`, `key`, `watch`, and `main`; existing narration manifest; existing unittest runner.

- [x] Add regressions that execute real cache/filesystem behavior with fake external synthesis/capture. Two rejected `openai-chat --verify off` invocations must both return 1 and regenerate, with failed scenes absent from the manifest; an accepted scene still caches. A cached clip rejected by strict ASR must be removed from the manifest. No actual ASR or media inspection.
- [x] Add a frame-directory regression with existing PNGs plus a sentinel file: recording must fail before capture and preserve every byte. Test CLI refusal before connecting or typing, for run/key/watch. Keep empty/new directories valid.
- [x] Run focused tests to observe the known failures.
- [x] Implement the smallest guards. Before manifest append: `if sid in failures: continue`. Share a small nonempty-directory guard between the CLI preflight and direct `film()` path; use `any(out.iterdir())` only after checking existence. Report a clear error instructing the caller to use a new take directory. Guard before run/key side effects, not only inside `film`.
- [x] Mock `module.shutil.which` in subtitle unit tests. In the real subtitle integration test call `fixtures.missing_executables("uv", "ffmpeg")` and skip before invoking `has_libass` if missing. Preserve strict runner rejection of skipped capabilities.
- [x] Remove only `websockets` from the runner's inline dependency list.
- [x] Run narration and recorder unit tests. Run subtitle tests with an isolated PATH containing uv and no FFmpeg; ordinary mode must pass with a capability skip, strict mode must fail because of that skip. Do not run media integration tests with FFmpeg available.
- [x] Self-review and commit only owned files. Report commands, results, commits, and any concerns.

### Task 2: Make Windows recipes executable from a fresh directory

**Files:** Modify `skills/proving-it-works-with-a-movie/recording-a-terminal.md`; record local before/after instruction evidence separately from shipped guidance.

**Interfaces:** Existing serve/run/key/watch/close CLI, readiness JSON, exit codes 0/1/2.

- [x] Preserve current docs as the baseline. Have fresh readers identify and exercise setup and invocation for each shell without consulting recorder source. Record outcomes against the unchanged recipe. The actual PowerShell recipe creates the cwd indirectly and passes; the missing-cwd review finding is not reproduced.
- [x] Add `[System.IO.Directory]::CreateDirectory($work) | Out-Null` before PowerShell serve. Use literal-path checks for readiness because the sample directory contains brackets.
- [x] Replace the Git Bash shorthand with a complete Bash block: `skill=$(cygpath -m /c/path/to/skills/proving-it-works-with-a-movie)`, `work=$(cygpath -m "$HOME/movie O'Brien λ & [take]")`, `mkdir -p "$work"`, `film="$skill/examples/film-terminal.py"`, then `uv run --script "$film" ...` with `--shell gitbash`. Explain the harness-owned background serve lifetime and readiness before commands.
- [x] Explain that each take needs an empty/new directory; return code 2 means the command remains active and should continue through key/watch. Include cleanup and keep the Unix section untouched.
- [x] Use fresh readers for corrected-doc trials on native Windows. Verify shell startup, cwd, persistent state, status handling, and close; do not grade media. Record exact commands, docs revision, and limitations. Cover PowerShell 5.1 and 7 plus Git Bash without a cross-product matrix.
- [x] Commit the corrected recipe. Review the complete repair diff against the reproduced comments; keep final media acceptance with Drew.

## Results

- Code repair: `4d4ede29`; 10 narration tests, 8 recorder unit tests, and 4 subtitle tests passed. The FFmpeg-dependent integration test was skipped; strict mode rejected that skip.
- Fresh-reader baseline: Git Bash failed on the copied PowerShell call operator; PowerShell 7 passed the nested session/cwd recipe.
- Corrected recipes passed on native Windows PowerShell 5.1, PowerShell 7, and Git Bash: echo, persistent state, interactive key, long-command watch, and close. PowerShell quoted-command arguments were checked in both versions.
- An initial PowerShell 5.1 candidate exposed native argument quote loss. Final examples use Read-Host/Start-Sleep, with verified version-specific quoting guidance. PowerShell can retain a true success flag after a parse error; the guidance now states that limitation.
- These are bounded instruction trials, not proof of automatic skill discovery or a full adversarial evaluation of the imported skill. Drew retains movie acceptance.
- The worker accidentally ran one integration test that checked temporary test frames before restricting subsequent execution to unit tests. Drew was informed; that run is excluded from acceptance evidence.
- Detailed local reports, command logs, and preserved failures are under `.superpowers/sdd/2026-09-11-movie-review-fixes/`.
