#!/usr/bin/env bash
# Run all brainstorm server tests.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

npm test
node ws-protocol.test.js
bash start-server.test.sh
