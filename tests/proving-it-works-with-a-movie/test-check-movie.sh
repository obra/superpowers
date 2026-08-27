#!/usr/bin/env bash
# Regression tests for scripts/check-movie.
#
# Synthesizes movies with known defects using ffmpeg's lavfi sources - no
# fixtures committed, nothing downloaded - and asserts the checker's verdict
# on each. The front-loaded case reproduces the real failure this skill
# exists to prevent: a movie whose action finishes in the first seconds
# while narration keeps talking over a frozen picture.
#
# Usage: tests/proving-it-works-with-a-movie/test-check-movie.sh
set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
CHECKER="$HERE/../../skills/proving-it-works-with-a-movie/scripts/check-movie"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

pass=0
fail=0

for tool in ffmpeg ffprobe uv; do
  command -v "$tool" >/dev/null || { echo "SKIP: $tool not on PATH"; exit 0; }
done
[ -x "$CHECKER" ] || { echo "FAIL: $CHECKER is not executable"; exit 1; }

# --- fixtures -------------------------------------------------------------
# action for 2s, then a frozen picture for 20s, narration (tone) throughout
ffmpeg -nostdin -y -v error \
  -f lavfi -i "testsrc2=size=320x240:rate=10:d=2" \
  -f lavfi -i "color=c=navy:size=320x240:rate=10:d=20" \
  -f lavfi -i "sine=frequency=300:duration=22" \
  -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v]" \
  -map "[v]" -map 2:a -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest \
  "$WORK/front-loaded.mp4"

# picture changing throughout, narration throughout
ffmpeg -nostdin -y -v error \
  -f lavfi -i "testsrc2=size=320x240:rate=10:d=22" \
  -f lavfi -i "sine=frequency=300:duration=22" \
  -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "$WORK/paced.mp4"

# one static frame for the whole runtime, narration throughout
ffmpeg -nostdin -y -v error \
  -f lavfi -i "color=c=navy:size=320x240:rate=10:d=12" \
  -f lavfi -i "sine=frequency=300:duration=12" \
  -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "$WORK/still.mp4"

# motion, but no audio track at all
ffmpeg -nostdin -y -v error \
  -f lavfi -i "testsrc2=size=320x240:rate=10:d=12" \
  -c:v libx264 -pix_fmt yuv420p "$WORK/silent.mp4"

# subtitles: one covering the whole runtime, one that gives up early
cat > "$WORK/paced.srt" <<'SRT'
1
00:00:00,000 --> 00:00:07,000
A narrated movie needs subtitles:
plenty of people watch muted.

2
00:00:07,000 --> 00:00:14,000
The checker treats their absence
as a defect, not a nicety.

3
00:00:14,000 --> 00:00:21,500
And it notices when they stop
before the narration does.
SRT
head -8 "$WORK/paced.srt" > "$WORK/short.srt"
cp "$WORK/paced.mp4" "$WORK/short.mp4"

# --- assertions -----------------------------------------------------------
check() {  # check <label> <expected-exit> <must-contain> <movie> [extra args...]
  local label="$1" want="$2" needle="$3" movie="$4"; shift 4
  local out rc
  out="$("$CHECKER" "$movie" --out "$WORK/$(basename "$movie" .mp4)-check" "$@" 2>&1)"
  rc=$?
  if [ "$rc" -ne "$want" ]; then
    echo "FAIL  $label: exit $rc, wanted $want"
    echo "$out" | sed 's/^/      /'
    fail=$((fail + 1)); return
  fi
  if ! printf '%s' "$out" | grep -qi -- "$needle"; then
    echo "FAIL  $label: output missing '$needle'"
    echo "$out" | sed 's/^/      /'
    fail=$((fail + 1)); return
  fi
  echo "ok    $label"
  pass=$((pass + 1))
}

check "front-loaded action is rejected"       1 "every visible change happens in the first" "$WORK/front-loaded.mp4"
check "paced + subtitles is accepted"         0 "Mechanical checks pass"                    "$WORK/paced.mp4"
check "narrated without subtitles rejected"   1 "no subtitles"                              "$WORK/paced.mp4" --subs "$WORK/nope.srt"
check "subtitles that stop early rejected"    1 "subtitles stop at"                         "$WORK/short.mp4"
check "subtitle check is opt-outable"         0 "Mechanical checks pass"                    "$WORK/paced.mp4" --subs "$WORK/nope.srt" --no-expect-subtitles
check "a still with audio is rejected"        1 "never reaches a new state"                 "$WORK/still.mp4"
check "missing narration is rejected"         1 "no audio stream"                           "$WORK/silent.mp4"
check "silent movie passes when unnarrated"   0 "Mechanical checks pass"                    "$WORK/silent.mp4" --no-expect-audio
check "a contact sheet is always written"     0 "contact-sheet.png"                         "$WORK/paced.mp4"

echo
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
