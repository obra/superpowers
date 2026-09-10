# Recording a terminal

CLIs, TUIs, installs, test runs, agents at work — a large share of what is
worth proving happens in a terminal, and none of it is visible to a browser
recorder or an OS screen capture you probably can't get permission for.

## Native Windows: one shell, two takes

`examples/film-terminal.py` serves a native shell through ttyd/ConPTY and an
owned headless Chrome or Edge page. It needs uv, native Python 3.12+, ttyd,
and Chrome or Edge. PowerShell itself does not need Bash. Choose the shell
being recorded with `--shell powershell51|powershell7|gitbash`; the shell
invoking uv is a separate choice. Use `--shell-exe`, `--ttyd`, and `--browser`
for explicit executable paths when they are absent from PATH.

Run `serve` in a foreground/background task kept alive by your harness,
like the visual companion. Keep that task running while later shell tool
calls submit requests. Do not use a one-shot shell that tears down its
children on return. Do not install a service. PowerShell `Start-Process
-ArgumentList` joins arguments into a string and can lose special-path
quoting; the foreground invocation below keeps arguments separate.

PowerShell 5.1 or 7, in the long-lived recorder task:

```powershell
$skill = 'C:/path/to/skills/proving-it-works-with-a-movie'
$work = "$HOME/movie O'Brien λ & [take]"
& uv run --script "$skill/examples/film-terminal.py" serve --shell powershell51 --directory "$work/session" --cwd "$work"
```

Git Bash, in the long-lived recorder task:

```bash
skill=$(cygpath -m '/c/path/to/skills/proving-it-works-with-a-movie')
work=$(cygpath -m "$HOME/movie O'Brien λ & [take]")
uv run --script "$skill/examples/film-terminal.py" serve --shell gitbash --directory "$work/session" --cwd "$work"
```

Create `work` first; use a new session directory each time. Wait for
`session/control/ready.json` and inspect `session/ready.png`. The ready record
contains the filmed shell's identity, cwd, geometry, and `next_request_id`.
Readiness comes through that same filmed terminal; opening a second ttyd
client would replace the session and is not an observation technique.

For each subsequent PowerShell control call, set `skill` and `work` again
and define this small request helper. It writes JSON without a BOM and
preserves each argument:

```powershell
function Send-MovieRequest([hashtable]$data, [switch]$WaitResult) {
    $path = "$work/request-$($data.id).json"
    $json = $data | ConvertTo-Json -Compress
    [IO.File]::WriteAllText($path, $json, [Text.UTF8Encoding]::new($false))
    $arguments = @('run','--script',"$skill/examples/film-terminal.py",'request',
        '--directory',"$work/session",'--file',$path)
    if ($WaitResult) { $arguments += '--wait-result' }
    & uv @arguments
    if ($LASTEXITCODE -ne 0) { throw 'Recorder request failed' }
}
# First control call: a real command keeps stdin until the later Enter key.
Send-MovieRequest @{id=1;operation='begin-take';name='take-one'} -WaitResult
Send-MovieRequest @{id=2;operation='run';command='python -u -c "print(123); input(); print(456)"';native_producer='python';timeout_seconds=120}
Start-Sleep -Seconds 2
Send-MovieRequest @{id=3;operation='end-take'} -WaitResult
```

In a **later control call**, with the same paths/helper and server still alive:

```powershell
Send-MovieRequest @{id=4;operation='begin-take';name='take-two'} -WaitResult
Send-MovieRequest @{id=5;operation='key';key='Enter'} -WaitResult
& uv run --script "$skill/examples/film-terminal.py" result --directory "$work/session" --id 2 --timeout 30
if ($LASTEXITCODE -ne 0) { throw 'Recorded command did not succeed' }
Start-Sleep -Seconds 2  # Keep the observed completion readable in the movie.
Send-MovieRequest @{id=6;operation='end-take'} -WaitResult
Send-MovieRequest @{id=7;operation='close'} -WaitResult
```

Equivalent Git Bash control calls use UTF-8 files and native-form paths.
Set `skill` and `work` in each call. The first call:

```bash
set -euo pipefail
recorder="$skill/examples/film-terminal.py"
printf '%s\n' '{"id":1,"operation":"begin-take","name":"take-one"}' > "$work/1.json"
printf '%s\n' '{"id":2,"operation":"run","command":"python -u -c \"print(123); input(); print(456)\"","native_producer":"python","timeout_seconds":120}' > "$work/2.json"
printf '%s\n' '{"id":3,"operation":"end-take"}' > "$work/3.json"
uv run --script "$recorder" request --directory "$work/session" --file "$work/1.json" --wait-result
uv run --script "$recorder" request --directory "$work/session" --file "$work/2.json"
sleep 2
uv run --script "$recorder" request --directory "$work/session" --file "$work/3.json" --wait-result
```

The later Git Bash call:

```bash
set -euo pipefail
recorder="$skill/examples/film-terminal.py"
printf '%s\n' '{"id":4,"operation":"begin-take","name":"take-two"}' > "$work/4.json"
printf '%s\n' '{"id":5,"operation":"key","key":"Enter"}' > "$work/5.json"
printf '%s\n' '{"id":6,"operation":"end-take"}' > "$work/6.json"
printf '%s\n' '{"id":7,"operation":"close"}' > "$work/7.json"
uv run --script "$recorder" request --directory "$work/session" --file "$work/4.json" --wait-result
uv run --script "$recorder" request --directory "$work/session" --file "$work/5.json" --wait-result
uv run --script "$recorder" result --directory "$work/session" --id 2 --timeout 30
sleep 2
uv run --script "$recorder" request --directory "$work/session" --file "$work/6.json" --wait-result
uv run --script "$recorder" request --directory "$work/session" --file "$work/7.json" --wait-result
```

Use one controller and consecutive IDs starting at one. Acknowledgment only
means accepted. `--wait-result` and the wait-only `result` command return
nonzero on failed, unknown, interrupted, or missing results. After a client
wait timeout, retrieve the original ID with `result`; do not submit it again.
The command's `timeout_seconds` is separate: its expiry ends the session and
marks the outcome unknown. `inspect` reports the pending command, active
take, and next ID; it consumes an ID like every other request.

`end-take` stops capture, preserving shell variables, cwd, and a pending
command. A second `run` is rejected while one is pending. Use intentional
`key` requests for input: printable characters (such as the fixture's `q`),
Enter, Escape, arrows, Tab, and Ctrl-C. `close` finalizes a healthy take;
`cancel` marks it incomplete. Both release only owned processes and mark a
pending command interrupted. Wait for the shutdown result before declaring
cleanup successful.

The viewport is fixed at 1600×900, sampled at a target 5 fps. Read the actual
rows/columns from readiness; resizing fails the session. Hold important
states at least 1.3 seconds. A screenshot gap above two seconds fails a take.
Exports use completed samples on the 0.2-second grid and record duplicates
in `take.json`; sampling does not prove every faster event was observed.
Each completed `end-take` supplies `kind: frames`, `src`, and `rate: 5` for
assembling.md. Keep the final movie at a readable resolution and inspect the
exported frames and finished movie, including command completion.

For native commands followed by logging, set `native_producer` to the
explicit first-stage executable. This prevents successful `tee`/`Tee-Object`
from hiding producer failure. Omit it for opaque/mixed scripts; their result
does not certify every internal command. Preserve raw PowerShell `$?`
separately from request-attributed errors and native exit status. See
rendering-from-a-log.md for direct shell logging recipes.

## Unix: tmux and ttyd

The technique: serve the terminal over HTTP with **ttyd**, attach it to a
**tmux** session, screenshot the page from a browser, and drive the session
with `tmux send-keys` from outside. Real characters from a real shell, in a
window you fully control. The commands below are the Unix recipe.
`examples/film-terminal.py` implements the separate native Windows route.

```bash
# inside the machine/container being filmed
tmux new-session -d -s demo -x 125 -y 34
ttyd -p 7681 -t fontSize=17 -t 'fontFamily=DejaVu Sans Mono,monospace' \
     -t 'theme={"background":"#101014","foreground":"#e8e6e1"}' \
     tmux attach -t demo

# from outside: drive it
tmux send-keys -t demo 'claude plugin install proving-it-works' Enter
docker exec CONTAINER tmux send-keys -t demo 'ls -la' Enter   # containerised
```

Size the tmux session to the browser viewport you will screenshot
(roughly `width/10` columns by `height/22` rows at 17px) or the capture
shows a window cropped to a different geometry than the shell believes it
has.

## Headless Chrome renders the terminal blank without software GL

ttyd draws the terminal into a `<canvas>`. Headless Chrome with no GPU
paints that canvas empty — the screenshot is a black rectangle with a
status bar, and nothing warns you. It cost 73 blank frames to notice.

```
--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader
```

A related trap: setting `Emulation.setDeviceMetricsOverride` mid-session
resizes the canvas without triggering a redraw, blanking it again. Set the
scale at launch (`--force-device-scale-factor=2`) instead.

**Preflight before every take.** Print something known, screenshot once, and
count lit pixels; abort if the frame is empty. Filming a whole sequence and
discovering afterwards that all of it is black is the failure this prevents:

```python
lit = sum(1 for v in frame.convert("L").getdata() if v > 90) / npixels
if lit < 0.002:
    raise SystemExit("terminal renders blank - check software GL flags")
```

## Never type into a program that is still running

`tmux send-keys` puts characters into whatever owns the pane. If a command
is still working, your keystrokes land in *its* stdin and appear as echoed
text — the movie shows commands that never ran. Wait for the shell:

```python
def wait_for_shell(session):
    while tmux(f"display-message -p -t {session} '#{{pane_current_command}}'") \
            .strip() not in ("bash", "sh", "zsh"):
        time.sleep(2)
```

This matters most for the interesting shots: an agent working, a build, a
test suite. Those are exactly the commands that outlast your `sleep`.

## Long work does not belong inside one take

An agent run or a build takes minutes. Film the command being issued, stop
the take, wait for the shell to come back, then film the result as a new
take, and let the cut carry the gap with a card that says how long it took.
Same rule as recording-motion.md: the work is real, the tedium is not.

## Playing a movie inside the terminal

`mpv --vo=tct movie.mp4` renders video as coloured terminal cells. It genuinely
proves a file plays where it was made, and it looks like what it is: blocky.
For a demo where the viewer should actually *see* the movie, cut to the movie
itself as a segment (`kind: movie` in assemble) rather than filming a terminal
playing it.

## Glyphs

Terminal fonts routinely lack the check marks and box drawing that CLIs
emit; a missing glyph renders as a placeholder box and makes real output
look broken. `fonts-dejavu-core` plus `-t 'fontFamily=DejaVu Sans Mono'`
covers most of it. Check the preflight screenshot before a long session.
