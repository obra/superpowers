#!/usr/bin/env python3
"""
PostToolUse hook: Run prek on modified files.
Runs pre-commit hooks on files that were just edited or written.
"""

import json
import subprocess
import sys
from pathlib import Path


def main():
    try:
        # Read hook input from stdin
        hook_input = json.load(sys.stdin)

        # Check if .pre-commit-config.yaml exists
        if not Path(".pre-commit-config.yaml").exists():
            sys.exit(0)

        # Extract file path from tool input
        tool_input = hook_input.get("tool_input", {})
        file_path = tool_input.get("file_path")

        if not file_path:
            sys.exit(0)

        # Convert to Path and check if file exists
        file_path = Path(file_path)
        if not file_path.exists():
            sys.exit(0)

        # Run prek on the specific file, skipping the branch check
        result = subprocess.run(
            ["prek", "run", "--skip", "no-commit-to-branch", "--files", str(file_path)],
            capture_output=True,
            text=True,
        )

        # Only report if prek failed (non-zero exit = formatting changes or errors)
        if result.returncode != 0:
            combined_output = result.stdout + result.stderr
            output = {
                "hookSpecificOutput": {
                    "hookEventName": "PostToolUse",
                    "additionalContext": f"Pre-commit hooks ran on {file_path}:\n\n{combined_output}",
                }
            }
            print(json.dumps(output))

        sys.exit(0)

    except Exception as e:
        # On any error, print and fail
        print(f"Hook error: {e}", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
