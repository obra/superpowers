# Recording a Proof Movie (ffmpeg + avfoundation)

Produce a watchable `.mp4`/`.mov` that proves an e2e run happened, that a
reviewer can audit and re-derive, and whose hashes match the raw artifacts it
renders. This is the fallback-that-is-actually-better when OS screen capture
is permission-blocked (macOS returns wallpaper-only frames): render the movie
from the real run's log instead of fighting the OS for pixels.

## Try the real capture first — refuse to fake it

```bash
# probe capture devices
/opt/homebrew/bin/ffmpeg -f avfoundation -list_devices true -i ""

# short validation grab, then extract frame 1 and LOOK at it
/opt/homebrew/bin/ffmpeg -y -hide_banner -f avfoundation -framerate 15 -capture_cursor 1 \
  -t 2 -i '<screen-index>:none' -vf scale=1280:-2 -pix_fmt yuv420p /tmp/cap-validate.mp4
/opt/homebrew/bin/ffmpeg -y -hide_banner -i /tmp/cap-validate.mp4 -frames:v 1 /tmp/cap-validate.png
```

If the frame is just wallpaper (app window missing), Screen Recording is
blocked for this process. **Do not ship it.** Say so explicitly and switch to
the rendered evidence reel below. `screencapture -x out.png` has the same
limitation; `screencapture -x -l <windowID> out.png` can grab a single window
if you can resolve its CoreGraphics window id.

## Run the real gate as the evidence source

Wrap the actual e2e test/command so the log carries machine-checkable
markers. Use `bash`, not `zsh` — zsh's read-only `$status` injects a spurious
error *after* a passing run and pollutes the movie.

```bash
run_log=<evidence-dir>/run.log
bash -o pipefail -c '
  {
    printf "MANUAL_E2E_KIND=<name>\n";
    printf "STARTED_AT="; date -u +%Y-%m-%dT%H:%M:%SZ;
    <the real e2e command>;             # e.g. xcodebuild test-without-building ... -resultBundlePath ...
    rc=$?;
    printf "FINISHED_AT="; date -u +%Y-%m-%dT%H:%M:%SZ;
    printf "EXIT_STATUS=%s\n" "$rc";
    exit "$rc"
  } 2>&1 | tee "$1"
' bash "$run_log"
```

## Snapshot external state before and after

If the run touches a remote host or a shared tmux, snapshot it identically
pre- and post-run and diff. Equal snapshots prove the run left no residue.

```bash
host=<host>
snapshot_path=<evidence-dir>/pre-snapshot.txt
bash -o pipefail -c 'ssh "$1" "$2" | tee "$3"' bash \
  "$host" \
  'date -Is; tmux list-sessions -F "#{session_name}|#{session_windows}|attached=#{session_attached}"; ps -eo pid=,args= | awk "/<helper>/ {print}"; find /tmp -maxdepth 1 -name "<sock-glob>" | wc -l' \
  "$snapshot_path"
# ... run gate ... then repeat for post-snapshot.txt. Begin comparison only after both capture commands succeed.
```

## Render the reel from the log

Draw 1920x1080 RGB frames from the log and snapshots (title / exact command
shape / result / before-after diff / evidence bundle) and stream
`img.tobytes()` into a single ffmpeg pipe. Keep it in a saved
`generate_*_movie.py` so it is re-runnable and auditable — don't leave it as a
one-shot heredoc for anything you'll repeat.

```python
from PIL import Image, ImageDraw, ImageFont
import subprocess

W, H, FPS = 1920, 1080, 15
SANS = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 42)   # macOS system fonts
MONO = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 24)

cmd = [
    '/opt/homebrew/bin/ffmpeg', '-y', '-hide_banner',
    '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
    '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', 'out.mov',
]
proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
for frame_count, render in scenes:            # scenes = [(nframes, render_fn), ...]
    denom = max(1, frame_count - 1)
    for i in range(frame_count):
        proc.stdin.write(render(i / denom).tobytes())   # render() -> PIL RGB Image, W x H
proc.stdin.close()
if proc.wait() != 0:
    raise SystemExit('ffmpeg failed')
```

## Verify the encoding with ffprobe

```bash
/opt/homebrew/bin/ffprobe -v error \
  -show_entries format=duration,size \
  -show_entries stream=codec_name,width,height,nb_frames \
  -of default=noprint_wrappers=1 out.mov
# expect e.g. codec_name=h264, width=1920, height=1080, real duration/nb_frames
```

## Extract frames, build a contact sheet, and look at it

```bash
mkdir -p frame-checks
for t in 00:00:03 00:00:24 00:00:45 00:01:04; do
  /opt/homebrew/bin/ffmpeg -y -hide_banner -ss "$t" -i out.mov \
    -frames:v 1 -update 1 "frame-checks/${t//:/-}.png"
done
# PIL: paste the extracted frames (resized) into a 2xN contact-sheet.png, labeled by timestamp
```

Then actually view `contact-sheet.png` (and any suspect full-size frame) to
confirm the text is legible. If a panel overflows or a frame is unreadable,
fix the generator and regenerate — do not ship an unreadable reel.

## Hash the bundle

```bash
shasum -a 256 out.mov frame-checks/contact-sheet.png run.log > SHA256SUMS
shasum -a 256 -c SHA256SUMS
```

If you later fix anything the movie renders (a wrong timestamp, a stale test
selector, a log line), **regenerate the movie and re-hash**. A hash that no
longer matches the log is a lie.

## Non-negotiables

- Never present a wallpaper-only or blank capture as evidence. Disclose the
  OS limitation and render an auditable reel instead — say so plainly; that
  pivot is the honest outcome, not a fallback to apologize for.
- The raw log and pre/post snapshots live *next to* the movie. The movie is
  derived from them, not a substitute for them.
- `ffprobe` confirms the container is real; the contact sheet plus a human
  view of it confirms it's legible. Neither alone is sufficient.
- `SHA256SUMS` covers the movie, the contact sheet, and the log — regenerate
  it whenever any source artifact changes.
- Keep the working tree clean: isolate scratch paths, snapshot/clean external
  state, and don't commit evidence artifacts unless the repo already tracks
  that kind of evidence.
