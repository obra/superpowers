#!/usr/bin/env bash

set -euo pipefail

cd "$(dirname "$0")/../.."
python3 tests/codex/validate_examples.py
bash tests/codex/test-real-skills.sh
bash tests/codex/test-multi-agent-e2e.sh
