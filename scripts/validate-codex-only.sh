#!/usr/bin/env bash
set -euo pipefail

tests/codex/test-repo-surface.sh
tests/codex/test-forbidden-terms.sh
tests/codex/test-doc-consistency.sh
tests/codex/test-workflow-parity.sh
tests/codex/test-runtime-smoke.sh
