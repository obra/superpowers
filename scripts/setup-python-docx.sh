#!/usr/bin/env bash

# Ensures the `python-docx` library is available for the docx-builder-gen skill.
# The skill's extraction script (scripts/extract_docx.py) imports `docx`.
# This step is best-effort: a missing Python toolchain warns but never fails
# the overall install, since no other tool depends on it.

set -euo pipefail

PY="${PYTHON_BIN:-python3}"

if ! command -v "$PY" >/dev/null 2>&1; then
  echo "python3 not found; skipping python-docx (needed only by the docx-builder-gen skill)." >&2
  exit 0
fi

if "$PY" -c "import docx" >/dev/null 2>&1; then
  echo "python-docx already available."
  exit 0
fi

echo "Installing python-docx (docx-builder-gen skill dependency)..."

# PEP 668 marks system interpreters as externally-managed, which blocks plain
# installs. Try a user install first, then fall back to --break-system-packages.
if "$PY" -m pip install --user python-docx >/dev/null 2>&1; then
  echo "python-docx installed (--user)."
elif "$PY" -m pip install --user --break-system-packages python-docx >/dev/null 2>&1; then
  echo "python-docx installed (--user --break-system-packages)."
else
  echo "Could not install python-docx automatically." >&2
  echo "Install it manually for the docx-builder-gen skill, e.g.:" >&2
  echo "  $PY -m pip install --user python-docx" >&2
  echo "  # or inside a virtualenv" >&2
  exit 0
fi

if "$PY" -c "import docx" >/dev/null 2>&1; then
  echo "Verified: python-docx import works."
else
  echo "python-docx installed but not importable by $PY; check your PATH/venv." >&2
fi
