# Finish Windows support for the movie skill

## Goal and limits

An agent on native Windows can use the existing movie skill from **PowerShell 5.1, PowerShell 7, or Git Bash** to capture real software, generate local narration, assemble the movie, add subtitles, and apply the existing movie verification gate.

- Both the invoking shell and the recorded shell must work. The acceptance rows pair each invoking shell with the same recorded shell; a nine-combination shell matrix is unnecessary.
- PowerShell does not require Git Bash. Native Windows does not require WSL, tmux, Docker, administrator rights, a cloud key, or changes to machine settings.
- Reuse native Python/uv, FFmpeg/ffprobe, Chromium-family browsers, ttyd, and the existing local voice/transcription dependencies. First use may download prerequisites and models; document that setup separately from recording.
- Keep the existing five tool CLIs, scene kinds, narration manifest, offsets, SRT files, and checker behavior. Preserve the existing Unix terminal recipe and macOS/Linux behavior.
- Validated on native Windows 11 x64. Support for other Windows releases or architectures is not inferred.

This is a Windows port. It does not deliver a general process-management framework, a cross-platform recorder rewrite, a new eval harness, or a new OS/architecture certification matrix. Existing Linux, Mac, WSL, Rosetta, and offline-isolation setup may be reused when useful; extending that setup is not a deliverable.

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

Add `skills/proving-it-works-with-a-movie/examples/film-terminal.py` as the Windows recording entry point referenced by the Windows instructions. It serves the shell through ttyd and observes it in a headless browser. The existing Unix tmux recipe remains documented separately; do not advertise this new entry point as a tested Unix recorder.

### Session and control contract

- `serve --shell powershell51|powershell7|gitbash --directory <new-session-dir>` owns one recorded shell and one browser page. Allow explicit shell/browser/ttyd executable paths and `--cwd` (default: the invoking working directory). Launch ttyd with explicit `-w` for that cwd, writable mode, one client, and loopback binding.
- Keep `serve` in a foreground/background task owned by the invoking harness, as the visual companion does. Later shell tool calls control the same process. It is not an installed service or self-daemonizing launcher.
- `request --directory <session-dir> --file <UTF-8-JSON>` submits a request. Files avoid inline command length and cross-shell JSON quoting problems. A session has one requesting controller; IDs are consecutive integers starting at one. Expose `next_request_id` in the ready/status files and `inspect` result; publish the updated status before acknowledging a consumed ID. Reject duplicate or non-next IDs before publication, with an immediate error rather than waiting for a missing file. Writes and replies are atomic. Default output is acknowledgment JSON, which does not claim command completion; a rejection is nonzero. `--wait-result` waits up to `--timeout` (default: 30 seconds) and exits nonzero for command/control failure, unknown/interrupted outcome, or missing result. A client wait timeout does not cancel the pending command.
- `result --directory <session-dir> --id <accepted-id> --timeout <seconds>` waits for or reads an existing result without submitting another request or consuming an ID. Default timeout is 30 seconds; use the same completion/exit-status rules as `request --wait-result`. This is the supported follow-up after acknowledgment or client timeout.
- Supported request operations are `run` (`command`, optional `timeout_seconds`, optional `native_producer`), `begin-take` (`name`), `end-take`, `key` (`key`), `inspect`, `close`, and `cancel`. Support printable keys, Enter, Escape, arrows, Tab, and Ctrl-C. Diagnostic probe phases, crash fixtures, and aggregation are test-only.
- `run` acknowledges acceptance without waiting for the command to finish. Its result deadline defaults to 90 seconds and is independent of the client's wait timeout. Use numbered request/ack/result files under `control/`, with session ID and request ID in replies. `inspect` exposes pending request and active take. A second `run` while one is pending fails before typing, leaving the session usable; take controls and intentional `key` input remain available. A known failing command can be followed by another command; it does not itself terminate recording.
- `end-take` stops capture only. It preserves the shell, working directory, variables, pending command, and browser connection for a later take, including across separate harness tool calls.
- Readiness requires a nonce, shell identity, and cwd returned through the filmed terminal, plus a readable preflight image. Opening another ttyd connection is not an observation mechanism. A reconnect fails the session instead of silently replacing its identity.

Command results distinguish `completed`, `unknown`, and `interrupted`; shell success is nullable. Preserve raw PowerShell `$?` separately from observed request-attributed errors, including PS5.1 expression-wrapper behavior; instrumentation must not change the submitted statement's semantics. Capture status before logging.

`native_producer` identifies the native executable for a direct invocation or the first stage of a pipeline followed by logging commands. This is the bounded attribution contract: Bash uses the first saved `PIPESTATUS` entry; PowerShell uses that request's native exit status. Opaque/mixed scripts omit this field and report their observed shell outcome without claiming individual internal commands succeeded. Do not infer producer identity or reuse stale native status. A completed result is successful only when shell success is true, no request-attributed shell error is present, and any explicitly identified producer has a known zero exit code. Thus successful `tee`/`Tee-Object` cannot hide a producer failure.

### Capture choice and deliberately limited geometry

Use **bounded `Page.captureScreenshot` PNG capture at 5 fps**, with a fixed **1600 × 900** browser viewport set before terminal navigation. This reuses the successful live-screenshot mechanism and the imported skill's deliberate-frame route. Continuous CDP screencast delivery is not required for this port.

- Observe and record actual terminal rows/columns; require at least 80 columns for the existing 60-character completion framing. Do not offer resize controls. A detected terminal geometry change fails the session with an actionable message.
- The CDP receiver must continue handling terminal output, command replies, and cancellation during capture. Use a two-second screenshot response deadline; a timeout or lost browser fails the active take.
- Treat 5 fps as the target sampling cadence, not a guarantee that every 0.2-second event is observed. Record monotonic take boundaries and screenshot request/completion times. A take starts at its first completed screenshot; `begin-take` completes only then. Place frames on the 0.2-second output grid using the latest screenshot completed at or before that grid time, never a future screenshot. Record duplicated intervals; a gap between completed captures, or from the last capture to take end, exceeding two seconds fails the take. Match total take duration within one frame (0.2 seconds). Total duration alone does not establish event timing.
- `end-take` returns a take directory and the corresponding existing `kind: frames` scene fields (`src`, `rate: 5`). These artifacts feed the existing assembler directly.
- Check preflight pixels and final exported frames. A static application can legitimately produce identical frames; image similarity alone is not a stalled-capture test. Acceptance must show several successive visible TUI states, each held for at least 1.3 seconds, in the automatically captured sequence while the command owns input, before its exit key. Check their order and placement against capture times. A manually requested snapshot cannot rescue this acceptance check; missing states fail it.
- At the fixed geometry, long wrapping output followed by a command completion must work. Invalid/truncated completion records time out as unknown; they never produce success. A general VT emulator and arbitrary resizing are outside this delivery.

### Ownership and failure handling

Use a Windows Job Object: establish containment before recorder-owned roots execute, and retain kill-on-close semantics. Normal close, cancel, browser loss, and forced recorder exit must remove its browser/ttyd/shell descendants within ten seconds. An unrelated process must survive. Cleanup still runs when capture, control-file, or report writes fail; such failures remain nonzero results. Pending command success becomes unknown/interrupted when observation is lost.

A command-result deadline expiring records an unknown outcome, fails the active take, and terminates the session with owned-resource cleanup. It must not clear pending state and type another command into the still-running program. Browser loss, capture timeout, or a forbidden geometry change likewise ends the session. Client wait deadlines have no such effect.

`close` finalizes a healthy active take; `cancel` marks an active take incomplete. Both mark any pending command interrupted with null success and release owned processes. Earlier completed takes remain available. A shutdown acknowledgment means only accepted; publish the successful close/cancel result only after cleanup finishes. That success describes resource release, not the interrupted command. A finalization, cleanup, or result-write failure makes shutdown nonzero or leaves no successful result; the client must not infer success from a missing result.

Keep ownership code specific to this recorder and its launched browser. Share a small Windows helper between the recorder and the card renderer; do not introduce a generic process framework.

## 3. Update only the Windows-facing guidance

Update the existing skill/route documents where Unix-only commands block Windows use. Keep their existing evidence standards and terminology.

- Provide complete PowerShell and Git Bash command sequences for the five tools and terminal example. Record how PowerShell 5.1 writes UTF-8 files and how both shells preserve producer exit status when logging.
- Explain the distinct choices of invoking shell and recorded shell, foreground lifetime, take boundaries, fixed viewport, and cleanup.
- Include a Windows FFmpeg `gdigrab` desktop preflight alongside the existing macOS recipe, using a scratch output directory. Verify it in the available ordinary-user interactive desktop session. Document unavailable/locked-desktop capture honestly: a log reel proves a run, not uncaptured GUI behavior.
- Retain browser-driven motion, stills, existing movie segments, and log reels as existing routes through the same media tools. No new scene language or browser automation framework is needed.
- Correct the current dangling terminal-example reference so Unix and Windows instructions point to what actually exists.

## 4. Validation

Each of PowerShell 5.1, PowerShell 7, and Git Bash on Windows 11 x64 produced
a complete narrated, hard-subtitled movie from a title card, a still, real
browser clicks, two terminal takes across separate tool calls, and a source
movie segment, using local Piper narration verified by local transcription,
with the checker passing. The portable suites pass on macOS and were also run
on Linux during development. Full-desktop `gdigrab` capture returned only
wallpaper on the test host; window-title capture worked.
