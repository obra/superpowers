"""
conftest.py — pytest configuration for scripts/gemini-builder tests.

Problem:
    The directory is named 'gemini-builder' (with a hyphen), which is not a
    valid Python identifier. This prevents using either:
      - Relative imports (..reader) — fails when pytest collects tests as
        top-level modules without a proper package context.
      - Absolute imports (scripts.gemini-builder.reader) — SyntaxError
        because hyphens are not valid in dotted module paths.

Solution:
    Inject the 'scripts/gemini-builder' directory into sys.path so that
    tests can use simple, direct imports: 'import reader', 'import parser'.
    This is the standard pytest pattern for src layouts with non-standard
    naming conventions.

    The conftest.py is auto-loaded by pytest before any test collection.
"""

import sys
from pathlib import Path

# Insert the scripts/gemini-builder directory at the front of sys.path
# so that test files can do: from reader import ..., from parser import ..., etc.
_BUILDER_DIR = Path(__file__).parent.parent.resolve()
if str(_BUILDER_DIR) not in sys.path:
    sys.path.insert(0, str(_BUILDER_DIR))
