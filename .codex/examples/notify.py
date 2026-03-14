#!/usr/bin/env python3

import json
import sys


def main() -> int:
    if len(sys.argv) != 2:
        return 1

    payload = json.loads(sys.argv[1])
    if payload.get("type") != "agent-turn-complete":
        return 0

    title = "Codex turn complete"
    last_message = payload.get("last-assistant-message")
    if last_message:
        title = f"Codex: {last_message[:80]}"

    input_messages = payload.get("input-messages") or []
    summary = " | ".join(str(item) for item in input_messages[:2])

    print(json.dumps({"title": title, "summary": summary}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
