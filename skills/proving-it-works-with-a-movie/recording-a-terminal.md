# Recording a terminal

CLIs, TUIs, installs, test runs, agents at work — a large share of what is
worth proving happens in a terminal, and none of it is visible to a browser
recorder or an OS screen capture you probably can't get permission for.

The technique: serve the terminal over HTTP with **ttyd**, attach it to a
**tmux** session, screenshot the page from a browser, and drive the session
with `tmux send-keys` from outside. Real characters from a real shell, in a
window you fully control. `examples/film-terminal.py` is a working
implementation of everything below.

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
