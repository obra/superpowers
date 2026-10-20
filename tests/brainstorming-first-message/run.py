#!/usr/bin/env python3
"""Run brainstorming first-message checks in headless Claude Code or Codex.

When to use: after changing skills/brainstorming/SKILL.md, to see what the
agent does before and in its first reply. This is the cheap loop; the full
quorum conversation scenarios in evals/ are the slower, graded version.

Each scenario reuses an evals scenario's fixtures and the exact first message
from its story.md, so the two stay in sync. Every rep runs one headless turn
(`claude -p` or `codex exec`) in a fresh copy of the fixture under an
isolated HOME (no user instructions, no installed plugins), with only the
plugin under test loaded. Codex gets the plugin staged as superpowers@debug,
the same way the evals' Codex provisioning does it.

Auth: Claude reads CLAUDE_CODE_OAUTH_TOKEN (or ANTHROPIC_API_KEY) from the
environment, falling back to evals/.env. Codex copies your ChatGPT
subscription auth from ~/.codex/auth.json (run `codex login` first).

Output: one line per rep on stdout. Per rep, `summary.md` (tools before the
first reply, then the reply text) and the raw `stream.jsonl` live under the
printed results directory. Read every summary.md; the flags are hints.

Examples:
  tests/brainstorming-first-message/run.py
  tests/brainstorming-first-message/run.py --reps 5 --scenario phased-spec
  tests/brainstorming-first-message/run.py --plugin-dir /tmp/superpowers-v7.0.0
  tests/brainstorming-first-message/run.py --agent codex --model gpt-6-luna
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


CODEX_PLUGIN_CONFIG = """[features]
plugins = true

[plugins."superpowers@openai-curated-remote"]
enabled = false

[plugins."superpowers@openai-curated"]
enabled = false

[plugins."superpowers@debug"]
enabled = true
"""
# Matches the evals' plugin staging: no VCS, evals, or local agent state.
PLUGIN_STAGE_IGNORE = shutil.ignore_patterns(".git", "node_modules", "evals", ".claude", ".worktrees", "__pycache__")


def is_read(block: dict) -> bool:
    if block.get("name") in READ_TOOLS:
        return True
    return block.get("name") == "Bash" and bool(SHELL_READ.search(str(block.get("input", {}).get("command", ""))))


def is_skill_load(block: dict) -> bool:
    """Claude loads skills with the Skill tool; Codex reads SKILL.md from disk."""
    if block.get("name") == "Skill":
        return "brainstorming" in str(block.get("input", {}).get("skill", ""))
    return block.get("name") == "Bash" and "brainstorming/SKILL.md" in str(block.get("input", {}).get("command", ""))


def stream_events(stream: Path, agent: str):
    """Yield ("tool", block) and ("text", str) in order, in Claude's block shape."""
    for line in stream.read_text().splitlines():
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        if agent == "claude":
            if event.get("type") != "assistant":
                continue
            for block in event.get("message", {}).get("content", []):
                if block.get("type") == "tool_use":
                    yield "tool", block
                elif block.get("type") == "text" and block.get("text", "").strip():
                    yield "text", block["text"].strip()
        elif event.get("type") == "item.completed":
            item = event.get("item", {})
            if item.get("type") == "command_execution":
                yield "tool", {"name": "Bash", "input": {"command": item.get("command", "")}}
            elif item.get("type") == "agent_message" and item.get("text", "").strip():
                yield "text", item["text"].strip()


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


def summarize(stream: Path, agent: str, slash_invoked: bool) -> dict:
    """Split the turn into tools used before the skill, after it, and the reply text.

    A /superpowers:brainstorming prompt loads the skill before the first tool
    call, with no Skill tool_use, so everything counts as after the skill.
    """
    before_skill, after_skill, texts = [], [], []
    skill_seen = slash_invoked
    for kind, value in stream_events(stream, agent):
        if kind == "tool":
            if is_skill_load(value):
                skill_seen = True
            (after_skill if skill_seen else before_skill).append(value)
        else:
            texts.append(value)
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
    env = {k: v for k, v in os.environ.items() if k not in ("CLAUDE_CODE_OAUTH_TOKEN", "ANTHROPIC_API_KEY", "CODEX_HOME")}
    env["HOME"] = str(home)
    if args.agent == "claude":
        env.update(auth_env)
        command = ["claude", "-p", prompt, "--plugin-dir", str(args.plugin_dir), "--model", args.model,
                   "--output-format", "stream-json", "--verbose", "--dangerously-skip-permissions",
                   "--max-turns", str(args.max_turns)]
    else:
        codex_home = home / ".codex"
        shutil.copytree(args.plugin_dir, codex_home / "plugins" / "cache" / "debug" / "superpowers" / "local",
                        ignore=PLUGIN_STAGE_IGNORE)
        shutil.copy(Path.home() / ".codex" / "auth.json", codex_home / "auth.json")
        (codex_home / "auth.json").chmod(0o600)
        (codex_home / "config.toml").write_text(CODEX_PLUGIN_CONFIG)
        env["CODEX_HOME"] = str(codex_home)
        command = ["codex", "exec", "--json", "-m", args.model, "--dangerously-bypass-approvals-and-sandbox", prompt]
    stream = rep_dir / "stream.jsonl"
    started = time.time()
    with stream.open("w") as fh:
        proc = subprocess.run(command, cwd=project, env=env, stdin=subprocess.DEVNULL, stdout=fh,
                              stderr=subprocess.STDOUT, timeout=args.timeout)
    shutil.rmtree(home, ignore_errors=True)
    # Only Claude Code expands a /superpowers:brainstorming prompt into the skill.
    slash_invoked = args.agent == "claude" and prompt.startswith("/") and "brainstorming" in prompt.split()[0]
    s = summarize(stream, args.agent, slash_invoked)
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
    parser.add_argument("--agent", choices=["claude", "codex"], default="claude")
    parser.add_argument("--model", help="default: claude-opus-5-5 for claude, gpt-6-luna for codex")
    parser.add_argument("--max-turns", type=int, default=30)
    parser.add_argument("--timeout", type=int, default=600, help="seconds per rep")
    parser.add_argument("--jobs", type=int, default=3)
    parser.add_argument("--label", default="", help="suffix for the results directory name")
    args = parser.parse_args()
    args.model = args.model or {"claude": "claude-opus-5-5", "codex": "gpt-6-luna"}[args.agent]
    args.plugin_dir = args.plugin_dir.resolve()

    if not (REPO / "evals" / "scenarios").is_dir():
        sys.exit(f"error: {REPO / 'evals'} is missing; clone superpowers-evals there (see evals/README.md)")
    if args.agent == "codex" and not (Path.home() / ".codex" / "auth.json").exists():
        sys.exit("error: ~/.codex/auth.json not found; run `codex login` first")
    auth_env = load_auth_env() if args.agent == "claude" else {}
    scenarios = sorted(SCENARIOS) if args.scenario == "all" else [args.scenario]
    stamp = time.strftime("%Y%m%d-%H%M%S")
    name = f"{stamp}-{args.agent}-{args.model}" + (f"-{args.label}" if args.label else "")
    out_root = Path(tempfile.gettempdir()) / "brainstorming-first-message" / name
    # Parallel invocations for different scenarios can share a directory.
    out_root.mkdir(parents=True, exist_ok=True)
    print(f"agent: {args.agent} {args.model}\nplugin: {args.plugin_dir}\nresults: {out_root}", flush=True)

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
