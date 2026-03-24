#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BASELINE_PATH="$REPO_ROOT/perf-baselines/runtime-hot-paths.json"
OUTPUT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/superpowers-benchmarks.XXXXXX")"
trap 'rm -rf "$OUTPUT_DIR"' EXIT

command -v cargo >/dev/null 2>&1 || {
  echo "cargo is required to run runtime benchmarks." >&2
  exit 1
}
command -v python3 >/dev/null 2>&1 || {
  echo "python3 is required to evaluate runtime benchmark baselines." >&2
  exit 1
}

while IFS=$'\t' read -r benchmark iterations warmup max_mean; do
  output_path="$OUTPUT_DIR/$benchmark.json"
  (
    cd "$REPO_ROOT"
    cargo bench --quiet --bench "$benchmark" -- --iterations "$iterations" --warmup "$warmup" --output "$output_path"
  )

  python3 - "$output_path" "$benchmark" "$max_mean" <<'PY'
import json
import pathlib
import sys

report_path = pathlib.Path(sys.argv[1])
benchmark = sys.argv[2]
max_mean = float(sys.argv[3])
report = json.loads(report_path.read_text())
mean_ms = float(report["mean_ms"])

print(f"{benchmark}: mean={mean_ms:.3f}ms threshold={max_mean:.3f}ms")
if mean_ms > max_mean:
    raise SystemExit(
        f"{benchmark} exceeded its checked-in mean latency threshold ({mean_ms:.3f}ms > {max_mean:.3f}ms)"
    )
PY
done < <(
  python3 - "$BASELINE_PATH" <<'PY'
import json
import pathlib
import sys

baseline = json.loads(pathlib.Path(sys.argv[1]).read_text())
for benchmark, config in baseline["benchmarks"].items():
    print(
        f"{benchmark}\t{config['iterations']}\t{config['warmup_iterations']}\t{config['max_mean_ms']}"
    )
PY
)

echo "Runtime benchmark thresholds passed."
