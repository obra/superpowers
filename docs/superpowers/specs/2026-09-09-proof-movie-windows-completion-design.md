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

Windows has no tmux, so `examples/film-terminal.py` stands in for it, keeping
the Unix route's shape: ttyd serves the shell, a headless Chrome or Edge page
renders it, screenshots are the frames. `serve` starts both, keeps them alive
in a harness-owned background task, and appends the raw terminal output to a
log. `run`, `key`, `watch`, and `close` are one-shot CDP calls against that
browser, so the shell, its variables, and its cwd persist across separate
tool calls with no daemon protocol.

- The installed prompt reports a counter, the shell's success flag, the last
  native exit code, and the cwd through the window title, which the picture
  never shows. `run` types a command, waits for the next prompt, and prints
  that status as JSON; it exits 1 when the command failed and 2 when it is
  still running after `--seconds`.
- Capture is bounded `Page.captureScreenshot` at 5 fps in a fixed 1600×900
  viewport. Frames sit on the 0.2-second grid and a slow screenshot repeats
  the previous frame, so every `--record` directory is a `kind: frames` scene
  at `rate: 5` for the assembler.
- `serve` refuses a blank canvas at readiness and exits nonzero if the
  browser or ttyd connection drops. `close` kills ttyd, the browser, and
  their descendants (`taskkill /T` on Windows) and removes the browser
  profile.
- The script does not check which OS it runs on, which is how its session
  tests run on macOS too; the Unix route stays the tmux recipe.

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
with the checker passing. The recorder's session tests pass on Windows 11 for
all three shells and on macOS against a real ttyd; the media suites were also
run on Linux during development. Full-desktop `gdigrab` capture returned only
wallpaper on the test host; window-title capture worked.
