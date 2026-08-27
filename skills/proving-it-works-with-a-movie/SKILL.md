---
name: proving-it-works-with-a-movie
description: Use when asked for a demo, screencast, tutorial, walkthrough, or proof video of software actually running, when a reviewer needs to see a feature work rather than take your word for it, or when handing over any video artifact of app behavior
---

# Proving It Works With a Movie

## Overview

A movie is evidence. Every way it fails is silent: no crash, no red text,
just an artifact that looks fine to whoever made it and is obviously broken
to the first person who watches it.

**Core principle: you have not made a movie until you have looked at the
movie.** Not the frames going in. The finished file coming out.

## Pick the route

| What you have to show | Route |
|---|---|
| Interaction happening: typing, clicking, a list updating live | Browser-driven motion → recording-motion.md |
| A CLI, a TUI, an install, a test run, an agent working | Terminal → recording-a-terminal.md |
| A sequence of real states, motion optional | Composited stills → rendering-stills.md |
| OS capture blocked (wallpaper-only frames), or the thing to prove is a *run*, not a UI | Reel rendered from the run's own log → rendering-from-a-log.md |

Stills are a legitimate movie. Reach for motion only when the *motion* is
the claim; it costs several times more to build and is where sync defects
live.

**Never** mock, stage, or reenact. If a beat can't be shown for real
(no credentials, no data, a 40-minute job), cut it and say why. A movie
that quietly fakes one beat is worthless as evidence for any beat.

## The gate — every route, before you hand anything over

```bash
# $SKILL_DIR is this skill's own directory - the "Base directory for this
# skill" path printed when it loads. Installed as a plugin that is
# $CLAUDE_PLUGIN_ROOT/skills/proving-it-works-with-a-movie
"$SKILL_DIR/scripts/narrate"        scenes.yaml narration/   # voice, gated
"$SKILL_DIR/scripts/assemble"       scenes.yaml silent-cut.mp4
"$SKILL_DIR/scripts/make-subtitles" narration/manifest.json movie.srt \
                                    --offsets-json segments/offsets.json
"$SKILL_DIR/scripts/burn-subtitles" silent-cut.mp4 movie.srt movie.mp4
"$SKILL_DIR/scripts/check-movie"    movie.mp4      # nonzero exit: do not ship
```

It samples picture and sound on one timeline and fails the movie when the
action is crammed into the first seconds while narration keeps talking, when
the picture never changes, when the audio is silent, or when a narrated
movie has no subtitles (or subtitles that quit before the narration does). It samples the
picture at 1 Hz, so any beat that must register — a flash, a blank frame, a
transition — has to be held longer than a second. Then:

1. **Open the contact sheet it wrote and actually look at it.** Identical
   tiles mean a frozen movie. Unreadable text means your viewport is wrong.
2. **If narrated: transcribe the rendered audio and diff it against your
   script.** Not the TTS engine's claim about what it said — the audio in
   the finished file. See narrating.md.
3. Fix, regenerate, re-run. Never patch the report instead of the movie.

## The silent failures

| What you get | Why it happens |
|---|---|
| Narrator talks over a picture that stopped moving | Sleeps guessed against narration nobody measured |
| A word missing from the narration | Local TTS drops out-of-vocabulary terms with no error |
| "Sure, here it is:" spoken aloud | Chat-model TTS ad-libs; it is not a TTS endpoint |
| Clicks that appear to happen by themselves | Automation draws no cursor |
| Wallpaper, or a blank window | OS screen-recording permission denied; capture "succeeds" |
| A scene missing, error naming a truncated file | `ffmpeg` ate the loop's stdin (`-nostdin`) |
| Your real data mutated | You recorded against the live tree; the movie writes |
| Nothing visibly happens, because nothing visibly *should* | The claim is "state survived" — film the event, not the effect (recording-motion.md) |
| A muted viewer gets nothing | Narration without subtitles. `narrate` + `make-subtitles` produce them; burn them in |

## Red flags — stop

- "The frames looked right" → frames are not a timeline. Run the checker.
- "ffprobe says 27 seconds" → duration is not content.
- "The TTS returned 200" → generation is not delivery. Transcribe it.
- "I'll note the glitch in the handover" → regenerate it instead.
- "Close enough to demo" → you are about to hand a reviewer a frozen movie.
- "No API key, so no narration" → `narrate` falls back to a local voice.
- "I'll add subtitles later" → later is after someone watched it muted.

## Keep the pipeline

Scene list, narration text, and build scripts are **committed files**, not
scratch. Scratch directories get cleaned mid-production and a movie you
can't rebuild is a movie you can't fix. See assembling.md.
