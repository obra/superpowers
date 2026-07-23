#!/usr/bin/env python3
"""
parse_observations.py
Utility script to discover, parse, and archive fast-loop observation notes for superpowers:evolving-skills.
"""

import os
import sys
import json
import shutil
import argparse
import re

def parse_frontmatter(content):
    """Simple YAML frontmatter parser for markdown files."""
    frontmatter = {}
    body = content
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            raw_fm = parts[1]
            body = parts[2]
            for line in raw_fm.strip().split("\n"):
                if ":" in line:
                    key, val = line.split(":", 1)
                    frontmatter[key.strip()] = val.strip().strip('"').strip("'")
    return frontmatter, body.strip()

def list_observations(obs_directory):
    """Finds all markdown observation files in obs_directory (skipping archive)."""
    observations = []
    if not os.path.exists(obs_directory):
        return observations

    for fname in sorted(os.listdir(obs_directory)):
        if fname.endswith(".md") and fname != "README.md":
            fpath = os.path.join(obs_directory, fname)
            if os.path.isfile(fpath):
                try:
                    with open(fpath, "r", encoding="utf-8") as f:
                        content = f.read()
                    fm, body = parse_frontmatter(content)
                    obs = {
                        "filepath": fpath,
                        "filename": fname,
                        "timestamp": fm.get("timestamp", ""),
                        "skill": fm.get("skill", "unknown"),
                        "phase": fm.get("phase", "unknown"),
                        "status": fm.get("status", "pending_distillation"),
                        "content": body,
                        "frontmatter": fm
                    }
                    observations.append(obs)
                except Exception as e:
                    sys.stderr.write(f"Warning: Failed to read {fname}: {e}\n")
    return observations

def archive_observation(filepath, archive_directory):
    """Moves a processed observation note to the archive directory."""
    if not os.path.exists(archive_directory):
        os.makedirs(archive_directory, exist_ok=True)
    
    filename = os.path.basename(filepath)
    target_path = os.path.join(archive_directory, filename)
    shutil.move(filepath, target_path)
    return target_path

def main():
    parser = argparse.ArgumentParser(description="Parse and manage superpowers observation notes.")
    parser.add_argument("--obs-dir", default=None, help="Path to observations directory")
    parser.add_argument("--list", action="store_true", help="List pending observations as JSON")
    parser.add_argument("--archive", help="Path to specific observation file to archive")
    args = parser.parse_args()

    # Default obs_dir relative to script location
    if not args.obs_dir:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        args.obs_dir = os.path.abspath(os.path.join(script_dir, "../references/observations"))

    if args.list:
        observations = list_observations(args.obs_dir)
        print(json.dumps(observations, indent=2))
        return

    if args.archive:
        archive_dir = os.path.join(args.obs_dir, "archive")
        archived = archive_observation(args.archive, archive_dir)
        print(f"Archived {args.archive} -> {archived}")
        return

    parser.print_help()

if __name__ == "__main__":
    main()
