#!/usr/bin/env bash
# Runs one experiment: N reps of converse.sh for a scenario, in parallel.
#
# Use when comparing skill variants. Each rep is a separate converse.sh run
# under OUT_DIR/EXPERIMENT-rREP/SCENARIO/, launched a few seconds apart.
# Per-rep logs go to OUT_DIR/logs/. Prints each rep's summary line when all
# are done. Score with gate-score.sh (first turn) or tech-lines.sh.
#
# Environment is passed through to converse.sh (CSD, CSD_CODEX_MODEL,
# REAL_CODEX_BIN, TURN_TIMEOUT, CODEX_ARGS, CODEX_EFFORT).

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: batch.sh -x EXPERIMENT -s SCENARIO -P PLUGIN_DIR -o OUT_DIR [-n REPS] [-t MAX_TURNS] [-H HARNESS]

  -x EXPERIMENT  Label, e.g. "e2-description".
  -s SCENARIO    Scenario under scenarios/.
  -P PLUGIN_DIR  Superpowers checkout to load.
  -o OUT_DIR     Results root, shared across experiments.
  -n REPS        Parallel reps (default 5).
  -t MAX_TURNS   Passed to converse.sh (default 1: first turn only).
  -H HARNESS     claude or codex (default codex).
EOF
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXP="" SCENARIO="" PLUGIN="" OUT="" REPS=5 TURNS=1 HARNESS=codex
while getopts "x:s:P:o:n:t:H:h" opt; do
  case $opt in
    x) EXP=$OPTARG ;; s) SCENARIO=$OPTARG ;; P) PLUGIN=$OPTARG ;; o) OUT=$OPTARG ;;
    n) REPS=$OPTARG ;; t) TURNS=$OPTARG ;; H) HARNESS=$OPTARG ;;
    h) usage; exit 0 ;; *) usage >&2; exit 2 ;;
  esac
done
[ -n "$EXP" ] && [ -n "$SCENARIO" ] && [ -n "$PLUGIN" ] && [ -n "$OUT" ] || { usage >&2; exit 2; }

mkdir -p "$OUT/logs"
for i in $(seq 1 "$REPS"); do
  bash "$SCRIPT_DIR/converse.sh" -H "$HARNESS" -s "$SCENARIO" -a "$EXP-r$i" -P "$PLUGIN" -t "$TURNS" -o "$OUT" \
    > "$OUT/logs/$EXP-$SCENARIO-r$i.log" 2>&1 &
  sleep 3
done
wait
for i in $(seq 1 "$REPS"); do
  grep -h 'turns=' "$OUT/logs/$EXP-$SCENARIO-r$i.log" | sed 's/ -> .*//' || echo "$EXP-r$i $SCENARIO: no summary; see $OUT/logs/$EXP-$SCENARIO-r$i.log"
done
