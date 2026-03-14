#!/usr/bin/env python3

import json
import re
import sys


FINALITY_RE = re.compile(
    r"\b(done|finished|complete|completed|fixed|resolved|ready)\b",
    re.IGNORECASE,
)
EVIDENCE_RE = re.compile(
    r"\b(test|tests|verified|verification|checked|ran|passing|pass)\b",
    re.IGNORECASE,
)


def main() -> int:
    payload = json.load(sys.stdin)
    message = payload.get("last_assistant_message") or ""

    if FINALITY_RE.search(message) and not EVIDENCE_RE.search(message):
        print(
            json.dumps(
                {
                    "decision": "block",
                    "reason": (
                        "Add concrete verification evidence before claiming the "
                        "work is done."
                    ),
                }
            )
        )
        return 0

    print(json.dumps({"continue": True}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
