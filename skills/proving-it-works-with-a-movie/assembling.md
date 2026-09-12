# Assembling

Turning clips, stills, and narration into one file — and the ffmpeg traps
that cost the most time.

## The segment rule

Per scene, the segment lasts **max(narration, visuals)**. Whichever is
shorter gets padded:

- video short → freeze the last frame (`tpad=stop_mode=clone`)
- audio short → pad with silence (`apad`)

```bash
ffmpeg -nostdin -y -v error -i clip.mp4 -i narration.wav \
  -filter_complex "[0:v]tpad=stop_mode=clone:stop_duration=${PAD}[v];[1:a]apad[a]" \
  -map "[v]" -map "[a]" -t "$DUR" -r 30 -pix_fmt yuv420p \
  -c:v libx264 -preset medium -c:a aac -ar 44100 -ac 2 segment.mp4
```

Then concat the segments (`-f concat -safe 0 -c copy`). Uniform codec
parameters across segments are what make the stream-copy concat valid.

**A long freeze-frame tail is a smell, not a fix.** If a scene's narration
runs 20 seconds past its visuals, the scene is wrong: give the camera
something to do, or cut the words.

## `-nostdin` on every ffmpeg call inside a loop

ffmpeg reads stdin by default and will eat the loop's input.

```bash
while IFS= read -r scene; do
  ffmpeg -nostdin ...          # without this, ffmpeg swallows the rest of the list
done < scenes.txt
```

Symptom when you forget: scenes silently skipped, and an error naming a
*truncated* identifier (`val-landing` for `eval-landing`) because ffmpeg
consumed part of the next line. It reads like a corrupt input file.

## Title and caption cards: render HTML, screenshot it

Do not fight `drawtext`. It is the fragile part of ffmpeg — under macOS
sandbox `textfile=` fails outright ("Either text, a valid file, a timecode
or text source must be provided") even with absolute paths. Write the card
as HTML, screenshot it in the browser you already have open, and treat it as
an image. You get real fonts, CSS layout, and markup accents for free.

Name cards so a lexical glob orders them: `card-00` (title), `card-01..NN`
(scenes), `card-99` (end).

```bash
ffmpeg -nostdin -y -v error -framerate 1/3 -pattern_type glob -i 'card-*.png' \
  -r 30 -pix_fmt yuv420p out.mp4      # 1/3 = each card holds 3s
```

## Burn the subtitles in

Subtitles are on by default; the checker fails a narrated movie without
them. Burn them into the picture so they survive being dropped into Slack,
a PR comment, or a phone — and keep the `.srt` beside the movie as the
sidecar the checker reads (and as the searchable transcript).

```bash
set -euo pipefail
scripts/make-subtitles narration/manifest.json movie.srt \
  --offsets-json segments/offsets.json
scripts/burn-subtitles silent-cut.mp4 movie.srt movie.mp4
```

Burn them at the *end*, over the assembled cut, so cue timings line up with
the final timeline rather than per-segment offsets.

Two traps the script exists to absorb:

- **Burning needs libass, and many ffmpeg builds lack it.** Homebrew's
  default macOS ffmpeg has no `subtitles` filter at all; Debian's has it.
  `burn-subtitles` checks, and falls back to an embedded soft track with a
  loud note rather than pretending it burned anything.
- **ffmpeg 8 removed positional filter options.** `subtitles=movie.srt`
  parses on 5.x and fails on 8.x with "No option name near". Write
  `subtitles=filename=movie.srt`, which works on both.

`Fontsize` is in points against the video height — check it on the contact
sheet, because a size that reads fine at 2560px wide is unreadable when the
movie is watched in a 400px-wide PR preview.

## Verify the encode, then verify the content

```bash
ffprobe -v error -show_entries format=duration,size \
  -show_entries stream=codec_name,width,height -of default=noprint_wrappers=1 out.mp4
```

`ffprobe` proves the container is real. It says nothing about whether the
movie is watchable — that is `check-movie` plus your own eyes on the contact
sheet.

## Keep the pipeline out of scratch

Scene list, narration text, recorder, narrate and assemble scripts belong in
the repo. Scratch directories are cleaned by the OS between sessions; losing
the assembler mid-production means reconstructing it from prose before you
can re-cut a single scene. Ask before committing large media; the *pipeline*
is small and always worth committing.

## Native Windows: the five tools

Use native `uv`, FFmpeg and ffprobe on the test process's PATH. Hard subtitles
require FFmpeg's `subtitles` filter (libass). Install Chrome or Edge for cards.
The tools' Python environments are managed by uv and need Python 3.10+.
First use can
download Python, script dependencies, the local Piper voice, and the local
transcription model. Do that setup before recording. No cloud key is required.
PowerShell needs neither Git Bash nor WSL, tmux, Docker, or administrator rights.

Keep the whole skill directory together: the scripts import their adjacent
helpers. Set `skill` to the skill's loaded base directory, and write a scene
file in `work`. Scene kinds remain `card`, `image`, `frames`, and `movie`;
`kind: movie` retains the source clip's own audio. Other scenes can have
`narration`. Use the measured assembly offsets for subtitles.

PowerShell 5.1 and 7 (each native exit code is checked before continuing):

```powershell
$skill = 'C:/path/to/skills/proving-it-works-with-a-movie'
$work = "$HOME/movie O'Brien λ & [take]"
[IO.Directory]::CreateDirectory($work) | Out-Null
& uv run --script "$skill/scripts/narrate" "$work/scenes.yaml" "$work/narration" --engine piper --verify on
if ($LASTEXITCODE -ne 0) { throw 'narrate failed' }
& uv run --script "$skill/scripts/assemble" "$work/scenes.yaml" "$work/cut.mp4" --narration "$work/narration" --work "$work/assembly work"
if ($LASTEXITCODE -ne 0) { throw 'assemble failed' }
& uv run --script "$skill/scripts/make-subtitles" "$work/narration/manifest.json" "$work/movie.srt" --offsets-json "$work/assembly work/offsets.json"
if ($LASTEXITCODE -ne 0) { throw 'make-subtitles failed' }
& uv run --script "$skill/scripts/burn-subtitles" "$work/cut.mp4" "$work/movie.srt" "$work/movie.mp4"
if ($LASTEXITCODE -ne 0) { throw 'burn-subtitles failed' }
& uv run --script "$skill/scripts/check-movie" "$work/movie.mp4" --out "$work/evidence" --json
if ($LASTEXITCODE -ne 0) { throw 'check-movie failed' }
```

Git Bash: convert paths to native Windows form before passing them to native
uv/Python/FFmpeg. In particular, Python can interpret `/c/...` as `C:\c\...`.
Keep each path quoted; an apostrophe is literal inside Bash double quotes.

```bash
set -euo pipefail
skill=$(cygpath -m '/c/path/to/skills/proving-it-works-with-a-movie')
work=$(cygpath -m "$HOME/movie O'Brien λ & [take]")
mkdir -p "$work"
uv run --script "$skill/scripts/narrate" "$work/scenes.yaml" "$work/narration" --engine piper --verify on
uv run --script "$skill/scripts/assemble" "$work/scenes.yaml" "$work/cut.mp4" --narration "$work/narration" --work "$work/assembly work"
uv run --script "$skill/scripts/make-subtitles" "$work/narration/manifest.json" "$work/movie.srt" --offsets-json "$work/assembly work/offsets.json"
uv run --script "$skill/scripts/burn-subtitles" "$work/cut.mp4" "$work/movie.srt" "$work/movie.mp4"
uv run --script "$skill/scripts/check-movie" "$work/movie.mp4" --out "$work/evidence" --json
```

Keep `movie.srt` beside `movie.mp4`: the checker discovers that basename.
Inspect the finished contact sheet and hard captions, then transcribe the
rendered audio as described in narrating.md. A successful soft-subtitle
fallback is not proof that captions were burned into the picture.

PowerShell 5.1's `Out-File` defaults to UTF-16. For scene YAML/JSON, request
JSON, HTML, and SRT, write UTF-8 explicitly:

```powershell
[IO.File]::WriteAllText($path, $json, [Text.UTF8Encoding]::new($false))
```

Use `-LiteralPath` for PowerShell file operations on paths containing brackets.
BOM-bearing UTF-8 and CRLF scene input are supported; a console's displayed
encoding is not a reliable way to check the bytes in a JSON file.
