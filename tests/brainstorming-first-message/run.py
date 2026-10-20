#!/usr/bin/env python3
"""Run brainstorming first-message checks in headless Claude Code.

When to use: after changing skills/brainstorming/SKILL.md, to see what the
agent does before and in its first reply. This is the cheap loop; the full
quorum conversation scenarios in evals/ are the slower, graded version.

Each scenario reuses an evals scenario's fixtures and the exact first message
from its story.md, so the two stay in sync. Every rep runs one `claude -p`
turn in a fresh copy of the fixture under an isolated HOME (no user
CLAUDE.md, no installed plugins), with only the plugin under test loaded.

Auth: reads CLAUDE_CODE_OAUTH_TOKEN (or ANTHROPIC_API_KEY) from the
environment, falling back to evals/.env.

Output: one line per rep on stdout. Per rep, `summary.md` (tools before the
first reply, then the reply text) and the raw `stream.jsonl` live under the
printed results directory. Read every summary.md; the flags are hints.

Examples:
  tests/brainstorming-first-message/run.py
  tests/brainstorming-first-message/run.py --reps 5 --scenario phased-spec
  tests/brainstorming-first-message/run.py --plugin-dir /tmp/superpowers-v7.0.0
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SCENARIOS = {
    "explicit-request": "brainstorming-explicit-request-grounds-first-question",
    "phased-spec": "brainstorming-continues-phased-spec",
    "auto-trigger": "brainstorming-auto-trigger-checks-in",
}
SKIP_OFFER = re.compile(
    r"skip (the |my |these )?questions|rather (I|we) just|just (start|build|get started)"
    r"|prefer to skip|want to skip",
    re.IGNORECASE,
)
READ_TOOLS = {"Read", "Grep", "Glob"}
# Shell reads count as recon too; agents often `cat` a spec instead of using Read.
SHELL_READ = re.compile(r"(^|[;&|]\s*|\s)(cat|sed|head|tail|grep|rg|ls|find|git (ls-files|log|show))\b")


def is_read(block: dict) -> bool:
    if block.get("name") in READ_TOOLS:
        return True
    return block.get("name") == "Bash" and bool(SHELL_READ.search(str(block.get("input", {}).get("command", ""))))


def first_message(story: Path) -> str:
    text = story.read_text()
    match = re.search(r"Send exactly this first message[^\n]*:\s*\n\s*\n\"(.+?)\"\s*\n", text, re.S)
    if not match:
        sys.exit(f"error: no 'Send exactly this first message' block in {story}")
    return " ".join(match.group(1).split())


def load_auth_env() -> dict:
    env = {}
    for key in ("CLAUDE_CODE_OAUTH_TOKEN", "ANTHROPIC_API_KEY"):
        if os.environ.get(key):
            env[key] = os.environ[key]
    if env:
        return env
    dotenv = REPO / "evals" / ".env"
    if dotenv.exists():
        for line in dotenv.read_text().splitlines():
            key, sep, value = line.partition("=")
            if sep and key.strip() in ("CLAUDE_CODE_OAUTH_TOKEN", "ANTHROPIC_API_KEY"):
                env[key.strip()] = value.strip().strip("'\"")
    if not env:
        sys.exit("error: set CLAUDE_CODE_OAUTH_TOKEN (claude setup-token) or ANTHROPIC_API_KEY, or put one in evals/.env")
    return env


def describe_tool(block: dict) -> str:
    name = block.get("name", "?")
    args = block.get("input", {})
    detail = args.get("file_path") or args.get("pattern") or args.get("skill") or args.get("command") or ""
    return f"{name} {str(detail)[:100]}".strip()


def summarize(stream: Path, slash_invoked: bool) -> dict:
    """Split the turn into tools used before the skill, after it, and the reply text.

    A /superpowers:brainstorming prompt loads the skill before the first tool
    call, with no Skill tool_use, so everything counts as after the skill.
    """
    before_skill, after_skill, texts = [], [], []
    skill_seen = slash_invoked
    for line in stream.read_text().splitlines():
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        if event.get("type") != "assistant":
            continue
        for block in event.get("message", {}).get("content", []):
            if block.get("type") == "tool_use":
                if block.get("name") == "Skill" and "brainstorming" in str(block.get("input", {}).get("skill", "")):
                    skill_seen = True
                (after_skill if skill_seen else before_skill).append(block)
            elif block.get("type") == "text" and block.get("text", "").strip():
                texts.append(block["text"].strip())
    reply = texts[-1] if texts else ""
    reads_after = [b for b in after_skill if is_read(b)]
    return {
        "skill": skill_seen,
        "before_skill": [describe_tool(b) for b in before_skill],
        "after_skill": [describe_tool(b) for b in after_skill],
        "reads": len([b for b in before_skill + after_skill if is_read(b)]),
        "reads_after_skill": len(reads_after),
        "skip_offer": bool(SKIP_OFFER.search(reply)),
        "questions": reply.count("?"),
        "reply": reply,
    }


def run_rep(scenario: str, rep: int, args, auth_env: dict, out_root: Path) -> str:
    scenario_dir = REPO / "evals" / "scenarios" / SCENARIOS[scenario]
    rep_dir = out_root / scenario / f"rep-{rep}"
    rep_dir.mkdir(parents=True)
    home = Path(tempfile.mkdtemp(prefix="bfm-home-"))
    project = rep_dir / "project"
    shutil.copytree(scenario_dir / "fixtures", project)
    git = ["git", "-c", "user.name=Test", "-c", "user.email=test@example.com"]
    subprocess.run(["git", "init", "-q", "-b", "main"], cwd=project, check=True)
    subprocess.run(["git", "add", "-A"], cwd=project, check=True)
    subprocess.run(git + ["commit", "-q", "-m", "Initial"], cwd=project, check=True)

    prompt = first_message(scenario_dir / "story.md")
    env = {k: v for k, v in os.environ.items() if k not in ("CLAUDE_CODE_OAUTH_TOKEN", "ANTHROPIC_API_KEY")}
    env.update(auth_env, HOME=str(home))
    stream = rep_dir / "stream.jsonl"
    started = time.time()
    with stream.open("w") as fh:
        proc = subprocess.run(
            ["claude", "-p", prompt, "--plugin-dir", str(args.plugin_dir), "--model", args.model,
             "--output-format", "stream-json", "--verbose", "--dangerously-skip-permissions",
             "--max-turns", str(args.max_turns)],
            cwd=project, env=env, stdout=fh, stderr=subprocess.STDOUT, timeout=args.timeout,
        )
    shutil.rmtree(home, ignore_errors=True)
    s = summarize(stream, slash_invoked=prompt.startswith("/") and "brainstorming" in prompt.split()[0])
    lines = [f"# {scenario} rep {rep}", "", f"prompt: {prompt}", f"exit: {proc.returncode}, {time.time() - started:.0f}s", "",
             "## tools before brainstorming loaded" + (" (slash-invoked: none)" if prompt.startswith("/") else "")] + [f"- {t}" for t in s["before_skill"]] + \
            ["", "## tools after brainstorming loaded"] + [f"- {t}" for t in s["after_skill"]] + ["", "## final reply", "", s["reply"]]
    (rep_dir / "summary.md").write_text("\n".join(lines) + "\n")
    return (f"{scenario:17} rep {rep}  skill={'y' if s['skill'] else 'N'}  reads={s['reads']:2} "
            f"(after skill {s['reads_after_skill']:2})  skip_offer={'Y' if s['skip_offer'] else 'n'}  "
            f"?={s['questions']}  exit={proc.returncode}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--scenario", choices=sorted(SCENARIOS) + ["all"], default="all")
    parser.add_argument("--reps", type=int, default=3)
    parser.add_argument("--plugin-dir", type=Path, default=REPO, help="superpowers checkout under test (default: this repo)")
    parser.add_argument("--model", default="claude-opus-5-5")
    parser.add_argument("--max-turns", type=int, default=30)
    parser.add_argument("--timeout", type=int, default=600, help="seconds per rep")
    parser.add_argument("--jobs", type=int, default=3)
    parser.add_argument("--label", default="", help="suffix for the results directory name")
    args = parser.parse_args()

    if not (REPO / "evals" / "scenarios").is_dir():
        sys.exit(f"error: {REPO / 'evals'} is missing; clone superpowers-evals there (see evals/README.md)")
    auth_env = load_auth_env()
    scenarios = sorted(SCENARIOS) if args.scenario == "all" else [args.scenario]
    stamp = time.strftime("%Y%m%d-%H%M%S")
    out_root = Path(tempfile.gettempdir()) / "brainstorming-first-message" / (stamp + (f"-{args.label}" if args.label else ""))
    out_root.mkdir(parents=True)
    print(f"plugin: {args.plugin_dir}\nresults: {out_root}", flush=True)

    jobs = [(s, r) for s in scenarios for r in range(1, args.reps + 1)]
    with ThreadPoolExecutor(max_workers=args.jobs) as pool:
        futures = [pool.submit(run_rep, s, r, args, auth_env, out_root) for s, r in jobs]
        for future in futures:
            try:
                print(future.result(), flush=True)
            except Exception as exc:  # report and keep the other reps going
                print(f"rep failed: {exc}", flush=True)
    print(f"read each summary: {out_root}/<scenario>/rep-N/summary.md")


if __name__ == "__main__":
    main()
