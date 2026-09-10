#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["pyyaml", "pillow", "websockets"]
# ///
"""Run the proving-it-works-with-a-movie regression suites portably."""

import argparse
import sys
import unittest
from pathlib import Path


IMPLEMENTED_SUITES = {
    "assembly": "test_assembly.py",
    "checker": "test_checker.py",
    "narration": "test_narration.py",
}
RESERVED_SUITES = {
    "paths",
    "browser",
    "subtitles",
    "processes",
    "shells",
    "terminal",
    "routes",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--suite",
        required=True,
        choices=[*IMPLEMENTED_SUITES, *sorted(RESERVED_SUITES), "all"],
    )
    parser.add_argument("--require-capabilities", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.suite in RESERVED_SUITES:
        print(
            f"suite {args.suite!r} is reserved but not implemented",
            file=sys.stderr,
        )
        return 2

    patterns = (
        list(IMPLEMENTED_SUITES.values())
        if args.suite == "all"
        else [IMPLEMENTED_SUITES[args.suite]]
    )
    test_directory = Path(__file__).resolve().parent
    loader = unittest.TestLoader()
    suite = unittest.TestSuite(
        loader.discover(
            str(test_directory),
            pattern=pattern,
            top_level_dir=str(test_directory),
        )
        for pattern in patterns
    )
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    if args.require_capabilities and result.skipped:
        print(
            f"required capabilities unavailable: {len(result.skipped)} "
            "selected test(s) skipped",
            file=sys.stderr,
        )
        return 1
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    raise SystemExit(main())
