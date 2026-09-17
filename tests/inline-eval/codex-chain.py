#!/usr/bin/env python3
"""Trace the review chain of a Codex rep from its rollout transcripts.

Usage: codex-chain.py <codex-worker-home>   (e.g. /tmp/csd-workers/homes/ep-cxspike-31)

Run BEFORE `csd stop`, which deletes the worker home. Reads every rollout
under sessions/, tells the main thread from forked reviewer threads, and
prints: the reviewer's final report, and the main thread's assistant
messages that mention the review, decoding, or fixes, so the per-rep
question "did the reviewer find it, how was it graded, did the executor
act" can be answered from evidence. Inter-agent payloads and reasoning
are encrypted in Codex rollouts; assistant messages are not.
"""
import glob
import json
import os
import re
import sys

home = sys.argv[1]
for f in sorted(glob.glob(os.path.join(home, "sessions", "*", "*", "*", "rollout-*.jsonl"))):
    msgs, execs, meta = [], [], None
    for line in open(f):
        try:
            r = json.loads(line)
        except json.JSONDecodeError:
            continue
        t, p = r.get("type"), r.get("payload") or {}
        if t == "session_meta" and meta is None:
            meta = p
        if t == "response_item" and p.get("type") == "message" and p.get("role") == "assistant":
            msgs.append(" ".join(c.get("text", "") for c in p.get("content", []) if c.get("type") == "output_text"))
        if t == "response_item" and p.get("type") == "custom_tool_call":
            m = re.search(r'cmd:\s*"((?:[^"\\]|\\.)*)"', p.get("input", ""))
            execs.append((m.group(1) if m else p.get("input", ""))[:120])
    role = "REVIEWER" if meta and meta.get("forked_from_id") else "MAIN"
    print(f"===== {role} {os.path.basename(f)[:48]}  assistant msgs={len(msgs)} execs={len(execs)}")
    if role == "REVIEWER":
        for m in msgs[-1:]:
            print("  REPORT:", " ".join(m.split())[:3000])
    else:
        hits = [m for m in msgs if re.search(r"(?i)unicode|decod|utf|review|minor|important|critical|fix", m)]
        for m in (hits or msgs[-2:]):
            print("  MAIN:", " ".join(m.split())[:900])
            print()
