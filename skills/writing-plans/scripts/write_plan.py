#!/usr/bin/env python3
"""
Executable wrapper for writing-plans skill.

This wrapper guides Claude through the file writing workflow instead of
letting Claude just describe what it would do.
"""
import sys
import os
import argparse
from datetime import datetime

def main():
    parser = argparse.ArgumentParser(
        description="Guide Claude through writing an implementation plan"
    )
    parser.add_argument(
        "--working-dir",
        required=True,
        help="Working directory path (from env context)"
    )
    parser.add_argument(
        "--plan-name",
        required=True,
        help="Name for the plan file (will be slugified)"
    )
    parser.add_argument(
        "--in-plan-mode",
        action="store_true",
        help="Set if currently in plan mode (uses staging area)"
    )
    parser.add_argument(
        "--target-dir",
        default="llm/implementation-plans",
        help="Target directory relative to working-dir (default: llm/implementation-plans)"
    )

    args = parser.parse_args()

    # Determine target path
    if args.in_plan_mode:
        staging_path = os.path.expanduser("~/.claude/plans")
        target_file = f"{staging_path}/{args.plan_name}.md"
        final_dir = os.path.join(args.working_dir, args.target_dir)
        print(f"📝 PLAN MODE DETECTED")
        print(f"✓ Write plan to: {target_file}")
        print(f"✓ Then copy to: {final_dir}/{args.plan_name}.md")
    else:
        target_dir = os.path.join(args.working_dir, args.target_dir)
        target_file = f"{target_dir}/{args.plan_name}.md"
        print(f"📝 REGULAR MODE")
        print(f"✓ Write plan to: {target_file}")

    # Create lock file to enable Write tool for this plan
    lock_file = os.path.join(args.working_dir, '.writing-plans-active')
    with open(lock_file, 'w') as f:
        f.write(f"{target_file}\n")
        f.write(f"created: {datetime.now().isoformat()}\n")

    print(f"🔓 Created lock file: {lock_file}")

    print(f"\n🔧 REQUIRED ACTIONS:")
    print(f"1. Use Write tool to create file with:")
    print(f"   - First line: <!-- jot:md-rename -->")
    print(f"   - YAML frontmatter (title, date, type, status)")
    print(f"   - H1 heading with feature name")
    print(f"   - Implementation tasks following writing-plans format")
    print(f"\n2. After writing, run post-write workflow:")
    print(f"   - Validate: python3 $CLAUDE_PLUGIN_ROOT/skills/writing-plans/scripts/validate-frontmatter.py {target_file}")
    print(f"   - Rename: python3 $CLAUDE_PLUGIN_ROOT/skills/writing-plans/scripts/rename_jot.py {target_file} (auto-tracks with file-track)")
    print(f"   ⚠️  IMPORTANT: Rename script will remove lock file")

    print(f"\n⚠️  CRITICAL: DO NOT just describe the plan!")
    print(f"⚠️  You MUST use Write tool to create the actual file!")
    print(f"⚠️  Describing = BUG. Writing = CORRECT.")

    return 0

if __name__ == "__main__":
    sys.exit(main())
