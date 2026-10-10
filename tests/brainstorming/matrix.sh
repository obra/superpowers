#!/usr/bin/env bash
# Runs several skill variants side by side, interleaved, on one scenario.
#
# Use when comparing variants. Codex's behavior drifts between batches run
# at different times, so arms must run in the same window to be comparable.
# Launches rep 1 of every arm, then rep 2 of every arm, and so on, a few
# seconds apart, all in parallel. Results go to OUT_DIR/ARM-rREP/SCENARIO/
# and per-rep logs to OUT_DIR/logs/. Prints a per-arm gate-score tally.
#
# Environment is passed through to converse.sh (CSD, CSD_CODEX_MODEL,
# REAL_CODEX_BIN, TURN_TIMEOUT, CODEX_ARGS, CODEX_EFFORT).

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: matrix.sh -s SCENARIO -o OUT_DIR [-n REPS] [-t MAX_TURNS] [-H HARNESS] ARM=PLUGIN_DIR[|CODEX_ARGS]...

  -s SCENARIO    Scenario under scenarios/.
  -o OUT_DIR     Results root (use a fresh one per matrix).
  -n REPS        Reps per arm (default 8).
  -t MAX_TURNS   Passed to converse.sh (default 1: first turn only).
  -H HARNESS     claude, codex, or pi (default codex).
  ARM=DIR        Arm label and the superpowers checkout it loads.
  ARM=DIR|ARGS   Same, plus extra codex flags for this arm only (CODEX_ARGS).
EOF
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCENARIO="" OUT="" REPS=8 TURNS=1 HARNESS=codex
while getopts "s:o:n:t:H:h" opt; do
  case $opt in
    s) SCENARIO=$OPTARG ;; o) OUT=$OPTARG ;; n) REPS=$OPTARG ;; t) TURNS=$OPTARG ;; H) HARNESS=$OPTARG ;;
    h) usage; exit 0 ;; *) usage >&2; exit 2 ;;
  esac
done
shift $((OPTIND - 1))
[ -n "$SCENARIO" ] && [ -n "$OUT" ] && [ $# -ge 1 ] || { usage >&2; exit 2; }
for spec in "$@"; do
  dir=${spec#*=}; dir=${dir%%|*}
  [[ "$spec" == *=* ]] && { [ -d "$dir" ] || [ "$dir" = curated ]; } || { echo "error: bad ARM=DIR: $spec" >&2; exit 2; }
done

mkdir -p "$OUT/logs"
for i in $(seq 1 "$REPS"); do
  for spec in "$@"; do
    arm=${spec%%=*} dir=${spec#*=} args=""
    [[ "$dir" != *"|"* ]] || { args=${dir#*|}; dir=${dir%%|*}; }
    CODEX_ARGS="${CODEX_ARGS:-} $args" bash "$SCRIPT_DIR/converse.sh" -H "$HARNESS" -s "$SCENARIO" -a "$arm-r$i" -P "$dir" -t "$TURNS" -o "$OUT" \
      > "$OUT/logs/$arm-r$i.log" 2>&1 &
    sleep 3
  done
done
wait

scores=$(bash "$SCRIPT_DIR/gate-score.sh" "$OUT" "$SCENARIO")
for spec in "$@"; do
  arm=${spec%%=*}
  echo "$arm: $(grep -E "^[A-Z]+ +$arm-r[0-9]+/" <<< "$scores" | awk '{print $1}' | sort | uniq -c | tr -s ' ' | tr '\n' ' ')"
done
