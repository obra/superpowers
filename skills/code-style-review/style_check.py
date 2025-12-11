#!/usr/bin/env python3
"""
Custom style checker for rules that ruff cannot cover.
Detects: non-English comments (including inline comments).
"""
import sys
from dataclasses import asdict, dataclass
from pathlib import Path


@dataclass
class Violation:
    """A style violation record."""
    filepath: str
    line: int
    rule: str
    priority: str  # must/should/optional/nice
    message: str

    def to_dict(self) -> dict:
        return asdict(self)

    def __str__(self) -> str:
        return f"{self.filepath}:{self.line}: [{self.priority}] {self.rule}: {self.message}"


def extract_comment_from_line(line: str) -> str | None:
    """Extract comment from a code line, handling inline comments.

    This function properly handles:
    - Line-start comments: # This is a comment
    - Inline comments: code  # This is a comment
    - String literals are NOT treated as comments

    Returns the comment text without the '#' symbol, or None if no comment exists.
    """
    in_string = False
    quote_char = None
    comment_idx = None

    for i, char in enumerate(line):
        if not in_string:
            # Check for string start
            if char in ('"', "'"):
                in_string = True
                quote_char = char
            # Check for comment start (not in string)
            elif char == '#':
                comment_idx = i
                break
        else:
            # In string, check for end
            if char == quote_char:
                # Check if escaped
                if i == 0 or line[i-1] != '\\':
                    in_string = False
                    quote_char = None

    if comment_idx is not None:
        return line[comment_idx+1:].strip()

    return None


def contains_non_ascii(text: str) -> bool:
    """Check if text contains non-ASCII characters."""
    try:
        text.encode('ascii')
        return False
    except UnicodeEncodeError:
        return True


def check_file(filepath: str) -> list[Violation]:
    """Check a single file for style violations."""
    violations = []
    path = Path(filepath)

    if not path.exists():
        print(f"Warning: {filepath} does not exist", file=sys.stderr)
        return violations

    if path.suffix != ".py":
        return violations

    try:
        content = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        print(f"Warning: {filepath} has encoding issues", file=sys.stderr)
        return violations

    lines = content.splitlines()

    for i, line in enumerate(lines, start=1):
        comment = extract_comment_from_line(line)
        if comment and contains_non_ascii(comment):
            violations.append(Violation(
                filepath=str(path),
                line=i,
                rule="non-english-comment",
                priority="must",
                message=f"Comment contains non-ASCII characters: '{comment[:50]}{'...' if len(comment) > 50 else ''}'. Use English only",
            ))

    return violations


# Directories and patterns to exclude from scanning
EXCLUDE_PATTERNS = {
    '.venv', 'venv', '__pycache__', '.git', 'dist', 'build',
    '.pytest_cache', 'node_modules', '.tox', '.mypy_cache'
}


def check_directory(dirpath: str) -> list[Violation]:
    """Check all Python files in a directory, excluding common build/venv directories."""
    violations = []
    path = Path(dirpath)

    if not path.exists():
        print(f"Warning: {dirpath} does not exist", file=sys.stderr)
        return violations

    for py_file in path.rglob("*.py"):
        # Skip files in excluded directories
        should_skip = False
        for part in py_file.parts:
            if part in EXCLUDE_PATTERNS:
                should_skip = True
                break

        if should_skip:
            continue

        violations.extend(check_file(str(py_file)))

    return violations


def main():
    if len(sys.argv) < 2:
        print("Usage: style_check.py <file_or_directory>", file=sys.stderr)
        sys.exit(1)

    target = sys.argv[1]
    path = Path(target)

    if path.is_file():
        violations = check_file(target)
    elif path.is_dir():
        violations = check_directory(target)
    else:
        print(f"Error: {target} is not a file or directory", file=sys.stderr)
        sys.exit(1)

    if violations:
        for v in violations:
            print(v)
        sys.exit(1)
    else:
        print("All checks passed!")
        sys.exit(0)


if __name__ == "__main__":
    main()
