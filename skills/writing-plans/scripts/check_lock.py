#!/usr/bin/env python3
"""Check if writing-plans lock file exists before writing."""

import os
import sys

def check_lock(working_dir: str, file_path: str) -> bool:
    """Check if lock file exists and authorizes this file."""
    lock_file = os.path.join(working_dir, '.writing-plans-active')

    if not os.path.exists(lock_file):
        print("❌ ERROR: No active writing-plans session")
        print("MUST invoke wrapper first:")
        print("  python3 ~/.claude/skills/writing-plans/scripts/write_plan.py \\")
        print(f"    --working-dir {working_dir} \\")
        print("    --plan-name <descriptive-name>")
        return False

    try:
        # Check if lock authorizes this specific file
        with open(lock_file, encoding='utf-8') as f:
            authorized_path = f.readline().strip()
    except (OSError, IOError) as e:
        print(f"❌ ERROR: Cannot read lock file: {e}")
        return False

    # Normalize both paths and compare full paths (not just basename)
    authorized_norm = os.path.normpath(os.path.abspath(authorized_path))
    file_norm = os.path.normpath(os.path.abspath(file_path))

    if authorized_norm != file_norm:
        print(f"❌ ERROR: Lock file authorizes {authorized_path}, not {file_path}")
        return False

    print(f"✓ Lock file valid for {file_path}")
    return True

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: check_lock.py <working_dir> <file_path>")
        sys.exit(1)

    working_dir = sys.argv[1]
    file_path = sys.argv[2]

    sys.exit(0 if check_lock(working_dir, file_path) else 1)
