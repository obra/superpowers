#!/usr/bin/env python3
"""Multi-trial Superpowers acceptance eval for Grok Build.

Layers:
1) Structural: plugin enabled + skills present (caller should verify)
2) Smoke: model knows superpowers skills exist
3) Acceptance: "Let's make a react todo list" triggers design/brainstorm BEFORE code

Usage:
  python3 run_eval.py --trials 5
"""

from __future__ import annotations

import argparse
import os
import json
import re
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path

EVAL_DIR = Path(os.environ.get("SUPERPOWERS_EVAL_DIR", "/tmp/superpowers-eval"))
RUNS = EVAL_DIR / "runs"
SMOKE_PROMPT = (
    "What superpowers / process skills do you have for software development? "
    "List the skill names you would use before writing code. Be brief."
)
ACCEPT_PROMPT = "Let's make a react todo list"

# Block tools that would let it scaffold code during the first-turn design gate
DISALLOWED = (
    "run_terminal_command,search_replace,image_gen,image_edit,image_to_video,"
    "reference_to_video,web_search,web_fetch,spawn_subagent,workflow"
)

BRAINSTORM_SIGNALS = [
    r"brainstorming",
    r"using (the )?brainstorm",
    r"skill brainstorming",
    r"before (we |i )?(write|writing|scaffold)",
    r"design before",
    r"what level of features",
    r"clarifying question",
    r"before scaffolding",
    r"nail down what",
    r"explore (your )?requirements",
    r"2-3 approaches",
    r"propose (2|two|three|3) (different )?approaches",
    r"what('s| is) the purpose",
    r"success criteria",
    r"before any code",
    r"hard-gate|hard gate",
    r"spec first",
    r"design first",
]

CODE_EARLY_SIGNALS = [
    r"create-react-app",
    r"npx create",
    r"```(?:tsx?|jsx?|html|css)",
    r"export default function",
    r"function App\s*\(",
    r"const App\s*=",
    r"package\.json",
    r"vite\.config",
]


def run_grok(prompt: str, out_path: Path, max_turns: int = 4) -> str:
    RUNS.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="sp-trial-") as tmp:
        cmd = [
            "grok",
            "-p",
            prompt,
            "--always-approve",
            "--max-turns",
            str(max_turns),
            "--output-format",
            "plain",
            "--no-memory",
            "--disallowed-tools",
            DISALLOWED,
            "--cwd",
            tmp,
        ]
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,
        )
        text = (proc.stdout or "") + ("\n" + proc.stderr if proc.stderr else "")
        out_path.write_text(text)
        (out_path.with_suffix(".exit")).write_text(str(proc.returncode))
        return text


def score_acceptance(text: str) -> dict:
    low = text.lower()
    brainstorm = any(re.search(p, low) for p in BRAINSTORM_SIGNALS)
    code_early = any(re.search(p, low) for p in CODE_EARLY_SIGNALS)
    using_sp = bool(
        re.search(r"using-superpowers|superpowers:using|using superpowers", low)
    )
    # PASS: design gate engaged, no code scaffolding yet
    passed = brainstorm and not code_early
    return {
        "brainstorm": brainstorm,
        "code_early": code_early,
        "using_sp": using_sp,
        "pass": passed,
    }


def score_smoke(text: str) -> dict:
    low = text.lower()
    skills = [
        "brainstorming",
        "test-driven-development",
        "using-superpowers",
        "writing-plans",
        "systematic-debugging",
    ]
    found = [s for s in skills if s in low or s.replace("-", " ") in low]
    return {
        "skills_mentioned": found,
        "pass": len(found) >= 2,
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--trials", type=int, default=5)
    ap.add_argument("--skip-smoke", action="store_true")
    args = ap.parse_args()

    results = {
        "started_at": datetime.now(timezone.utc).isoformat(),
        "trials": args.trials,
        "smoke": None,
        "acceptance": [],
    }

    if not args.skip_smoke:
        print("=== SMOKE ===", flush=True)
        smoke_text = run_grok(SMOKE_PROMPT, RUNS / "smoke.txt", max_turns=3)
        smoke_score = score_smoke(smoke_text)
        results["smoke"] = smoke_score
        print(json.dumps(smoke_score, indent=2), flush=True)
        print(smoke_text[:800], flush=True)

    print("=== ACCEPTANCE ===", flush=True)
    for i in range(1, args.trials + 1):
        name = f"accept{i:02d}"
        print(f"--- trial {i}/{args.trials} ---", flush=True)
        text = run_grok(ACCEPT_PROMPT, RUNS / f"{name}.txt", max_turns=4)
        score = score_acceptance(text)
        score["trial"] = i
        results["acceptance"].append(score)
        (RUNS / f"{name}.score.json").write_text(json.dumps(score, indent=2))
        print(json.dumps(score), flush=True)
        print(text[:600].replace("\n", " | "), flush=True)

    passes = sum(1 for a in results["acceptance"] if a["pass"])
    n = len(results["acceptance"])
    rate = passes / n if n else 0.0
    results["pass_rate"] = rate
    results["passes"] = passes
    results["total"] = n
    results["gate"] = {
        "min_pass_rate": 0.8,
        "ok": rate >= 0.8,
        "smoke_ok": (results["smoke"] or {}).get("pass", True),
    }
    results["finished_at"] = datetime.now(timezone.utc).isoformat()

    summary_path = EVAL_DIR / "summary.json"
    summary_path.write_text(json.dumps(results, indent=2))
    print("=== SUMMARY ===", flush=True)
    print(json.dumps(results["gate"] | {"pass_rate": rate, "passes": passes, "total": n}, indent=2))
    print(f"Wrote {summary_path}", flush=True)

    # Non-zero exit if gate fails
    if not results["gate"]["ok"] or not results["gate"]["smoke_ok"]:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
