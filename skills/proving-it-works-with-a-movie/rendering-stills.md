# Composited stills

The cheap route, and the right one whenever the *sequence of states* is the
claim and motion is decoration. Real screenshots of the running product,
captioned, held long enough to read.

Adapted from `rendering-a-demo-movie.md` in obra/superpowers PR #1931.

## 1. Capture real scene frames

Fix the viewport first so every frame composes identically. Per beat:
navigate or drive the app into the state, screenshot to `frame-NN.png`, and
**read the PNG back** to confirm you got the state you meant. One deliberate
screenshot per beat; no fps.

The read-back is not optional. It is what catches a shot taken mid-scroll,
mid-animation, or before a fetch resolved — the defect that otherwise ships.

## 2. Sequence the screenshots as they are

Do not composite caption bars onto the stills. Subtitles carry the words
now (assembling.md), so a caption strip burned into each frame duplicates
them, competes with them, and has to be re-rendered every time you reword a
sentence. The screenshot is the evidence; leave it alone.

Name the shots so a lexical glob orders them — `shot-01.png` … `shot-NN.png`
— and let the assembly step hold each one for its narration.

A title and an end card are still worth having, and those genuinely are
compositing: render them as HTML and screenshot them rather than fighting
ffmpeg `drawtext` (see assembling.md). Name them `shot-00` and `shot-99` so
the same glob picks them up in the right place.

## 3. Hold each shot for its narration

If the movie is narrated, each shot's duration is its narration clip's
measured length (plus a short beat), not a fixed interval. This is what
keeps a stills movie in sync by construction — the picture advances exactly
when the sentence about it ends.

Unnarrated, `-framerate 1/3` (3s per shot) is a reasonable default; anything
faster than ~2.5s is unreadable.

## 4. Gate it

Run `"$SKILL_DIR/scripts/check-movie"` (see SKILL.md for the path), open the
contact sheet, and look. A stills movie earns a
frozen-tail warning when its final card outlasts its last narration by a
lot — that usually means the closing card is doing too much work, or the
last scene should have been two.
