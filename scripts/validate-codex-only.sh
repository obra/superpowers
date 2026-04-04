#!/usr/bin/env bash
set -euo pipefail

tests/codex/test-repo-surface.sh
tests/codex/test-skill-discovery.sh
tests/codex/test-forbidden-terms.sh
tests/codex/test-doc-consistency.sh
