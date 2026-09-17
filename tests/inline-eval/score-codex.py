#!/usr/bin/env python3
"""Score one Codex inline-eval rep from the csd event stream.

Usage: score-codex.py <rep-dir> [codex-transcript-path]

Codex transcripts are a different format from Claude Code's, so this scorer
works from <rep-dir>/events.jsonl (csd's pre_tool_use/post_tool_use events,
which carry tool names and inputs) plus the scratch repo and the fixture's
probe. Token totals come from the Codex rollout transcript when its path is
given and readable; otherwise they are reported as unknown.
"""
import json
import os
import re
import subprocess
import sys
from datetime import datetime

rep = sys.argv[1]
transcript = sys.argv[2] if len(sys.argv) > 2 else ""
repo = os.path.join(rep, "repo")
FIXTURE = os.environ.get("INLINE_EVAL_FIXTURE") or os.path.join(os.path.dirname(__file__), "fixtures", "wordstat")
SCORING = json.load(open(os.path.join(FIXTURE, "scoring.json")))

events = []
for line in open(os.path.join(rep, "events.jsonl")):
    try:
        events.append(json.loads(line))
    except json.JSONDecodeError:
        pass

calls = []  # (idx, tool, input-as-text)
for i, e in enumerate(events):
    if e.get("event") != "pre_tool_use":
        continue
    inp = e.get("tool_input") or {}
    text = inp if isinstance(inp, str) else json.dumps(inp)
    calls.append((i, e.get("tool", ""), text))

out = []
def row(name, value, note=""):
    out.append(f"{name:<34} {value!s:<12} {note}")

tools = {}
for _, t, _ in calls:
    tools[t] = tools.get(t, 0) + 1
row("tool calls", len(calls), ", ".join(f"{k}={v}" for k, v in sorted(tools.items(), key=lambda kv: -kv[1])))
row("skill loads (SKILL.md reads)", sum(1 for _, _, x in calls if "SKILL.md" in x),
    "; ".join(sorted({m for _, _, x in calls for m in re.findall(r"skills/([a-z-]+)/SKILL\.md", x)})))
spawns = [x for _, t, x in calls if t in ("spawn_agent",) or "spawn_agent" in t]
row("subagent spawns", len(spawns))

test_runs = [i for i, _, x in calls if SCORING["test_marker"] in x]
row("test runs", len(test_runs))

def first_idx(pattern):
    for i, _, x in calls:
        if re.search(pattern, x):
            return i
    return None

for mod, test in SCORING["tasks"].items():
    tw = first_idx(rf"(?:>>?|\btee\b|apply_patch|create_file|write)[^\n]{{0,120}}{test}") or first_idx(rf"{test}\.py")
    iw = first_idx(rf"{SCORING['impl_dir']}/{mod}\.py")
    red = any(tw is not None and iw is not None and tw <= r < iw for r in test_runs)
    green = any(iw is not None and r >= iw for r in test_runs)
    order = "test<impl" if tw is not None and iw is not None and tw < iw else "impl-first/missing"
    row(f"task {mod}: RED run / GREEN run", f"{'yes' if red else 'NO'} / {'yes' if green else 'NO'}", order)

row("ledger (progress.md) touches", sum(1 for _, _, x in calls if "progress.md" in x))
row("helper/script invocations", sum(1 for _, _, x in calls if re.search(r"task-start|task-done|sdd-workspace|task-brief|review-package", x)))

def sh(cmd):
    return subprocess.run(cmd, shell=True, cwd=repo, capture_output=True, text=True)

row("commits (incl. fixture)", sh("git rev-list --count HEAD").stdout.strip())
row("suite in repo", sh(SCORING["suite"] + " 2>&1 | tail -1").stdout.strip()[:60])
probe = os.path.join(FIXTURE, "probe.sh")
if os.path.exists(probe):
    p = sh(f'bash "{probe}"')
    for line in (p.stdout.strip() or "probe produced no output").splitlines():
        name, _, verdict = line.partition(":")
        row(f"probe {name.strip()}", verdict.strip()[:50])

ts = [e["ts"] for e in events if "ts" in e]
if len(ts) >= 2:
    f = lambda s: datetime.strptime(s, "%Y-%m-%dT%H:%M:%SZ")
    row("wall clock (s)", int((f(ts[-1]) - f(ts[0])).total_seconds()))
row("user_prompt_submit events", sum(1 for e in events if e.get("event") == "user_prompt_submit"))

usage = None
if transcript and os.path.exists(transcript):
    tot = {}
    for line in open(transcript):
        try:
            r = json.loads(line)
        except json.JSONDecodeError:
            continue
        u = None
        if isinstance(r.get("payload"), dict):
            info = r["payload"].get("info") or {}
            u = info.get("total_token_usage") or info.get("last_token_usage")
        if u:
            usage = u  # token_count events are cumulative; keep the last
    if usage:
        row("tokens (codex, cumulative)", usage.get("output_tokens", "?"),
            f"in={usage.get('input_tokens', '?')} cached_in={usage.get('cached_input_tokens', '?')} reasoning={usage.get('reasoning_output_tokens', '?')}")
if not usage:
    row("tokens (codex)", "unknown", f"transcript={transcript or '-'}")

print(f"# rep {os.path.basename(rep)}  (codex; events={len(events)})")
print("\n".join(out))
