#!/usr/bin/env python3
"""Score one inline-eval rep.

Usage: score.py <rep-dir> [session-id]

Reads the Claude Code session transcript ($CLAUDE_CONFIG_DIR/projects/**/<sid>.jsonl)
for the ordered tool calls and assistant text, the csd events copy in
<rep-dir>/events.jsonl as a cross-check on tool-call counts, the scratch repo
for commits and a real test run, and the session's subagent transcripts for their token usage.

Prints a scorecard: deterministic checks first, then every assistant text
block in order (truncated) so the rationalizations can be read verbatim.
"""
import glob
import json
import os
import re
import subprocess
import sys

rep = sys.argv[1]
sid = sys.argv[2] if len(sys.argv) > 2 else ""
repo = os.path.join(rep, "repo")

# ---- transcript -----------------------------------------------------------

CFG = os.path.expanduser(os.environ.get("CLAUDE_CONFIG_DIR", "~/.claude"))

def find_transcript():
    if sid:
        hits = glob.glob(f"{CFG}/projects/*/{sid}.jsonl")
        if hits:
            return hits[0]
    enc = re.sub(r"[/._]", "-", os.path.realpath(repo))
    hits = sorted(glob.glob(f"{CFG}/projects/{enc}/*.jsonl"), key=os.path.getmtime)
    return hits[-1] if hits else None

transcript = find_transcript()
if not transcript:
    sys.exit(f"no transcript found for {repo}")

# Subagent transcripts: <transcript dir>/<sid>/subagents/agent-*.jsonl.
# In subagent-driven runs the implementers do the writes and test runs, so
# tool calls from every transcript are merged into one timestamp-ordered
# stream. Assistant text and usage are kept per transcript.
sub_dir = os.path.join(os.path.dirname(transcript), os.path.basename(transcript)[:-6], "subagents")
sub_files = sorted(glob.glob(os.path.join(sub_dir, "*.jsonl")))

raw_calls = []  # (timestamp, seq, tool, input, source)
texts = []      # (idx, text)   main transcript only
usage = {}      # main: message id -> usage
sub_usage = {}  # subagents: (file, message id) -> usage
seq = 0

def ingest(path, is_main):
    global seq
    for line in open(path):
        try:
            rec = json.loads(line)
        except json.JSONDecodeError:
            continue
        msg = rec.get("message") or {}
        content = msg.get("content")
        if rec.get("type") != "assistant" or not isinstance(content, list):
            continue
        if msg.get("usage"):
            if is_main:
                usage[msg.get("id", seq)] = msg["usage"]
            else:
                sub_usage[(path, msg.get("id", seq))] = msg["usage"]
        for block in content:
            seq += 1
            if block.get("type") == "tool_use":
                raw_calls.append((rec.get("timestamp", ""), seq, block.get("name", ""),
                                  block.get("input") or {}, "main" if is_main else "sub"))
            elif is_main and block.get("type") == "text" and block.get("text", "").strip():
                texts.append((seq, block["text"].strip()))

ingest(transcript, True)
for f in sub_files:
    ingest(f, False)
raw_calls.sort(key=lambda c: (c[0], c[1]))
calls = [(i, tool, inp) for i, (_, _, tool, inp, _) in enumerate(raw_calls, 1)]

def is_write(tool):
    return tool in ("Write", "Edit", "MultiEdit", "NotebookEdit")

def touched_path(tool, inp):
    if is_write(tool):
        return inp.get("file_path", "")
    if tool == "Bash":
        return inp.get("command", "")
    return ""

# Workers in bypass mode are told to prefer Bash heredocs over Write/Edit,
# so a "write" is either a file tool or a Bash redirection/tee to the path.
def writes_to(tool, inp, pattern):
    if is_write(tool):
        return re.search(pattern, inp.get("file_path", "")) is not None
    if tool == "Bash":
        return re.search(r"(?:>>?|\btee\b)\s*\"?[^\s\"|;&]*" + pattern, inp.get("command", "")) is not None
    return False

def first_write_idx(pattern=None):
    for i, tool, inp in calls:
        if pattern is None and (is_write(tool) or (tool == "Bash" and re.search(r"(?:>>?|\btee\b)\s", inp.get("command", "")))):
            return i
        if pattern is not None and writes_to(tool, inp, pattern):
            return i
    return None

# ---- checks ---------------------------------------------------------------

out = []
def row(name, value, note=""):
    out.append(f"{name:<34} {value!s:<12} {note}")

skills = [(i, inp.get("skill", "")) for i, tool, inp in calls if tool == "Skill"]
ep_calls = [i for i, s in skills if "executing-plans" in s]
first_write = first_write_idx()
row("skill executing-plans invoked", bool(ep_calls),
    "before first write" if ep_calls and (first_write is None or ep_calls[0] < first_write)
    else ("AFTER first write" if ep_calls else ""))
row("all skills invoked", ", ".join(s.replace("superpowers:", "") for _, s in skills) or "none")

agents = [(i, inp) for i, tool, inp in calls if tool == "Agent"]
row("Agent dispatches", len(agents),
    "; ".join(f"{a.get('model', '-')}:{str(a.get('description', ''))[:28]!r}" for _, a in agents))

bash = [(i, inp.get("command", "")) for i, tool, inp in calls if tool == "Bash"]
test_runs = [i for i, c in bash if "unittest" in c]
row("unittest runs", len(test_runs))

tasks = {"counter": "test_counter", "formatter": "test_formatter", "cli": "test_cli"}
for mod, test in tasks.items():
    tw = first_write_idx(test)
    iw = first_write_idx(rf"wordstat/{mod}\.py")
    # a command that writes the test AND runs it counts as a red run (r == tw);
    # one that writes the impl and runs it is green, not red (r == iw excluded)
    red = any(tw is not None and iw is not None and tw <= r < iw for r in test_runs)
    green = any(iw is not None and r >= iw for r in test_runs)
    order = "test<impl" if tw is not None and iw is not None and tw < iw else "impl-first/missing"
    row(f"task {mod}: RED run / GREEN run", f"{'yes' if red else 'NO'} / {'yes' if green else 'NO'}", order)

ledger = [i for i, tool, inp in calls if "progress.md" in touched_path(tool, inp)]
row("ledger (progress.md) touches", len(ledger))
scripts = [c for _, c in bash if re.search(r"sdd-workspace|task-brief|review-package", c)]
row("sdd script invocations", len(scripts))

def sh(cmd):
    return subprocess.run(cmd, shell=True, cwd=repo, capture_output=True, text=True)

commits = sh("git rev-list --count HEAD").stdout.strip()
row("commits (incl. fixture)", commits)
t = sh('python3 -m unittest discover -p "test_*.py" 2>&1 | tail -1')
row("unittest in repo", t.stdout.strip()[:60])
events = os.path.join(rep, "events.jsonl")
turns = sum(1 for l in open(events) if '"user_prompt_submit"' in l) if os.path.exists(events) else "?"
row("user_prompt_submit events", turns, "(background-agent wakeups count too)")

final = texts[-1][1] if texts else ""
row("final: 'Rulings I made'", "Rulings I made" in final)
row("final: mentions self-review", "self-review" in final.lower())
asks = [(i, tx) for i, tx in texts[:-1] if "?" in tx and re.search(r"\b(should I|want me|shall I|continue|proceed|ok to)\b", tx, re.I)]
row("mid-run check-in candidates", len(asks))

KEYS = ("input_tokens", "output_tokens", "cache_creation_input_tokens", "cache_read_input_tokens")
def totals(us):
    return {k: sum(u.get(k, 0) for u in us.values()) for k in KEYS}

main = totals(usage); sub = totals(sub_usage)
def fmt(t):
    return f"out={t['output_tokens']} cache_read={t['cache_read_input_tokens']} cache_create={t['cache_creation_input_tokens']} in={t['input_tokens']}"
row("main session tokens", len(usage), "msgs; " + fmt(main))
row("subagent tokens", len(sub_files), "agents; " + fmt(sub))
both = {k: main[k] + sub[k] for k in KEYS}
row("TOTAL tokens", "", fmt(both))

print(f"# rep {os.path.basename(rep)}  transcript={transcript}")
print("\n".join(out))
print("\n# assistant text, in order (truncated)")
for i, tx in texts:
    one = " ".join(tx.split())
    print(f"[{i:>4}] {one[:220]}")
