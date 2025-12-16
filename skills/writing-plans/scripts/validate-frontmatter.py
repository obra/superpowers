#!/usr/bin/env python3
"""
Validate frontmatter in markdown files.

This script checks that a markdown file contains valid frontmatter with required fields.
Used by the record-findings skill to ensure data quality.

Usage:
    python3 validate-frontmatter.py <path-to-markdown-file>

Returns:
    0 if validation passes
    1 if validation fails (with error message on stderr)
"""
import sys
import re
from typing import Dict, List, Optional


def extract_frontmatter(content: str) -> Optional[Dict[str, str]]:
    """Extract YAML frontmatter from markdown content."""
    # Skip jot comment if present and match YAML frontmatter between --- delimiters
    # Allow for <!-- jot:md-rename --> or similar comments before frontmatter
    match = re.match(r'^(?:<!--.*?-->\s*\n)?---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if not match:
        return None

    frontmatter_text = match.group(1)
    frontmatter = {}

    # Parse simple YAML (key: value pairs)
    for line in frontmatter_text.split('\n'):
        line = line.strip()
        if not line or line.startswith('#'):
            continue

        # Match key: value
        match = re.match(r'^(\w+):\s*(.*)$', line)
        if match:
            key, value = match.groups()
            frontmatter[key] = value.strip()

    return frontmatter


def validate_frontmatter(frontmatter: Optional[Dict[str, str]]) -> tuple[bool, List[str]]:
    """
    Validate frontmatter has required fields.

    Required fields: title, date, type, status
    Optional fields: tags, related, phase, project

    Returns: (is_valid, list_of_errors)
    """
    errors = []

    if frontmatter is None:
        errors.append("No frontmatter found. Add YAML frontmatter between --- delimiters at the start of the file.")
        return False, errors

    required_fields = ['title', 'date', 'type', 'status']

    for field in required_fields:
        if field not in frontmatter or not frontmatter[field]:
            errors.append(f"Missing required field: {field}")

    # Validate field values if present
    if 'type' in frontmatter:
        valid_types = ['implementation-plan', 'research-finding', 'analysis', 'investigation', 'design']
        if frontmatter['type'] and frontmatter['type'] not in valid_types:
            errors.append(f"Invalid type '{frontmatter['type']}'. Valid types: {', '.join(valid_types)}")

    if 'status' in frontmatter:
        valid_statuses = ['draft', 'in-progress', 'completed', 'active', 'archived']
        if frontmatter['status'] and frontmatter['status'] not in valid_statuses:
            errors.append(f"Invalid status '{frontmatter['status']}'. Valid statuses: {', '.join(valid_statuses)}")

    # Validate date format (YYYY-MM-DD)
    if 'date' in frontmatter and frontmatter['date']:
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', frontmatter['date']):
            errors.append(f"Invalid date format '{frontmatter['date']}'. Use YYYY-MM-DD format.")

    return len(errors) == 0, errors


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 validate-frontmatter.py <path-to-markdown-file>", file=sys.stderr)
        sys.exit(1)

    path = sys.argv[1]

    try:
        with open(path, 'r') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: File not found: {path}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error reading file: {e}", file=sys.stderr)
        sys.exit(1)

    frontmatter = extract_frontmatter(content)
    is_valid, errors = validate_frontmatter(frontmatter)

    if is_valid:
        print("✓ Frontmatter validation passed")
        sys.exit(0)
    else:
        print("✗ Frontmatter validation failed:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
