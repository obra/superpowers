# Windows Movie Support Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Plan for review. Writing this plan does not restart implementation or authorize agent dispatch.

**Goal:** Finish the existing movie workflow on native Windows through PowerShell 5.1, PowerShell 7, and Git Bash.

**Architecture:** Keep the five media tools and completed assembly fixes. Adapt the proven Windows terminal mechanism into one example with fixed-viewport screenshot capture; share only browser discovery/rendering and Windows Job Object code. Extend the existing test runner and validate three complete Windows workflows.

**Tech stack:** Existing Python/uv, FFmpeg/ffprobe, Chrome/Edge, ttyd, Piper/faster-whisper, unittest/Pillow/PyYAML, and the probe's script-local `websocket-client==1.9.0`.

**Spec:** [Reviewed Windows completion design](../specs/2026-09-09-proof-movie-windows-completion-design.md), including its [resolved adversarial findings](../specs/2026-09-09-proof-movie-windows-completion-review.md).

## Global constraints

- Both the invoking shell and the recorded shell must work. The acceptance rows pair each invoking shell with the same recorded shell; a nine-combination shell matrix is unnecessary.
- PowerShell does not require Git Bash. Native Windows does not require WSL, tmux, Docker, administrator rights, a cloud key, or changes to machine settings.
- Keep the existing five tool CLIs, scene kinds, narration manifest, offsets, SRT files, and checker behavior. Preserve the existing Unix terminal recipe and macOS/Linux behavior.
- Validate native Windows x64 on Ballmer; report its actual OS version and tool identities. Do not infer untested release/architecture coverage.
- Use bounded `Page.captureScreenshot` PNG capture at 5 fps, with a fixed 1600 × 900 browser viewport before navigation. Keep the spec's two-second capture limit, 0.2-second duration tolerance, and ten-second cleanup limit.
- Reuse prepared tools and fixtures. Do not resume the superseded 12-task plan, build generic process abstractions, provision further OS runners, or expand the four instruction evaluations into a platform matrix.
- The spec is binding for all tasks. A failed capture decision gate requires a bounded design decision; it does not authorize a renderer rewrite.
- One review per completed milestone, with focused rechecks for actual findings. Review does not itself dispatch the next implementer. At execution, one controller owns Windows submissions; do not revive the canceled controller or workers.

## Baseline and reused resources

Use the existing isolated worktree `/Users/drewritter/.paseo/worktrees/2mmrq9t5/movie-os-compatibility`, branch `feat/movie-os-compatibility`. The implementation baseline is `442a48d9`; reviewed completion documents are at `4ce8c884`. Check status before execution and preserve any intervening work. No import, branch reset, or repeated feasibility suite is needed.

In paths below, `S` is `skills/proving-it-works-with-a-movie`, `T` is `tests/proving-it-works-with-a-movie`, `P` is `.superpowers/sdd/2026-09-09-proof-movie-os-compatibility`, and `W` is new execution scratch `.superpowers/sdd/windows-completion`. These abbreviations identify paths, not automatically defined shell variables.

| Resource | Reuse |
| --- | --- |
| Ballmer transport | `drew@ballmer.local`. SSH stages/retrieves files; its elevated token does not establish ordinary-user execution. |
| Ordinary-user runner | Existing desktop Paseo terminal `1496200b-5545-4d85-af31-d01df72a3c11`, if still available. Use the existing daemon and a task-owned terminal if replacement is necessary. Record the actual test process's Medium token. |
| Windows tools | `C:\Users\drew\movie-os-task1-20260909\tools`: `uv\uv.exe`, `python\cpython-3.12.14-windows-x86_64-none\python.exe`, `pwsh\pwsh.exe`, `ttyd.exe`, and `ffmpeg\ffmpeg-9.0.1-essentials_build\bin`. Inventory is historical; check only paths needed by the active task. |
| Windows transport examples | `P/task-2-evidence/{stage-windows-task2.ps1,submit-windows-task2.ps1,launch-windows-task2.ps1,run-windows-task2.py}`. Copy/adapt into `W` and a fresh remote `C:\Users\drew\movie-windows-completion` directory. Preserve old evidence. |
| Native Mac | Existing uv/Chrome; libass-capable FFmpeg/ffprobe at `P/tools/macos-arm64`. Original system FFmpeg remains available for no-libass checks. |
| Linux regression runner | Existing `superpowers-movie-linux-amd64` container, ordinary `movie` user, read-only `/worktree` mount. Existing isolated-container browser wrapper may add `--no-sandbox`; never make that a product default. |
| Voice and harness setup | Prepared caches and tool-shell evidence under `P/artifacts/windows-voice-preflight` and `P/artifacts/windows-eval-preflight`. Setup is not final acceptance. |

The Windows transport uses the matching installed CLI `C:\Users\drew\AppData\Local\Programs\Paseo\resources\bin\paseo.cmd`. Reuse its encoded PowerShell submission mechanism. Do not change execution policy, profiles, machine PATH, credentials, or services. Runtime test environments must not force Python UTF-8 mode in every case: the BOM/default-code-page cases must exercise the product's own handling.

## Files and fixed interfaces

| File | Responsibility |
| --- | --- |
| `S/scripts/{assemble,burn-subtitles,narrate,make-subtitles,check-movie}` | Existing public commands; targeted portability/verification changes only |
| `S/scripts/media_paths.py` | Keep completed frame/FFconcat implementation |
| New `S/scripts/browser_tools.py` | `find_browser(explicit: str \| None) -> str \| None` and `render_card(html: Path, png: Path, *, browser: str, width: int, height: int, timeout: float = 20) -> None` |
| New `S/scripts/windows_jobs.py` | Extract proven `WindowsJob`: `spawn(argv: list[str], directory: Path, log: Path, env: dict[str, str] \| None = None) -> int`, `wait(pid: int, timeout: float) -> int`, `close() -> None`; retain native identity/snapshot operations needed by ownership tests |
| New `S/examples/film-terminal.py` | Windows-only `serve`, `request`, and `result` entry points; `command_succeeded(result: dict) -> bool` and `frame_sources(completed: list[float], start: float, end: float, rate: float = 5) -> list[int]` are testable pure helpers |
| `T/run-tests.py`, `T/fixtures.py` | Existing runner; add named suites and `load_script(name: str) -> types.ModuleType` for extensionless tools, plus bounded recorder-client fixture helpers |
| `T/test_{assembly,checker,narration,paths}.py` | Keep existing assertions; extend narration and encoding cases |
| New `T/test_{browser,subtitles,processes,terminal}.py` | Tests for the shared helpers/media fixes and native Windows recorder; `processes` tests the Windows Job helper, not a new framework |
| New `T/fixtures/{browser.html,terminal_app.py}` and `T/run-windows-acceptance.py` | One small real app fixture and one reproducible Windows workflow driver |
| `S/*.md` and `T/README.md` | Correct affected recipes, prerequisites, and reproduction commands |
| `docs/superpowers/reports/2026-09-09-proof-movie-os-compatibility.md` | Append final Windows results and artifact locations to the existing report |

Media tools retain Python 3.10+ metadata. The Windows example may retain the probe's Python 3.12+ and websocket-client dependency in its uv script header. Import Windows APIs only when used on Windows. Add that same script-local client dependency to tests that import the example. Do not introduce a generic `processes.py` or a recorder package hierarchy.

## Task 1 / milestone 1: Complete the media tools

**Deliverable:** Native Windows can render cards, assemble all scene kinds, synthesize and verify narration, and produce correctly located subtitles using the existing commands.

**Files:** Existing five scripts; new `browser_tools.py` and `windows_jobs.py`; `T/fixtures.py`, `run-tests.py`, `test_browser.py`, `test_subtitles.py`, `test_processes.py`, `test_narration.py`, and focused encoding additions to current tests.

- [ ] **1. Capture focused failing cases.** Register `browser`, `subtitles`, and `processes` suites when their tests exist. Cover invalid explicit browser, Windows Chrome/Edge discovery, special-path file URI, timeout cleanup with an unrelated sentinel, nested SRT paths, UTF-8 BOM/CRLF input, default-code-page Unicode output, and fresh/cached ASR failure. Keep Windows Job tests in `processes` so portable suites do not acquire required Windows-only skips.

For the cached verification policy, add this test shape using a loaded `narrate` module; it needs no TTS download:

```python
def test_cached_audio_requires_requested_verification(self):
    import json, sys, tempfile
    from pathlib import Path
    from unittest.mock import patch
    import fixtures
    module = fixtures.load_script("narrate")
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        output = work / "voice"
        output.mkdir()
        (output / "clip.wav").write_bytes(b"cached audio fixture")
        (output / "manifest.json").write_text(json.dumps([
            {"id": "clip", "text": "Read this sentence.", "wav": "clip.wav",
             "duration": 1.0}
        ]), encoding="utf-8")
        scenes = work / "scenes.yaml"
        scenes.write_text(json.dumps({"scenes": [
            {"id": "clip", "narration": "Read this sentence."}
        ]}), encoding="utf-8")
        argv = ["narrate", str(scenes), str(output),
                "--engine", "piper", "--verify", "on"]
        with patch.object(sys, "argv", argv), \
             patch.object(module, "openai_key", return_value=None), \
             patch.object(module, "duration", return_value=1.0), \
             patch.object(module, "transcribe_local", return_value=None):
            self.assertNotEqual(module.main(), 0)
```

The synthetic bytes are for branch/policy testing only. Real WAV synthesis/transcription remains part of the Windows acceptance fixture.

- [ ] **2. Run the new tests before fixes.** Use `uv run --script tests/proving-it-works-with-a-movie/run-tests.py --suite narration` and the new suites; retain the specific assertions that fail. Missing imports during initial helper creation are expected, but also capture the existing cached-verification false success and native card/subtitle failure before changing them.

- [ ] **3. Implement browser ownership and cards.** Extract the proven Win32 structure/binding and suspended-spawn/Job-assignment sequence from `probe-windows.py`. Add `wait` using retained process handles, `WaitForSingleObject`, and `GetExitCodeProcess`; timeout raises `TimeoutError`. Preserve idempotent close, kill-on-close, and handle release on failures. `browser_tools.render_card` uses this helper on Windows and an owned subprocess session on Unix. Always close its process group/Job and temporary profile in `finally`. Discovery checks an explicit executable first and fails if unusable; otherwise check existing Unix candidates and Windows Chrome/Edge machine/user/PATH locations. Replace the assembler's hand-built URL with `html.resolve().as_uri()` and verify the resulting PNG is nonempty.

- [ ] **4. Implement subtitle and text handling.** Resolve movie/SRT/output paths before changing cwd. Copy only the subtitle into a temporary directory as `captions.srt`; run the existing hard-burn command with that cwd and `subtitles=filename=captions.srt`. Preserve soft embedding. Keep separate diagnostic branches for missing libass and actual burn failure. Read human/shell-authored text with `utf-8-sig`, write plain `utf-8`, and make command output tolerate the native console while preserving UTF-8 machine-readable files. Apply this to the remaining five-tool text IO sites, not unrelated code.

- [ ] **5. Repair transcription and cache behavior.** Keep `transcribe_local(wav, model="base.en") -> str | None`. Use an owned temporary result file, one isolated uv invocation, and this child result protocol:

```python
# Inside ASR_SNIPPET, after obtaining segs:
from pathlib import Path
import json
Path(sys.argv[3]).write_text(
    json.dumps({"text": " ".join(s.text.strip() for s in segs)}),
    encoding="utf-8")
```

Build the child argv as `["uv", "run", "--no-config", "--no-project", "--isolated", "--python", sys.executable, "--with", "faster-whisper", "python", "-c", ASR_SNIPPET, str(wav.resolve()), model, str(result_path)]`, with cwd in the temporary directory. Preserve cache locations; do not inherit a project's environment as the helper environment. Parse only the owned JSON `text` string. Keep stdout/stderr as diagnostics; absent/invalid results or child failure return unavailable. Under explicit `on` that means a failed clip and nonzero command, including cached WAVs. Verification must run after deciding whether to synthesize or reuse a clip. Keep `auto`/`off` behavior and drift thresholds from the reviewed spec; do not add a verification ledger or change the manifest schema.

- [ ] **6. Verify and review the deliverable.** On ordinary-user Windows run `assembly`, `paths`, `browser`, `subtitles`, `narration`, `checker`, and `processes` with `--require-capabilities`. Remove the current Windows card skip when the real card works. Include actual Chrome and Edge cards, actual hard subtitles in a special-character path, and real ASR from a cwd containing a conflicting project configuration. Controlled helper tests cover stdout contamination, malformed results, off→on cached audio, and missing libass. Review/commit the bounded media diff once: `fix(movie): finish native Windows media tools`.

## Task 2 / milestone 2: Finish the Windows terminal example

**Deliverable:** One usable Windows example, invoked from each supported shell, exporting timed PNG takes that feed `assemble`.

**Files:** New `S/examples/film-terminal.py`; `T/test_terminal.py` and `T/fixtures/terminal_app.py`; runner/fixture registration. Reuse Task 1's browser discovery and Windows Job helper. Keep the historical probe unchanged.

- [ ] **1. Run the capture decision gate first.** In `W/capture-gate.py` load the existing probe with `importlib.util.spec_from_file_location` and reuse its terminal launch/readiness/prompt/output handling. Set the fixed viewport before navigation and record its established geometry. Replace only the take acquisition with asynchronous `CDP.send("Page.captureScreenshot", {"format": "png"})` and the existing `pump`/response map; never start a screencast. One screenshot request is outstanding at a time, targeted every 0.2 seconds, with a two-second monotonic deadline. Keep processing terminal events and control input between polls.

Run the gate on ordinary-user Ballmer for PS5.1, PS7, and Git Bash. The native fixture prints long wrapping output, then three colored/text-labeled TUI states held at least 1.3 seconds each, then waits for `q`. Record application state times and automatically captured frames; inspect each state before `q` and then a successful command completion. This must pass without manual snapshot assistance. Do not rerun the old 40-check feasibility gate. If this mechanism fails, retain the failure and stop recorder extraction for the bounded design decision specified in the spec.

Give this scratch gate the probe-compatible arguments `--shell-kind powershell51|powershell7|gitbash --shell EXECUTABLE --browser EXECUTABLE --ttyd EXECUTABLE --directory FRESH_DIRECTORY` and run it through native `uv run --script`. PS5.1 is the existing `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`; Git Bash is `C:\Program Files\Git\bin\bash.exe`. The PS7/ttyd paths are in the resource table. Resolve the existing browser through Task 1's helper. These argument names are confined to the scratch gate; the public example uses the reviewed `serve` interface.

- [ ] **2. Add timing and result-policy tests.** Load the new example by file path, without starting a browser on import. Use this implementation/test contract for frame placement:

```python
def frame_sources(completed, start, end, rate=5):
    import bisect, math
    if not completed or completed[0] != start or end < start:
        raise ValueError("Invalid take boundaries")
    if completed != sorted(completed) or completed[-1] > end:
        raise ValueError("Invalid capture times")
    intervals = [b - a for a, b in zip(completed, completed[1:])]
    if max(intervals + [end - completed[-1]]) > 2:
        raise TimeoutError("Capture gap exceeds two seconds")
    count = max(1, math.ceil((end - start) * rate))
    return [bisect.bisect_right(completed, start + i / rate) - 1
            for i in range(count)]

assert frame_sources([10.0, 10.35, 10.81], 10.0, 11.0) == [0, 0, 1, 1, 1]
```

Also reject a capture gap over two seconds. Test `command_succeeded` with completed shell success plus an identified producer returning seven: it must be false even when the logger succeeds. Unknown/interrupted states, observed shell errors, or missing status for an identified producer must likewise be false.

```python
def command_succeeded(result):
    return (result.get("outcome") == "completed"
            and result.get("shell_success") is True
            and result.get("shell_error") is None
            and (result.get("native_producer") is None
                 or result.get("producer_exit_code") == 0))

assert not command_succeeded({
    "outcome": "completed", "shell_success": True, "shell_error": None,
    "native_producer": "python.exe", "producer_exit_code": 7})
```

- [ ] **3. Extract only user-facing recorder behavior.** Use script metadata `requires-python = ">=3.12"` and `dependencies = ["websocket-client==1.9.0"]`. Reuse the proven CDP receiver, bounded completion parser, ttyd `-w`/one-client/writable startup, prompt adapters, and owned roots. Import sibling `scripts` explicitly relative to `__file__`. Remove gate aggregators, sentinel creation, automatic test phases, heartbeat workers, probe variable assertions, and the probe's hard-coded 20-minute test lifetime. Keep a foreground `serve` process owned by the harness, with per-command deadlines.

- [ ] **4. Implement the exact CLI/control contract.** `serve` accepts `--shell`, `--directory`, `--cwd`, and executable overrides `--shell-exe`, `--browser`, `--ttyd`. Retain the spec's `request --file` and wait-only `result --id` forms, 30-second client timeout, and 90-second default command timeout. Persist ordered request/ack/result files, session IDs, pending run, active take, and `next_request_id`. Publish state before acknowledgments; reject gap/duplicate IDs before publication and second runs before typing. Server-rejected consumed IDs advance the sequence so cancellation remains usable. A failed command result is nonzero without ending the session.

For example, a caller writes this UTF-8 file and submits it once; later result retrieval never writes another request:

```json
{"id":1,"operation":"run","command":"Write-Output 'ready'","timeout_seconds":90}
```

```text
uv run --script skills/proving-it-works-with-a-movie/examples/film-terminal.py request --directory SESSION --file request-1.json
uv run --script skills/proving-it-works-with-a-movie/examples/film-terminal.py result --directory SESSION --id 1 --timeout 30
```

`SESSION` denotes the caller's real session directory. Test readiness nonce/cwd/shell through the filmed connection; reconnect or geometry change ends the session. Preserve raw PowerShell status separately from attributed errors. Keep direct-native/first-pipeline-producer attribution exactly as the spec defines; opaque scripts do not acquire inferred native status.

- [ ] **5. Integrate successful capture and shutdown.** `begin-take` completes after its first PNG and monotonic start time. Pump CDP, control requests, command completion, and capture replies in one bounded loop. Write raw sample times, then ordinary numbered PNG copies selected by `frame_sources` at end. Return scene fields `kind: frames`, `src` as the absolute take-directory string, and `rate: 5`, plus take metadata. The absolute path is accepted by the existing assembler's path join. Do not alter input geometry while recording.

`end-take` keeps shell/browser alive. Command timeout, capture timeout, reconnect, and geometry change record the specified unknown/interrupted result, fail the active take, and terminate the session. `close` finalizes a healthy take; `cancel` marks it incomplete. Both interrupt any pending command and release the Job; successful shutdown results are written only afterward. Finalizer failures remain failures. Support the declared printable/special keys without adding arbitrary terminal emulation.

- [ ] **6. Verify through separate actual tool calls.** Run `uv run --script tests/proving-it-works-with-a-movie/run-tests.py --suite terminal --require-capabilities` on ordinary-user Windows. Stage the whole native suite in each actual invoking shell while recording that same shell. Reuse probe outcome and child/grandchild/sentinel fixtures against the final example. Validate two takes across separate shell tool calls, pending-command persistence, cwd/variables, wrapped output, automatic multi-state TUI pixels, and normal/cancel/browser-loss/forced-exit cleanup. Inject client timeout followed by `result`, command timeout, gap/duplicate IDs, screenshot/geometry failure, and control/report-write failure. Do not count a single Python process driving both phases as proof of harness-call persistence.

- [ ] **7. Review/commit the finished example.** Inspect exported PNGs and their assembled sequence, duration, state order, and recorded gaps. Commit the recorder/tests as `feat(movie): support native Windows terminal recording` after the milestone review. The capture decision gate is part of this task, not a separately staffed project.

## Task 3 / milestone 3: Instructions and final acceptance

**Deliverable:** Copyable Windows instructions and three inspected finished movies from the final code, with a short results report.

**Files:** `S/{SKILL,assembling,narrating,recording-a-terminal,recording-motion,rendering-stills,rendering-from-a-log}.md` where changes are needed; `T/README.md`; new `T/run-windows-acceptance.py` and `T/fixtures/browser.html`; the existing results report. No external eval-repository changes are required.

- [ ] **1. Save one fixture and workflow driver.** `run-windows-acceptance.py --work DIR --shell powershell51|powershell7|gitbash --phase prepare|finish` prepares scenes or processes the recorded artifacts. `prepare` creates the same scratch browser app, captures its changing states, and creates an image plus an existing movie segment with its own known audio. `finish` requires `--take-one PATH --take-two PATH` pointing to the example's exported frame directories. Use `movie O'Brien λ & [take]` paths, CRLF scenes, UTF-8 BOM input coverage, a separate assembly work directory, narration-longer and visual-longer cases. Load the tiny browser counter from its file URI and change it through actual CDP mouse clicks. Reuse the example's retained `CDP.send`/`pump`/`responses` handling and Task 1's owned browser helpers, closing fixture processes afterward. No fixture server or browser recording framework is needed.

The saved scenes name `title` (card), `still` (image), `browser` (frames), `take-one`/`take-two` (frames at 5 fps), and `source` (movie). Narrate the non-movie scenes; retain the source segment's own audio. Let the driver call existing tools through `fixtures.run_tool` and reject every nonzero result:

```python
steps = [
    ("narrate", [str(scenes), str(voice), "--engine", "piper", "--verify", "on"]),
    ("assemble", [str(scenes), str(cut), "--narration", str(voice), "--work", str(segments)]),
    ("make-subtitles", [str(voice / "manifest.json"), str(subtitles),
                        "--offsets-json", str(segments / "offsets.json")]),
    ("burn-subtitles", [str(cut), str(subtitles), str(movie)]),
    ("check-movie", [str(movie)]),
]
```

These local variables are the driver's `Path` values under `--work`; use an evidence subdirectory for checker outputs. Local voice repeats synthesize into a new output directory using downloaded model caches; the cached-WAV off→on policy is tested separately. During final audio verification, compare each narrated interval with its script and the source-movie interval with its own reference, so preserved source audio is not misclassified as TTS drift.

- [ ] **2. Run the two baseline instruction sessions before Markdown edits.** Apply `superpowers:writing-skills` when editing skill instructions. Use one fixed scenario for an actual PowerShell tool and an actual Git Bash tool, each against the unchanged instructions plus the final product code. This isolates the instruction change. Save the scenario at `W/instruction-scenario.md`:

> On native Windows, make a narrated and hard-subtitled proof movie from the provided local app and terminal fixture, using the installed movie skill. Work in the supplied path with spaces, an apostrophe, and Unicode. Use local narration without a cloud key. Keep the recorded command alive between two takes. If desktop capture is unavailable, state what was actually captured and what remains unproven.

Use a controlled unavailable-desktop condition in these sessions. Reuse `P/artifacts/windows-eval-preflight/native-tool-preflight.py` and `native-gitbash-preflight.py` as launcher references, removing diagnostic `--safe` mode and loading the explicit candidate plugin with skill bootstrap. The transcripts must show the actual shell tool and loaded skill; a PowerShell parent invoking a Bash tool does not count. Pin the same existing model and setup across before/after. Do not build a Quorum deployment or launch other agents during planning.

- [ ] **3. Write and exercise Windows instructions.** Document all five `uv run --script` invocations, prerequisites, shell-specific quoting, pure PowerShell execution, foreground lifetime, consecutive request IDs, wait-only results, take timing, keys, fixed geometry, and cleanup. Use `[IO.File]::WriteAllText($path, $json, [Text.UTF8Encoding]::new($false))` for PowerShell UTF-8 without BOM. Document native producer status before `Tee-Object`, and Bash `PIPESTATUS`/pipefail for logs. Preserve Unix tmux instructions and fix the dangling example reference.

Add the Windows desktop preflight:

```text
ffmpeg -nostdin -y -f gdigrab -framerate 5 -i desktop -t 2 capture-check.mp4
ffmpeg -nostdin -y -i capture-check.mp4 -frames:v 1 capture-check.png
```

Invoke with an argument array and scratch paths from the ordinary-user interactive desktop; inspect actual application pixels. Document failure without converting it to a GUI success claim. Test Chrome and Edge card discovery once each; no browser-by-shell cross product is needed.

- [ ] **4. Execute final acceptance and the two candidate instruction sessions.** Run the documented workflow from PS5.1, PS7, and Git Bash, recording the corresponding shell; one row each. Capture the invoking shell's own version/PID in its command transcript before launching uv; `--shell` selects the recorded shell and is not evidence for the invoking shell. Remove cloud keys only from the test process environment and use a process-local tool PATH excluding `llm` credential lookup; leave saved credentials untouched and select local Piper explicitly. Use native Windows tools and verify the actual ordinary-user token. For each final movie inspect picture, hard subtitles, audible narration, contact sheet, timing, and rendered-audio transcription. Record executable paths, shell identity, source revision, command exit codes, movie/contact-sheet paths, and inspection result. Complete the four-session before/after instruction comparison with the same scenario and candidate Markdown.

On the native Mac and existing Linux runner, run only the portable suites `assembly`, `paths`, `checker`, `narration`, `browser`, and `subtitles` with `--require-capabilities`, including the changed shared code paths. Windows-only `processes`/`terminal` are not part of those runs. A skipped required case is incomplete, never green. Add actual fresh and cached-model voice checks on the existing Mac/Linux setup when validating the changed shared narration helper; do not re-provision other architectures.

- [ ] **5. Close the reviewed scope.** Append a three-row Windows matrix, Mac/Linux regression results, four instruction-session results, and desktop/card checks to the existing report. Include stable artifact locations and the final tested source revision. Mark every spec acceptance row passed or explicitly incomplete; do not merely count commands returning zero. Review the final diff and commit `docs(movie): document and verify Windows workflows`. No pushing, PR, or merge is part of this plan.

## Spec coverage and execution boundary

| Reviewed requirement | Task |
| --- | --- |
| Five tools, paths, cards, UTF-8/BOM, subtitles, isolated ASR including cached verification (R2) | 1 |
| Fixed capture decision gate; producer status (R1); ordered/asynchronous control (R3); timeout/shutdown (R4); honest frame timing (R5) | 2 |
| Final recorder cleanup, same-session takes, wrapping, TUI and native shell behavior | 2 |
| Three complete Windows workflows, local voice, final-movie inspection, desktop/card checks, existing-platform regressions | 3 |
| Windows instructions and four before/after skill sessions | 3 |

At execution, retain focused RED/GREEN evidence and review each of these three milestones. Rerun only checks affected by a fix; final integration must use final product code. If a genuine blocker requires changing an approved interface, dependency, supported route, or validation scope, present that concrete issue before expanding work.

This plan was written and self-reviewed without starting implementation, remote tests, or agents. The next action is human review of the plan and execution choice; the old controller and workers remain canceled.
