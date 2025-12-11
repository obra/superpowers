#!/usr/bin/env python3
"""
Custom style checker for rules that ruff cannot cover.
Detects: non-English comments.
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


def is_non_ascii_comment(line: str) -> bool:
    """Check if a comment contains non-ASCII characters.
    
    Only checks actual comments (starting with #), not string literals.
    """
    stripped = line.lstrip()
    if not stripped.startswith("#"):
        return False
    comment = stripped[1:]
    for char in comment:
        if ord(char) > 127:
            return True
    return False


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
        if is_non_ascii_comment(line):
            violations.append(Violation(
                filepath=str(path),
                line=i,
                rule="non-english-comment",
                priority="must",
                message="Comment contains non-ASCII characters; use English only",
            ))
    
    return violations


def check_directory(dirpath: str) -> list[Violation]:
    """Check all Python files in a directory."""
    violations = []
    path = Path(dirpath)
    
    if not path.exists():
        print(f"Warning: {dirpath} does not exist", file=sys.stderr)
        return violations
    
    for py_file in path.rglob("*.py"):
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
