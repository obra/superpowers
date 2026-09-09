Task 1 native Windows feasibility report — DONE_WITH_CONCERNS

The bounded mechanism gate passed on Ballmer with actual ordinary-user execution for PowerShell 5.1, PowerShell 7 and Git Bash. The final aggregate has 40 passed checks, zero failed/unavailable checks. This result includes the controller-approved explicit same-page snapshot checkpoint for TUI capture. It does not establish general resize/redraw decoding or general screencast freshness. Those remain required production fixes/tests, particularly capture freshness in Tasks 8–9. Independent controller review remains required before dependent implementation proceeds.

Work stayed in `/Users/drewritter/.paseo/worktrees/2mmrq9t5/movie-os-compatibility`, branch `feat/movie-os-compatibility`, implementation base `0b22f618`. Changed files are `tests/proving-it-works-with-a-movie/probe-windows.py` and this report. No skill prose or bulk port changes; no subagents/reviewers dispatched; no push, PR or merge. Read the Task 1 brief, global constraints, terminal excerpt, probe context, applicable AGENTS.md, the imported three regression scripts, and TDD/verification/debugging/worktree/Paseo skills. Did not read the full plan.

The inspected PR #2214 was rechecked as OPEN against `dev`, exact head `f6617db1517488d4a8b66925519d5ffbeef965b3`; imported movie skills/tests matched that revision. An immutable import archive is retained as `task-1-evidence/inspected-import.tar`, SHA256 `a4abb54f8ecf34acd44d7a4eb912492c59d749fef73b473cac95e2da25d70225`. The controller's original 18-assertion baseline was independently repeated here: 4 assemble, 5 narration and 9 checker assertions passed, none skipped.

Launch host: `workerbee`, macOS. Recording host: `ballmer`, Windows 11 Pro 10.0.26200, native x64. This host observation imposes no Windows 11-only production requirement. WSL and the other OS acceptance jobs belong to later/controller work; they were not used to substitute for this native gate.

Remote root is exactly `C:\Users\drew\movie-os-task1-20260909`. Portable prerequisites are under `tools`, archives under `downloads`, uv environments under `cache`, and all sessions under `evidence`. Local evidence root is `.superpowers/sdd/2026-09-09-proof-movie-os-compatibility/task-1-evidence/`; its `remote/` directory contains retrieved remote artifacts. These large artifacts remain ignored in Git and available locally/remotely; source and report are committed. Every local SSH call has a named `.ps1`, `-command.json` containing the actual encoded argv, `.stdout.txt` and `.stderr.txt` under the local evidence root.

Inventory inspected PATH and relevant installed user locations before provisioning. WindowsApps Python/Bash aliases were unused. No PATH, profiles, execution policy, firewall, credentials, services or account membership changed. No management network was disabled. Existing Chrome and Git Bash were reused.

| Prerequisite | Actual executable, relative to remote root unless absolute | Actual version/result |
| --- | --- | --- |
| uv | `tools\uv\uv.exe` | `uv 0.12.12 (c4be69153 2026-09-09 x86_64-pc-windows-msvc)` |
| Native Python | `tools\python\cpython-3.12.14-windows-x86_64-none\python.exe` | CPython 3.12.14, `win32`, AMD64, 64-bit pointers |
| PowerShell 5.1 | `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe` | `5.1.26100.9168`, 64-bit |
| PowerShell 7 | `tools\pwsh\pwsh.exe` | `7.6.6`, 64-bit |
| ttyd | `tools\ttyd.exe` | `ttyd version 1.7.7-40e79c7`, PE x64 despite upstream asset name `ttyd.win32.exe` |
| FFmpeg/ffprobe | `tools\ffmpeg\ffmpeg-9.0.1-essentials_build\bin\{ffmpeg,ffprobe}.exe` | `9.0.1-essentials_build-www.gyan.dev` |
| Git Bash | `C:\Program Files\Git\bin\bash.exe` | Bash `5.3.9(1)-release (x86_64-pc-cygwin)`, Git 2.54.0.windows.1 |
| Browser | `C:\Program Files\Google\Chrome\Application\chrome.exe` | Chrome 152.0.7977.65 |
| CDP client | PEP 723 uv script environment | websocket-client 1.9.0 |

`remote/prerequisites.json` retains actual command arrays, stdout/stderr, exit codes, binary SHA256 and PE machine `0x8664`. Commands exercised `uv --version`, native Python identity, `ffmpeg -version/-filters/-encoders/-devices`, `ffprobe -version`, `ttyd --version/--help`, each PowerShell version separately, Git Bash version and native tools from Git Bash. Native FFmpeg reported libx264, AAC, subtitles and `--enable-libass`; all prerequisite checks passed. Git Bash invoked native Windows Python and FFmpeg explicitly, not WSL or MSYS Python.

Downloads and actual SHA256 values below are retained in `remote/downloads.jsonl` and the remote `downloads` directory. Expected digests came from the corresponding release metadata/checksum/PyPI records. Python/wheel downloads were repeated after an interrupted tool call with identical digests; both records remain in the log. FFmpeg's official download page links the Gyan Windows distribution used here ([FFmpeg downloads](https://ffmpeg.org/download.html)).

| Download origin | SHA256 |
| --- | --- |
| [uv 0.12.12 archive](https://github.com/astral-sh/uv/releases/download/0.12.12/uv-x86_64-pc-windows-msvc.zip) | `3d54912924c36e862c14f427d04f2ed70a99e8001d1c30caa101f6d5711626d5` |
| [PowerShell 7.6.6 archive](https://github.com/PowerShell/PowerShell/releases/download/v7.6.6/PowerShell-7.6.6-win-x64.zip) | `02fe458be20493fbdf43f61ea20610b811ee6c738ab1676c61b9cfcd1a33c860` |
| [ttyd 1.7.7 executable](https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.win32.exe) | `e33a27501b10b96981335bcba938b1145c7f52551a343e72160f00ab71832b37` |
| [Gyan release essentials](https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip) | `fec81ae03971d9dd4be3ebe02e263bd2ec1d789483f931bdba5f5715e65da2e9` |
| [Astral CPython 3.12.14, 20260901](https://github.com/astral-sh/python-build-standalone/releases/download/20260901/cpython-3.12.14%2B20260901-x86_64-pc-windows-msvc-install_only_stripped.tar.gz) | `7c45c9622400d578709a9b2cddbe8124cc21d382409d9f13406d706d28e31b14` |
| [websocket-client 1.9.0 wheel](https://files.pythonhosted.org/packages/34/db/b10e48aa8fff7407e67470363eac595018441cf32d5e1001567a7aeba5d2/websocket_client-1.9.0-py3-none-any.whl) | `af248a825037ef591efbf6ed20cc5faa03d3b47b9e5a2230a529eeee1c1fc3ef` |

SSH transport executed as High-integrity `ballmer\drew`. Those earlier results remain elevated evidence, not ordinary-user acceptance. Direct token inventory returned TokenElevationType=1 and TokenElevation=1; TokenLinkedToken failed with Win32 error 1312. No account was created or reconfigured. The controller established existing desktop Paseo execution in task terminal `1496200b-5545-4d85-af31-d01df72a3c11`, named `movie-standard-user-probe`, cwd the remote root. Initial controller evidence is `standard-runner-token.json` and local `artifacts/ballmer-runner-inventory/` beside this report. Each acceptance supervisor then independently queried its own token through Win32: elevation type 3, elevated false, integrity SID `S-1-16-8192`, desktop session 1, `ballmer\drew`, Administrators deny-only. These results are in each `probe.json` or crash session `control/ready.json`, including complete `whoami /all` output. Token queries followed [Microsoft's GetTokenInformation contract](https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-gettokeninformation).

The matching installed remote Paseo CLI submitted the launch command into that Medium terminal while SSH itself remained High:

```powershell
& 'C:\Users\drew\AppData\Local\Programs\Paseo\resources\bin\paseo.cmd' terminal send-keys '1496200b-5545-4d85-af31-d01df72a3c11' '<powershell.exe -NoLogo -NoProfile -NonInteractive -EncodedCommand plus actual UTF16LE base64>' Enter --json
```

The literal base64/argv is retained in each `*-submit-command.json`, not reconstructed in this report. Task-owned `*-launch.ps1` artifacts execute native Python `subprocess.Popen` argument arrays for the three uv probes and wait for them in the persistent terminal. No additional agent or service was launched. The newer local Paseo CLI's workspace SDK mismatch with the older host was bypassed using the already installed matching CLI, without changing the installation.

The common probe command was the following, with the actual selected absolute shell and a new session directory in each launch artifact:

```powershell
$env:UV_PYTHON_INSTALL_DIR='C:\Users\drew\movie-os-task1-20260909\tools\python'
$env:UV_CACHE_DIR='C:\Users\drew\movie-os-task1-20260909\cache'
$env:UV_NO_CONFIG='1'
$env:PYTHONIOENCODING='utf-8'
& 'C:\Users\drew\movie-os-task1-20260909\tools\uv\uv.exe' run --python 'C:\Users\drew\movie-os-task1-20260909\tools\python\cpython-3.12.14-windows-x86_64-none\python.exe' --script 'C:\Users\drew\movie-os-task1-20260909\probe-windows.py' --serve --ttyd 'C:\Users\drew\movie-os-task1-20260909\tools\ttyd.exe' --browser 'C:\Program Files\Google\Chrome\Application\chrome.exe' --shell 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe' --shell-kind powershell51 --directory 'C:\Users\drew\movie-os-task1-20260909\evidence\standard-normal-powershell51' --launch-host workerbee
```

Separate SSH/harness calls used the same uv prefix with `--phase first`, later `--phase second`, then `--phase prepare-cleanup` and `--phase close`, supplying `--shell-kind` and `--directory`. The first phase returned while native Python's `time.sleep(45)` was still in flight. The later phase began another take, inspected that same pending request, resized, waited for completion and checked the persisted variable. Exact separate-call transcripts are `standard-normal-<shell>-{first,second,prepare,close}-call.*`. The ordered request, ack and result files remain in each session's `control` directory. Request IDs are monotonic, a run ack precedes completion, and another run cannot take input while a prior run is pending.

The probe uses an unnamed, non-inheritable Windows Job with kill-on-close and no breakaway. ttyd and isolated Chrome are created suspended, assigned before resume, and tracked with retained native handles and creation times. Supervisor and sentinel remain outside the child Job. Actual x64 structure sizes were STARTUPINFOW 104, PROCESS_INFORMATION 24, BASIC_LIMIT 64, IO_COUNTERS 48 and EXTENDED_LIMIT 144. The code terminates an unresumed root if assignment/resume fails; no unowned-root fallback exists. Deliberately induced assignment failure is not part of the Task 1 runtime matrix; the future ownership task still needs its broader error-injection coverage.

Actual ttyd arguments include `-i 127.0.0.1 -p <owned-port> -W -m 1 -w <session-directory>` followed by the explicitly selected shell. Chrome uses an isolated session profile, loopback CDP, `--headless=new`, initial `about:blank` and 1600x900 window. The one page enables CDP Network before navigation, identifies its own terminal WebSocket request ID, observes binary opcode 2 with leading output byte `0` (`30` hex), and applies the exact requested `ttyd_output` decoder. Input, readiness screenshot, parsed completions and screencast metadata all refer to that same page/socket/session. The required `assert_probe` contract remains verbatim.

| Actual standard session result | PowerShell 5.1 | PowerShell 7 | Git Bash |
| --- | --- | --- | --- |
| Recorded shell PID before/after | 12680 / 12680 | 14484 / 14484 | MSYS 1420 / 1420 |
| Session nonce before/after | `13ec77781da74219aa6ef3b1ca5f0548` | `d427b90065644f579858711962e89bb4` | `75d88a3a44e641719b45ba7218ebca46` |
| First driver returned (epoch s) | 1788994016.157899 | 1788994016.108129 | 1788994016.157899 |
| Later inspection, same pending run | 1788994039.2253277 | 1788994039.1947393 | 1788994039.2253277 |
| Delayed run completed | 1788994060.7506654 | 1788994060.513397 | 1788994061.1033065 |
| Persisted variable | `persisted-λ` | `persisted-λ` | `persisted-λ` |
| Actual columns | 217 → 167 | 217 → 167 | 217 → 167 |
| Normal cleanup seconds | 1.890 | 1.859 | 1.875 |
| Cancel cleanup seconds | 1.984 | 1.984 | 2.047 |
| Browser-loss cleanup seconds | 0.063 | 0.047 | 0.047 |
| Supervisor-crash cleanup seconds | 0.250 | 0.250 | 0.203 |

Each cleanup checked parent/child/grandchild heartbeats, disappearance through native handles, no advancing heartbeat after shutdown, and unrelated sentinel survival. Crash observers opened/validated native handles before killing the actual supervisor with exit 99; every sentinel also advanced its heartbeat after that kill, then was cleaned through its verified handle. A final audit checked 609 recorded PID/creation-time observations across sessions, found no remaining original processes, and explicitly distinguished reused PIDs. `remote/final-process-audit.json` retains those observations. Git Bash's MSYS shell PID is never used as a Win32 process handle/PID assumption.

All three extra-client attempts were refused with `WebSocketConnectionClosedException: Connection to remote host was lost.` and no HTTP status. Evidence retains `accepted=false`, `candidate_continuity=false`, plus a nonce/PID-bearing round trip on the original page. All three browser-loss tests observed Win32 10054 (`An existing connection was forcibly closed by the remote host`); active commands became interrupted with `shell_success=null`, and no successful continuity was claimed. The browser was terminated only through its owned native handle.

All 27 selected command cases completed with their expected semantics: ten cases per PowerShell version and seven for Git Bash. Native exit 0 followed by a failing cmdlet and native exit 7 followed by a successful cmdlet proved that cmdlet outcomes do not inherit stale native status. PowerShell direct terminating/nonterminating errors were false; parse failure preserved `raw_shell_success=true` separately from `parse_error=true`, semantic `shell_success=false` and the actual ParseException. The expression wrapper `(Write-Error 'probe expression wrapper')` was true in PS5.1 and false in PS7; its error text remains recorded. Explicit external shell script `exit 9` returned native 9. The producer/logging failure preserved native/producer exit 7: PowerShell shell status false; Bash logger shell status true with pipeline statuses `[7,0]` and producer success false. Commands and attribution are in `standard-outcomes-*/outcomes.json`; raw observed streams are alongside them. These are atomic-beat observations, not a claim to find every internally ignored error in arbitrary scripts.

Actual RED/GREEN history and retained defects:

- Initial `python3 tests/proving-it-works-with-a-movie/probe-windows.py` before recorder implementation exited 1 with `KeyError: 'shells'` (`red-unimplemented.txt`). Initial `assert_outcomes({})` exited 1 with `KeyError: 'native_success'` (`red-outcomes.txt`). No invented passing runtime fixtures were substituted.
- Original `startup-*` runs for all three shells obtained the page WebSocket then closed without output; screenshots showed Reconnecting. Keeping binary/Job/CDP constant and adding explicit ttyd `-w` passed nonce/PID/cwd readiness in `cwd-*`. Upstream [ttyd PR #1502](https://github.com/tsl0922/ttyd/pull/1502), independently read by the controller, initializes command-line/cwd pointers to NULL alongside MSVC work. That supports the cwd correction without proving the internal cause of our runtime failure. Our ttyd log did not emit upstream error 123; no such claim is made.
- Separate probe implementation defect: the initial PowerShell prompt error baseline was unset and emitted `InvokeMethodOnNull` at prompt line 8. `prompt-diagnostic-powershell51` and original `outcomes-*` retain this. Initializing `$Error.Count` and guarding null records corrected it. Corrected PS baseline evidence remains separate from ttyd's explicit-cwd prerequisite.
- Original long completion lines wrapped at 218 columns and ConPTY duplicated a boundary character while emitting cursor repositioning sequences (`outcomes-gitbash`). Its raw `network.jsonl`/`terminal.bin` and failed result remain. Completion payloads now use base64 chunks of at most 60 characters on separate lines. Earlier elevated dimensions were 218→167; actual standard dimensions were 217→167. A preliminary update/aggregate wrongly generalized 218 to standard runs; retrieved size messages corrected that (`aggregate-first-full.txt`). No arbitrary resize/redraw decoder is claimed, and no VT-emulation dependency was added.
- ParseException initially left raw $? true and broke expected error attribution in `outcomes-v2-*`. The final prompt preserves raw status plus request-attributed parse failure; `outcomes-v3-*` elevated and `standard-outcomes-*` Medium cases passed.
- The original extra-client handler expected an HTTP error and failed on EOF in `session-powershell51`. It now retains EOF refusal and requires the original-page round trip. Nothing unavailable became green merely because the attempted connection threw.
- Initial normal cleanup asserted handle exit immediately after Job membership reached zero; Chrome handles could still be unsignaled. Retained `session-v2-*` failures show stopped worker heartbeats and surviving sentinel. A bounded wait on retained handles corrected this; elevated `final-*` and standard cleanup evidence retain before/after results.
- An elevated `final-powershell7` run also hit `PermissionError(13, 'Permission denied')` reading `heartbeats\child.json` during atomic replacement, despite successful cleanup. A bounded 0.5s access-error retry now retries the actual file operation; persistent errors still raise, never returning empty/old evidence. Standard runs passed. One original concurrent CDP connection exceeded a 0.1s handshake (`cancel-gitbash`); connection setup now allows 5s, with receive polling still 0.1s.
- An SSH command exceeded Windows command-line length; the exact script is now copied as a task-owned artifact and invoked by a short encoded ScriptBlock wrapper. PS5 native `-c` quoting was corrected using a base64 Python payload. Initial ZIP export encountered a pre-1980 profile timestamp; exports now exclude browser profiles and preserve only probe evidence. Failed commands remain in their named outputs.
- Initial aggregate inspection assumed cleanup-ended ownership takes had an `end_request` summary count. Their real frame manifests were present; the aggregate now validates those persisted files directly while retaining explicit counts for requested end-take operations. The failed first aggregate is retained.

The active-TUI capture defect required separate visual review. `standard-normal-powershell51` successfully ran the TUI and its end PNG showed the screen, but its active-take JPEGs stopped before that screen. A one-second application-ready hold in `standard-tui-*` still left blank-ending PowerShell JPEGs. Those are retained failures; neither the command result nor the final PNG was accepted as the active-pixel proof.

The controller approved a bounded correction: after actual `tui-ready.json` and a visual hold, use an explicit `snapshot` control request on the same page and existing CDP connection, before sending `q`; still require an inspected active-take JPEG before `q`. `tui-diagnostic-*` proved live PNGs while request 2 was pending. Final `tui-verified-*` also logged CDP sends, receives, frame acknowledgments and polling timeouts. I inspected `interactive/000009.jpg` in all three: each visibly contains `Native Windows TUI λ` and `[q] Finish this screen`, with no `TUI_EXIT:q` yet. `active-tui-pixel-inspection.json` retains exact JPEG hashes, frame metadata, request IDs and the explicit visual finding. The aggregate verifies those exact bytes and timings; it does not pretend to perform OCR.

| Final TUI evidence (epoch seconds) | PS5.1 | PS7 | Git Bash |
| --- | --- | --- | --- |
| Application ready | 1788994874.380406 | 1788994874.7009904 | 1788994874.6822324 |
| Snapshot request 3; run 2 pending | 1788994875.4311693 | 1788994875.854709 | 1788994875.7615943 |
| Inspected active JPEG 9 received | 1788994875.7732553 | 1788994875.8755016 | 1788994875.7821376 |
| `q` request 4 dispatched | 1788994875.9168005 | 1788994876.04243 | 1788994875.9338365 |
| Received events during ready→snapshot hold | 12 | 9 | 7 |
| Receive timeout polls during hold | 8 | 8 | 8 |
| Screencast acks sent and replied during hold | 4 | 3 | 2 |

The receiver demonstrably kept draining and acknowledging during the driver wait. The final traced run also contained earlier TUI frames before its snapshot, so it does not establish the cause of earlier stalls or prove that the snapshot alone caused a redraw. The feasibility claim is specifically the inspected checkpoint method. General capture freshness is a REQUIRED production fix/test in Tasks 8–9; stalled takes must not pass production acceptance. Resize-aware completion decoding is likewise required later. The controller explicitly retained these constraints and the possibility of another redraw/compositor interaction.

Final artifacts and reproducibility:

- `remote/probe.json` is the complete aggregate, generated from actual retained reports/control/frame files. Per-session reports intentionally keep unrelated checks unavailable; only the aggregate can open the complete gate.
- `remote/standard-outcomes-{powershell51,powershell7,gitbash}/`: recorded outcomes, raw CDP messages, terminal bytes, screenshots and frames.
- `remote/standard-normal-*`: separate-call two takes, resize, variable/nonce/PID continuity, extra-client refusal, normal close.
- `remote/standard-cancel-*`, `remote/standard-loss-*`, `remote/standard-crash-*`: separate cancellation, browser-loss and crash/heartbeat/sentinel evidence. Crash result is `crash.json`, because the killed supervisor cannot write a final report.
- `remote/tui-verified-*`: accepted active TUI JPEGs, `tui-live.png`, `cdp-trace.jsonl`, control requests/acks/results and final normal cleanup. `standard-tui-*` and `tui-diagnostic-*` preserve focused attempts.
- Earlier `startup-*`, `cwd-*`, `outcomes-*`, `outcomes-v2-*`, `outcomes-v3-*`, `session-*`, `session-v2-*`, `cancel-*` and `final-*` remain explicitly elevated historical evidence.
- Main retrieved archive: remote `C:\Users\drew\movie-os-task1-20260909\evidence-final.zip`, local `task-1-evidence/evidence-final.zip`, 2,323 files, 160,448,403 bytes, SHA256 `ba7438c8686183ceb1f55dd32e62bed3fc57d082bc642f5487561aca364da024`.
- Capture supplement: remote `C:\Users\drew\movie-os-task1-20260909\evidence-capture-final.zip`, local same basename under `task-1-evidence`, 650 files, 23,823,967 bytes, SHA256 `4b1186772fec51d3581390ae4dc462811d5b6b7c86018fc36b0062de384a844a`. The supplement overlaps earlier focused artifacts; it is not 650 additional unique sessions/files.
- Local `parser-replay.json`: replayed actual standard outcome streams in seven-byte chunks (22, 22 and 16 records). Truncated completion framing produced no record; damaged framing produced no successful record. Runtime browser-loss records separately demonstrate interrupted/null outcomes when completion is absent.
- `aggregate-before-retrieval.txt`, `aggregate-first-full.txt`, `aggregate-before-tui-retrieval.txt` retain incomplete/failed aggregate iterations. Missing artifacts fail closed. `aggregate-final.txt` retains the complete passing output.

The main standard runtime source snapshot is `probe-standard-runtime-a107564b5e34.py`, full SHA256 `a107564b5e341c84d5ae21bc9ecbb7c41cd1544752597c78f0cde5dae37489c2`. Focused traced capture used `probe-final-runtime-be36b8182b5c.py`, full SHA256 `be36b8182b5caa1dc071dad3bd075cc44d40a3b6fe7b3282b6da739b44259d40`. Subsequent final-source changes only add validation of the manually inspected pixel artifact's hash/timing in aggregation, its hashlib import, and explicit scope/production requirements in aggregate metadata; they do not alter the exercised Windows mechanism.

Final verification commands are `python3 -m py_compile tests/proving-it-works-with-a-movie/probe-windows.py`, `python3 tests/proving-it-works-with-a-movie/probe-windows.py --aggregate .superpowers/sdd/2026-09-09-proof-movie-os-compatibility/task-1-evidence/remote`, and `--assert-result` against that generated `remote/probe.json`. Aggregate output: `gate=passed`, 40 passed checks; assert-result exits 0. The three imported `test-*.sh` scripts returned `4 passed, 0 failed`, `5 passed, 0 failed`, and `9 passed, 0 failed`; stdout/stderr and actual argv are retained in `imported-final-checks.json` and `test-*.sh.final.*`. No missing-tool SKIP was counted as passing.

Self-review confirms the exact user assertion/decoder seams, native executable arrays, single-page observation, raw versus semantic PowerShell status, native ownership rather than MSYS PID assumptions, bounded shutdown and unavailable/error handling. The file is deliberately a self-contained feasibility test harness, not production modules. Its aggregation expects the named evidence layout and specific observed widths. It does not implement arbitrary VT redraw, robust production capture freshness, the complete OS support matrix, movie assembly/narration portability or comprehensive Win32 failure injection. Those are remaining production work, not omitted green Task 1 runtime checks. The existing task-owned Paseo terminal is left idle and available for later tasks as requested; recorder processes and sentinels are gone. Tools/downloads/evidence remain available under the authorized remote root.

Final native validation also ran the committed-source aggregate and assert-result commands on Ballmer, both exiting 0 (`final-ballmer-aggregate-assert.*`). Local negative checks rejected deletion of a required crash check and corruption of the actual persisted-variable result. These are negative mutations of retained evidence, not fabricated successful runtime checks. The original Task 1 requirements and imported movie code remained unchanged.
