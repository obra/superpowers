# Native Windows feasibility gate — Task 1

The bounded mechanism gate passed on Ballmer under an actual Medium-integrity ordinary-user token for PowerShell 5.1, PowerShell 7 and Git Bash: **40/40 checks**, including 27 command-outcome cases. That evidence belongs to commit `49bc2932857071896fb764688594709a1b494eaa`; the cleanup error-path correction below has separate verification. This is a feasibility probe, not the bulk OS port. The TUI result uses the controller-approved same-page snapshot checkpoint; general capture freshness and resize/redraw decoding remain required production work.

Public implementation: [probe-windows.py](../../../tests/proving-it-works-with-a-movie/probe-windows.py). Focused ownership tests: [test-probe-cleanup.py](../../../tests/proving-it-works-with-a-movie/test-probe-cleanup.py). These files and this index remain in Git after the temporary SDD workspace is removed. Generated frames, screenshots and archives are outside core and currently retained at the locations below; durable evidence consolidation is pending.

## Actual environment and prerequisites

Launch host was `workerbee` (macOS); recording host was `ballmer`, Windows 11 Pro 10.0.26200, native x64. This observation does not impose a Windows 11-only production requirement. Remote task root is exactly `C:\Users\drew\movie-os-task1-20260909`. Existing Chrome and Git Bash were reused after inventory. Portable prerequisites, cache and test directories are task-owned; machine PATH, profiles, firewall, credentials, services, account membership and management networking were not changed.

| Tool | Observed version | Executable relative to task root unless absolute |
| --- | --- | --- |
| Python | CPython 3.12.14, win32 AMD64, 64-bit pointers | `tools\python\cpython-3.12.14-windows-x86_64-none\python.exe` |
| uv | 0.12.12, c4be69153 | `tools\uv\uv.exe` |
| PowerShell 5.1 | 5.1.26100.9168 | `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe` |
| PowerShell 7 | 7.6.6 | `tools\pwsh\pwsh.exe` |
| Git Bash | 5.3.9(1)-release, Git 2.54.0.windows.1 | `C:\Program Files\Git\bin\bash.exe` |
| ttyd | 1.7.7-40e79c7, PE x64 | `tools\ttyd.exe` |
| Chrome | 152.0.7977.65 | `C:\Program Files\Google\Chrome\Application\chrome.exe` |
| FFmpeg/ffprobe | 9.0.1-essentials_build-www.gyan.dev | `tools\ffmpeg\ffmpeg-9.0.1-essentials_build\bin` |
| CDP client | websocket-client 1.9.0 | uv script environment |

The [prerequisite inventory](../../../.superpowers/sdd/2026-09-09-proof-movie-os-compatibility/task-1-evidence/remote/prerequisites.json) retains argv, stdout/stderr, exit codes and executable hashes. Native FFmpeg exercised libx264, AAC and subtitles/libass support. Git Bash invoked native Windows Python and FFmpeg explicitly.

| Retained download origin | Actual SHA256 |
| --- | --- |
| [uv 0.12.12](https://github.com/astral-sh/uv/releases/download/0.12.12/uv-x86_64-pc-windows-msvc.zip) | `3d54912924c36e862c14f427d04f2ed70a99e8001d1c30caa101f6d5711626d5` |
| [PowerShell 7.6.6](https://github.com/PowerShell/PowerShell/releases/download/v7.6.6/PowerShell-7.6.6-win-x64.zip) | `02fe458be20493fbdf43f61ea20610b811ee6c738ab1676c61b9cfcd1a33c860` |
| [ttyd 1.7.7](https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.win32.exe) | `e33a27501b10b96981335bcba938b1145c7f52551a343e72160f00ab71832b37` |
| [Gyan FFmpeg release essentials](https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip) | `fec81ae03971d9dd4be3ebe02e263bd2ec1d789483f931bdba5f5715e65da2e9` |
| [Astral CPython 3.12.14, 20260901](https://github.com/astral-sh/python-build-standalone/releases/download/20260901/cpython-3.12.14%2B20260901-x86_64-pc-windows-msvc-install_only_stripped.tar.gz) | `7c45c9622400d578709a9b2cddbe8124cc21d382409d9f13406d706d28e31b14` |
| [websocket-client 1.9.0 wheel](https://files.pythonhosted.org/packages/34/db/b10e48aa8fff7407e67470363eac595018441cf32d5e1001567a7aeba5d2/websocket_client-1.9.0-py3-none-any.whl) | `af248a825037ef591efbf6ed20cc5faa03d3b47b9e5a2230a529eeee1c1fc3ef` |

The download records and checksums are in [downloads.jsonl](../../../.superpowers/sdd/2026-09-09-proof-movie-os-compatibility/task-1-evidence/remote/downloads.jsonl); the portable files remain under the remote `downloads` and `tools` directories. The FFmpeg project [links the Gyan Windows distribution](https://ffmpeg.org/download.html).

SSH itself ran as High-integrity `ballmer\drew`; those early results remain elevated. Its linked-token query failed with Win32 1312. Acceptance instead ran in existing desktop Paseo terminal `1496200b-5545-4d85-af31-d01df72a3c11`, `movie-standard-user-probe`, desktop session 1. Every acceptance supervisor independently recorded `ballmer\drew`, elevation type 3, elevated false, integrity SID `S-1-16-8192`, Administrators deny-only. Full token evidence is in each session report. No High-integrity result substitutes for ordinary-user acceptance.

## Bounded observations

The same Chrome page enables CDP Network observation before navigation, identifies its own ttyd socket, and supplies command input, output observation and recording. Native children are created suspended, assigned to an unnamed non-inheritable kill-on-close Windows Job, then resumed. There is no unowned-root fallback. The supervisor and unrelated sentinel remain outside that Job; Win32 ownership uses retained handles and creation times, never Git Bash's MSYS PID as a native PID.

Two separate harness calls started and ended takes around a still-pending 45-second command, then verified the same shell PID/nonce and `persisted-λ`. Actual columns were **217 → 167** in all three Medium sessions; earlier elevated runs were 218 → 167. Completion payload lines are bounded to **60 base64 characters**. Truncated framing produced no record, damaged framing no successful record; browser loss produced interrupted/null success. This is not arbitrary resize/redraw decoding.

All 27 command cases retained actual status attribution. A ParseException can coexist with raw PowerShell `$? = true`; `raw_shell_success` remains separate from request-attributed `parse_error=true` and semantic `shell_success=false`. The Bash logging pipeline retained `[7,0]` and producer exit 7. Extra ttyd clients were refused with EOF, and the original page still completed a nonce/PID round trip. Browser loss retained Win32 10054 and interrupted outcomes.

| Cleanup, seconds | PowerShell 5.1 | PowerShell 7 | Git Bash |
| --- | --- | --- | --- |
| Normal | 1.890 | 1.859 | 1.875 |
| Cancellation | 1.984 | 1.984 | 2.047 |
| Browser loss | 0.063 | 0.047 | 0.047 |
| Supervisor crash | 0.250 | 0.250 | 0.203 |

These original successful paths checked parent/child/grandchild heartbeats, retained process-handle exit, stopped heartbeats and sentinel survival followed by scoped sentinel cleanup. The final original audit checked 609 PID/creation-time observations and found no remaining original processes, distinguishing reused PIDs. The review nevertheless found an error-path leak, addressed below.

The accepted TUI JPEG is `interactive/000009.jpg` in each `tui-verified-*` directory. Implementer, reviewer and controller inspected active-take pixels showing `Native Windows TUI λ` and `[q] Finish this screen`, while run request 2 remained pending and before `q` request 4. The explicit same-page `snapshot` request 3 occurred after application readiness. [Pixel inspection metadata](../../../.superpowers/sdd/2026-09-09-proof-movie-os-compatibility/task-1-evidence/remote/active-tui-pixel-inspection.json) preserves hashes and timing.

| TUI event, epoch seconds | PS5.1 | PS7 | Git Bash |
| --- | --- | --- | --- |
| Application ready | 1788994874.380406 | 1788994874.7009904 | 1788994874.6822324 |
| Snapshot request 3 | 1788994875.4311693 | 1788994875.854709 | 1788994875.7615943 |
| Inspected JPEG received | 1788994875.7732553 | 1788994875.8755016 | 1788994875.7821376 |
| q request 4 | 1788994875.9168005 | 1788994876.04243 | 1788994875.9338365 |

CDP trace proves the receiver continued draining/acknowledging during the ready-file wait/hold: 12/9/7 received events, 8/8/8 timeout polls and 4/3/2 acknowledged screencast frames. Some final-run TUI frames preceded the checkpoint, so this does not establish why earlier takes stalled or claim the snapshot alone caused a redraw. Acceptance is scoped to the inspected checkpoint method.

## Retained failures and corrections

- With the same ttyd binary, Job and CDP page, initial `startup-*` sessions disconnected without output. Adding explicit `ttyd -w <session-directory>` made `cwd-*` readiness pass. Upstream [ttyd PR 1502](https://github.com/tsl0922/ttyd/pull/1502) initializes command-line/cwd pointers to NULL; that supports the prerequisite without establishing the internal cause of our failure. No error 123 was observed in our ttyd log.
- The probe's initial PowerShell prompt separately raised `InvokeMethodOnNull` because its error baseline was unset. Initializing and guarding the baseline corrected this; original and corrected evidence is retained separately from ttyd's cwd prerequisite.
- Original Git Bash completion framing wrapped at 218 columns and ConPTY duplicated a character at a cursor repositioning boundary. Raw `outcomes-gitbash/network.jsonl` and `terminal.bin` retain the failure. Bounded multiline framing corrected the tested dimensions without adding a VT emulator.
- Earlier active TUI takes lacked the TUI pixels despite a successful command and end PNG; a one-second hold still failed in PowerShell. `standard-normal-powershell51`, `standard-tui-*` and `tui-diagnostic-*` preserve those failures. The live PNG alone was never accepted instead of the active-take assertion.
- Original handle-exit timing and transient heartbeat access failures are retained in elevated `session-v2-*` and `final-powershell7`. Bounded waits/retries corrected those observed cases; persistent access failures remain errors, motivating the review fix below.

## Review fix: cleanup evidence failures

Review of `49bc2932` found that snapshot, heartbeat or pending-result errors could escape before owned-resource cleanup. The correction protects evidence collection, always attempts terminal/Job release, gives the outside-job sentinel an independent finalizer, records stage-specific diagnostics, and returns failure when evidence is missing or reporting fails. An unknown process snapshot is `null`, not an empty successful ownership observation.

The first actual Medium RED run occurred before the cleanup edit: snapshot, persistent heartbeat and pending-result failures each left three owned workers and the sentinel alive. Terminal-close failure left three workers alive, although its sentinel was already released; report-write failure escaped after resources exited. The normal base-source case released resources but returned `None`, failing only the new boolean result contract. Thus 0/6 is not a claim that all six scenarios leaked. Independent verifier teardown happened only after these observations were captured.

A strengthened test replaced the synthetic post-release job error with native `TerminateJobObject` access denied (Win32 5), retaining real kill-on-close handle release. It again produced 0/6 against the unchanged base source, then **6/6 against the fix**, actual test-process exit 0. Each injected failure returned false, kept `normal_cleanup=failed`, preserved diagnostics and left no owned processes or sentinel alive. The successful fixture returned true. All cases independently recorded Medium SID `S-1-16-8192`, elevated false, elevation type 3, session 1.

| Focused GREEN case | Cleanup seconds | Retained diagnostic stages |
| --- | --- | --- |
| Snapshot failure | 0.422 | `snapshot`; ownership snapshot remains null |
| Persistent heartbeat access failure | 0.484 | `heartbeats_before`, `heartbeats_after`, `heartbeats_verify` |
| Pending-result write failure | 0.468 | `pending_reply` |
| Terminal failure plus native Job termination failure | 0.468 | `terminal_close`, `job_close` |
| Final report write failure | 0.469 | `report_write`; absent report is not accepted |
| Successful native ownership fixture | 0.453 | None |

A fresh real ttyd/Chrome PowerShell 5.1 session under Medium closed in **2.891 seconds**, cleanup passed, supervisor launcher exit 0. A second real Medium session deliberately created a directory at its final `probe.json` path before close. The actual native replace failed with Win32 5; the supervisor exited **1**, stderr/stdout retained `report_write`, and the summary marked cleanup failed. An independent observer retained 19 native process handles before close (including supervisor and sentinel), verified all signaled, and checked stopped worker heartbeats. The remaining `probe.tmp` is an unsuccessful pre-error write, not a canonical passing report. No unrelated 27 outcome cases or 18 imported baseline assertions were rerun in this fix round.

| Focused evidence | Result |
| --- | --- |
| [Initial pre-edit RED](../../../.superpowers/sdd/2026-09-09-proof-movie-os-compatibility/task-1-evidence/remote/fix-round1-red/cleanup-tests.json) | Expected 0/6, test process exit 1 |
| [Native-fault RED against base](../../../.superpowers/sdd/2026-09-09-proof-movie-os-compatibility/task-1-evidence/remote/fix-round1-red-native/cleanup-tests.json) | Expected 0/6, exit 1 |
| [GREEN ownership cases](../../../.superpowers/sdd/2026-09-09-proof-movie-os-compatibility/task-1-evidence/remote/fix-round1-green/cleanup-tests.json) | 6/6, exit 0; SHA256 `58c687f146fdb5063892dc0de1157d6f9915a4a11be3eb412dc5298b147e48a7` |
| [Successful live close](../../../.superpowers/sdd/2026-09-09-proof-movie-os-compatibility/task-1-evidence/remote/fix-round1-live-powershell51/probe.json) | Cleanup passed, launcher exit 0 |
| [Live report failure observer](../../../.superpowers/sdd/2026-09-09-proof-movie-os-compatibility/task-1-evidence/remote/fix-round1-live-report-failure-powershell51/failure-exit-observation.json) | Supervisor exit 1, failed cleanup, released resources |
| [Fix-round archive](../../../.superpowers/sdd/2026-09-09-proof-movie-os-compatibility/task-1-evidence/evidence-fix-round1.zip) | 265 files, 3,473,557 bytes; SHA256 `e22564f54e7bde79de3e2ea904ccab9d0faffa825c17f1e80c0beb78ff69ffab` |

New probe SHA256: `b7f8a47bb09c9d4ed08642f8292df34a51b78a3040e0d6a3798a76286405ce90`. Focused test SHA256: `d85988949955a4f67fcc724a81c616b7f3e57c819f0a314632ab89355b4c89d1`. The initial RED test snapshot, hash `05c92c9ddfa9a4e05615634f9cbe80798f04856e994b3302ee7ad73decd6d20c`, is retained separately. The fix archive is also at `C:\Users\drew\movie-os-task1-20260909\evidence-fix-round1.zip`; exact new remote session directories are `evidence\fix-round1-{red,red-native,green}`, `evidence\fix-round1-live-powershell51` and `evidence\fix-round1-live-report-failure-powershell51`.

An intervening SSH/SCP reset prevented the initial fix upload/submission before execution. A bounded read-only `hostname` retry succeeded; the unchanged remote base-source hash was verified before upload. These transport failures are separate from runtime test outcomes. No host/network repair was attempted. The task terminal remains available; probe resources have been released.

## Reproduction and artifact index

Run the following in a native **Medium-integrity** PowerShell terminal after copying the public probe and focused test beside the task-owned prerequisites. Choose new output directories; the probe refuses unsafe reuse. These are explicit argument arrays/paths, not PATH changes.

```powershell
$taskRoot = 'C:\Users\drew\movie-os-task1-20260909'
$python = "$taskRoot\tools\python\cpython-3.12.14-windows-x86_64-none\python.exe"
$uv = "$taskRoot\tools\uv\uv.exe"
$probe = "$taskRoot\probe-windows.py"
$env:UV_PYTHON_INSTALL_DIR = "$taskRoot\tools\python"
$env:UV_CACHE_DIR = "$taskRoot\cache"
$env:UV_NO_CONFIG = '1'
$env:PYTHONIOENCODING = 'utf-8'
& $python "$taskRoot\test-probe-cleanup.py" --directory "$taskRoot\evidence\cleanup-reproduction"

& $uv run --python $python --script $probe --serve --ttyd "$taskRoot\tools\ttyd.exe" --browser 'C:\Program Files\Google\Chrome\Application\chrome.exe' --shell 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe' --shell-kind powershell51 --directory "$taskRoot\evidence\session-reproduction" --launch-host workerbee
```

Keep `--serve` alive. In separate harness calls with the same task environment, run the phases below against that directory. `first` returns while its command is still pending; invoke `second` before the 45 seconds elapse. For PS7 or Git Bash use their absolute executable above and matching `--shell-kind powershell7` or `gitbash` on every invocation. `second` also completes the interactive take, including the approved snapshot checkpoint. Separate fresh sessions exercise `cancel` and `browser-loss` instead of `close`.

```powershell
& $uv run --python $python --script $probe --phase first --shell-kind powershell51 --directory "$taskRoot\evidence\session-reproduction"
& $uv run --python $python --script $probe --phase second --shell-kind powershell51 --directory "$taskRoot\evidence\session-reproduction"
& $uv run --python $python --script $probe --phase prepare-cleanup --shell-kind powershell51 --directory "$taskRoot\evidence\session-reproduction"
& $uv run --python $python --script $probe --phase close --shell-kind powershell51 --directory "$taskRoot\evidence\session-reproduction"
```

For standalone TUI reproduction, start a fresh `--serve` session using a new directory such as `$taskRoot\evidence\interactive-reproduction`. In a separate harness call, invoke `--phase interactive` with that directory and the matching shell kind, then run `prepare-cleanup` and `close` against the same fresh session. Do not invoke `interactive` after `second` in an existing session: both create the take named `interactive`, and the probe refuses to reuse its directory.

Actual Medium launch commands were submitted through the already installed matching CLI, `C:\Users\drew\AppData\Local\Programs\Paseo\resources\bin\paseo.cmd terminal send-keys 1496200b-5545-4d85-af31-d01df72a3c11 '<encoded PowerShell command>' Enter --json`. SSH transport remained High; the daemon-owned terminal supplied the Medium token. The exact UTF16LE commands, launch scripts, subprocess argv and outputs are preserved as `*-submit-command.json`, `*-launch.ps1`, `*-launcher.json` and named stdout/stderr files, not inferred from this example.

Local temporary evidence root is `.superpowers/sdd/2026-09-09-proof-movie-os-compatibility/task-1-evidence/`; `remote/` mirrors remote `C:\Users\drew\movie-os-task1-20260909\evidence`. Links below currently target that ignored workspace. They will cease to resolve after SDD deletion unless evidence is consolidated first; source and this report remain reviewable independently.

| Evidence | Contents |
| --- | --- |
| [Aggregate](../../../.superpowers/sdd/2026-09-09-proof-movie-os-compatibility/task-1-evidence/remote/probe.json) | Original 40 passed checks; per-session unrelated checks remain unavailable |
| [Main archive](../../../.superpowers/sdd/2026-09-09-proof-movie-os-compatibility/task-1-evidence/evidence-final.zip) | 2,323 files, 160,448,403 bytes; outcomes, continuity, ownership, prerequisites and original failures |
| [Capture supplement](../../../.superpowers/sdd/2026-09-09-proof-movie-os-compatibility/task-1-evidence/evidence-capture-final.zip) | 650 files, 23,823,967 bytes, overlapping earlier artifacts; accepted TUI pixels/traces |
| [PS5.1 active TUI JPEG](../../../.superpowers/sdd/2026-09-09-proof-movie-os-compatibility/task-1-evidence/remote/tui-verified-powershell51/interactive/000009.jpg) | Inspected while request 2 pending, before q |
| [PS7 active TUI JPEG](../../../.superpowers/sdd/2026-09-09-proof-movie-os-compatibility/task-1-evidence/remote/tui-verified-powershell7/interactive/000009.jpg) | Same acceptance method |
| [Git Bash active TUI JPEG](../../../.superpowers/sdd/2026-09-09-proof-movie-os-compatibility/task-1-evidence/remote/tui-verified-gitbash/interactive/000009.jpg) | Same acceptance method |
| [Original process audit](../../../.superpowers/sdd/2026-09-09-proof-movie-os-compatibility/task-1-evidence/remote/final-process-audit.json) | 609 PID/creation-time observations, no remaining original processes |

Main archive SHA256: `ba7438c8686183ceb1f55dd32e62bed3fc57d082bc642f5487561aca364da024`. Capture supplement SHA256: `4b1186772fec51d3581390ae4dc462811d5b6b7c86018fc36b0062de384a844a`. Remote copies are `$taskRoot\evidence-final.zip` and `$taskRoot\evidence-capture-final.zip`. Original runtime source snapshots are retained locally as `probe-standard-runtime-a107564b5e34.py` (SHA256 `a107564b5e341c84d5ae21bc9ecbb7c41cd1544752597c78f0cde5dae37489c2`) and `probe-final-runtime-be36b8182b5c.py` (SHA256 `be36b8182b5caa1dc071dad3bd075cc44d40a3b6fe7b3282b6da739b44259d40`). Commit `49bc2932` probe SHA256 is `515f382ecb960c6111649784e8ecb23d66f2ac67f7f2cdbb498760a2679bf67b`.

For command outcomes, use the full launch command above with `--outcomes` instead of `--serve`, a fresh directory, and each selected shell. For a supervisor-crash check, start a fresh `--serve`, run `prepare-cleanup`, then use `& $uv run --python $python --script $probe --crash-check --directory "$taskRoot\evidence\session-reproduction"` against that crash session. The observer validates retained native identities before killing the supervisor and releases the sentinel afterward. Inspect active TUI JPEGs before claiming their pixels; a successful phase alone does not establish the visual assertion.

The probe's `--help` exposes these modes. Original complete aggregate replay commands are below; they validate retained evidence, not a new Windows runtime execution:

```sh
python3 tests/proving-it-works-with-a-movie/probe-windows.py --aggregate .superpowers/sdd/2026-09-09-proof-movie-os-compatibility/task-1-evidence/remote
python3 tests/proving-it-works-with-a-movie/probe-windows.py --assert-result .superpowers/sdd/2026-09-09-proof-movie-os-compatibility/task-1-evidence/remote/probe.json
```

## Required production follow-through

General screencast freshness is a **required production fix and test in Tasks 8–9**; stalled takes must not pass. Resizing requires a production shell adapter/supervisor that handles completion framing through resize/redraw, with damaged/missing framing remaining unknown/interrupted. Further work includes broader ownership failure injection, the full OS support matrix, and assembly/narration/verification portability. This probe does not establish those results. The Task 1 mechanism gate and independent review must finish before the bulk port begins.


## Reviewed Windows completion — final results

The earlier sections record historical feasibility work, not the current
acceptance gate. The reviewed three-milestone implementation is now present.
The final native workflows passed; the four-session instruction comparison
has two explicitly incomplete verification outcomes below. No PR, push,
merge, further OS provisioning, or additional eval platform was performed.

Ballmer: native Windows build 26200, x64, ordinary Medium token
`S-1-16-8192`, prepared CPython 3.12.14. Actual invoking-shell transcripts
identify PS5.1 `5.1.26100.9168`, PS7 `7.6.6`, and Git Bash
`5.3.9(1)-release`, with executable/PID before uv. This is evidence for that
tested host, not every Windows release or architecture.

| Invoking → recorded shell | Five tools + checker + rendered audio | Duration | Retained artifacts |
|---|---|---:|---|
| PS5.1 → PS5.1 | PASS | 27.000 s | [Movie](</Users/drewritter/.paseo/worktrees/2mmrq9t5/movie-os-compatibility/.superpowers/evidence/windows-completion/final-task3/powershell51/movie O'Brien λ & [take]/movie.mp4>), [contact sheet](</Users/drewritter/.paseo/worktrees/2mmrq9t5/movie-os-compatibility/.superpowers/evidence/windows-completion/final-task3/powershell51/movie O'Brien λ & [take]/evidence/checker/contact-sheet.png>), [rendered audio](</Users/drewritter/.paseo/worktrees/2mmrq9t5/movie-os-compatibility/.superpowers/evidence/windows-completion/final-task3/powershell51/movie O'Brien λ & [take]/evidence/rendered-audio.json>) |
| PS7 → PS7 | PASS | 26.878 s | [Movie](</Users/drewritter/.paseo/worktrees/2mmrq9t5/movie-os-compatibility/.superpowers/evidence/windows-completion/final-task3/powershell7/movie O'Brien λ & [take]/movie.mp4>), [contact sheet](</Users/drewritter/.paseo/worktrees/2mmrq9t5/movie-os-compatibility/.superpowers/evidence/windows-completion/final-task3/powershell7/movie O'Brien λ & [take]/evidence/checker/contact-sheet.png>), [rendered audio](</Users/drewritter/.paseo/worktrees/2mmrq9t5/movie-os-compatibility/.superpowers/evidence/windows-completion/final-task3/powershell7/movie O'Brien λ & [take]/evidence/rendered-audio.json>) |
| Git Bash → Git Bash | PASS | 27.167 s | [Movie](</Users/drewritter/.paseo/worktrees/2mmrq9t5/movie-os-compatibility/.superpowers/evidence/windows-completion/final-task3/gitbash/movie O'Brien λ & [take]/movie.mp4>), [contact sheet](</Users/drewritter/.paseo/worktrees/2mmrq9t5/movie-os-compatibility/.superpowers/evidence/windows-completion/final-task3/gitbash/movie O'Brien λ & [take]/evidence/checker/contact-sheet.png>), [rendered audio](</Users/drewritter/.paseo/worktrees/2mmrq9t5/movie-os-compatibility/.superpowers/evidence/windows-completion/final-task3/gitbash/movie O'Brien λ & [take]/evidence/rendered-audio.json>) |

All movies are 1600×900 H.264/AAC. Each combines a card, still, real CDP
counter clicks, two native terminal takes, and a labeled existing movie
segment retaining its own 440 Hz stereo tone. Inputs exercise the path
`movie O'Brien λ & [take]`, UTF-8 BOM/CRLF scenes, and separate assembly work.
Title narration lasts 3.855–3.971 s against one second of visuals; still
visuals last four seconds against 1.498–1.695 s of narration.

Each workflow used real local Piper synthesis with verification, then a new
output directory reusing downloaded model caches. The process PATH excludes
`llm`, and cloud keys were removed only from that process. All 15 narrated
final-movie intervals passed local ASR comparison (0% length drift, worst
changed-word run at most two). Each source-tone interval separately passed
frequency/amplitude comparison with its own source reference. Fresh/cached
WAV verification is not substituted for final-movie transcription.

The exported terminal samples show red→green→blue in order and visible
command completion after the second take's exit key. Six take duration
errors are 0.028–0.094 s; maximum completed-screenshot gaps are
0.625–1.109 s. Frame hashes confirm the documented completed-sample grid,
with no future sample used. Contact sheets and decoded movie frames were
inspected; short color states missed by the contact-sheet selection are
present in the actual movies.

Evidence index: [timing/frame inspection](</Users/drewritter/.paseo/worktrees/2mmrq9t5/movie-os-compatibility/.superpowers/evidence/windows-completion/final-task3/timing-and-frame-inspection.json>),
[controller final-movie inspection](</Users/drewritter/.paseo/worktrees/2mmrq9t5/movie-os-compatibility/.superpowers/evidence/windows-completion/final-task3/controller-final-movies.json>),
[final source SHA-256 manifest](</Users/drewritter/.paseo/worktrees/2mmrq9t5/movie-os-compatibility/.superpowers/evidence/windows-completion/final-task3/final-source-sha256.json>).
The manifest pins the tested recorder, helpers, five tools, and fixture;
Task 3 applies to base `ce9b3fcf`, following media `5621d1d6` and recorder
`ce9b3fcf`. The retained source hashes, commands, and source-labeled earlier
results establish provenance without claiming an older artifact tested a
later failure-path change. Remote artifacts remain at
`C:\Users\drew\movie-windows-completion\final-task3`.

### Capture targets and reused regression evidence

Named-window `gdigrab` captured readable pixels from the task-owned Windows
application: [window image](</Users/drewritter/.paseo/worktrees/2mmrq9t5/movie-os-compatibility/.superpowers/evidence/windows-completion/final-task3/desktop-target/title.png>) and
[commands/results](</Users/drewritter/.paseo/worktrees/2mmrq9t5/movie-os-compatibility/.superpowers/evidence/windows-completion/final-task3/desktop-target/result.json>). Visible padding and
capture dimensions are retained; no DPI/root-cause claim is inferred.
Full-desktop capture returned zero but showed wallpaper only, including a
late frame: [desktop image](</Users/drewritter/.paseo/worktrees/2mmrq9t5/movie-os-compatibility/.superpowers/evidence/windows-completion/final-task3/desktop-target/capture-check.png>).
That target remains **unverified for application capture in this session**.
Read-only evidence showed WinSta0/Default and an active console session;
no lock, service, credential, or machine-setting changes were made.

Chrome and Edge title-card checks and the unchanged media regressions reuse
`.superpowers/evidence/windows-completion/media-5621d1d6`. The Mac and Linux
portable assertions passed 35 per host; native-only Job tests are excluded
from that portable result. Final strict browser/narration checks passed
4/4 and 9/9 per host. Real fresh and cached-model voice checks on both hosts
reuse `.superpowers/evidence/windows-completion/{macos,linux}-voice`.
The narration/browser/subtitle code exercised there is unchanged.

The existing terminal capture gate, native outcome/control/ownership
regressions (57 tests), and finalization corrections (7 focused tests) retain
their source labels under `capture-gate`, `terminal-b8a723f4`, and
`terminal-ce9b3fcf`. Task 3 adds the demonstrated Unicode-cwd startup fix and
the previously reviewed identity-error handle cleanup. Focused native tests
passed 4/4. Local changed-policy suites passed 12 terminal and two ownership
assertions; their 13 and two native-only skips do not establish native
coverage. The native final workflows separately exercise all three shells.

### Four instruction sessions — comparison complete, full compliance partial

All four loaded the explicit candidate plugin and successful
`using-superpowers` SessionStart bootstrap, invoked the movie Skill, and used
actual PowerShell or Bash tools. The scenario, model (`claude-sonnet-5`,
existing `sonnet` alias), low effort, supplied tools/caches, product code, and
stop-at-first-instruction-gap criterion were held constant. Only the candidate
Markdown changed. No diagnostic safe mode or extra implementation agent was
used. Permissions/context were scoped to the task plugin, fixtures,
artifacts, and owned processes.

| Session | Observed result |
|---|---|
| PowerShell baseline | Demonstrated documentation failure: inferred the native route from source, failed special-path `Start-Process` quoting, BOM request input, and guessed an `operation: result` request. Stopped through owned cleanup after the gap; not a completed workflow. |
| Git Bash baseline | Demonstrated documentation failure: inferred the native route from source and passed `/c/...` to native Python, producing `C:\c\...`/file-not-found. Stopped through the launcher's Job cleanup after the gap; not a completed workflow. |
| PowerShell candidate | **Partial.** New foreground-task, UTF-8 request, consecutive-ID, two-take, wait-only result, local voice, five-tool, caption/contact-sheet, cleanup, and honest capture-boundary instructions worked. It claimed complete verification but omitted transcription of the rendered final audio. |
| Git Bash candidate | **Incomplete due to harness turn cap.** Built a movie and ran media/checker/evidence steps, then returned `error_max_turns` (41 reported turns, exit 1) before a final response or rendered-final-audio transcription. This is not a full skill pass or an inferred instruction failure. |

Launch limits were $4, 40 turns, and 900 seconds per session. The PowerShell
baseline's interrupted result reported 54 turns/$1.4456, and the completed
PowerShell candidate reported 44 turns; the requested cap must not be
mistaken for the harness's actual reported count. Git Bash candidate cost
was $0.832 and elapsed time 223.6 s. No limit was silently scored as success.
Transcripts and launcher result records are retained under
[the stable instruction evidence](</Users/drewritter/.paseo/worktrees/2mmrq9t5/movie-os-compatibility/.superpowers/evidence/windows-completion/final-task3/instructions/>). Further corrective
instruction work is left to review; no extra sessions were launched.

### Acceptance disposition

| Reviewed acceptance area | Disposition |
|---|---|
| Three native invoking/recorded-shell workflows | PASS on the recorded host |
| Repeatable mixed fixture, paths, encodings, timing | PASS |
| Terminal control, continuity, native outcomes, ordered automatic states | PASS with retained focused regression evidence |
| Fresh/cached-model local voice per workflow | PASS |
| Finished picture, hard captions, checker and rendered audio | PASS for all three independent acceptance movies |
| Browser cards / capture targets | PASS Chrome, Edge, and named-window pixels; full-desktop target explicitly unverified |
| Focused negative cases and ownership | PASS with source-labeled earlier evidence plus Task 3 focused corrections |
| Existing Mac/Linux behavior | PASS reused unchanged portable/media/voice evidence |
| Four instruction comparisons | Executed; **full candidate skill compliance remains INCOMPLETE** for the two specific outcomes above |
