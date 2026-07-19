"""Shared safe command matching and rewriting for traceback hook adapters."""

from __future__ import annotations

import re
import shlex
from collections.abc import Sequence
from enum import Enum


class CommandMatch(Enum):
    NON_TARGET = "non_target"
    TARGET = "target"
    MALFORMED_TARGET = "malformed_target"


def _tokenize_command(command: str) -> tuple[list[str], bool]:
    """Return successfully read tokens and whether later tokenization failed."""
    lexer = shlex.shlex(
        command,
        posix=True,
        punctuation_chars=";&|()<>",
    )
    lexer.whitespace_split = True
    lexer.commenters = ""
    tokens: list[str] = []
    try:
        while True:
            token = lexer.get_token()
            if token == lexer.eof:
                return tokens, False
            tokens.append(token)
    except ValueError:
        return tokens, True


def _target_candidate_pattern(target_tokens: Sequence[str]) -> re.Pattern[str]:
    executable, subcommand, flag = target_tokens
    quoted_flag = "|".join(
        (
            re.escape(flag),
            re.escape(f"'{flag}'"),
            re.escape(f'"{flag}"'),
        ),
    )
    return re.compile(
        rf"^[ \t]*{re.escape(executable)}[ \t]+"
        rf"{re.escape(subcommand)}[ \t]+"
        rf"(?:{quoted_flag})(?=$|[ \t\r\n;|&<>])",
    )


def classify_command(
    command: str,
    target_tokens: Sequence[str],
) -> CommandMatch:
    """Classify a direct shell command, failing closed only for target calls."""
    tokens, parse_failed = _tokenize_command(command)
    target = tokens[: len(target_tokens)] == list(target_tokens)
    if parse_failed:
        if target or _target_candidate_pattern(target_tokens).match(command):
            return CommandMatch.MALFORMED_TARGET
        return CommandMatch.NON_TARGET
    if target:
        return CommandMatch.TARGET
    return CommandMatch.NON_TARGET


def rewrite_command(
    command: str,
    environment: Sequence[tuple[str, str]],
) -> str:
    """Prefix a command with shell-quoted environment assignments."""
    assignments = " ".join(
        f"{name}={shlex.quote(value)}" for name, value in environment
    )
    return f"env {assignments} {command}"
