# Movie committee repairs implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair the full-PR committee's concrete failure cases in #2214, including the narration producer/consumer gap that survived narrow reviews.

**Architecture:** Keep the five tools, adjacent helpers, recorder, and existing artifact formats. Acceptance must be withdrawn before accepted bytes can change, and assembly must enforce current scene intent against that acceptance. Keep timing inside measured intervals and resource cleanup around acquisition.

**Tech Stack:** Python 3.10+, unittest, existing uv dependencies, Bash and JavaScript recipe examples.

**Spec:** `docs/superpowers/specs/2026-09-09-proof-movie-windows-completion-design.md`, interpreted with Drew's current instructions and the committee findings recorded under `.superpowers/review/pr2214/committee/`.

## Global Constraints

- Keep the existing five tool CLIs, scene kinds, narration manifest, offsets, SRT files, and checker behavior. Preserve macOS/Linux and native Windows operation.
- Keep existing dependencies; no process framework, language-segmentation dependency, compatibility layer, or new evaluation harness.
- Drew personally watches the movies for final acceptance. Do not generate or inspect media, run real movie checkers, synthesis, ASR, FFmpeg, browsers, ttyd, or image/frame inspection. Test real Python decisions using text/byte sentinels and mocked external boundaries only.
- Preserve failed evidence and do not claim mock-based checks establish live media acceptance.
- Keep `auto/on/off`, drift thresholds, authoritative browser selection, partial manual offsets, intentional silence, and source-movie own-audio behavior.
- Work only in `/Users/drewritter/.paseo/worktrees/2mmrq9t5/pr2214-narration-cache`; do not modify the parent checkout, merge, or push from workers.
- Tests exercise meaningful behavior and structured inputs, never large command/script/HTML string matches. No whole media test suites; select only verified safe classes.
- Implementers do not spawn subagents. Follow TDD, self-review, commit explicit files with a detailed message, and report RED/GREEN commands and evidence.

### Task 1: Make narration acceptance survive reruns and govern assembly

**Files:** `scripts/narrate`, `scripts/assemble`, `scripts/media_paths.py`, `scripts/check-movie`, optional small adjacent narration-contract helper; `test_narration.py`, `test_assembly.py`, and new safe contract test module under `tests/proving-it-works-with-a-movie/`. All script paths are under `skills/proving-it-works-with-a-movie/`.

**Interfaces:** Preserve manifest fields `id`, `text`, `wav`, `duration`, `synthesis`. Normalize scene text for identity using `" ".join(text.split())`, without dropping Unicode or punctuation. Resolve each manifest WAV relative to the narration directory. Transcript comparison is a separate, tolerant operation. Existing movie scenes retain their own source audio and omit narration offsets.

- [x] Add failing tests before code: accepted two-scene render, forced rejection of first scene, exception in second, normal retry never reuses rejected bytes; strict unavailable verification withdraws acceptance; unchanged accepted settings still cache. Inject failures in synthesis and duration and assert published entries cannot point at rejected replacements. Preserve failed bytes as evidence.
- [x] Publish manifest atomically (`temporary.write_text(..., encoding="utf-8"); temporary.replace(manifest_path)`) and withdraw acceptance before overwriting any referenced WAV. Publish each accepted scene only after transcript/ASR gates and duration succeed. Preserve the existing bounded attempts and no-narration CLI behavior. Do not silently create a fallback acceptance record.
- [x] Add unsupported-comparison tests for unrelated Chinese/Japanese (including short and mixed-script text), symbols-only scripts, multiline text, accented Latin, and spaced Cyrillic. Use Unicode casefold/normalization and whitespace-preserving tokenization. Explicitly detect scripts requiring segmentation; do not infer support from average word length or introduce CJK character thresholds. Unsupported comparisons report unavailable/nonzero under `--drift-check` and `--verify on`; `auto` warns/allows unavailable ASR, `off` bypasses ASR. The mandatory chat transcript gate never accepts unsupported comparison, including existing cached chat clips under off/auto. Preserve supported-word thresholds and empty/missing speech rejection.
- [x] Preflight required ffprobe before synthesis, with a meaningful missing-tool test. Keep existing mocked tests portable by mocking this boundary.
- [x] Add safe assembly tests: removed narration ignores leftover WAV and creates no offset; required narration with missing manifest/entry/WAV or changed text fails before encoding; accepted referenced WAV is selected even when named differently; movie scenes retain own audio and no narration offset. Validate all narration requirements before encoding the first segment. Update existing media fixture declarations/manifests to reflect the contract without running those media suites.
- [x] Correct movie segment inputs: probe audio-stream presence, supply anullsrc only for silent source movies, explicitly map selected source video/audio, and fit both width and requested inner height before padding. Test input selection and computed geometry with mocked probes/encoder, including 2560x1080 into 1920x1080. No real encoding.
- [x] Correct percent-bearing sequence paths in assembly and checker: escape only literal directory percent signs (or use controlled cwd plus fixed basename), retaining the intended `%08d`/numbering placeholder. Test the path helper/selected input-output target with byte sentinels; never sample media.
- [x] Run safe narration and new assembly/path contract tests; retain existing cache/drift regressions. Self-review and commit.

### Task 2: Keep every subtitle inside its scene and select the supplied track

**Files:** `skills/proving-it-works-with-a-movie/scripts/make-subtitles`, `scripts/burn-subtitles`, `scripts/check-movie` (SRT text parser only); `tests/proving-it-works-with-a-movie/test_subtitles.py` or a separate safe subtitle contract module, safe checker policy/parser regressions, and `run-tests.py`.

**Interfaces:** Manifest schema stays unchanged. Assembly offsets select membership and start times; manual offsets retime selected scenes without reintroducing omitted scenes. Task 1 makes assembly offsets refer only to accepted narration.

- [x] Add failing timing tests by parsing emitted SRT: five chunks in 0.5 seconds followed immediately by another scene; one chunk in 12 seconds; mixed-length chunks; submillisecond/invalid duration handling; empty cut; nonzero manual offsets. Assert every word survives, ordered positive millisecond cue intervals stay within the measured scene, the final cue covers the narration end within rounding, and reported end agrees with emitted cues.
- [x] Allocate proportional durations over the entire scene. Readability limits can guide splitting/allocation but cannot overflow or truncate the measured interval. Coalesce chunks if there are fewer representable milliseconds than chunks; reject unrepresentable/nonpositive durations clearly rather than emit invalid cues. Remove the serialization fallback that extends collapsed cues by one second.
- [x] Preserve assembly membership selection as the manifest/offset intersection, including unknown offset keys producing no cues, and partial manual offsets. Enforce accepted membership in Task 1's assembly handoff tests rather than changing this existing subtitle CLI contract.
- [x] Add one safe producer/consumer regression that invokes narrate, assemble, and make-subtitles sequentially using their real files and mocked synthesis/probing/encoding. Remove an opening scene's narration on rerun: its old WAV survives as evidence, assembly omits that audio/offset, and the remaining scene's caption starts at its measured assembly offset. Assert emitted manifest/offset/SRT data and chosen inputs, not full commands.
- [x] Add safe replacement-track tests for explicit soft mode and hard-burn fallback by inspecting selected stream maps, including an input already containing subtitles and a video without audio. Explicitly select `0:v:0`, optional source audio, and `1:s:0` from the supplied SRT. Preserve truthful fallback diagnostics.
- [x] Repair `subtitle_end` to read cue timing lines rather than any caption text containing an arrow. Root reproduced a valid cue with `Follow source --> destination.` raising ValueError. Add text-only parser tests for literal arrows, fake timestamps in caption text, actual malformed cue timing, empty subtitles, and multiple cues; keep the checker's existing last-cue policy unchanged.
- [x] Register a `contracts` test-runner suite for `test_*contract*.py`, so the new safe regression files run through the normal entrypoint and are included in `all`. Keep only mocked/text-based tests in those modules. Verify by executing `--suite contracts`, never `--suite all` in this pass.
- [x] Run only safe subtitle classes (existing offset/path tests and BOM/fallback cases plus new contract tests). Self-review and commit.

### Task 3: Own recorder resources from acquisition through shutdown

**Files:** `skills/proving-it-works-with-a-movie/examples/film-terminal.py`, `tests/proving-it-works-with-a-movie/test_terminal.py` or a separate safe recorder contract module.

**Interfaces:** Preserve `serve/run/key/watch/close`, prompt markers, session files, exit 1 on failure and exit 2 only for a live unfinished command, 5 fps timing, and 1600x900 viewport. Preserve logs; only remove the recorder's own profile and readiness state.

- [x] Add startup-failure tests with fake Popen handles and no processes: first/second log open, ttyd launch, browser launch, session metadata write, terminal log open, later connection failure. Verify each acquired process is cleaned, handles close, failed startup cannot remain ready, and profile cleanup is owned. Register resources immediately under an encompassing try/finally (or ExitStack); no general process framework.
- [x] Resolve session directory before child arguments, cwd, and profile construction. Test a relative path against the actual child argv/cwd relationship using fake processes.
- [x] Make serve the cleanup owner: close writes the existing stop request and waits with one overall 30-second deadline for completed cleanup, instead of killing historical numeric PIDs. Honor stop requests inside startup pump/retry loops too. Retire PID metadata atomically only after confirmed process and profile cleanup and remove stale ready state; test repeated close after cleanup kills nothing and retains logs. A wait timeout, unreadable/missing metadata, unavailable serve, or failed profile removal is not successful cleanup and returns nonzero. The deadline accommodates an active bounded CDP call, both five-second child waits, and profile release. Avoid creating a new cross-platform PID-identity protocol.
- [x] Add no-record observation tests for connection/session loss using fake CDP and log text. Poll connection/liveness while waiting; a dead session is failure, never `running`. A live timed-out command still returns 2. Do not consume prompt status incorrectly or lose completed native exit status.
- [x] Test timing using a fake clock, capture callback returning byte tokens, and mocked writes: a final capture crossing a one-second endpoint must fill exactly the bounded 5 fps slots; also cover hold endpoint, normal completion and mid-capture stalls. No real image/frame inspection or integration tests.
- [x] Fix ST-terminated OSC stripping and test both BEL/ST markers in actual visible-text parsing. Emit ASCII-escaped stdout JSON (or explicit UTF-8) and test a CP1252 stream with René and λ; keep UTF-8 JSON files.
- [x] Register real-session test cleanup immediately after Popen so failed setUp cannot leak it; do not run SessionTests in this pass. Retain the tests' real owned-process assertions when shutdown clears PID metadata: snapshot owned IDs for assertions while the session is live rather than iterating an empty completed list. Run safe prompt, serve-argument, and new recorder contract tests; self-review and commit.

### Task 4: Make shipped recipes preserve failures and measured timing

**Files:** `skills/proving-it-works-with-a-movie/SKILL.md`, `assembling.md`, `rendering-from-a-log.md`, `recording-motion.md`, `recording-a-terminal.md`, `narrating.md`, `tests/proving-it-works-with-a-movie/README.md`; focused documentation test evidence under ignored review/SDD directories.

**Interfaces:** Documentation describes Tasks 1-3's existing formats and corrected behavior. Existing evidence standards and Windows shell recipes remain intact. This is a focused reference correction, not a broad skill-policy rewrite.

- [x] Use writing-skills. Preserve the before-change fresh-reader reference trial and execute the original recipes with fake producer commands and log fixtures to record failures. No real media or OS recording.
- [x] Put `set -euo pipefail` in the primary Unix pipeline's executing Bash scope, retaining all five commands and offsets. In the assembling subtitle example pass `--offsets-json segments/offsets.json` and stop if subtitle production fails. Explain current scene plus accepted manifest, relative WAV reference, and movie own-audio behavior in one paragraph.
- [x] Put the producer-to-tee logging pipeline under the shell that owns pipefail, preserving the real producer exit status and printed STARTED/FINISHED/EXIT_STATUS markers. Execute the recipe with failing and passing fake producers; assert shell status and log content without matching a large rendered command.
- [x] Restore the cursor transform on mouseup. Execute the documented JavaScript with a minimal fake DOM/event dispatcher and assert repeated press/release state changes; no browser or pixels.
- [x] State that session directories, like take directories, must be new or empty on retries. Explain that close requests cleanup from serve, waits up to 30 seconds, and reports failure when the owner is unavailable or cleanup fails; hard-killing serve can leave its children and stale readiness, so these signals cannot establish a live owner. Document unsupported transcript verification and existing retry behavior accurately without adding a user approval gate.
- [x] Document the new `--suite contracts` entrypoint as safe mocked/text checks, distinct from existing media/session suites and live acceptance.
- [x] Fresh-reader candidate trials use the same bounded scenarios as baseline, then execute supplied commands with fake boundaries. Preserve both failures and successes; do not call this full skill evaluation. Self-review and commit documentation plus concise results in this plan.

Task 4 executable snippet result: the preserved baseline returned success after
an assembly failure and a failed logged producer, emitted subtitles at zero
instead of the measured two-second offset, and left the cursor pressed after
mouseup. After the focused guide edits, the fake-boundary harness preserves
assembly exit 41 and logger exit 23, stops later producers, retains prior
outputs, runs all five stages on success, emits the subtitle interval at
`00:00:02,000`, and restores the cursor on two releases. The safe `contracts`
entrypoint passes 66 tests. Two independent fresh-reader candidate trials also
passed the bounded command checks recorded below; these checks are not full
skill evaluation or live movie acceptance.

## Final verification and review

Run the safe accumulated contract selection once after all code changes. Have an independent reviewer read the full accumulated PR from `fd02874aa5c55ba3c2bca431253b48e0e4c8be5a` through the final head, including docs/spec and tests, and resolve concrete remaining findings. Push only to Ada's `import/proving-it-works-skill` branch after passing review, verify #2214's remote head, and reply to the four current external threads with exact evidence. Do not merge. Drew's viewing remains final acceptance.

## Consolidated verification results

- Narration/assembly, subtitle, recorder, and guide tasks each passed independent spec and quality review after their recorded fix rounds.
- At `b206e0cb`, the normal `--suite contracts` entrypoint passed 66 mocked/text tests and the selected existing portable regressions passed 45 tests: 111 safe tests total. No media/session suites ran.
- Executing the original guide snippets with fake producers reproduced lost failure statuses, missing measured subtitle offsets, continued burning after subtitle failure, and a cursor that stayed pressed. The corrected snippets passed failure and success cases while preserving prior output evidence.
- Two independent fresh readers used the candidate guides. Their supplied Bash commands passed the bounded failed-rebuild, producer-status, evidence-preservation, and measured-caption-offset checks with fake tool boundaries. These are focused reference trials, not a full skill evaluation or native workflow acceptance.
- The before-change fresh reader independently supplied fail-fast/offset corrections but also deleted prior outputs. No before/after agent success-rate improvement is claimed.
- Logs, rejected-attempt evidence, reports, and review packages remain in the worktree's ignored review/SDD directories. The parent checkout remains untouched.
- Final whole-PR review and normal push to the existing Ada-fork PR head follow these results. Drew's viewing remains the final acceptance decision; this pass does not merge the PR.
