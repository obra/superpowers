# Finish Windows support for the movie skill

**Status:** Reviewed execution completed through the three implementation milestones. Native workflow results and the remaining candidate-instruction verification gaps are recorded in the [results report](../reports/2026-09-09-proof-movie-os-compatibility.md#reviewed-windows-completion--final-results).

**Baseline:** `feat/movie-os-compatibility` at `442a48d9`, based on the movie import at `f6617db1`.

**Implementation plan:** [Three-milestone completion plan](../plans/2026-09-09-proof-movie-windows-completion.md). Execution was authorized and resumed.

This replaces the remaining scope of the [earlier OS compatibility design](2026-09-09-proof-movie-os-compatibility-design.md) and its [12-task implementation plan](../plans/2026-09-09-proof-movie-os-compatibility.md). Completed fixes and retained evidence remain useful. Unfinished tasks in that plan are not instructions to resume work.

## Goal and limits

An agent on native Windows can use the existing movie skill from **PowerShell 5.1, PowerShell 7, or Git Bash** to capture real software, generate local narration, assemble the movie, add subtitles, and apply the existing movie verification gate.

- Both the invoking shell and the recorded shell must work. The acceptance rows pair each invoking shell with the same recorded shell; a nine-combination shell matrix is unnecessary.
- PowerShell does not require Git Bash. Native Windows does not require WSL, tmux, Docker, administrator rights, a cloud key, or changes to machine settings.
- Reuse native Python/uv, FFmpeg/ffprobe, Chromium-family browsers, ttyd, and the existing local voice/transcription dependencies. First use may download prerequisites and models; document that setup separately from recording.
- Keep the existing five tool CLIs, scene kinds, narration manifest, offsets, SRT files, and checker behavior. Preserve the existing Unix terminal recipe and macOS/Linux behavior.
- Validate native Windows x64 on the available Ballmer host. Record its actual Windows version; do not infer support for untested Windows releases or architectures, or add a Windows 11-only restriction without a demonstrated need.

This is a Windows port. It does not deliver a general process-management framework, a cross-platform recorder rewrite, a new eval harness, or a new OS/architecture certification matrix. Existing Linux, Mac, WSL, Rosetta, and offline-isolation setup may be reused when useful; extending that setup is not a deliverable.

## Keep the completed work

| Existing work | Treatment |
| --- | --- |
| `assemble` and `media_paths.py` at `442a48d9` | Keep numbered ordinary-file frame staging, FFconcat escaping, UTF-8 writes, ordering, and cleanup. The native Windows path/assembly evidence covers images, frames, and movie segments; cards remain open. |
| Portable runner and tests | Keep the original 18 assertion intents and the corrected subtitle-offset assertion. Extend this runner for the remaining fixes. |
| `probe-windows.py` | Reuse the demonstrated ttyd launch, same-page observation, shell status, and Windows Job Object mechanisms. Keep test fixtures and evidence aggregation out of the user-facing recorder. |
| Existing host inventory and artifacts | Use the prepared ordinary-user Windows runner and explicit tool paths. Prior evidence is labeled with its source revision; it does not replace testing the final changed code. |

The probe's TUI success used a bounded checkpoint. Its event-driven screencast and arbitrary resize behavior are not accepted as a finished capture implementation.

## 1. Finish the existing media tools

| Area | Required resulting behavior |
| --- | --- |
| Invocation | All five extensionless scripts work with `uv run --script <path> ...` from each Windows shell. Documentation uses each shell's own quoting and environment syntax. Existing Unix shebang execution remains usable. |
| Browser and cards | Discover installed Chrome or Edge in standard Windows user/machine locations and on PATH; keep existing Mac/Linux discovery. An explicit `--browser` is authoritative: an unusable value reports an error. Render local HTML using `Path.resolve().as_uri()`, an owned temporary browser profile, and a bounded timeout. Verify the screenshot exists. Release the browser processes launched by this render on success/failure without touching the user's browser. |
| Subtitle paths | For hard subtitles, copy the SRT to a safe fixed basename in a temporary directory and run FFmpeg there, using absolute movie/output paths. This avoids interpreting drive letters, apostrophes, and backslashes as filter syntax. Preserve explicit soft-subtitle mode and the existing no-libass fallback, with accurate diagnostics. A burn failure must not be reported as missing libass. |
| Text | Read/write YAML, JSON, HTML, SRT, and transcription text with explicit UTF-8, accepting UTF-8 BOM where shell-generated input requires it. CRLF input is valid. Unicode paths/content must survive native Windows defaults, including PowerShell 5.1. Machine-readable helper results must not depend on the console code page. |
| Local transcription | Replace the failing nested `python3` launch with a Windows-compatible uv-managed Python invocation isolated from the project being filmed. Return transcript data separately from library stdout diagnostics. Under `--verify on`, transcribe both newly generated and reused cached WAVs: an unchanged manifest or a prior `--verify off` run does not establish verification. Missing, malformed, or failed transcription is nonzero under `on`; `auto` may report verification unavailable, and `off` remains explicit. Preserve existing drift thresholds. |

The narration change addresses observed failures: native Windows could synthesize audio but silently skip requested transcription, and a native-library stdout warning could be mistaken for transcript text. Do not change the checker's general acceptance policy as part of this fix.

## 2. Provide a usable Windows terminal example

Add `skills/proving-it-works-with-a-movie/examples/film-terminal.py` as the Windows recording entry point referenced by the Windows instructions. It uses the proven native ttyd/ConPTY and browser approach. The existing Unix tmux recipe remains documented separately; do not advertise this new entry point as a tested Unix recorder.

### Session and control contract

- `serve --shell powershell51|powershell7|gitbash --directory <new-session-dir>` owns one recorded shell and one browser page. Allow explicit shell/browser/ttyd executable paths and `--cwd` (default: the invoking working directory). Launch ttyd with explicit `-w` for that cwd, writable mode, one client, and loopback binding.
- Keep `serve` in a foreground/background task owned by the invoking harness, as the visual companion does. Later shell tool calls control the same process. It is not an installed service or self-daemonizing launcher.
- `request --directory <session-dir> --file <UTF-8-JSON>` submits a request. Files avoid inline command length and cross-shell JSON quoting problems. A session has one requesting controller; IDs are consecutive integers starting at one, matching the probe's ordered reader. Expose `next_request_id` in the ready/status files and `inspect` result; publish the updated status before acknowledging a consumed ID. Reject duplicate or non-next IDs before publication, with an immediate error rather than waiting for a missing file. Writes and replies are atomic. Default output is acknowledgment JSON, which does not claim command completion; a rejection is nonzero. `--wait-result` waits up to `--timeout` (default: 30 seconds) and exits nonzero for command/control failure, unknown/interrupted outcome, or missing result. A client wait timeout does not cancel the pending command.
- `result --directory <session-dir> --id <accepted-id> --timeout <seconds>` waits for or reads an existing result without submitting another request or consuming an ID. Default timeout is 30 seconds; use the same completion/exit-status rules as `request --wait-result`. This is the supported follow-up after acknowledgment or client timeout.
- Supported request operations are `run` (`command`, optional `timeout_seconds`, optional `native_producer`), `begin-take` (`name`), `end-take`, `key` (`key`), `inspect`, `close`, and `cancel`. Support printable keys, Enter, Escape, arrows, Tab, and Ctrl-C. Diagnostic probe phases, crash fixtures, and aggregation are test-only.
- `run` acknowledges acceptance without waiting for the command to finish. Its result deadline defaults to 90 seconds and is independent of the client's wait timeout. Reuse the probe's numbered request/ack/result files under `control/`, with session ID and request ID in replies. `inspect` exposes pending request and active take. A second `run` while one is pending fails before typing, leaving the session usable; take controls and intentional `key` input remain available. A known failing command can be followed by another command; it does not itself terminate recording.
- `end-take` stops capture only. It preserves the shell, working directory, variables, pending command, and browser connection for a later take, including across separate harness tool calls.
- Readiness requires a nonce, shell identity, and cwd returned through the filmed terminal, plus a readable preflight image. Opening another ttyd connection is not an observation mechanism. A reconnect fails the session instead of silently replacing its identity.

Command results distinguish `completed`, `unknown`, and `interrupted`; shell success is nullable. Preserve raw PowerShell `$?` separately from observed request-attributed errors, including PS5.1 expression-wrapper behavior; instrumentation must not change the submitted statement's semantics. Capture status before logging.

`native_producer` identifies the native executable for a direct invocation or the first stage of a pipeline followed by logging commands. This is the bounded attribution contract already exercised by the probe: Bash uses the first saved `PIPESTATUS` entry; PowerShell uses that request's native exit status. Opaque/mixed scripts omit this field and report their observed shell outcome without claiming individual internal commands succeeded. Do not infer producer identity or reuse stale native status. A completed result is successful only when shell success is true, no request-attributed shell error is present, and any explicitly identified producer has a known zero exit code. Thus successful `tee`/`Tee-Object` cannot hide a producer failure. Retain the existing probe's relevant outcome cases as regressions for the adapted code.

### Capture choice and deliberately limited geometry

Use **bounded `Page.captureScreenshot` PNG capture at 5 fps**, with a fixed **1600 × 900** browser viewport set before terminal navigation. This reuses the successful live-screenshot mechanism and the imported skill's deliberate-frame route. Continuous CDP screencast delivery is not required for this port.

- Observe and record actual terminal rows/columns; require at least 80 columns for the existing 60-character completion framing. Do not offer resize controls. A detected terminal geometry change fails the session with an actionable message.
- The CDP receiver must continue handling terminal output, command replies, and cancellation during capture. Use a two-second screenshot response deadline; a timeout or lost browser fails the active take.
- Treat 5 fps as the target sampling cadence, not a guarantee that every 0.2-second event is observed. Record monotonic take boundaries and screenshot request/completion times. A take starts at its first completed screenshot; `begin-take` completes only then. Place frames on the 0.2-second output grid using the latest screenshot completed at or before that grid time, never a future screenshot. Record duplicated intervals; a gap between completed captures, or from the last capture to take end, exceeding two seconds fails the take. Match total take duration within one frame (0.2 seconds). Total duration alone does not establish event timing.
- `end-take` returns a take directory and the corresponding existing `kind: frames` scene fields (`src`, `rate: 5`). These artifacts feed the existing assembler directly.
- Check preflight pixels and final exported frames. A static application can legitimately produce identical frames; image similarity alone is not a stalled-capture test. Acceptance must show several successive visible TUI states, each held for at least 1.3 seconds, in the automatically captured sequence while the command owns input, before its exit key. Check their order and placement against capture times. A manually requested snapshot cannot rescue this acceptance check; missing states fail it.
- At the fixed geometry, long wrapping output followed by a command completion must work. Invalid/truncated completion records time out as unknown; they never produce success. A general VT emulator and arbitrary resizing are outside this delivery.

The screenshot cadence and fixed-geometry adapter require a focused actual Windows test before committing to further recorder extraction. If either fails, retain the failure and propose a bounded alternative; do not silently resume the old recorder architecture.

### Ownership and failure handling

Reuse the probe's Windows Job Object mechanism: establish containment before recorder-owned roots execute, and retain kill-on-close semantics. Normal close, cancel, browser loss, and forced recorder exit must remove its browser/ttyd/shell descendants within ten seconds. An unrelated process must survive. Cleanup still runs when capture, control-file, or report writes fail; such failures remain nonzero results. Pending command success becomes unknown/interrupted when observation is lost.

A command-result deadline expiring records an unknown outcome, fails the active take, and terminates the session with owned-resource cleanup. It must not clear pending state and type another command into the still-running program. Browser loss, capture timeout, or a forbidden geometry change likewise ends the session. Client wait deadlines have no such effect.

`close` finalizes a healthy active take; `cancel` marks an active take incomplete. Both mark any pending command interrupted with null success and release owned processes. Earlier completed takes remain available. A shutdown acknowledgment means only accepted; publish the successful close/cancel result only after cleanup finishes. That success describes resource release, not the interrupted command. A finalization, cleanup, or result-write failure makes shutdown nonzero or leaves no successful result; the client must not infer success from a missing result.

Keep ownership code specific to this recorder and its launched browser. Extract a small Windows helper only where it avoids duplicating the proven mechanism; do not introduce the previous generic `OwnedProcesses` framework.

## 3. Update only the Windows-facing guidance

Update the existing skill/route documents where Unix-only commands block Windows use. Keep their existing evidence standards and terminology.

- Provide complete PowerShell and Git Bash command sequences for the five tools and terminal example. Record how PowerShell 5.1 writes UTF-8 files and how both shells preserve producer exit status when logging.
- Explain the distinct choices of invoking shell and recorded shell, foreground lifetime, take boundaries, fixed viewport, and cleanup.
- Include a Windows FFmpeg `gdigrab` desktop preflight alongside the existing macOS recipe, using a scratch output directory. Verify it in the available ordinary-user interactive desktop session. Document unavailable/locked-desktop capture honestly: a log reel proves a run, not uncaptured GUI behavior.
- Retain browser-driven motion, stills, existing movie segments, and log reels as existing routes through the same media tools. No new scene language or browser automation framework is needed.
- Correct the current dangling terminal-example reference so Unix and Windows instructions point to what actually exists.

## 4. Finite acceptance checklist

All results below are required unless explicitly conditional. Reuse prepared tools and the existing portable runner. A missing prerequisite or skipped required test is an incomplete result, not compatibility proof.

| Check | Required evidence |
| --- | --- |
| Three native Windows workflow runs | One run invoked from each of PS5.1, PS7, and Git Bash on Ballmer, recording the corresponding shell. Record actual tool paths, native Windows Python identity, shell versions, and ordinary-user token. |
| One repeatable fixture per run | Combine a rendered title card, still image, changing real browser content, terminal takes, and an existing movie segment into a narrated, hard-subtitled movie. Use a path such as `movie O'Brien λ & [take]`, CRLF scene input, and a separate work directory. Preserve source movie audio and measured offsets; cover both narration-longer and visuals-longer scene timing. |
| Terminal behavior per recorded shell | Known success/failure; PowerShell cmdlet/native distinctions and raw expression-wrapper status; explicitly attributed producer failure through logging must make `result` nonzero; one command running across two takes and separate tool calls; cwd/variable persistence; long wrapped output; several ordered TUI states in automatic frames before the exit key. Validate timestamp placement and fixed geometry. |
| Local voice per workflow | Fresh local Piper synthesis and actual transcription with no cloud key, including a repeat using cached models. Invoke the finished helper through `narrate --verify on`. Synthetic audio/text comparisons and skipped ASR do not satisfy this check. Additional OS network-isolation experiments are unnecessary. |
| Final movie per workflow | All five tools complete; hard subtitles are visible, narration audible, action and timing visible in the finished movie; checker passes; inspect its contact sheet and transcribe/check the rendered audio. Record artifacts and commands. |
| Browser fallback and desktop | Render an actual title card with Chrome and Edge once each. Run the desktop preflight in the existing interactive session and inspect real app pixels; separately verify that unavailable capture is reported as unavailable. No RDP/compositor matrix. |
| Focused negative tests | Bad browser override, browser timeout, missing libass/soft fallback, malformed or unavailable ASR under `--verify on` for both fresh and off→on cached clips, no-Bash PowerShell launch, screenshot timeout, geometry change, and cleanup after control/report failures. Control cases cover immediate gap/duplicate-ID rejection, wait-only result retrieval after client timeout, second-run rejection, command-timeout teardown, and no successful shutdown result before cleanup. Use controlled tests for these failure cases. |
| Ownership regressions | Normal close, cancel, browser loss, and forced exit on the final recorder for each recorded shell. Reuse the existing child/grandchild and unrelated-sentinel fixtures. |
| Existing platforms | Run the existing portable regressions on the available native Mac and Linux runner, including the modified browser/subtitle/narration code paths. Preserve Unix instructions. No additional WSL, Rosetta, Intel-hardware, or architecture certification gate. |
| Skill instructions | Four focused agent sessions: before/after using actual PowerShell tools and before/after using actual Git Bash tools. Use the same Windows scenario to exercise paths, no-key narration, terminal commands, and honest capture failure. Follow `superpowers:writing-skills`; retain transcripts and before/after results. No new eval platform or 36-session matrix. |

Share the fixture and downloaded model caches across shell runs; each run must still produce its own final-code artifacts. Fix demonstrated failures and rerun the affected checks. A final integration run uses the final code; unchanged prerequisite investigations and already-reviewed unrelated fixtures do not need repeating.

## Delivery and stopping point

Work has three implementation milestones: **media tools**, **Windows terminal example**, and **instructions plus final acceptance**. The first two can be reviewed as concrete changes without creating another platform-wide task hierarchy.

Expected edits are the existing five scripts, at most the browser/Windows ownership helpers actually shared by the example, the new terminal example, focused tests in the existing test directory, and affected movie Markdown files. Existing scratch evidence is retained, not promoted wholesale into production. Summarize final results in the existing report with stable artifact locations and source revision.

Done means the three native Windows workflow runs and this checklist have concrete results, documented limitations are visible, and the user has a complete diff to review. Missing Windows route evidence remains unfinished work. Pushing, opening a PR, and merging are separate from this specification request.

Execution resumed under this reviewed scope. The results report records each acceptance disposition, including incomplete candidate-instruction verification; the superseded plan and earlier workers were not resumed.
