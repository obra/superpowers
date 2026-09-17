#!/usr/bin/env python3
"""Price inline-eval reps in USD by the model each agent actually ran on.

Usage: cost.py <rep-dir>...   (each rep dir has cfg/projects/**/<sid>.jsonl)

Reads every assistant message's usage in the main transcript and its
subagent transcripts, prices each by that message's `model`, and prints one
line per rep plus per-model totals. Pass several rep dirs to get an arm's
median at the end.

Pricing: Anthropic first-party API rates as cached in the claude-api skill
reference on 2026-06-24 (input/output per MTok), with cache reads at 0.1x
input and cache writes at 1.25x input as that reference states. Update
here if the rates change; nothing else in the harness depends on them.
"""
import glob
import json
import os
import statistics
import sys

PRICE = {  # $/MTok: input, output
    "claude-opus-5": (5.00, 25.00),
    "claude-sonnet-5": (2.00, 10.00),
    "claude-haiku-4-5": (1.00, 5.00),
    # Mantle (Claude on AWS) ids. Priced here at Anthropic first-party list
    # rates for the same model so arms stay comparable; Bedrock bills
    # separately and may differ. Opus 4.8 is the same tier as Opus 5.
    "us.anthropic.claude-opus-5": (5.00, 25.00),
    "us.anthropic.claude-sonnet-5": (2.00, 10.00),
    "us.anthropic.claude-opus-4-8": (5.00, 25.00),
    "anthropic.claude-opus-4-8": (5.00, 25.00),
    "anthropic.claude-opus-5": (5.00, 25.00),
    "anthropic.claude-sonnet-5": (2.00, 10.00),
    "anthropic.claude-haiku-4-5": (1.00, 5.00),
}
CACHE_READ = 0.10
CACHE_WRITE = 1.25


def price_for(model):
    for k, v in PRICE.items():
        if model and model.startswith(k):
            return v
    raise SystemExit(f"no price for model {model!r}; add it to PRICE")


def usage_of(path):
    seen = {}
    for line in open(path):
        try:
            rec = json.loads(line)
        except json.JSONDecodeError:
            continue
        m = rec.get("message") or {}
        if (rec.get("type") == "assistant" or m.get("role") == "assistant") and m.get("usage"):
            seen[m.get("id")] = (m.get("model"), m["usage"])
    return list(seen.values())


def cost(model, u):
    inp, out = price_for(model)
    return (u.get("input_tokens", 0) * inp
            + u.get("output_tokens", 0) * out
            + u.get("cache_read_input_tokens", 0) * inp * CACHE_READ
            + u.get("cache_creation_input_tokens", 0) * inp * CACHE_WRITE) / 1e6


def rep_cost(rep):
    cfg = os.path.join(rep, "cfg", "projects")
    mains = [f for f in glob.glob(f"{cfg}/*/*.jsonl")]
    if not mains:
        raise SystemExit(f"no transcript under {cfg}")
    main = max(mains, key=os.path.getmtime)
    files = [main] + glob.glob(f"{main[:-6]}/subagents/*.jsonl")
    by_model = {}
    for f in files:
        for model, u in usage_of(f):
            by_model[model] = by_model.get(model, 0.0) + cost(model, u)
    return by_model


totals = []
for rep in sys.argv[1:]:
    by_model = rep_cost(rep)
    total = sum(by_model.values())
    totals.append(total)
    parts = ", ".join(f"{m.replace('claude-', '')}=${c:.2f}" for m, c in sorted(by_model.items()))
    print(f"{os.path.basename(rep):<14} ${total:6.2f}   ({parts})")
if len(totals) > 1:
    print(f"{'median':<14} ${statistics.median(totals):6.2f}")
