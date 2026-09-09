# Proof movie OS compatibility

**Date:** 2026-09-09

**Status:** Draft for Drew review

**Scope:** Platform compatibility for the movie skill proposed in [PR #2214](https://github.com/obra/superpowers/pull/2214). Implementation depends on that import or its final equivalent.

## Goal and agreed direction

The movie skill must cover the same OS families and execution environments as
Superpowers' visual brainstorming companion: macOS, Linux, native Windows, WSL,
and headless or remote operation. Windows users must be able to launch the movie
pipeline from PowerShell or Git Bash and record either shell. Native Windows
must not require WSL; the PowerShell movie workflow must not require Git Bash.

An agent should be able to record real software, assemble a narrated and
subtitled movie, inspect it, and apply the same verification criteria on every
supported environment. Native terminal recording is part of the initial scope.

Compatibility means equivalent outcomes, documented prerequisites, and tested
behavior. Capture methods can differ by OS and available display facilities.

## Evidence and baseline

This design uses local Superpowers commit `3a8bdc11` and PR #2214 head
`f6617db1517488d4a8b66925519d5ffbeef965b3` as its inspected baselines.

The companion's current implementation establishes these distinctions:

- [Browser launch](../../../skills/brainstorming/scripts/server.cjs) handles
  macOS, native Windows, WSL, Linux with a display, and Linux without a display.
- [Launch instructions](../../../skills/brainstorming/visual-companion.md)
  accommodate PowerShell tools by invoking Git Bash's `bash.exe`. The companion
  itself has a Bash launcher; this is not evidence of a separate PowerShell
  implementation or of operation without Git Bash.
- [Process startup](../../../skills/brainstorming/scripts/start-server.sh)
  accounts for foreground execution and Windows/MSYS PID incompatibility.
- [Windows lifecycle tests](../../../tests/brainstorm-server/windows-lifecycle.test.sh)
  exercise Git Bash behavior. [Browser launcher tests](../../../tests/brainstorm-server/browser-launcher.test.js)
  cover Windows, WSL, and headless Linux decisions, including treating URLs as
  arguments rather than shell commands.

These sources identify the required OS families. They do not establish an
exhaustive promise covering every OS release, CPU architecture, Linux
distribution, or desktop capture backend.

For the imported movie skill, all three shell regression suites were run on
macOS during this investigation: assembly 4/4, checker 9/9, narration drift 5/5.
These 18 assertions do not test actual speech generation, title-card rendering,
subtitle burning, or Windows execution. No Windows support is established by
those results.

Concrete compatibility gaps in the inspected import include Unix-only command
examples, a tmux-dependent terminal recipe, macOS-only desktop capture examples,
FFmpeg glob-dependent frame input, missing Windows browser discovery, and a
hand-built file URL that misencodes a Windows path. `burn-subtitles` also uses
only the subtitle basename without setting the working directory described in
its comment.

## Support contract

| Execution environment | Shells used to launch tools | Required movie routes | Desktop capture behavior |
| --- | --- | --- | --- |
| macOS | zsh and Bash | Browser motion, terminal, stills, real-run logs, full processing pipeline | Use available macOS capture with permission; inspect a sample before recording |
| Linux desktop | Bash; commands use portable POSIX syntax where applicable | Same routes and pipeline | Use an available capture backend for the active display; distinguish X11 from Wayland |
| Linux headless, container, or remote session | Bash | Headless browser and terminal capture, stills, logs, full processing pipeline | Detect absent display/capture access and choose a route that can prove the claim |
| Native Windows | Windows PowerShell 5.1, PowerShell 7, Git Bash | Same routes and pipeline; record native PowerShell and Git Bash sessions | Use a verified native capture backend, initially FFmpeg `gdigrab`, when a desktop is accessible |
| WSL | Linux shell using Linux tools | Same Linux routes and pipeline | WSL capture is scoped to its available display; Windows host desktop capture is a separate native Windows operation |

PowerShell 5.1 and 7 are separate invocation tests. Git Bash is a Windows shell
environment, not a synonym for WSL. Git Bash must invoke native Windows Python
and FFmpeg for its native Windows tests. WSL tests must invoke Linux tools.

Keep OS detection, launch-shell detection, recorded-shell selection, and display
capability separate. A PowerShell launcher may record Git Bash and vice versa.
Do not infer the recorded shell from the shell running the pipeline.

Do not introduce a Windows 11-only restriction solely because a test machine
runs Windows 11. Record exact OS, architecture, interpreter, browser, and tool
versions in validation results. Native terminal capture requires a compatible
Windows console API; ttyd documents ConPTY builds for Windows 10 1809 or later.
Other route prerequisites may set their own minimum versions.

Architecture compatibility is also a dependency check: do not assume that a
Python script or a Windows x64 wheel proves native ARM64 support. Required
validation starts with macOS arm64 and x64, Linux x64, and native Windows x64,
plus WSL on Windows. Record Linux arm64 and Windows arm64 dependency availability
and execution evidence before listing those combinations as verified. A missing
wheel is a reported route limitation, not an excuse to claim OS parity or
silently substitute a paid service.

## Approach and alternatives

Use the existing five Python tools as one shared pipeline, with small local
helpers where platform handling is reused. Keep shell differences in invocation
examples and adapters for recording real commands. Keep capture differences in
route documentation and its executable examples.

This preserves the scene file, narration manifest, offsets, subtitles, movie,
and checker output across operating systems. It also limits changes to the
skill being imported; no companion rewrite is required.

Two alternatives were considered:

- **Route all Windows work through WSL or Git Bash.** This does not satisfy the
  agreed native PowerShell workflow, and WSL cannot stand in for recording a
  native Windows terminal or application.
- **Maintain separate PowerShell and Bash pipelines.** This duplicates timing,
  subtitles, and verification behavior and makes platform drift likely. Both
  shells can invoke the same Python scripts explicitly.

## Shared pipeline

### Invocation and dependencies

Document `uv run --script` for all five extensionless tools. Retain existing
Unix shebang execution for compatibility. Examples set the skill directory using
the location supplied by the harness, rather than a Claude-specific install path.

```powershell
$SkillDir = 'C:\path to plugin\skills\proving-it-works-with-a-movie'
uv run --script "$SkillDir/scripts/assemble" scenes.yaml silent-cut.mp4
if ($LASTEXITCODE -ne 0) { throw 'Movie assembly failed' }
```

```bash
SKILL_DIR='/path to plugin/skills/proving-it-works-with-a-movie'
uv run --script "$SKILL_DIR/scripts/assemble" scenes.yaml silent-cut.mp4 || exit "$?"
```

PowerShell recipes must work under 5.1 without relying on PowerShell 7-only
operators. Bash syntax must be identified as Bash when it is not POSIX syntax.
All examples must preserve failure status across pipelines and logging.

Before a long recording, check prerequisites for the selected route: `uv`, a
compatible Python, FFmpeg/ffprobe and required codecs/filters, the chosen
browser, ttyd for terminal capture, and local narration/transcription packages
when requested. Check capabilities, not merely executable presence. Report
the missing capability and an appropriate install or alternate-route action.
There is no need for a new global installer or plugin-startup dependency check.

Use the tools already involved in the proposed import. Do not introduce a new
recording service, TTS service, global Node dependency, or Windows-only package
manager requirement. The import's dependency-policy exception remains a
maintainer decision associated with PR #2214; this spec does not grant one.

### Paths, encoding, and process arguments

- Resolve assets relative to the scene file and generated assets relative to
  the selected work directory. Preserve existing explicit output-path semantics.
- Use `Path.resolve().as_uri()` for browser file URLs. Browser discovery honors
  `--browser`, then checks platform installations and PATH, including Chrome and
  Edge on Windows and Chrome/Chromium on macOS and Linux.
- Use explicit UTF-8 for YAML, JSON, HTML, SRT, concat lists, and text evidence.
  Accept ordinary LF and CRLF text inputs and diagnose unreadable encodings.
- Pass external executable arguments as arrays. Avoid shell command strings for
  FFmpeg, browsers, or opening an artifact. User-requested shell commands belong
  only in the selected recorded shell.
- Keep MSYS path conversion at the launch boundary. Do not translate the same
  path twice or feed Bash pseudo-PIDs to native Windows process APIs.
- Support spaces, apostrophes, Unicode, and shell metacharacters in valid local
  paths. Exercise nested subtitle directories and work directories outside the
  current directory. Avoid requiring symlink privileges or POSIX tools such as
  `mktemp`, `shasum`, and `kill` for the PowerShell pipeline.

### Frame assembly and subtitles

Expand and sort frame filenames in Python. Feed FFmpeg a deterministic numbered
sequence staged in the work directory, using ordinary files without requiring
symlinks. Preserve the existing lexical ordering and frame rate. This replaces
the dependency on FFmpeg's optional glob support. Clean only staging files owned
by the current build and preserve source screenshots.

Write concat entries with FFmpeg-specific escaping and test native Windows
drive paths. File list syntax and filter syntax are separate from shell quoting.
Preserve the segment rule `max(narration duration, visual duration)` and measured
offsets; the port must not change timing or drop frames.

For subtitle burning, stage the SRT under a safe fixed basename in a temporary
directory and execute FFmpeg from that directory, with resolved input/output
paths. This avoids interpolating user filenames into the subtitle filter.
Clean staging on both success and failure. Verify the selected font actually
renders the sample text, using available platform fonts rather than assuming
DejaVu is installed everywhere.

Preserve the documented soft-subtitle fallback, with an accurate explanation of
why burning was unavailable. A burn failure with libass present must report the
actual failure rather than claim libass is missing. Full-platform acceptance
requires proving the hard-subtitle path with a capable FFmpeg build; a successful
soft fallback alone is insufficient. Continue shipping the SRT alongside the
movie for the existing checker contract.

### Narration and verification

Keep local Piper narration and local transcription available without a cloud
key on the verified support combinations. First-run model downloads must be
distinguished from subsequent offline operation. Check actual synthesis and
transcription, including subprocess interpreter selection and Unicode handling.

Do not make cloud credentials a Windows requirement. A missing local ASR must
remain visible in output and cannot count as a verified narration acceptance
run, even where the existing script permits a skip.

Preserve the existing verification thresholds, contact-sheet inspection,
subtitle checks, and requirement to compare rendered speech with its script.
Platform compatibility is not a reason to weaken a gate. Existing general
checker limitations remain limitations; redesigning its heuristics is outside
this work.

## Recording routes

### Browser and stills

Keep browser-driven recording as the common motion route. Select a compatible
browser explicitly or through discovery, use an isolated profile, preflight a
real screenshot, and retain cursor overlays and measured narration pacing.
Headless recording must work without opening a desktop browser. Distinguish
Playwright's own recording encoder, when that route is used, from system FFmpeg.

Use available harness browser automation or the documented recorder's browser
connection. The compatibility work does not create a new browser automation
framework. Navigation races must have bounded capture timeouts. Unexpected blank
output or stalled capture must not silently produce a successful recording;
intentional blank transition beats remain valid evidence.

### Terminal and TUI

Keep the existing ttyd/tmux route for Unix environments. Add a native Windows
route using ttyd's Windows console support and an explicitly selected PowerShell
or Git Bash executable. Native Windows must not require tmux, Docker, or WSL.

Drive the native terminal through browser keyboard input into the live ttyd
terminal. Provide an executable example inside the skill with explicit shell
selection, viewport, output location, and a short real command sequence. The
existing `examples/film-terminal.py` reference points outside the imported
files; replace it with an included, tested example or a correct included-file
reference. The standalone example is specific to a Docker/tmux demo and must
not be presented as a working native Windows recorder unchanged.

Command completion is a shell adapter responsibility. For scripted shell beats,
install a session-local completion marker containing a sequence identifier and
the real exit status, emitted only after the command returns. Observe the
terminal output stream, not OCR or guessed sleeps, for that marker, and distinguish
actual marker output from echoed command text. Keep instrumentation in the
recorded session; do not edit the human partner's shell profiles. Treat a failed
command as failed evidence even when logging succeeds. Preserve the shell's
normal semantics and record the exact command.

For interactive TUI beats, use explicit application state and key actions; do
not send another shell command while the TUI still owns input. Unknown state or
a completion timeout stops the take with a diagnostic. Validate delayed commands,
nonzero exits, an interactive TUI, resizing, and non-ASCII output in both recorded
Windows shells.

A recording session owns one terminal for the duration of its takes. Stopping a
take pauses capture without killing a long-running command; the same browser
connection and shell persist until the recording session ends. Browser
disconnect/reconnect persistence is not assumed. If the connection is lost and
the shell cannot be proven to survive, mark the take interrupted and report it.

### Desktop capture and real-run logs

Document device/capability selection per OS: macOS capture, native Windows
`gdigrab`, and supported Linux display capture. Detect the active display and
available FFmpeg devices before selecting a command. On Wayland, do not apply an
X11 recipe by default; use an available permission-aware capture route or switch
to browser/terminal recording. This work does not promise universal desktop
capture on every compositor or remote-session configuration.

Preflight by recording a short sample and examining its actual pixels. Permission
denial, blank capture, an unavailable remote desktop, or missing display must
produce an explicit route decision. A log reel can prove a real command run; it
cannot substitute for pixels when the claim is specifically native GUI behavior.
If the required claim cannot be captured, report it as unproven.

Provide Bash and PowerShell real-run log recipes that retain the command's exit
status, timestamps, and actual output. Use standard-library Python hashing or
equivalent native commands for evidence bundles. Retain source logs beside the
derived movie. Windows PowerShell 5.1 output encoding must be tested explicitly.

## Lifecycle and remote behavior

Match the companion's lifecycle principles without copying its Bash launcher:
run recorders under the harness's persistent/background execution mechanism,
report readiness after the real browser/terminal is reachable, and preserve the
session between agent tool calls. Avoid assuming detached `nohup` processes
survive in a Windows or managed-harness environment.

Own browser profiles, ports, temporary assets, and child process handles per
recording session. Bind terminal and debugging endpoints to loopback by default.
Readiness and command waits have explicit timeouts. On finish, interrupt, or
failure, stop and wait for owned processes and release resources; do not kill by
generic executable name or unverified stale PID. Ordinary users must be able to
run the workflow without elevated privileges.

Use the same distinction as the companion between a renderer and opening a
browser for the human partner. If a recorder needs to open a URL, use the OS
launcher with separate arguments; on WSL, Windows URL opening is a convenience,
not permission to pass Linux filesystem paths to Windows executables. With no
display, report the artifact path/URL and continue headless processing. Remote
browser access uses an explicit, documented access mechanism; remote deployment
or a new public tunnel service is outside scope.

## Implementation boundaries

Expected files are the five scripts under
`skills/proving-it-works-with-a-movie/scripts/`, small shared helpers if needed,
the skill's route documents, an included terminal recording example, and tests
under `tests/proving-it-works-with-a-movie/`. Add a focused platform support
reference and link it from `SKILL.md` rather than making every route repeat the
whole compatibility matrix.

Preserve scene kinds, manifest fields, offsets, CLI arguments, and output artifact
formats. Keep macOS and Linux entry points working. Do not bundle changes to
plugin hooks, the visual companion, unrelated skills, standalone-repo retirement,
or the movie checker's general behavior. No new harness integration is proposed.

Add a portable Python integration suite for the shared behavior. Shell launch
tests should be thin wrappers over the same fixtures and assertions. Preserve
existing regression coverage; replacing a Bash test requires equivalent coverage
in the portable suite. The suite must be runnable locally and on OS runners
without depending on a particular CI provider.

## Acceptance and evidence

| Area | Required proof |
| --- | --- |
| OS coverage | Actual runs on macOS, Linux, native Windows, and WSL; record exact environments and distinguish architecture coverage |
| Launch shells | Bash and zsh on macOS, Bash on Linux/WSL, Windows PowerShell 5.1, PowerShell 7, and Git Bash on native Windows |
| Shared pipeline | All scene kinds; measured scene offsets; hard and soft subtitles; checker verdicts and contact sheets |
| Paths | Spaces, apostrophes, Unicode, metacharacters, Windows drive paths, relative/absolute work directories, nested SRT files, LF/CRLF |
| Windows terminal | Both recorded shells; at least one crossed launch/record-shell combination; delayed command, failed command, TUI input, and retained session between takes |
| Native independence | PowerShell movie tools run with Git Bash and WSL unavailable to them; Git Bash native tests use Windows binaries |
| Local voice | Real no-key Piper synthesis and local ASR on macOS, Linux, and native Windows; repeat with cached models and network disabled |
| Capture failure | Blank frame, missing display, permission refusal, browser loss, and timeout produce accurate outcomes and no fabricated proof |
| Lifecycle | Survives a harness turn boundary; bounded shutdown after success, error, and interruption; unrelated sentinel process survives cleanup |
| Evidence integrity | Failed command remains failed through logging; missing required speech verification is reported; rendered content matches real actions |

The end-to-end fixture includes a small real browser app with a persistent state
change and a terminal sequence that prints Unicode, runs a delayed command, and
returns a nonzero status. Capture those actions, generate real local narration,
assemble title/image/frame/movie scenes, burn subtitles, run the checker, and
inspect the finished output. Include a terminal TUI take and an unnarrated
log-reel case. An intentionally failing command may be part of a successful
recording test: its logged status and narration must accurately show that failure.
Use synthetic clips for deterministic negative checker tests, clearly identified
as test fixtures.

Run the end-to-end pipeline from both Windows shell families. Cover PowerShell
5.1 and 7 with real launch tests; test the OS pipeline with actual executables,
not only mocked `sys.platform`. Optional display-specific tests may be skipped
only with a recorded reason and a separate result for the fallback route. A
missing prerequisite in a required acceptance job is a failure of that job's
setup, not a green compatibility result.

Skill instruction changes require `superpowers:writing-skills` and before/after
pressure testing across multiple agent sessions. Scenarios include a PowerShell
harness, a Git Bash harness, no cloud key, a path containing spaces, missing
libass, and headless/blocked capture. Check that agents select valid commands,
keep failures visible, and inspect the artifact. Store evals and transcripts in
the project's external eval repository; it is absent from this checkout, so
record its actual path and commit rather than assuming `evals/` is present.

Evidence records must include OS/architecture, shell, Python/uv, FFmpeg build,
browser, TTS/ASR versions, harness/model, command, return code, and artifact or
transcript location. Generated media need not be committed to core, but the
fixture and reproduction commands must be retained.

The design is ready for implementation after review. Compatibility is complete
only when the required matrix has evidence, the updated skill has behavior evals,
and the support documentation accurately distinguishes verified combinations
from dependency or display limitations.

## External references

- [uv explicit script invocation](https://docs.astral.sh/uv/reference/cli/#uv-run--script)
  supports extensionless Python scripts.
- [uv platform policy](https://docs.astral.sh/uv/reference/policies/platforms/)
  distinguishes tested platforms from build-only support; it is not a substitute
  for validating the rest of the movie toolchain.
- [FFmpeg image input](https://ffmpeg.org/ffmpeg-formats.html#image2)
  documents that glob input depends on build support.
- [FFmpeg Windows desktop capture](https://ffmpeg.org/ffmpeg-devices.html#gdigrab)
  documents desktop, region, and window capture.
- [ttyd Windows builds](https://github.com/tsl0922/ttyd/wiki/Compile-on-Windows)
  document native ConPTY support and its OS requirement.
- [Piper package files](https://pypi.org/project/piper-tts/#files)
  include Windows x64 builds; package availability alone is not a completed
  synthesis or transcription test.
