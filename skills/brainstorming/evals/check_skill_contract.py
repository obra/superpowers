#!/usr/bin/env python3
from pathlib import Path
import sys

skill = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).parents[1] / "SKILL.md")
text = skill.read_text(encoding="utf-8")

required = {
    "Define Acceptance": "Define Acceptance",
    "Mini Acceptance Contract": "Mini Acceptance Contract",
    "Probe Contract": "Probe Contract",
    "Acceptance Challenge": "Acceptance Challenge",
    "Acceptance Readiness": "Acceptance Readiness",
    "behavioral ambiguity": "behavioral ambiguity",
    "invariant": "invariant",
    "observable": "observable",
    "writing-plans gate": "Acceptance Ready",
}

missing = [name for name, needle in required.items() if needle.lower() not in text.lower()]

forbidden = [
    "If so, pick one and make it explicit",
]
present_forbidden = [s for s in forbidden if s.lower() in text.lower()]

if missing or present_forbidden:
    print("FAIL")
    if missing:
        print("Missing required concepts:")
        for item in missing:
            print(f"- {item}")
    if present_forbidden:
        print("Forbidden legacy ambiguity rule still present:")
        for item in present_forbidden:
            print(f"- {item}")
    raise SystemExit(1)

print("PASS")
print("Acceptance contract structure is present and the legacy ambiguity rule is absent.")