#!/usr/bin/env bash
# Regression test: skill-trigger queue runner must derive completed cases from the baseline run file.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "--- Skill Trigger Queue Sync ---"

output="$(cd "$REPO_ROOT" && ruby <<'RUBY'
require File.expand_path("tests/skill-trigger/run_queue_batch", Dir.pwd)

baseline_ids = completed_ids_from_run(RUN_PATH)
queue_ids = completed_ids

missing = baseline_ids - queue_ids
extra = queue_ids - baseline_ids

if missing.empty? && extra.empty?
  puts "PASS"
else
  warn "baseline_ids=#{baseline_ids.inspect}"
  warn "queue_ids=#{queue_ids.inspect}"
  warn "missing=#{missing.inspect}"
  warn "extra=#{extra.inspect}"
  exit 1
end
RUBY
)"

if [ "$output" = "PASS" ]; then
  echo "  [PASS] queue runner completion set matches observed baseline entries"
else
  echo "  [FAIL] unexpected output from queue sync check"
  printf '%s\n' "$output"
  exit 1
fi
