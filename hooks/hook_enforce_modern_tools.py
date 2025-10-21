#!/usr/bin/env python3
"""
PreToolUse hook: Enforce modern tool usage over legacy alternatives.
Denies old commands and suggests better alternatives.
"""
import json
import sys
import re


# Code structure keywords that suggest ast-grep should be used
CODE_KEYWORDS = [
    r'\bclass\b', r'\bdef\b', r'\bfunction\b', r'\binterface\b',
    r'\bconst\b', r'\blet\b', r'\bvar\b', r'\basync\b', r'\bawait\b',
    r'\bimport\b', r'\bfrom\b', r'\bexport\b', r'\breturn\b',
    r'\bstruct\b', r'\benum\b', r'\btype\b', r'\bimpl\b'
]

# Code file extensions
CODE_EXTENSIONS = [
    r'\.py\b', r'\.js\b', r'\.ts\b', r'\.tsx\b', r'\.jsx\b',
    r'\.go\b', r'\.rs\b', r'\.java\b', r'\.c\b', r'\.cpp\b',
    r'\.h\b', r'\.hpp\b', r'\.rb\b', r'\.php\b'
]


def looks_like_code_search(command):
    """Detect if grep/rg command is searching for code structures."""
    # Check for code keywords in the search pattern
    for keyword in CODE_KEYWORDS:
        if re.search(keyword, command, re.IGNORECASE):
            return True

    # Check if searching in code files
    for ext in CODE_EXTENSIONS:
        if re.search(ext, command):
            return True

    # Check for complex regex patterns often used in code search
    if re.search(r'grep.*[\[\]{}()\|\\]', command):
        return True

    return False


# Tool enforcement rules: (pattern, reason, check_function)
TOOL_RULES = [
    {
        "pattern": r"(^|\||;|&&)\s*(grep|egrep|fgrep)\b",
        "check": looks_like_code_search,
        "code_reason": "Use ast-grep for searching code structures. Examples:\n  ast-grep --pattern 'class $NAME' (find classes)\n  ast-grep --pattern 'def $FUNC($$$)' (find function definitions)\n  ast-grep --pattern 'import { $$$ } from $MOD' (find imports)",
        "text_reason": "Use rg (Grep tool) for text search, ast-grep for code structures"
    },
    {
        "pattern": r"(^|\||;|&&)\s*find\b",
        "reason": "Use fd - fd (by name), fd -p (by path), fd . <dir> (list), fd -e <ext> <pattern>"
    },
    {
        "pattern": r"ls\s+[^|]*-(la|R)",
        "reason": "Use fd . <directory> to list files in directory"
    },
    {
        "pattern": r"(^|\||;|&&)\s*(sed|awk)\b",
        "reason": "Use jq for JSON, yq for YAML/XML, rg for text search"
    }
]


def check_command(command):
    """Check if command violates any tool rules."""
    for rule in TOOL_RULES:
        if re.search(rule["pattern"], command):
            # Check if this rule has a conditional check function
            if "check" in rule and rule["check"](command):
                reason = rule.get("code_reason", rule.get("reason"))
            else:
                reason = rule.get("text_reason", rule.get("reason"))

            return {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": reason
                }
            }
    return None


def main():
    try:
        # Read hook input from stdin
        hook_input = json.load(sys.stdin)

        # Extract command from Bash tool input
        command = hook_input.get("tool_input", {}).get("command", "")

        if not command:
            sys.exit(0)

        # Check if command violates any rules
        denial = check_command(command)

        if denial:
            print(json.dumps(denial))
            sys.exit(0)

        # Allow the command
        sys.exit(0)

    except Exception:
        # On any error, allow the command to proceed
        sys.exit(0)


if __name__ == "__main__":
    main()
