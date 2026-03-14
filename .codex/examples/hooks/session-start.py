#!/usr/bin/env python3

import json
import sys


MESSAGE = (
    "Superpowers is installed. Before implementing, check whether a process "
    "skill applies. If brainstorming applies, ask at most one substantive "
    "question per turn and reassess after each user answer. For multi-agent "
    "work, prefer the role catalog under .codex/examples/agents and the "
    "prompt library under .codex/examples/prompts."
)


def main() -> int:
    json.load(sys.stdin)
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "SessionStart",
                    "additionalContext": MESSAGE,
                }
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
