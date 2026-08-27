#!/usr/bin/env bash
# Regression tests for scripts/assemble and scripts/make-subtitles.
#
# The property that matters: a segment lasts max(narration, visuals), and
# the scene offsets written for the subtitler match where scenes actually
# start in the finished cut. Hand-computed offsets silently mistime every
# cue after an inserted scene, which is why assemble emits them.
#
# Usage: tests/proving-it-works-with-a-movie/test-assemble.sh
set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPTS="$HERE/../../skills/proving-it-works-with-a-movie/scripts"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
pass=0; fail=0

for tool in ffmpeg ffprobe uv; do
  command -v "$tool" >/dev/null || { echo "SKIP: $tool not on PATH"; exit 0; }
done

ok() { echo "ok    $1"; pass=$((pass + 1)); }
no() { echo "FAIL  $1"; fail=$((fail + 1)); }
dur() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }
about() {  # about <actual> <expected> <tolerance>
  awk -v a="$1" -v b="$2" -v t="$3" 'BEGIN{exit !(a-b<t && b-a<t)}'
}

mkdir -p "$WORK/shots"
for i in 1 2 3 4; do
  ffmpeg -nostdin -y -v error -f lavfi \
    -i "color=c=0x${i}0${i}0${i}0:size=320x180:d=0.1" -frames:v 1 \
    "$WORK/shots/s0$i.png"
done
# a 6-second narration stand-in, so the 4s of pictures must be padded to it
mkdir -p "$WORK/narration"
ffmpeg -nostdin -y -v error -f lavfi -i "sine=frequency=300:duration=6" \
  "$WORK/narration/body.wav"
python3 - "$WORK" <<'PY'
import json, sys, subprocess
w = sys.argv[1]
d = float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration",
    "-of","csv=p=0",f"{w}/narration/body.wav"],capture_output=True,text=True).stdout)
json.dump([{"id":"body","text":"one two three four five six seven eight nine ten",
            "wav":"body.wav","duration":d}], open(f"{w}/narration/manifest.json","w"))
PY

cat > "$WORK/scenes.yaml" <<'YAML'
resolution: { width: 640, height: 360 }
fps: 30
scenes:
  - id: opener
    kind: image
    src: shots/s01.png
    duration: 2
  - id: body
    kind: frames
    src: shots
    rate: 1.0
YAML

out="$WORK/out.mp4"
if "$SCRIPTS/assemble" "$WORK/scenes.yaml" "$out" >"$WORK/log" 2>&1; then
  ok "assemble runs"
else
  no "assemble runs"; sed 's/^/      /' "$WORK/log"
fi

# opener 2s + body max(4s pictures, 6s narration) = 8s
total="$(dur "$out")"
if about "$total" 8 0.4; then ok "segment = max(narration, visuals)"
else no "segment = max(narration, visuals): got ${total}s, wanted ~8"; fi

offset="$(python3 -c "import json;print(json.load(open('$WORK/segments/offsets.json'))['body'])" 2>/dev/null)"
if about "${offset:-0}" 2 0.3; then ok "offsets.json places the narrated scene"
else no "offsets.json places the narrated scene: got ${offset:-none}, wanted ~2"; fi

if "$SCRIPTS/make-subtitles" "$WORK/narration/manifest.json" "$WORK/out.srt" \
     --offsets-json "$WORK/segments/offsets.json" >/dev/null 2>&1 \
   && grep -q "00:00:0[2-9]" "$WORK/out.srt"; then
  ok "cues start at the scene's real offset, not zero"
else
  no "cues start at the scene's real offset, not zero"
fi

echo
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
