# Rendering a Demo Movie (browser-composited)

Turn a real, running app into a short titled/captioned demo `.mp4` whose
frames are genuine screenshots of the product — not mockups — and verify the
output is actually correct before handing it over. Needs a running instance
of the app, a browser-automation tool that can navigate, run JS (`eval`), set
a viewport, and screenshot to a path, plus `ffmpeg`/`ffprobe`, and a scratch
dir such as `/tmp/app-movie/`.

## Step 1 — capture real scene frames from the live app

Set a fixed viewport, then per scene: navigate/interact via JS to compose the
shot, screenshot to `frame-NN.png`, and **read the PNG back to confirm** the
shot is what you intended. No fixed fps — one deliberate screenshot per scene
beat.

```
use_browser: {"action":"navigate","payload":"http://localhost:<port>/"}
use_browser: {"action":"screenshot","payload":{"path":"/tmp/app-movie/frame-01.png"}}
# ...navigate/eval to set up each subsequent scene, screenshot frame-02..frame-NN
```

## Step 2 — composite title/caption/end cards in the browser

Prefer this over ffmpeg `drawtext`, which is fragile: on macOS-under-sandbox,
`textfile=` reliably fails with `Either text, a valid file, a timecode or
text source must be provided` (even with absolute paths), while a trivial
inline `text=Foo` may work. Don't fight it. Render cards as HTML and
screenshot them — you also get real fonts, `<b>` accents, and CSS layout for
free.

`card.html` (param-driven: title / end / image+caption-bar):

```html
<!doctype html>
<meta charset="utf-8">
<style>
  body { margin:0; width:1400px; height:960px; overflow:hidden;
         font-family:Georgia,serif; background:#faf8f4; }
  .frame { width:1400px; height:900px; display:block; }        /* the app screenshot */
  .bar   { width:1400px; height:60px; background:#2a2722; color:#faf8f4;
           display:flex; align-items:center; justify-content:center;
           font-size:26px; letter-spacing:.02em; }             /* caption strip */
  .bar b { color:#e8b04a; font-weight:normal; }
  .title { height:960px; display:flex; flex-direction:column;
           align-items:center; justify-content:center; gap:24px; }
  .title h1 { font-size:120px; margin:0; color:#b3422f; font-weight:normal; }
  .title p  { font-size:40px; margin:0; color:#44403a; }
  .title.dark { background:#2a2722; } .title.dark p { color:#faf8f4; }
  .title.dark p.accent { color:#b3422f; font-size:30px; }
</style>
<body><script>
  const q = new URLSearchParams(location.search);
  if (q.get("mode") === "title") {
    document.body.innerHTML = '<div class="title"><h1>App Name</h1><p>one-line tagline</p></div>';
  } else if (q.get("mode") === "end") {
    document.body.innerHTML = '<div class="title dark"><p>deployed to production · [DATE]</p><p class="accent">App Name — org</p></div>';
  } else {
    document.body.innerHTML = '<img class="frame" src="' + q.get("img") + '"><div class="bar">' + q.get("cap") + '</div>';
  }
</script></body>
```

Drive it (name cards so a lexical glob orders them title → scenes → end:
`card-00` … `card-07` … `card-99`):

```
use_browser: {"action":"set_viewport","payload":{"width":1400,"height":960}}
use_browser: {"action":"navigate","payload":"file:///tmp/app-movie/card.html?mode=title"}
use_browser: {"action":"screenshot","payload":{"path":"/tmp/app-movie/card-00.png"}}
# per scene: define a helper once, then swap innerHTML and screenshot:
use_browser: {"action":"eval","payload":"window.__setCard=(img,cap)=>{document.body.innerHTML='<img class=\"frame\" src=\"'+img+'\"><div class=\"bar\">'+cap+'</div>';return img;}; __setCard('frame-01.png','The scene resolves — it lands in <b>New state</b>')"}
use_browser: {"action":"screenshot","payload":{"path":"/tmp/app-movie/card-01.png"}}
# ...repeat __setCard + screenshot for frame-02..frame-07 -> card-02..card-07
use_browser: {"action":"navigate","payload":"file:///tmp/app-movie/card.html?mode=end"}
use_browser: {"action":"screenshot","payload":{"path":"/tmp/app-movie/card-99.png"}}
```

## Step 3 — concatenate the cards

Pure image concat, no drawtext. `-framerate 1/3` holds each card 3 seconds;
the `card-*` glob orders them.

```bash
cd /tmp/app-movie && \
ffmpeg -y -loglevel error -framerate 1/3 -pattern_type glob -i 'card-*.png' \
  -vf "scale=1400:960" -r 30 -pix_fmt yuv420p ~/Desktop/app-demo.mp4 && \
ffprobe -v error -show_entries format=duration -of csv=p=0 ~/Desktop/app-demo.mp4
# 9 cards -> 27.000000
```

## Step 4 — verify the artifact (do not skip)

Extract a mid-movie frame and actually look at it; duration/size are
necessary but not sufficient. This is the step that catches a scene
screenshotted mid-scroll (half-blank) before it ships.

```bash
ffmpeg -y -loglevel error -ss 13 -i ~/Desktop/app-demo.mp4 -frames:v 1 /tmp/app-movie/check.png
# then Read check.png; if a scene is wrong, re-capture just that frame-NN,
# recompose its card-NN.png, and re-run Step 3.
```

## If you must use ffmpeg drawtext (failed under sandbox — kept for reference)

This is the approach that **FAILED** under macOS sandbox (`textfile=`
unreadable). Inline `text=` may still work for short labels; per-scene
captions letterbox the shot and draw text into the padding:

```bash
FONT=/System/Library/Fonts/Helvetica.ttc
# title card (lavfi solid color + two inline drawtext)
ffmpeg -y -loglevel error -f lavfi -i "color=c=0xfaf8f4:s=1400x960:d=3" \
  -vf "drawtext=fontfile=$FONT:text='App Name':fontsize=110:fontcolor=0xb3422f:x=(w-text_w)/2:y=360,drawtext=fontfile=$FONT:text='one-line tagline':fontsize=42:fontcolor=0x44403a:x=(w-text_w)/2:y=510" \
  -r 30 -pix_fmt yuv420p seg-00.mp4
# a captioned scene: scale to 1400x900, pad 60px dark bar, caption in the bar
ffmpeg -y -loglevel error -loop 1 -i frame-01.png -t 3 \
  -vf "scale=1400:900,pad=1400:960:0:0:color=0x2a2722,drawtext=fontfile=$FONT:text='caption text':fontsize=30:fontcolor=0xfaf8f4:x=(w-text_w)/2:y=918" \
  -r 30 -pix_fmt yuv420p seg-01.mp4
# concat demuxer
for f in seg-*.mp4; do echo "file '$f'"; done > list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i list.txt -c copy ~/Desktop/app-demo.mp4
```

## Why the browser-composited path wins

- Real product screenshots as scenes are unfakeable — an honest "show it
  off."
- No dependency on ffmpeg font rendering, the flaky part; cards get real
  fonts, rich markup (`<b>` accents), and CSS layout.
- Deterministic ordering via zero-padded `card-NN.png` filenames plus glob.
- The extract-a-frame-and-read-it check in Step 4 is the honesty gate: it is
  how a bad frame gets caught instead of shipped.
