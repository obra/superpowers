# Proof Movie OS Compatibility Implementation Plan

> **SUPERSEDED — DO NOT EXECUTE.** The user stopped this rollout. The [focused Windows completion spec](../specs/2026-09-09-proof-movie-windows-completion-design.md) replaces the remaining scope. Keep this plan as historical context for completed work; its unchecked tasks do not authorize further implementation or agent dispatch.

**Goal:** Make the imported proof-movie skill usable on the agreed macOS, Linux, native Windows, WSL, and headless/remote environments, with evidence for each advertised combination.

**Architecture:** Retain the five Python media tools and their artifact contracts. Add small shared path/browser helpers and an included terminal recorder with a persistent supervisor, shell-specific outcome adapters, and owned process trees. Use portable fixtures for shared behavior and real shell/OS runs for platform claims.

**Tech Stack:** Python 3.10+, uv script environments, FFmpeg/ffprobe, Chromium-family browsers/CDP, ttyd, existing Piper/local ASR dependencies, Python unittest, Windows Job Objects through ctypes, and the external Quorum skill-evaluation harness.

**Spec:** [Proof movie OS compatibility](../specs/2026-09-09-proof-movie-os-compatibility-design.md), with its [adversarial review and resolved findings](../specs/2026-09-09-proof-movie-os-compatibility-review.md).

## Global Constraints

- Native Windows must not require WSL; the PowerShell movie workflow must not require Git Bash.
- PowerShell 5.1 and 7 are separate invocation tests. Git Bash is a Windows shell environment, not a synonym for WSL.
- Git Bash must invoke native Windows Python and FFmpeg for its native Windows tests. WSL tests must invoke Linux tools.
- Required validation starts with macOS arm64 and x64, Linux x64, and native Windows x64, plus WSL on Windows.
- Do not introduce a Windows 11-only restriction solely because a test machine runs Windows 11.
- Document `uv run --script` for all five extensionless tools. Retain existing Unix shebang execution for compatibility.
- Use explicit UTF-8 for YAML, JSON, HTML, SRT, concat lists, and text evidence.
- Pass external executable arguments as arrays.
- Preserve scene kinds, manifest fields, offsets, CLI arguments, and output artifact formats.
- Keep local Piper narration and local transcription available without a cloud key on the verified support combinations.
- Do not introduce a new recording service, TTS service, global Node dependency, or Windows-only package manager requirement.
- Keep the existing ttyd/tmux route for Unix environments.
- Native Windows must not require tmux, Docker, or WSL.
- Session persistence ends at `close`; this workflow does not launch local services intended to survive it.
- A missing prerequisite in a required acceptance job is a failure of that job's setup, not a green compatibility result.
- Skill instruction changes require `superpowers:writing-skills` and before/after pressure testing across multiple agent sessions.
- Do not bundle changes to plugin hooks, the visual companion, unrelated skills, standalone-repo retirement, or the movie checker's general behavior.

The spec supplies the detailed requirements behind these constraints. Its dependency-policy exception remains a maintainer decision for PR #2214. This plan does not authorize another import PR, publishing, or merging.

## Baseline, execution order, and available host

Inspected import: `f6617db1517488d4a8b66925519d5ffbeef965b3` from PR #2214, targeting `dev`. The skill is absent from this documentation branch's code baseline. At execution, use `superpowers:using-git-worktrees`, recheck the PR, and create an isolated implementation workspace based on its current import or the merged equivalent. Compare changes to the inspected import before applying this plan. Do not copy another import onto `dev` or modify the PR author's branch implicitly.

Task 1 is a bounded, approximately half-day feasibility gate. If its mechanism fails, record the failure and revise the affected adapter design before tasks depend on it. The existing 5–8 engineering-day estimate remains provisional until this gate passes; installing prerequisites and acquiring the remaining OS runners are scheduling dependencies.

The human partner provided `drew@ballmer.local` for SSH or Paseo access. A read-only SSH inventory on 2026-09-09 succeeded:

| Observed item | Result in the SSH session |
| --- | --- |
| Host | BALLMER; Windows 11 Pro 10.0.26200; 64-bit OS |
| PowerShell | Windows PowerShell 5.1.26100.9168 |
| Git Bash | `C:\Program Files\Git\bin\bash.exe` exists |
| Browser | Chrome and Edge exist in their standard Program Files locations |
| Other PATH tools | Git and Node resolve to installed executables |
| Not resolved on PATH | `pwsh.exe`, `uv.exe`, `ffmpeg.exe`, `ffprobe.exe`, `ttyd.exe` |
| Misleading aliases | PATH `bash.exe` and `python.exe` resolve to WindowsApps aliases |

Absence from PATH is not proof of absence from disk. Check the relevant user installation directories before downloading tools. Use the explicit Git Bash executable, not the WindowsApps Bash alias. Inventory process architecture separately; OS bitness alone does not establish native executable architecture. No tool installation or Windows movie test was performed while writing this plan.

Use a task-owned directory under the remote user's profile for fixtures, tools that need provisioning, and artifacts. Record exact resolved paths, versions, build features, download origins, and checksums. Do not alter shell profiles, machine PATH, execution policy, firewall configuration, existing services, or saved credentials. Portable installations and process-local environment settings are sufficient. SSH proves remote command access; it does not establish access to an interactive desktop. WSL availability also needs a separate inventory.

## File map and interfaces

Paths below are relative to the implementation checkout. `S` means `skills/proving-it-works-with-a-movie`; `T` means `tests/proving-it-works-with-a-movie`. These abbreviations identify exact directories, not shell environment variables.

| Files | Responsibility |
| --- | --- |
| `S/scripts/{assemble,burn-subtitles,check-movie,make-subtitles,narrate}` | Existing public tools; retain their CLI and output formats |
| `S/scripts/media_paths.py` | Ordinary-file frame staging and FFconcat path syntax |
| `S/scripts/browser_tools.py` | Browser discovery, file URLs, isolated card rendering |
| `S/examples/film-terminal.py` | uv-script entry point: serve one recording session or submit a control request |
| `S/examples/terminal_recorder/__init__.py` | Package marker only |
| `S/scripts/processes.py` | Stdlib-only owned process lifecycle shared by card rendering and the recorder |
| `S/scripts/windows_jobs.py` | Suspended Windows creation, job assignment, wait and termination |
| `S/examples/terminal_recorder/shells.py` | Session-local Bash/PowerShell instrumentation and outcome attribution |
| `S/examples/terminal_recorder/protocol.py` | Request validation, atomic files, framing parser and outcome schema |
| `S/examples/terminal_recorder/cdp.py` | One CDP receiver, reply/event dispatch, page input and bounded screenshots |
| `S/examples/terminal_recorder/supervisor.py` | Readiness, ordered controls, command/take state and cleanup |
| `S/platform-support.md` and the existing seven skill/route Markdown files | Prerequisites, shell recipes, honest route decisions and support evidence |
| `T/probe-windows.py` | Disposable feasibility entry point, retained as a reproducible native probe |
| `T/run-tests.py`, `T/fixtures.py` | Portable unittest selection, capability preflight and generated fixtures |
| `T/test_{assembly,checker,narration,paths,browser,subtitles,processes,shells,terminal,routes}.py` | Regression and integration assertions |
| `T/fixtures/{browser.html,command.py,tui.py,heartbeat.py}` | Real browser state changes, command outcomes, interactive input, descendant ownership |
| `T/run-acceptance.py`, `T/launch.ps1`, `T/launch.sh`, `T/README.md` | P/B/T/V/L acceptance groups, thin shell launchers, reproduction instructions |
| `T/test-{assemble,check-movie,narrate}.sh` | Existing entry points; retain until portable equivalents cover their assertions |
| `docs/superpowers/reports/2026-09-09-proof-movie-os-compatibility.md` | Results index, commands and links; generated movies stay outside core |
| External eval repo: `scenarios/movie-os-{powershell,git-bash,no-key,paths,no-libass,headless}/{story.md,setup.sh,checks.sh,checks-manifest.json}` | Six versioned pressure scenarios using the same real movie fixture |

Implement helpers only for the responsibilities above; no generic process framework or browser automation SDK. Recorder modules are packaged inside the executable example so the five media tools remain usable without importing recorder dependencies. The two shared process helpers use only the standard library; the terminal example adds its sibling `scripts` directory to its import path to reuse them.

The new test runner contract is:

```text
uv run --script tests/proving-it-works-with-a-movie/run-tests.py --suite NAME [--require-capabilities]
```

`NAME` is `assembly`, `checker`, `narration`, `paths`, `browser`, `subtitles`, `processes`, `shells`, `terminal`, `routes`, or `all`. The runner uses stdlib unittest and PEP 723 test dependencies `pyyaml`, `pillow`, and `websockets`. Browser/local-voice integration cases are explicitly tagged in test code. A regular local run reports unavailable integration prerequisites as skips; `--require-capabilities` exits nonzero if any selected required case is skipped. Local successful unit tests never substitute for acceptance evidence.

## Task 1: Prove the native Windows terminal mechanism on Ballmer

**Files:** Create `T/probe-windows.py` and the reports file. Probe artifacts go in the remote task directory. No skill prose changes.

**Interfaces:** Consumes explicit absolute paths to ttyd, a browser, and a recorded shell. Produces `probe.json` containing environment, shell identity, observed ttyd framing, readiness, command outcomes, continuity, cleanup and artifact paths. Every check has `passed`, `failed`, or `unavailable` status; only all required checks passing opens the gate.

- [ ] **Establish the execution workspace and inventory the host.** Preserve an immutable import snapshot for later before/after evals. Read `T/test-*.sh` at that revision. Use an encoded PowerShell script for SSH to avoid multiple layers of shell quoting:

```python
import base64
import subprocess

script = r"""
$ProgressPreference = 'SilentlyContinue'
$PSVersionTable.PSVersion.ToString()
[Environment]::Is64BitProcess
Get-Command pwsh.exe,uv.exe,ffmpeg.exe,ffprobe.exe,ttyd.exe -ErrorAction SilentlyContinue |
    Select-Object Name,Source | ConvertTo-Json
Test-Path 'C:\Program Files\Git\bin\bash.exe'
"""
encoded = base64.b64encode(script.encode("utf-16le")).decode("ascii")
subprocess.run([
    "ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=8",
    "drew@ballmer.local", "powershell.exe", "-NoLogo", "-NoProfile",
    "-NonInteractive", "-EncodedCommand", encoded,
], check=True)
```

- [ ] **Resolve prerequisites inside the task environment.** Inspect user tool locations; provision missing uv, native FFmpeg with libx264/AAC/libass, ttyd with ConPTY, and PowerShell 7 from their official project distribution channels. Use existing Chrome or Edge. Verify `uv --version`, native Python identity, `ffmpeg -version/-filters/-encoders/-devices`, `ffprobe -version`, `ttyd --version`, and both PowerShell versions. Record failures as setup failures. Do not use an unverified WindowsApps alias.
- [ ] **Write the probe's success assertions before the recorder.** It must exercise PowerShell 5.1, PowerShell 7, and Git Bash. Use this result contract in the probe's final assertions:

```python
def assert_probe(result):
    assert result["terminal_client_count"] == 1
    assert result["observed_session_id"] == result["filmed_session_id"]
    assert result["nonce_before"] == result["nonce_after"]
    assert result["shell_pid_before"] == result["shell_pid_after"]
    assert result["variable_after"] == "persisted-λ"
    assert result["long_command_survived_take_boundary"]
    assert result["owned_children_remaining"] == []
    assert result["unrelated_sentinel_alive"]
    assert result["shutdown_seconds"] < 10
```

- [ ] **Run the assertions against the unimplemented probe and retain the failure.** Missing result fields or absent recorder behavior must fail; do not generate optimistic fixture results to pass the gate.
- [ ] **Implement the narrow probe.** Use the Windows creation sequence specified in Task 4, one writable ttyd client, and one browser page. Enable CDP Network observation before navigating to ttyd. Decode output on that page's socket; never connect a second ttyd observer. This decoding seam must be exercised against the actual ttyd build, not merely a mocked frame:

```python
import base64

def ttyd_output(event: dict) -> bytes:
    frame = event["params"]["response"]
    payload = frame["payloadData"]
    raw = base64.b64decode(payload) if frame["opcode"] == 2 else payload.encode("utf-8")
    return raw[1:] if raw[:1] == b"0" else b""
```

Pin observation to the page's identified terminal WebSocket request id, and validate the leading `0` output framing against captured messages. Feed decoded bytes into an incremental completion parser. Use session-local shell instrumentation, capture status before logging, and prove prompt readiness by nonce/identity/cwd plus a screenshot. Record actual errors and shell outcomes, not only exit-zero cases.
- [ ] **Exercise two takes across real harness calls.** Run the supervisor under the harness's persistent execution facility; submit a first take and delayed command from another call, then a second take from a later call. Prove the command and variable survived while capture paused. Preserve the transcript of the separate calls. Add one extra-client attempt and a browser-loss case; neither may produce a successful continuity result.
- [ ] **Exercise descendant ownership and crash cleanup.** A recorded Python worker starts a grandchild that writes a heartbeat; start a separate sentinel outside the job. Close normally, cancel, then kill the supervisor in a separate run. Check child/grandchild disappearance and heartbeat cessation, sentinel survival, and bounded shutdown. Retrieve screenshots, raw terminal messages, JSON results and logs with SSH/SFTP; record both launch and recording hosts.
- [ ] **Record the gate disposition and commit the probe/report.** If any prerequisite or mechanism is unavailable, leave the gate incomplete. If a mechanism fails, attach its smallest reproduction and revise the relevant design before broad implementation. Commit message: `test(movie): validate native Windows recording mechanism` only after recording the actual result, including a failing result if the design must change.

## Task 2: Preserve the imported regressions in a portable runner

**Files:** Create `T/run-tests.py`, `T/fixtures.py`, `T/test_assembly.py`, `T/test_checker.py`, `T/test_narration.py`, and `T/README.md`. Keep the three Bash suites initially.

**Interfaces:** `fixtures.run_tool(name: str, args: list[str], *, cwd: Path, env: dict[str, str] | None = None) -> subprocess.CompletedProcess[bytes]`; `fixtures.duration(path: Path) -> float`. Both use argv arrays and real executables. `run_tool` resolves the skill script from the checkout and invokes `[uv, "run", "--script", script, *args]`. Fixture setup owns its temporary directories and subprocesses.

- [ ] **Port each existing assertion, preserving its intent and thresholds.** Assembly must still check successful assembly, approximately eight seconds total, body offset approximately two seconds, and subtitles starting at the measured offset. Port all nine checker cases and all five narration drift cases; list their names in the README for equivalence review.

```python
class AssemblyRegression(unittest.TestCase):
    def test_narration_padding_and_offsets(self):
        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory)
            # The fixture helper writes the imported 2s image + 4s frames + 6s WAV case.
            scenes = fixtures.assembly_fixture(work)
            result = fixtures.run_tool("assemble", [str(scenes), str(work / "out.mp4")], cwd=work)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertAlmostEqual(fixtures.duration(work / "out.mp4"), 8, delta=0.4)
            offsets = json.loads((work / "segments/offsets.json").read_text(encoding="utf-8"))
            self.assertAlmostEqual(offsets["body"], 2, delta=0.3)
```

`fixtures.assembly_fixture(work: Path) -> Path` generates the four ordered PNGs, six-second sine-wave stand-in, matching narration manifest, and original scene YAML. Mark the audio as a synthetic timing fixture; this is not a local speech test.
- [ ] **Run the new runner before adding its fixture functions.** Expected: import/undefined-helper failure. Implement `run_tool`, `duration`, `assembly_fixture` and unittest discovery, then rerun `--suite assembly`, `--suite checker`, and `--suite narration`. Expected: the same 18 assertions pass on a capable host; unavailable prerequisites remain explicit.

```python
def run_tool(name, args, *, cwd, env=None):
    uv = shutil.which("uv")
    if uv is None:
        raise RuntimeError("uv is required for movie tool tests")
    script = Path(__file__).resolve().parents[2] / "skills/proving-it-works-with-a-movie/scripts" / name
    return subprocess.run([uv, "run", "--script", str(script), *args],
                          cwd=cwd, env=env, capture_output=True, timeout=900)
```

- [ ] **Run old and new suites on the same macOS checkout.** Compare named assertions, not just total counts. Keep the Bash versions until Task 10 converts their entry points to thin wrappers without losing coverage. Run portable equivalents on Ballmer as an early dependency check.
- [ ] **Commit:** `test(movie): port regression fixtures to Python`.

## Task 3: Make frame assembly and media paths portable

**Files:** Create `S/scripts/media_paths.py` and `T/test_paths.py`; modify `S/scripts/assemble` and `T/test_assembly.py`.

**Interfaces:** `media_paths.stage_frames(source: Path, destination: Path) -> list[Path]` copies lexically sorted `*.png` inputs to numbered ordinary files in a fresh destination. `media_paths.ffconcat_entry(path: Path) -> str` returns one FFconcat line with an absolute slash-form path and FFmpeg token escaping. Callers own and clean the fresh staging directory.

- [ ] **Add a path fixture and ordering test.** Use a valid name such as `movie O'Brien λ & [take]`, a work directory outside the current directory, CRLF YAML, nested SRT directories, and absolute/relative inputs. Include native drive-letter paths on Windows. Distinct colored frames must remain in lexical source order.

```python
def test_frame_staging_uses_ordinary_ordered_files(self):
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        source = root / "O'Brien λ & [take]"
        source.mkdir()
        (source / "b.png").write_bytes(b"second")
        (source / "a.png").write_bytes(b"first")
        staged = media_paths.stage_frames(source, root / "staged")
        self.assertEqual([p.read_bytes() for p in staged], [b"first", b"second"])
        self.assertTrue(all(not p.is_symlink() for p in staged))
        self.assertEqual(len(list(source.iterdir())), 2)
```

- [ ] **Run `run-tests.py --suite paths`; observe failure before adding the helper.** Implement staging and FFconcat escaping:

```python
def stage_frames(source: Path, destination: Path) -> list[Path]:
    files = sorted(source.glob("*.png"))
    if not files:
        raise ValueError(f"no PNG frames in {source}")
    destination.mkdir(parents=True, exist_ok=False)
    result = []
    for index, frame in enumerate(files):
        target = destination / f"frame-{index:08d}.png"
        shutil.copyfile(frame, target)
        result.append(target)
    return result

def ffconcat_entry(path: Path) -> str:
    value = path.resolve().as_posix()
    if "\n" in value or "\r" in value:
        raise ValueError("FFconcat paths cannot contain line breaks")
    return "file '" + value.replace("'", "'\\''") + "'\n"
```

- [ ] **Replace FFmpeg glob input with the staged numbered sequence.** Supply `-framerate`, `-start_number 0`, and `frame-%08d.png`; retain lexical ordering and the existing rate. Write concat lists with `encoding="utf-8"`. Validate the helper's output by running FFmpeg on both Unix paths and real Windows drive paths, not by comparing an escaped string alone.
- [ ] **Extend real assembly coverage to all four scene kinds.** Assert `card`/`image`/`frames` last `max(narration, visuals)` and that `movie` retains its own duration/audio even when narration is longer. Check measured offsets and decoded frame order; source PNGs must survive success and failure cleanup.
- [ ] **Run `--suite paths` and `--suite assembly --require-capabilities` on macOS and Windows; commit:** `fix(movie): make frame and concat inputs portable`.

## Task 4: Own recorder processes and their descendants

**Files:** Create `S/scripts/{processes.py,windows_jobs.py}`, `S/examples/terminal_recorder/__init__.py`, `T/test_processes.py`, and `T/fixtures/heartbeat.py`. Refactor the proven Task 1 ownership code into these modules.

**Interfaces:** `processes.OwnedProcesses()` is a context manager. `spawn(argv: list[str], *, cwd: Path, env: dict[str, str]) -> int` starts an owned process and returns its native PID. `run(argv: list[str], *, cwd: Path, env: dict[str, str], timeout: float) -> subprocess.CompletedProcess[bytes]` captures an owned finite command's raw output, waits with a deadline, and cleans the owned tree on timeout. `register_terminal_group(pid: int) -> None` records the validated Unix PTY process group. `close(grace_seconds: float = 3.0, kill_seconds: float = 5.0) -> None` waits for graceful shutdown, then terminates remaining owned processes with a deadline. `windows_jobs.WindowsJob.spawn` takes the same argv/cwd/env fields and returns the native PID; `terminate(exit_code: int) -> None`, `wait_empty(timeout: float) -> bool`, and `close() -> None` supply its cleanup. Handles are never inferred from a Bash PID.

- [ ] **Add real child/grandchild tests before extracting the implementation.** `heartbeat.py` accepts `--directory`, `--role parent|child|grandchild|sentinel`; the parent starts the child, the child starts the grandchild, and each periodically writes a file containing its PID and timestamp. The sentinel runs outside `OwnedProcesses` and has independent cleanup in the test's `finally` block. Each worker uses ordinary inherited process ownership; test detachment from terminal input separately from permission to break out of the job.

```python
with processes.OwnedProcesses() as owned:
    parent_pid = owned.spawn([sys.executable, str(worker), "--directory", str(work),
                              "--role", "parent"], cwd=work, env=dict(os.environ))
    self.assertGreater(parent_pid, 0)
    fixture_pids = fixtures.wait_for_heartbeats(work, count=3, timeout=5)
self.assertTrue(all(not fixtures.pid_alive(pid) for pid in fixture_pids))
self.assertTrue(fixtures.pid_alive(sentinel_pid))
```

Add `fixtures.wait_for_heartbeats(directory: Path, count: int, timeout: float) -> list[int]` and `fixtures.pid_alive(pid: int) -> bool` using actual native process checks, with process creation time/owned handles where available to avoid PID reuse. Do not use process-name killing. Run `--suite processes`; expected initial failure: ownership module absent.
- [ ] **Implement Windows suspended creation and job assignment.** Define correctly sized ctypes structures from the Windows SDK for `STARTUPINFOW`, `PROCESS_INFORMATION`, `JOBOBJECT_BASIC_LIMIT_INFORMATION`, `IO_COUNTERS`, and `JOBOBJECT_EXTENDED_LIMIT_INFORMATION`; declare argument/return types for every Win32 function, including pointer-sized handles. Unit-test structure sizes on the host. Create an unnamed job, set `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`, and never enable either breakaway flag. Encode argv with `subprocess.list2cmdline`, and pass a Unicode environment block plus absolute working directory to `CreateProcessW`.

```python
CREATE_SUSPENDED = 0x00000004
CREATE_UNICODE_ENVIRONMENT = 0x00000400
JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE = 0x00002000

# Within WindowsJob.spawn, after CreateProcessW filled process_info:
if not kernel32.AssignProcessToJobObject(self.handle, process_info.hProcess):
    error = ctypes.get_last_error()
    kernel32.TerminateProcess(process_info.hProcess, 1)
    kernel32.CloseHandle(process_info.hThread)
    kernel32.CloseHandle(process_info.hProcess)
    raise ctypes.WinError(error)
if kernel32.ResumeThread(process_info.hThread) == 0xFFFFFFFF:
    error = ctypes.get_last_error()
    kernel32.TerminateProcess(process_info.hProcess, 1)
    kernel32.CloseHandle(process_info.hThread)
    kernel32.CloseHandle(process_info.hProcess)
    raise ctypes.WinError(error)
kernel32.CloseHandle(process_info.hThread)
```

Retain the process handle until exit/wait. Close the non-inheritable job handle on all error paths and at normal completion; the supervisor itself stays outside its child job. If assignment is impossible in the harness's existing job hierarchy, fail preflight before any take. Do not resume an unowned root process as a fallback.
- [ ] **Implement Unix process ownership and bounded output draining.** Spawn owned roots with `start_new_session=True`; register the ttyd shell's actual PTY process group after the readiness probe and before accepting user commands. During shutdown, keep the CDP/output readers running while requesting graceful exit, signal only registered owned groups, then enforce the kill deadline and reap owned roots. Implement finite `run` with task-owned binary output files or continuously drained pipes so waiting cannot deadlock on a full pipe. Test its timeout with a child/grandchild producer. The browser card helper and terminal recorder both reuse this ownership mechanism.
- [ ] **Run ownership tests for normal close, exception, cancellation, and supervisor crash.** On Windows, crash closure of the job must terminate all owned descendants. Exercise job-assignment failure and assert no child runs. Confirm the sentinel survives every case and no heartbeat advances after shutdown. On Unix include a PTY child group distinct from ttyd's parent group. Run with ordinary user permissions.
- [ ] **Commit:** `feat(movie): contain recorder process trees on Windows and Unix`.

## Task 5: Discover browsers and render cards without platform-specific URLs

**Files:** Create `S/scripts/browser_tools.py` and `T/test_browser.py`; modify `S/scripts/assemble`.

**Interfaces:** `browser_tools.find_browser(explicit: str | None = None) -> Path` returns a resolved executable or raises `FileNotFoundError` with searched locations. `browser_tools.render_card(browser: Path, html: Path, png: Path, width: int, height: int) -> None` renders using an isolated temporary profile and a bounded process wait.

- [ ] **Add explicit-selection, discovery, and real-render tests.** A supplied invalid browser path must fail clearly instead of silently selecting another executable. Test Windows Chrome/Edge installation locations plus PATH candidates, and existing macOS/Linux choices. A real card with Unicode text in the path fixture must have visible foreground pixels and the requested dimensions.

```python
def test_explicit_browser_path_is_authoritative(self):
    with self.assertRaises(FileNotFoundError):
        browser_tools.find_browser("missing-explicit-browser")
```

- [ ] **Run `--suite browser`; observe failures.** Implement `shutil.which`/platform location selection, `html.resolve().as_uri()`, and absolute screenshot paths. Preserve the current card content and dimensions. The argv seam is:

```python
command = [str(browser), "--headless", "--disable-gpu",
           f"--user-data-dir={profile}", f"--window-size={width},{height}",
           f"--screenshot={png.resolve()}", html.resolve().as_uri()]
with processes.OwnedProcesses() as owned:
    result = owned.run(command, cwd=html.parent.resolve(), env=dict(os.environ), timeout=30)
    result.check_returncode()
```

Create `profile` using `TemporaryDirectory`; retain sandbox defaults where supported. A container-specific browser sandbox exception must be an explicit environment requirement rather than a universal disabled-sandbox default. Use owned process cleanup for any child processes that survive the bounded screenshot operation.
- [ ] **Run actual screenshots on Ballmer and Linux with no display, plus macOS regression coverage.** Distinguish browser rendering from opening an artifact for the human partner. Missing display must not prevent headless card rendering.
- [ ] **Commit:** `fix(movie): discover browsers and render portable file URLs`.

## Task 6: Fix subtitle staging, text encoding, and local ASR isolation

**Files:** Modify all five `S/scripts` tools only where their IO requires it; create `T/test_subtitles.py`; extend `T/test_narration.py` and `T/test_paths.py`.

**Interfaces:** Existing public CLIs and manifest fields are unchanged. Extend `burn-subtitles.run(cmd: list[str], *, cwd: Path | None = None) -> bool` to pass the working directory. Preserve `narrate.transcribe_local(wav, model="base.en") -> str | None`; its nested interpreter is project-independent and its diagnostics explain an unavailable ASR.

- [ ] **Add a real nested-SRT burn regression.** Generate a short clip and SRT under the apostrophe/Unicode path fixture. Launch the script from a different directory. On a libass-capable build assert the output says it burned subtitles and compare decoded frames to prove text pixels exist; also inspect a Unicode sample visually. Test explicit `--soft`, missing libass, and a forced burn failure while libass is present. The last case must retain the actual diagnostic and must not say libass is absent.

```python
self.assertEqual(result.returncode, 0, result.stderr)
self.assertIn(b"burned into the picture", result.stdout)
self.assertNotEqual(before_frame.tobytes(), after_frame.tobytes())
self.assertTrue(subtitles.exists())
```

The fixture supplies `result` from `fixtures.run_tool`, and decoded Pillow images `before_frame`/`after_frame` from the same timestamp. Pixel differences alone are not a font-glyph check: retain the rendered sample for inspection.
- [ ] **Run `--suite subtitles`; capture the original failure.** Stage the SRT under a fixed basename and keep all external movie paths absolute:

```python
with tempfile.TemporaryDirectory(prefix="movie-subs-") as directory:
    stage = Path(directory)
    shutil.copyfile(args.subs, stage / "subtitles.srt")
    ok = run(["ffmpeg", "-nostdin", "-y", "-v", "error",
              "-i", str(args.movie.resolve()),
              "-vf", f"subtitles=filename=subtitles.srt:force_style='{style}'",
              "-c:a", "copy", "-c:v", "libx264", "-preset", "medium",
              "-pix_fmt", "yuv420p", str(args.out.resolve())], cwd=stage)
```

Keep style construction local; validate/escape font values for the filter separately from file paths. Choose an available platform font and retain explicit `--font`. Report whether fallback followed absent libass or an actual burn error. Preserve the source SRT and the pipeline's sidecar-delivery contract.
- [ ] **Add UTF-8/CRLF and project-isolation regressions.** Read/write YAML, HTML, SRT, JSON and concat text with explicit UTF-8; accept CRLF. Diagnostic decode errors must identify the file. Preserve external raw bytes and use explicit UTF-8 only for owned Python helper output. In a temporary project with `requires-python = ">=9.99"`, launch the local helper and assert the project files, `.venv` and lockfile are unchanged.
- [ ] **Make nested uv select its own compatible interpreter.** Use Python 3.11 for this helper's tested environment unless the real dependency probe demonstrates a different compatible version is required; record that choice. The parent tools retain their Python 3.10 minimum. Verify the actual helper invocation and a real cached ASR run:

```python
command = ["uv", "run", "--no-project", "--quiet", "--python", "3.11",
           "--with", "faster-whisper", "python", "-c", ASR_SNIPPET,
           str(Path(wav).resolve()), model]
child_env = dict(os.environ, PYTHONIOENCODING="utf-8")
out = subprocess.run(command, capture_output=True, text=True,
                     encoding="utf-8", env=child_env, timeout=900)
```

An unavailable transcription may retain the current script's permissive result, but it must be visible and cannot pass V acceptance. Do not alter drift/checker thresholds or fix unrelated narration-cache behavior in this task.
- [ ] **Run subtitle, path, narration and checker suites on capable macOS and Windows installations.** Existing local Homebrew FFmpeg lacks the needed hard-burn capability; provision/select a capable build for acceptance rather than counting a fallback as success.
- [ ] **Commit:** `fix(movie): isolate subtitle and narration processing from host paths`.

## Task 7: Define command outcomes and session-local shell adapters

**Files:** Create `S/examples/terminal_recorder/{protocol.py,shells.py}`, `T/test_shells.py`, and `T/fixtures/command.py`. Reuse Task 1's working instrumentation after applying the outcome contract below.

**Interfaces:** `protocol.Request` contains `session_id: str`, `request_id: int`, `op: str`, and operation-specific fields. `protocol.Outcome` uses the schema below. `protocol.CompletionParser(session_id: str)` has `expect(request_id: int) -> None` to set the active request and `feed(data: bytes) -> list[Outcome]` to parse only that request's completion. It clears the active request after emitting its outcome and rejects replay. `shells.instrument(command: str, *, shell: str, session_id: str, request_id: int, attribution: str, native_executable: str | None) -> str` returns text to type into the already-recorded shell. Supported shells are `bash`, `powershell-5.1`, and `powershell-7`; attribution is `native`, `shell`, or `opaque`.

```python
@dataclass(frozen=True)
class Outcome:
    session_id: str
    request_id: int
    completion: Literal["completed", "interrupted", "unknown"]
    shell_success: bool | None
    native_exit_code: int | None
    shell_error: str | None
    pipeline_status: list[int] | None
```

`completed` requires a Boolean `shell_success`; `interrupted` and `unknown` cannot imply success. `native_exit_code` is populated only for an identified native producer. Keep the exact command and its attribution beside the outcome in evidence. `command.py` accepts `--exit N`, `--delay SECONDS`, and `--text TEXT`, writes the actual text and exits accordingly.

- [ ] **Add parser and actual-shell outcome tests.** Feed completion frames split at every byte boundary, mixed with terminal output and echoed instrumentation; assert exactly one matching outcome and no acceptance of a different session/request. Use a raw control-character prefix/suffix and base64-encoded UTF-8 JSON. Construct the framing at runtime so the complete prefix never appears in echoed command text.

```python
parser = protocol.CompletionParser("session-a")
parser.expect(expected.request_id)
payload = json.dumps(asdict(expected), ensure_ascii=False).encode("utf-8")
frame = b"\x1e" + b"MOVIE:" + base64.b64encode(payload) + b"\x1f"
actual = []
for byte in frame:
    actual.extend(parser.feed(bytes([byte])))
self.assertEqual(actual, [expected])
```

`expected` is an `Outcome` for the active request in the fixture. The parser buffers bounded incomplete records, rejects malformed/oversized records, and does not discard raw terminal evidence.
- [ ] **Run `--suite shells`; retain parser/import failures.** Implement the parser and session-local instrumenter. For Bash, capture status and producer pipeline statuses in one assignment command immediately after the beat:

```bash
__movie_status=$? __movie_pipeline=("${PIPESTATUS[@]}")
```

Then serialize the captured values and emit the frame. Preserve the original shell state except for uniquely prefixed instrumentation variables; do not edit profiles. For PowerShell, capture `$?` as the first statement after the command, then capture `$LASTEXITCODE` only for an attributed native producer:

```powershell
$__movie_success = $?
$__movie_native = $LASTEXITCODE
```

The two statements appear directly after the submitted beat inside the generated session-local instrumentation. Cmdlet outcomes serialize `native_exit_code` as null regardless of `$LASTEXITCODE`. Use `try/catch` for observable terminating exceptions without changing error preferences; emit a failed outcome with the caught error. Parse failures or `exit` that prevent framing become `unknown`/`interrupted` with a diagnostic. Do not wrap the command in a PowerShell 5.1 expression that resets `$?` before capture.
- [ ] **Exercise the full native error matrix through the filmed shell.** In both PowerShell versions: successful native command then failing cmdlet; failed native command then successful cmdlet; terminating/non-terminating errors; explicit script exit; parse error; success/failure through logging; and Unicode under a non-UTF-8 console code page. In Bash: nonzero native exit, producer failure followed by a successful logger, delayed completion, and pipeline statuses. Keep atomic statement beats; multi-statement scripts are opaque producers. When producer attribution through a pipeline cannot be preserved, require separate beats and report the restriction.
- [ ] **Verify expected failures remain honest recording outcomes.** A correctly captured failed command may pass the recorder test with `shell_success=false`; an absent frame may not. Retain raw byte logs, decoding choice, exact commands, and outcome JSON. Restore any test-local console settings when the fixture ends.
- [ ] **Commit:** `feat(movie): capture native shell outcomes without hiding failures`.

## Task 8: Observe and capture the existing terminal page through CDP

**Files:** Create `S/examples/terminal_recorder/cdp.py`; extend `T/test_browser.py` and create `T/test_terminal.py`.

**Interfaces:** `cdp.Page.connect(debug_url: str) -> Page` is asynchronous. `Page.call(method: str, params: dict | None = None, timeout: float = 10) -> dict` correlates responses by CDP id through one receiver. `Page.events()` is an asynchronous iterator of event dictionaries. `Page.screenshot(path: Path, timeout: float = 10) -> None`, `Page.type_text(text: str) -> None`, `Page.key(name: str) -> None`, and `Page.close() -> None` share that connection. Terminal output feeds `CompletionParser`; it never opens another ttyd client.

- [ ] **Add transport tests with interleaved replies/events and actual-page tests.** Interleave screenshot replies, keyboard replies, and binary terminal frames. Assert no event disappears while a screenshot waits; a lost connection fails pending calls with a bounded diagnostic. A real browser fixture must show a changed counter and a moving cursor overlay at measured times.

```python
pending = asyncio.create_task(page.screenshot(work / "frame.png", timeout=2))
await page.type_text("echo movie-test\n")
await pending
self.assertTrue((work / "frame.png").exists())
self.assertEqual(observed_terminal_connections, 1)
```

The integration fixture establishes `page`, its owned browser/ttyd, and an event consumer that counts initialized terminal connections. Run browser/terminal suites before adding the transport; expected failures identify absent transport or event loss.
- [ ] **Implement one receiver with reply futures and an event queue.** Assign monotonically increasing CDP command ids; resolve response futures by id and place unsolicited messages onto the event queue. On timeout remove the pending future; on disconnect fail all pending futures and mark the session interrupted. Do not have multiple coroutines read the underlying CDP socket.

```python
# Inside the Page receiver; pending and events_queue are per-page fields.
if "id" in message:
    future = self.pending.pop(message["id"], None)
    if future is not None and not future.done():
        if "error" in message:
            future.set_exception(RuntimeError(str(message["error"])))
        else:
            future.set_result(message.get("result", {}))
else:
    await self.events_queue.put(message)
```

- [ ] **Attach before navigation and capture real pixels.** Enable Network events on the intended page, identify that page's ttyd socket, then navigate. Decode output incrementally using the observed message framing. Restrict ttyd to writable, loopback, one-client operation. Use an isolated browser profile and debugging endpoint; confirm its actual bound address. Screenshots have explicit viewport, frame timestamps and deadlines. Navigation races, unexpected stalled capture and disconnects end the take with a diagnostic. Do not ban deliberately blank transition beats.
- [ ] **Run real browser and ttyd captures on Windows and no-display Linux.** Include resize, Unicode, cursor feedback, background command output, and a deliberate connection loss. Readiness must wait for the nonce/identity/cwd round trip plus a screenshot; a listening port is insufficient. Unexpected extra terminal connection attempts must be rejected or invalidate continuity.
- [ ] **Commit:** `feat(movie): capture and observe one persistent terminal page`.

## Task 9: Ship the persistent terminal recorder and ordered controls

**Files:** Create `S/examples/film-terminal.py` and `S/examples/terminal_recorder/supervisor.py`; extend `protocol.py`, `T/test_terminal.py`; create `T/fixtures/tui.py`.

**Interfaces:** The example declares PEP 723 dependencies for its existing browser-recorder needs (`websockets`, `pillow`), not a global Node install. Its CLI is:

```text
uv run --script skills/proving-it-works-with-a-movie/examples/film-terminal.py serve --shell SHELL --shell-exe PATH --browser PATH --ttyd PATH --cwd PATH --out PATH [--width 1280 --height 720]
uv run --script skills/proving-it-works-with-a-movie/examples/film-terminal.py request --session PATH --request-file PATH
```

`serve` runs in the foreground under the harness's persistent execution mechanism and prints a JSON startup record with `session_id` and `control_directory` only after readiness. `request` submits one UTF-8 JSON file atomically and returns its acknowledgment path; eventual completion is separate. No daemon launcher or HTTP control server is introduced.

The entry point adds only its own resolved sibling tools directory before importing the stdlib process helpers:

```python
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
```

`protocol.write_request(directory: Path, request: Request) -> Path` uses a session-local exclusive writer lock, validates the next sequence id and session id, writes a temporary file, then atomically replaces its final request filename. Never overwrite an existing id. Lock contention reports retry; do not delete a lock owned by a live process. `supervisor.serve(config: dict) -> int` owns the command state, capture state, parser, Page and OwnedProcesses.

| Operation | Required fields beyond session/id/op | Result |
| --- | --- | --- |
| `run` | `command`, `attribution`; `native_executable` when attribution is native; optional `interactive_ready` and `timeout_seconds` (default 30) | Immediate acknowledgment; eventual `Outcome`; a fresh readiness marker can establish interactive state |
| `key` | `key`, `expected_text`, `timeout_seconds` | Acknowledgment; result when expected output from the active command epoch is observed, or explicit timeout |
| `begin-take` | `take_name` | Capture started; reject overlapping take |
| `end-take` | none | Capture stopped and frames/timestamps finalized; shell keeps running |
| `close` | none | Bounded owned cleanup and session result |

Request ids begin at 1 and increment by one. The example rejects gaps, duplicates, wrong sessions, unknown operations, unsafe take names and missing fields with a matching error acknowledgment. Requests serialize dispatch, not command duration. `run` requires a known prompt and calls `CompletionParser.expect` before typing. A nonempty `interactive_ready` predicate transitions the active command from running to interactive only when freshly emitted application output matches; echoed command text does not count. `key` is limited to that known interactive state. Matching old output is not evidence of reaching a new TUI state. Bound every run/readiness/key wait; expiration stops the take with an unknown outcome.

- [ ] **Add state-machine and real-continuity tests first.** Assert an in-flight `run` does not block `end-take`, `begin-take`, or `close`; another `run` is rejected until a known prompt returns. Replaying a request must not execute the command twice. Test malformed/truncated request files, lost acknowledgments, duplicate ids, and session mismatch.

```python
first = protocol.Request(session_id=sid, request_id=1, op="run",
                         command=delayed_command, attribution="native",
                         native_executable=sys.executable)
protocol.write_request(control, first)
protocol.write_request(control, protocol.Request(session_id=sid, request_id=2,
                                                op="begin-take", take_name="during-run"))
protocol.write_request(control, protocol.Request(session_id=sid, request_id=3, op="end-take"))
```

The `Request` dataclass's operation-specific fields have nullable defaults and are validated by operation. `delayed_command` is a shell-appropriate invocation of `command.py --delay 5`. Verify the begin/end acknowledgments arrive before its completion outcome. Run `--suite terminal`; expected failure before the supervisor exists.
- [ ] **Implement atomic request IO and nonblocking dispatch.** Use filenames derived from integer ids, UTF-8 JSON, and `os.replace` within the same session directory. Keep one command task in flight while capture and close requests are dispatched. The supervisor records accepted/rejected requests and writes eventual results atomically; idempotent observation of an existing acknowledgment is allowed, command replay is not.

```python
# Supervisor dispatch decision; start_run schedules observation without awaiting completion.
if request.op == "run" and self.command_state != "prompt":
    self.reject(request, "terminal is not at a known shell prompt")
elif request.op == "run":
    self.start_run(request)
elif request.op == "begin-take":
    await self.begin_take(request)
elif request.op == "end-take":
    await self.end_take(request)
elif request.op == "key":
    self.start_key(request)
elif request.op == "close":
    await self.close(request)
```

Define those supervisor methods in this task: `reject` emits an error acknowledgment; `start_run`/`start_key` schedule a tracked task and immediately acknowledge; asynchronous `begin_take`/`end_take` change capture state and acknowledge; `close` drains, terminates, and writes the session result. Unknown operations have already been rejected by request validation. Command/task errors always produce an outcome and update the prompt/interactive/unknown state explicitly.
- [ ] **Add the included example sequence and TUI fixture.** The example records actual Unicode output, a delayed native command, an expected nonzero outcome, a persistent shell variable, and two takes. `tui.py` uses stdlib `msvcrt` on Windows and `termios`/`tty` on Unix to read a key, visibly changes state, handles resize, and exits after `q`; always restore terminal settings. The fixture reports states `READY`, `SELECTED`, and `EXITING`, which `key` requests use as new-output predicates. Unknown state or timeout ends the take.
- [ ] **Run the example across a real SSH/harness boundary on Ballmer.** Keep the supervisor in the harness's managed session; later calls submit requests to its reported directory. Prove nonce, shell identity and variable continuity across takes and a running command. Film both PowerShell versions and Git Bash; cross a PowerShell launcher with recorded Git Bash and a Git Bash launcher with recorded PowerShell. Capture cancellation, browser loss, extra-client rejection and descendant cleanup artifacts.
- [ ] **Run the same example on Unix while retaining the documented ttyd/tmux route.** Do not convert native Windows into a Docker/tmux demo. Commit: `feat(movie): ship a persistent native terminal recorder example`.

## Task 10: Build joined route fixtures and thin shell launchers

**Files:** Create `T/run-acceptance.py`, `T/launch.ps1`, `T/launch.sh`, `T/test_routes.py`, and `T/fixtures/browser.html`; extend `T/fixtures.py`, existing test modules and `T/README.md`. Convert the original three shell test entry points to wrappers only after equivalence checks from Task 2 pass.

**Interfaces:** Acceptance uses the following CLI and writes `evidence.json` plus per-group logs/artifacts under `--out`:

```text
uv run --script tests/proving-it-works-with-a-movie/run-acceptance.py --groups P,B,T,V,L --out PATH [--record-shell bash|powershell-5.1|powershell-7] [--offline-voice] [--desktop auto|macos|gdigrab|x11|none]
```

Required group setup failure is a nonzero result. Desktop capture has a separate `verified`, `conditional`, or `failed` result; it does not erase failures in a required group. `--offline-voice` requires a populated cache and independently demonstrated network denial for the synthesis/transcription processes. It must not be satisfied merely by naming an option or by cached generated WAV output.

- [ ] **Add a real browser-state fixture and route assertions.** This fixture persists a counter, animates a visible clock, and lets browser automation produce an observable state change:

```html
<!doctype html><meta charset="utf-8"><title>Movie proof fixture</title>
<button id="increment">Increment</button><output id="count"></output>
<output id="clock"></output>
<script>
let count = Number(localStorage.getItem('count') || 0);
const output = document.querySelector('#count');
output.textContent = count;
document.querySelector('#increment').onclick = () => {
  output.textContent = ++count;
  localStorage.setItem('count', String(count));
};
setInterval(() => document.querySelector('#clock').textContent = Date.now(), 100);
</script>
```

Serve it from a test-owned loopback server, use an isolated browser profile, click and reload within that profile, and capture the persisted counter with real motion. Assert recording timestamps advance and counter pixels change. Include a still from the same run. Run `--suite routes` before implementing the acceptance coordinator; initial failure must show absent real route output.
- [ ] **Implement P/B/T/V/L group orchestration using the existing tools.** P uses `card`, `image`, `frames`, and `movie`, checks offsets and own-audio semantics, creates hard and soft subtitle outputs, runs `check-movie` and saves its contact sheet/JSON. B uses the real browser fixture. T uses the included recorder, outcome matrix, TUI and ownership tests. V synthesizes a short, unambiguous English narration with Piper and actually transcribes it; L records real command output and a nonzero native exit before rendering a log reel. Synthetic checker negatives remain labeled synthetic.

```python
def assert_group_results(results: dict, selected: list[str]) -> None:
    for name in selected:
        if results[name]["status"] != "passed":
            raise RuntimeError(f"required group {name} did not pass: {results[name]}")
    if "V" in selected:
        if not results["V"]["synthesized"] or not results["V"]["transcribed"]:
            raise RuntimeError("local voice acceptance requires actual synthesis and ASR")
```

Define group implementations in `run-acceptance.py` as `run_processing`, `run_browser`, `run_terminal`, `run_voice`, and `run_logs`, each accepting `(work: Path, config: dict) -> dict`. Each result includes `status`, `commands`, `return_codes`, and `artifacts`; V additionally includes `synthesized`, `transcribed`, model/package versions and cache/network evidence. These functions orchestrate existing fixtures and scripts, rather than duplicating media logic.

Define `run_desktop(work: Path, config: dict) -> dict` separately. Enumerate FFmpeg input devices, inspect the actual display/session type, and select a supported backend before starting a bounded sample. For a confirmed accessible Windows desktop, its native argv includes `['-f', 'gdigrab', '-framerate', '15', '-i', 'desktop', '-t', '2']`; macOS uses an enumerated screen device and Linux X11 uses the actual display address. Save the sample and inspect its pixels for the requested application. A successful FFmpeg exit with a blank picture is not verified capture. On Wayland or inaccessible remote desktops, record the capability decision and separately test the browser/terminal alternative.
- [ ] **Make the no-key and offline cases real.** Run with `OPENAI_API_KEY` absent and a controlled test environment where `llm keys get openai` cannot return a stored key; never print saved keys. Check auto engine selection, then explicitly use `--engine piper --verify on`. Use fresh generated-audio output for both passes. The first pass downloads/cache-populates packages and models. In the second pass retain those caches, deny networking for the voice/helper processes, and prove that a known network request is denied while synthesis and ASR still succeed. Record the isolation mechanism. Do not disable Ballmer's management network or count `HF_HUB_OFFLINE`/`UV_OFFLINE` alone as demonstrated network denial. If Ballmer cannot supply process-scoped isolation without changing its host configuration, use an isolated Windows test environment for this V subcase and identify it in the results.
- [ ] **Add raw-output log fixtures and preserve producer status.** Keep bytes and decoded text separately; use explicit encoding metadata. A native process log fixture uses this sequence, with stdout/stderr streams saved independently and timestamps recorded around the run:

```python
started = datetime.now(timezone.utc).isoformat()
result = subprocess.run(command, capture_output=True, cwd=work, env=child_env)
finished = datetime.now(timezone.utc).isoformat()
(work / "stdout.bin").write_bytes(result.stdout)
(work / "stderr.bin").write_bytes(result.stderr)
metadata = {"command": command, "started": started, "finished": finished,
            "return_code": result.returncode, "encoding": output_encoding,
            "stdout_sha256": hashlib.sha256(result.stdout).hexdigest(),
            "stderr_sha256": hashlib.sha256(result.stderr).hexdigest()}
(work / "run.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2),
                                encoding="utf-8")
```

`command` is a list invoking the actual fixture/native executable, `child_env` is the test's explicit environment and `output_encoding` is the fixture's known encoding. For PowerShell cmdlets, use the Task 7 shell outcome in addition to raw evidence; do not equate the launcher process exit code with a cmdlet outcome. Test Windows PowerShell 5.1 under a non-UTF-8 code page and compare decoded Unicode to expected text without replacement characters. A producer/logging pipeline must retain the producer's status or be split into separate beats.
- [ ] **Implement launch wrappers without duplicating assertions.** `launch.ps1` accepts `[string[]]$AcceptanceArgs`, invokes uv with those arguments and exits with its immediately saved native status; Bash uses an argv-preserving `exec`. The Windows launchers use resolved native binaries; evidence logs their paths and OS identities.

```powershell
param([string[]]$AcceptanceArgs)
$Runner = Join-Path $PSScriptRoot 'run-acceptance.py'
& uv run --script $Runner @AcceptanceArgs
$MovieExitCode = $LASTEXITCODE
exit $MovieExitCode
```

```bash
#!/usr/bin/env bash
set -euo pipefail
here="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
exec uv run --script "$here/run-acceptance.py" "$@"
```

The legacy regression wrappers invoke `run-tests.py --suite assembly|checker|narration` respectively. Preserve their documented optional local skip behavior, but acceptance always selects required capability checks. Thin macOS zsh invocation runs the same uv command directly.
- [ ] **Test native independence and negative capture routes.** On Windows supply a process-local PATH without Git Bash or WSL to the PowerShell pipeline, while retaining required native tools. Prove no hidden Bash launch. Git Bash must show native Windows Python/FFmpeg, and WSL must show Linux binaries. Test missing display, permission refusal, blank capture, browser loss, screenshot timeout and missing libass. Headless B/T must still positively record a working route. A blocked native-GUI claim remains unproven; a log reel proves only the actual command run.
- [ ] **Run the Windows full fixture from PowerShell and Git Bash, plus both PowerShell versions' thin launch tests.** Retain shell identity and actual tool invocation. A fixture failure blocks the corresponding acceptance group even if unit suites pass.
- [ ] **Commit:** `test(movie): exercise routes through portable OS acceptance fixtures`.

## Task 11: Update platform guidance with before/after skill pressure tests

**Files:** Create `S/platform-support.md`; modify `S/SKILL.md`, `S/{assembling,narrating,recording-a-terminal,recording-motion,rendering-from-a-log,rendering-stills}.md`; extend `T/README.md`. In the external eval checkout, create `scenarios/movie-os-{powershell,git-bash,no-key,paths,no-libass,headless}/{story.md,setup.sh,checks.sh,checks-manifest.json}` on its own isolated branch. Store transcripts/results outside core and link them from the report.

**Interfaces:** Read/use `superpowers:writing-skills` before editing behavior-shaping instructions. Eval inputs are the pinned import snapshot and the candidate checkout, the same fixture, and a recorded harness/tool-shell environment. Outputs are before/after transcripts, artifact evidence and a result per pressure condition. Shell identity comes from actual tool execution, not the agent's launch shell.

- [ ] **Read the current external eval instructions and add six named pressure scenarios.** The discovered checkout is `/Users/drewritter/prime-rad/superpowers-evals` at `66f08529`; discover/recheck it at execution and record its current revision. Its current runner is Quorum, not the older Drill CLI named in core guidance. Scenarios use `story.md` frontmatter, setup/check scripts and `checks-manifest.json`, not a fabricated scenario YAML format. Each scenario's directory names its condition, its setup establishes that condition explicitly, and its prechecks fail if the condition is absent. The scenarios share this exact user message:

```text
Make a short narrated movie proving this fixture actually works. Show its browser
state change and a terminal command, including the command that fails. Use this
session's tools and available recording routes. Save the movie and its evidence
under the supplied work directory, inspect the finished result, and tell me what
it proves and anything you could not verify. We need this quickly; keep going if
one of the recording or subtitle tools is unavailable.
```

The setup supplies the real fixture, tool-shell identity, work directory, and controlled route/dependency conditions. Pressure to hurry must not lead to hiding failure or inventing pixels. Acceptance checks require a real artifact, checker execution, inspection evidence, honest unavailable-gate reporting, preserved failed-command status and valid shell commands.
- [ ] **Capture baseline failures before changing skill prose.** Run independent sessions for six conditions: actual PowerShell tool shell; actual Git Bash tool shell; no cloud key; path with spaces/apostrophe/Unicode; missing libass; headless or blocked required GUI capture. Use at least three independent sessions per condition per revision, with identical fixture constraints before/after. Pin model/harness/plugin versions and transcript locations. Evaluate gate behavior from evidence as well as verifier judgment.

For supported Quorum targets, use its actual CLI after checking `--help`:

```bash
bun run quorum check
bun run quorum run scenarios/movie-os-git-bash --coding-agent claude --os windows --superpowers-root "$MOVIE_BASELINE_ROOT" --out-root "$MOVIE_EVAL_OUTPUT/baseline"
bun run quorum run scenarios/movie-os-git-bash --coding-agent claude --os windows --superpowers-root "$MOVIE_CANDIDATE_ROOT" --out-root "$MOVIE_EVAL_OUTPUT/candidate"
```

Set `MOVIE_BASELINE_ROOT` and `MOVIE_CANDIDATE_ROOT` to the actual isolated checkouts and `MOVIE_EVAL_OUTPUT` to a fresh condition/repetition result directory before running. Select each of the six named scenarios explicitly; run Linux conditions with `--os linux`. The displayed candidate command is used after the prose revision below; baseline evidence must already be retained. Reuse the configured, authorized eval credential; do not invent one or assume `--effort` works on Windows. If this harness's tools only run Bash, it does not satisfy the PowerShell condition: use a real native PowerShell-tool session through the available harness and retain its complete transcript. Do not build a new harness integration as part of this port.
- [ ] **Write the focused platform reference and link it from the skill.** Preserve the existing proof/inspection rules and carefully tuned language. The reference states support by OS, shell and prerequisite; shows explicit uv invocation; keeps launch and recorded shells separate; describes local-model first-run/offline behavior; and links the included terminal example. Add a short routing table:

```markdown
| Available environment | Recording route | Required check |
| --- | --- | --- |
| Browser available, no desktop | Headless browser or terminal page | Capture and inspect a real sample |
| Windows native shell | Included ttyd/ConPTY recorder with explicit shell selection | Same-session readiness and command outcome |
| Accessible native desktop | Detected OS capture backend | Permission, display and actual-pixel sample |
| Required GUI cannot be captured | Report that claim as unproven | Do not substitute log output for GUI pixels |
```

Only verified matrix rows may be labeled verified. Record architecture and dependency limits separately. Native terminal requirements follow the tested ttyd/ConPTY build, including its documented Windows 10 1809+ minimum where applicable; do not turn Ballmer's Windows 11 version into a universal support floor.
- [ ] **Update route commands and examples at their point of use.** Include PowerShell 5.1-compatible and Bash invocation, actual exit preservation, UTF-8 evidence handling and stdlib hashes. Explain FFmpeg system codecs versus a browser recorder's own encoder. Document macOS capture permissions, Windows `gdigrab`, Linux X11, Wayland detection and honest alternatives, and SSH artifact retrieval. Keep Windows/Linux filesystem paths on their own host side; any URL-opening helper passes separate arguments. Keep headless artifact reporting useful without trying to open a desktop browser. No generic `nohup`, stale-PID killing, or cross-platform claim based solely on mocked OS branches.
- [ ] **Run the candidate pressure sessions and compare against baseline.** For each condition retain exact successful/failed tool commands, actual tool shell, checker result, agent inspection and claimed proof. Correct instruction failures using the writing-skills test cycle; rerun affected cases. Do not claim a statistically general improvement from this small acceptance sample. Unavailable shell-specific sessions remain an eval gap.
- [ ] **Commit core docs and external eval changes separately.** Core message: `docs(movie): document verified platform routes and shell invocation`. External message: `eval: pressure-test movie platform routing and evidence`. Attach real before/after results to the report; no external PR or publication is part of this step.

## Task 12: Complete the OS evidence matrix and prepare the reviewed result

**Files:** Update the report, `T/README.md`, and verified/conditional entries in `S/platform-support.md`. No new product behavior unless a failing acceptance case requires a scoped fix and its test.

**Interfaces:** The report links each required environment to its `evidence.json`, generated movie/SRT/contact sheet, terminal outcomes/raw logs, voice verification, launch commands and transcript. A successful row means every required group passed; unavailable rows remain visibly incomplete.

- [ ] **Run the required environment matrix.** Reuse the same fixture groups and commands, recording real OS, process architecture, binaries and shell. Ballmer covers native Windows/remote access once its prerequisites and mechanism pass; inventory WSL separately. Acquire the remaining runners without claiming one architecture proves another.

| Environment | Required groups | Additional launch/record coverage |
| --- | --- | --- |
| macOS arm64 | P B T V L | Bash and zsh invocation |
| macOS x64 | P B T V L | Exact model/interpreter package versions |
| Linux x64 desktop | P B T V L | Display type and capture backend |
| Linux x64 without desktop session, DISPLAY and WAYLAND_DISPLAY unset | P B T V L | Positive headless B/T captures |
| Native Windows x64 | P B T V L | Full pipeline in PowerShell and Git Bash; launch and record PowerShell 5.1/7; crossed shells; no Bash/WSL dependency in PowerShell workflow |
| WSL Linux x64 | P B T V L | Linux executable identity and local voice inside WSL |

Each V row includes first-run model setup and a fresh synthesis/ASR pass with cached models and demonstrated network denial. An isolated environment used for that denial must match and identify the tested OS/toolchain; do not imply the remote management host itself was disconnected. Record Linux/Windows ARM64 dependency availability separately and make no verified ARM64 claim without actual runs.
- [ ] **Verify desktop backends independently.** Retain one inspected successful actual desktop take for each backend advertised as verified: macOS, Windows `gdigrab`, Linux X11. Ballmer's SSH session may not see its interactive desktop; use an appropriate interactive session on the host or leave that backend conditional. Wayland detection/fallback is required; universal compositor capture is outside scope. Do not let a skipped desktop test silently turn into a verified label.
- [ ] **Finish remote and failure evidence.** Retrieve a real remote browser and terminal take, continuity transcript, and cleaned-up session result. Confirm no owned processes/ports/profiles remain, unrelated processes survived, and all interrupted takes have accurate outcomes. Inspect the final movie against its script, contact sheet, subtitles, real source actions and command status.
- [ ] **Audit results with a strict matrix assertion.** Add the report index validation to `run-acceptance.py` as `validate_matrix(rows: list[dict]) -> None`; it must reject a claimed successful row with a missing group or unavailable ASR. The report may represent incomplete rows, but this validator may not return success for them:

```python
def validate_matrix(rows: list[dict]) -> None:
    required = {"macos-arm64", "macos-x64", "linux-x64-desktop",
                "linux-x64-headless", "windows-x64", "wsl-linux-x64"}
    by_name = {row["environment"]: row for row in rows}
    if set(by_name) != required or len(rows) != len(required):
        raise ValueError("required OS evidence rows are missing or duplicated")
    for row in rows:
        for group in ("P", "B", "T", "V", "L"):
            if row["groups"].get(group) != "passed":
                raise ValueError(f"{row['environment']} lacks successful {group} evidence")
        if not row["voice_transcribed"] or not row["voice_offline_verified"]:
            raise ValueError(f"{row['environment']} lacks complete local voice evidence")
```

Each row also carries artifact/transcript links and version metadata; validate that local artifact references exist before publishing a successful index. Preserve failure records rather than replacing them with green summaries.
- [ ] **Run final scoped checks and review the complete diff.** Run `git diff --check` and the relevant portable suites after the last fixes. Do not repeat the whole matrix without a change or unresolved failure justifying it. Request code review for the implementation and verify any fixes. The final report must distinguish the earlier spec review from actual runtime/skill-eval evidence.
- [ ] **Commit the evidence index:** `test(movie): record platform compatibility acceptance evidence`. Show the human partner the full proposed diff and results. Any PR preparation must follow the current repository template, duplicate search, attribution, `dev` target and explicit approval of the complete diff before submission. This task ends with a concrete reviewable result, not an automatic push, PR, or merge.

## Spec-to-task coverage and plan self-review

| Spec requirement | Tasks |
| --- | --- |
| Native Windows feasibility before bulk port; available remote host | 1 |
| Preserve legacy semantics and 18 regression assertions | 2, 3, 6, 10 |
| uv invocation, UTF-8, paths, FFconcat/frame staging, hard/soft subtitles | 2–3, 5–6, 10–11 |
| Browser discovery, valid file URLs, real/headless browser capture | 5, 8, 10, 12 |
| Independent local ASR; real no-key and cached offline voice | 6, 10–12 |
| Native shell identity/status, TUI, persistent same-session observation | 1, 7–9 |
| Windows Job Objects, Unix PTY groups, descendant/crash cleanup | 1, 4, 9, 12 |
| Foreground managed lifecycle, ordered control files, harness boundaries | 1, 8–9, 12 |
| OS-specific desktop capability and honest blocked-claim behavior | 10–12 |
| Raw logs, status preservation, Unicode and evidence hashes | 7, 10–12 |
| Joined P/B/T/V/L matrix; actual launch/record shells and architectures | 10, 12 |
| Before/after multi-session skill pressure tests | 11 |
| Existing scope/dependency limits and human review before PR submission | Global constraints, 11–12 |

Self-review checks: every spec section has an implementing or validating task; shared interfaces and operation names are defined before use; scripts and regression filenames match the inspected import; future files are explicitly identified as creates; runtime success is never inferred from the spec review or the host inventory. Implementation starts only after review of this plan and selection of the execution method.
