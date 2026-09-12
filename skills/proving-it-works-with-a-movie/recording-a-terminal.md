# Recording a terminal

CLIs, TUIs, installs, test runs, agents at work — a large share of what is
worth proving happens in a terminal, and none of it is visible to a browser
recorder or an OS screen capture you probably can't get permission for.

## Native Windows: `examples/film-terminal.py` stands in for tmux

Windows has no tmux, so the example script holds the session instead. `serve`
starts ttyd on the shell you name and a headless Chrome or Edge page showing
it, keeps both alive, and appends the raw terminal output to
`SESSION/terminal.log`. Every other verb is one short call against that
browser. Run `serve` in a background task your harness keeps alive, the way
the visual companion server runs; a one-shot shell that kills its children
on return ends the session.

It needs uv, ttyd, and Chrome or Edge on PATH, or `--ttyd` and `--browser`.
`--shell powershell51|powershell7|gitbash` picks the filmed shell; the shell
you type these commands into is a separate choice. Replace the sample
commands below with the software you are proving.

### PowerShell

Run this block in a background terminal/task your harness keeps alive.
For PowerShell 5.1 use `--shell powershell51`; for PowerShell 7 use
`--shell powershell7`.

```powershell
$skill = 'C:/path/to/skills/proving-it-works-with-a-movie'
$work = "$HOME/movie O'Brien λ & [take]"
$film = "$skill/examples/film-terminal.py"
[System.IO.Directory]::CreateDirectory($work) | Out-Null
& uv run --script $film serve "$work/session" --shell powershell7 --cwd $work
```

In a second terminal/task, define the same paths and wait for readiness.
Repeat these three variable definitions in each tool call if your harness
starts a fresh shell for every call. `-LiteralPath` keeps the brackets in
the sample directory name from being interpreted as wildcards.

```powershell
$skill = 'C:/path/to/skills/proving-it-works-with-a-movie'
$work = "$HOME/movie O'Brien λ & [take]"
$film = "$skill/examples/film-terminal.py"
$deadline = (Get-Date).AddSeconds(60)
while (-not (Test-Path -LiteralPath "$work/session/ready.json")) {
    if ((Get-Date) -gt $deadline) { throw 'Recorder not ready; inspect the serve task output.' }
    Start-Sleep -Milliseconds 200
}
& uv run --script $film run "$work/session" 'echo hello' --record "$work/take-one"
& uv run --script $film run "$work/session" 'Read-Host' --record "$work/take-two" --seconds 2
# Exit 2 means Read-Host is still waiting. Press Enter to finish it in a new take:
& uv run --script $film key "$work/session" Enter --record "$work/take-three"
# A long command can continue across calls; exit 2 here is expected too:
& uv run --script $film run "$work/session" 'Start-Sleep -Seconds 5' --record "$work/take-four" --seconds 1
& uv run --script $film watch "$work/session" --record "$work/take-five" --seconds 10
& uv run --script $film close "$work/session"
```

Read `$LASTEXITCODE` immediately after each invocation. Stop on exit 1;
exit 2 is expected while the interactive command is waiting for input.
Always call `close` when finished, including after a failed command.

When invoking from PowerShell 5.1, escape embedded double quotes with a
backslash before passing a command to native uv: use the command argument
`'python -c \"print(123)\"'`. PowerShell 7 preserves the quotes in
`'python -c "print(123)"'` directly. This depends on the invoking shell,
regardless of which shell you record.

### Git Bash

Convert paths passed to native uv/Python with `cygpath -m`. Run this block
in a background terminal/task your harness keeps alive:

```bash
skill=$(cygpath -m /c/path/to/skills/proving-it-works-with-a-movie)
work=$(cygpath -m "$HOME/movie O'Brien λ & [take]")
film="$skill/examples/film-terminal.py"
mkdir -p "$work"
uv run --script "$film" serve "$work/session" --shell gitbash --cwd "$work"
```

In a second terminal/task, use the same paths. Repeat the three variable
definitions in each tool call if it starts a fresh shell. Keep `set -e`
off for these interactive calls so expected exit 2 does not end the script.

```bash
skill=$(cygpath -m /c/path/to/skills/proving-it-works-with-a-movie)
work=$(cygpath -m "$HOME/movie O'Brien λ & [take]")
film="$skill/examples/film-terminal.py"
deadline=$((SECONDS + 60))
until [[ -f "$work/session/ready.json" ]]; do
    if (( SECONDS >= deadline )); then
        printf '%s\n' 'Recorder not ready; inspect the serve task output.' >&2
        exit 1
    fi
    sleep 0.2
done
uv run --script "$film" run "$work/session" 'echo hello' --record "$work/take-one"
uv run --script "$film" run "$work/session" 'read -r answer' --record "$work/take-two" --seconds 2
# Exit 2 means read is still waiting. Press Enter to finish it in a new take:
uv run --script "$film" key "$work/session" Enter --record "$work/take-three"
# A long command can continue across calls; exit 2 here is expected too:
uv run --script "$film" run "$work/session" 'sleep 5' --record "$work/take-four" --seconds 1
uv run --script "$film" watch "$work/session" --record "$work/take-five" --seconds 10
uv run --script "$film" close "$work/session"
```

Read `$?` immediately after each invocation. Stop on exit 1; exit 2 means
the command remains active. Always call `close` when finished, including
after a failed command. The original `serve` task exits after `close`.

`run` types the command and films at 5 fps into `--record` until the prompt
comes back, holds 1.5 s so the result stays readable, and prints the status
as JSON: `ok` is the shell's own success flag and `exit_code` the last native
program's exit code, which PowerShell keeps from an earlier program when the
command was a cmdlet. PowerShell can also leave its success flag true after
a parse error, so check the terminal output when a command returns without
doing the expected work. The recorder exits 1 when the shell reports failure
and 2 when it is still running after `--seconds`. `key` presses one key and `watch` films
without typing; both wait for the prompt the same way. Every `--record`
directory is a `kind: frames` scene at `rate: 5`; a slow screenshot repeats
the previous frame so the timing stays honest. Use a new or empty directory
for every take, including retakes. A nonempty `--record` directory is refused
before input is sent, preserving the earlier take.

Long work spans takes exactly as on Unix: film the command being issued with
a short `--seconds`, do other things, then `watch` the result as a new take.
The shell, its variables and its cwd persist across calls until `close`,
which kills ttyd, the browser and everything they started.

The viewport is fixed at 1600×900 with a 17 px font. Look at
`SESSION/ready.png` before filming; `serve` refuses a blank canvas, the same
preflight as below.

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
