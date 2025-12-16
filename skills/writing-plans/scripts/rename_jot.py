#!/usr/bin/env python3
"""
Rename jot files to YYMMDD-XX-slug.md format.

This script is invoked after writing a file via record-findings or writing-plans skills.
It ensures consistent naming and tracks files with file-track when available.

Format: YYMMDD-XX-slug.md
  - YYMMDD: 6-digit date (year, month, day)
  - XX: 2-digit sequence number (01-99)
  - slug: URL-safe title from H1 heading or filename

Usage:
    python3 rename_jot.py <path-to-markdown-file>

Example:
    python3 rename_jot.py /path/to/llm/implementation-plans/my-plan.md
"""
import sys
import os
import re
import datetime
import unicodedata
import subprocess
from pathlib import Path


# Try importing from file-track (canonical source)
_USE_FILETRACK_RENAME = False
try:
    from file_track.rename import (
        rename_file as ft_rename_file,
        slugify as ft_slugify,
        extract_h1_title as ft_extract_h1_title,
        get_next_sequence_number as ft_get_next_sequence_number,
    )
    _USE_FILETRACK_RENAME = True
except ImportError:
    pass  # Fallback mode


# ============================================================================
# FALLBACK IMPLEMENTATIONS (used only when file-track unavailable)
# ============================================================================

def _fallback_slugify(text: str) -> str:
    """Convert text to a slug format (fallback implementation).

    Matches file-track's slugify behavior:
    - Lowercase, ASCII-only
    - Replace spaces/underscores with hyphens
    - Remove special chars
    - Collapse multiple hyphens
    - Truncate to 50 chars
    - Fallback to "untitled"
    """
    # Normalize to ASCII
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")

    # Lowercase
    text = text.lower()

    # Replace spaces and underscores with hyphens
    text = text.replace(" ", "-").replace("_", "-")

    # Remove special chars (keep only alphanumeric and hyphens)
    text = re.sub(r"[^a-z0-9-]+", "", text)

    # Collapse multiple hyphens
    text = re.sub(r"-+", "-", text)

    # Strip leading/trailing hyphens
    text = text.strip("-")

    # Truncate to 50 chars
    if len(text) > 50:
        text = text[:50].rstrip("-")

    return text or "untitled"


def _fallback_extract_h1_title(file_path: Path) -> str | None:
    """Extract first H1 heading from markdown file (fallback implementation).

    Skips code blocks to avoid false matches.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        in_code_block = False
        for line in content.split('\n'):
            # Track code block boundaries
            if line.strip().startswith('```'):
                in_code_block = not in_code_block
                continue

            # Skip lines inside code blocks
            if in_code_block:
                continue

            # Check for H1 heading
            m = re.match(r'^#\s+(.+)$', line)
            if m:
                return m.group(1).strip()

        return None
    except Exception:
        return None


def _fallback_get_next_sequence(directory: Path, date_prefix: str) -> int:
    """Get next sequence number for a given date prefix (fallback implementation).

    Scans directory for files matching YYMMDD-XX-* pattern.
    Returns max_seq + 1 (with graceful degradation if > 99).
    """
    max_seq = 0
    pattern = re.compile(rf"^{date_prefix}-(\d{{2}})-")

    try:
        for name in os.listdir(directory):
            m = pattern.match(name)
            if m:
                try:
                    seq = int(m.group(1))
                    max_seq = max(max_seq, seq)
                except ValueError:
                    pass
    except FileNotFoundError:
        pass

    next_seq = max_seq + 1

    # Graceful degradation if > 99
    if next_seq > 99:
        print(f"Warning: Sequence number exceeds 99 for {date_prefix}", file=sys.stderr)
        next_seq = 99

    return next_seq


def _fallback_rename_file(path: Path) -> Path:
    """Rename file to YYMMDD-XX-slug.md format (fallback implementation)."""
    # Skip if already matches new format
    if re.match(r"^\d{6}-\d{2}-", path.name):
        return path

    # Generate date prefix
    now = datetime.datetime.now()
    date_prefix = now.strftime('%y%m%d')  # YYMMDD

    # Extract slug from H1 or filename
    title = _fallback_extract_h1_title(path)
    if title:
        slug = _fallback_slugify(title)
    else:
        # Use filename (strip any existing prefixes)
        stem = path.stem
        raw_slug = re.sub(r"^(?:(?:\d{4}|\d{6}|\d{8})-?)+", "", stem)
        slug = _fallback_slugify(raw_slug) if raw_slug else "untitled"

    # Get next sequence number
    seq = _fallback_get_next_sequence(path.parent, date_prefix)

    # Generate new filename
    new_name = f"{date_prefix}-{seq:02d}-{slug}.md"
    new_path = path.parent / new_name

    # Rename
    try:
        path.rename(new_path)
        return new_path
    except Exception as e:
        print(f"Error renaming file: {e}", file=sys.stderr)
        raise


# ============================================================================
# PUBLIC INTERFACE (delegates to file-track or fallback)
# ============================================================================

def rename_file(path: Path) -> Path:
    """Rename file using file-track if available, otherwise use fallback."""
    if _USE_FILETRACK_RENAME:
        return ft_rename_file(path)

    print("Warning: file-track not installed, using fallback", file=sys.stderr)
    return _fallback_rename_file(path)


# ============================================================================
# MAIN CLI
# ============================================================================

def main():
    """Main entry point for CLI."""
    if len(sys.argv) < 2:
        print("Usage: python3 rename_jot.py <path-to-markdown-file>", file=sys.stderr)
        sys.exit(1)

    path_str = sys.argv[1]
    path = Path(path_str)

    if not path.exists():
        print(f"Error: File not found: {path}", file=sys.stderr)
        sys.exit(1)

    if path.suffix != ".md":
        print(f"Error: File must be a .md file: {path}", file=sys.stderr)
        sys.exit(1)

    # Store old name for output
    old_name = path.name

    # Rename file
    try:
        new_path = rename_file(path)

        # Only print message if actually renamed
        if new_path.name != old_name:
            print(f"✓ Renamed {old_name} → {new_path.name}")

    except Exception as e:
        print(f"Error: Failed to rename file: {e}", file=sys.stderr)
        sys.exit(1)

    # Track with file-track CLI if available (uses shared wrapper)
    track_script = Path.home() / ".claude/scripts/track_with_filetrack.sh"
    if track_script.exists():
        try:
            subprocess.run(
                [str(track_script), str(new_path), "--no-rename"],
                check=True,
                capture_output=True
            )
        except subprocess.CalledProcessError as e:
            print(f"Warning: file-track tracking failed: {e}", file=sys.stderr)
    # Don't fail the rename operation if tracking fails

    # Remove lock file created by writing-plans wrapper
    # Find git root by walking up from the file
    working_dir = new_path.parent
    while working_dir != working_dir.parent:
        if (working_dir / '.git').exists():
            break
        working_dir = working_dir.parent

    lock_file = working_dir / '.writing-plans-active'
    if lock_file.exists():
        lock_file.unlink()
        # Lock file removed silently

    sys.exit(0)


if __name__ == "__main__":
    main()
