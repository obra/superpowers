# Recording motion from a live app

For when the interaction itself is the claim. Drive a real browser against a
real running instance; every pixel is the product.

## Record against a copy, always

A demo movie *writes*: it creates records, saves edits, fires jobs. Copy the
data tree to a scratch suite and serve that. Never point the recorder at the
tree you care about, and never at a production instance.

## Two capture styles

**Native video capture** (Playwright `record_video_dir`, Chrome DevTools
screencast) gives you a continuous clip for free. Playwright needs its own
bundled encoder — `playwright install ffmpeg` — separate from system ffmpeg.
Good when you want one continuous take.

**Deliberate frame capture** (screenshot per beat, encode at a chosen rate)
costs more code and buys per-beat control over pacing, which is what you
need when narration has to line up. This is the right default for a narrated
tutorial.

## Draw a cursor or the app appears haunted

Browser automation moves an invisible pointer: a click looks like the UI
changing by itself, which is exactly what a skeptical reviewer discounts.
Inject a cursor overlay on every page and animate it to each target before
clicking, with a press pulse on mousedown.

```js
// injected via addInitScript / Page.addScriptToEvaluateOnNewDocument
const ring = document.createElement("div");
ring.style.cssText = "position:fixed;width:20px;height:20px;border:3px solid " +
  "rgba(255,64,129,.9);border-radius:50%;pointer-events:none;z-index:2147483647;" +
  "transform:translate(-50%,-50%);transition:transform .08s";
document.addEventListener("DOMContentLoaded", () => document.body.appendChild(ring));
document.addEventListener("mousemove", e => {
  ring.style.left = e.clientX + "px"; ring.style.top = e.clientY + "px";
}, true);
document.addEventListener("mousedown",
  () => ring.style.transform = "translate(-50%,-50%) scale(.6)", true);
```

Type at human pace too (~55ms/char, longer after punctuation). Instant text
insertion reads as a scripted fake even when it isn't.

## Describe scenes as data, not code

Put the movie in a scene list — id, narration, ordered actions — and keep the
recorder generic. You will re-record individual scenes many times; editing a
YAML entry beats editing a script every time. Verbs worth having:
`goto`, `wait_for`, `click`, `type`, `append` (caret to end, then type),
`select`, `pause`.

Check your scene list against the recorder's actual verbs *before* a long
pass. A verb the recorder doesn't implement fails at record time, after
you've spent the wall clock.

## Only type into empty fields

Automation appends at whatever caret exists. To edit existing text you need
an explicit caret move (`ControlOrMeta+ArrowDown` to end, then type).
Anything else silently produces mangled input on camera.

## When the correct behavior is invisible

Some claims are proven by *nothing changing*: state survives a reload,
a retry is idempotent, a cache returns the same answer. Filmed naively, the
before and after frames are pixel-identical and the movie shows nothing at
all — a viewer cannot tell the reload happened, and the mechanical gate will
correctly report a picture that stopped moving.

Stage a visible marker of **the event**, not the effect: navigate to
`about:blank` and back rather than reloading in place, so there is a real
teardown and a genuinely blank beat on camera, then the restored state.
Same for a restart — show the process dying.

Hold that marker beat for **more than one second**. `check-movie` samples the
picture at 1 Hz; a 600ms blank falls between two samples and is invisible to
the gate even though it is real. Anything you want the checker (or a viewer)
to register needs ~1.3s or more.

## Screenshot-based capture: navigation orphans an in-flight capture

Driving CDP directly, a `Page.captureScreenshot` issued as a navigation
begins never gets a reply — not slowly, *never*. A capture loop that awaits
it hangs until whatever global timeout you have expires.

Race every capture against a short timeout (~700ms) and skip the frame:

```js
const shot = await Promise.race([
  send("Page.captureScreenshot", { format: "png" }),
  new Promise(r => setTimeout(() => r(null), 700)),
]);
if (shot) writeFrame(shot.data);   // dropped frames are fine; a hung loop is not
```

## Slow real work does not fit inside a scene

A genuine multi-minute operation (a model generating, a build, a deploy)
cannot be waited out inside a recording pass — and if the recorder owns the
server, shutting it down at end-of-pass kills the job mid-flight and leaves
half-written artifacts.

Split into passes: record up to the trigger, let the pass end, produce the
artifact off-camera with the normal CLI, then record the pass that opens the
finished result. The movie is honest — the work really happened — and no
scene depends on a job outliving the process that started it.

## App-specific gotchas worth checking before a pass

- **Auth in the URL**: apps that read a token from `?k=` on first load and
  scrub it need the token on the *first* navigation of each fresh context
  only; tagging every navigation forces reloads and breaks hash routing.
- **Typed fields with parsers**: a value like `Yes`/`No`/`On`/`Off` in a
  YAML-backed form field saves as a boolean and can crash the app on camera.
