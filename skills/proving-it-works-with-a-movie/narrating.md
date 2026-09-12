# Narrating

Narration is where the most embarrassing silent failures live: the movie
looks perfect and says the wrong words.

## Choosing a voice

Listen to a sample of your actual sentences — including product names and
jargon — before you render anything with it. A voice that mangles the one
word your movie is about is worse than no narration.

| Engine | Watch for |
|---|---|
| OS built-ins (`say`) | Free and instant; reliably sounds robotic. Fine for a scratch timing pass, not for delivery. |
| Cloud TTS endpoints (e.g. `/v1/audio/speech`) | Deterministic: reads exactly what you send. The safe default. |
| Chat models with audio output | Best prosody, but they are *chat models*: they ad-lib preambles ("Sure, here it is:"). Usable only with a verbatim gate. |
| Local neural TTS, Piper | The default when no key is present: free, offline after a one-time voice download, runs on macOS and Linux. It **mispronounces** unusual names rather than dropping them (our jargon came back as "Smevel's", all 14 words intact) — the opposite of the failure below, and the safer one. |
| Local neural TTS, Kokoro | Free and offline, but drops out-of-vocabulary words **silently**, with a zero exit code. "Every eval on the shelf" became "every on the shelf" with no error at all. |

## Use the script

`scripts/narrate scenes.yaml narration/ --verify on` renders one clip per scene and
picks its engine automatically: a cloud voice when a key is there, Piper
when there isn't. It writes `manifest.json` with the exact text and the
*measured* duration of every clip — which is what make-subtitles and the
assembly step both consume, so nothing downstream has to guess timings.

Force the choice with `--engine openai|openai-chat|piper`. `openai-chat`
buys the best prosody and pays for it with ad-libs, so it is gated below.

## The gate runs even without a key

`narrate --verify on` transcribes every clip, including cached clips, with
local faster-whisper in its own environment and compares the result against
the script. It needs no API key. Missing or failed transcription is a failure;
the first run needs network access to download dependencies and the ASR model.

| Mode | Local transcription behavior |
|---|---|
| `--verify on` | Required for every engine. Unavailable ASR or detected drift returns nonzero and excludes the failed clip from the manifest. Use this for the gated workflow above. |
| `--verify auto` (CLI default) | Tries ASR for Piper and `openai-chat`; reports unavailable ASR but allows the clip. Skips ASR for `openai`. Detected drift still fails. |
| `--verify off` | Skips ASR. |

The `openai-chat` engine's returned transcript is also checked when rendering,
regardless of the ASR mode. That transcript does not prove what the WAV contains.

What it measures is **missing or invented content**, not exact words, and
that distinction is load-bearing. A small ASR mangles unusual names — ours
came back as "Mevil studio" and "Yvel" — so exact matching cries wolf on
good clips. Worse, a genuinely *dropped* word scores as more similar than
two mispronounced ones, so a strict ratio would pass the real defect and
fail the harmless one. The gate therefore flags a large length change or a
run of consecutive words that went missing: a skipped sentence, an ad-libbed
preamble, a clip that came out empty.

It will not catch a single dropped word in a jargon-heavy line. For those,
listen to one clip yourself when you pick the voice.

`narrate` records each clip's text, engine, voice, and synthesis model.
Changing any of these re-renders the clip. Clips without recorded synthesis
settings also re-render; an unchanged clip can be reused and still receives
any requested ASR verification.

## The verbatim gate — required

Never trust the generator's own account of what it produced. Verify the
audio that is actually in the file:

```bash
# transcribe the RENDERED audio, then diff against the source script
ffmpeg -nostdin -v error -i movie.mp4 -map 0:a -ac 1 -ar 16000 narration.wav
# send narration.wav to a transcription API, then compare word sequences
```

A word-sequence diff (lowercase, strip punctuation) catches dropped jargon,
ad-libbed preambles, and whole missing sentences. If the engine returns its
own transcript, diff that too — it is a cheap early signal — but the
rendered audio is the artifact that ships, so it is the one that counts.

When drift is found: regenerate that block and re-verify. Retrying once
clears chat-model preambles almost every time.

## Measure durations; never guess them

The single most common defect in a narrated movie is motion paced against
narration that nobody timed. Write the script, render the audio, `ffprobe`
each clip, *then* build video to those measured lengths.

```bash
ffprobe -v error -show_entries format=duration -of csv=p=0 narration/scene-03.wav
```

Word-count estimates (~2.5 words/sec) are for planning the script only.
Real delivery runs long and varies per block.

## Pronunciation of product names

Check the sample for your own jargon before committing to a voice. If a good
voice mangles one term, spell it phonetically **in the TTS input only**
("S M evals"), never in the script file a human reads. Keep that
substitution in the narrate step so the source text stays clean.

## Native Windows local voice

Use `--engine piper --verify on` with the commands in assembling.md. The
first run downloads the Piper voice and the transcription model; later runs
reuse those caches. `--verify on` transcribes every clip, including cached
WAVs from an earlier run, and treats an unavailable transcriber as a failure
rather than a pass. Afterwards, transcribe the finished movie's audio and
compare each narrated interval with its script. A `kind: movie` segment
keeps its own sound and is checked against its source, not a script.
