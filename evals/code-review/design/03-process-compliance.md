# Dimension 3 — Process Compliance

> **Question:** Did the agent actually follow the 7-step process in
> `SKILL.md`, or did it shortcut to "produce a review" and skip the
> calibration steps?

This dimension is hard to automate perfectly — transcripts are fuzzy and
"intent" can be faked with section headers. We measure **coarse violations**
that strongly correlate with shallow reviews.

**v1 status:** Designed, not automated. A `Score-Process.ps1` would be a
straightforward addition once we have transcript fixtures.

## What we can check from a transcript

The adapter may optionally emit a structured **transcript log** alongside
the review (path declared in the adapter response). Format: JSONL of agent
events with timestamps:

```jsonl
{"t": 0.0,  "kind": "tool_call", "tool": "read", "args": {"path": "diff.patch"}}
{"t": 1.2,  "kind": "tool_call", "tool": "read", "args": {"path": "src/fetch.ts"}}
{"t": 8.7,  "kind": "tool_call", "tool": "read", "args": {"path": "pr.md"}}
{"t": 15.0, "kind": "agent_write", "text": "### Independent Assessment\n..."}
{"t": 42.0, "kind": "subagent_launch", "task": "model=gemini-2.5 critique..."}
{"t": 67.0, "kind": "agent_write", "text": "## 🤖 Code Review\n..."}
```

When the adapter cannot produce transcripts, process compliance falls back
to **output-only structural checks**.

## Checks (ordered by signal-to-noise)

### Hard fails (strong evidence of skipped process)

1. **Narrative anchoring** — in PR mode, `pr.md` was read **before** any
   `agent_write` containing "Independent Assessment", "what does this change
   do", or similar. Reading the description first violates Step 2.
2. **Multi-model critique skipped without disclosure** — the review output
   contains no `Multi-Model` / `Multi-model` / `Step 5` section AND the
   transcript shows no `subagent_launch` of an external-model agent AND
   the output does not contain a documented skip (e.g., "Multi-model review
   skipped: ..."). `SKILL.md` § Step 5: "Silent skips are not permitted."
3. **Grill step has no written answers** — Step 6 section exists but
   contains only headers / question text, no reasoned answers.
4. **Findings without evidence** — any finding whose body lacks a file/line
   reference, observed-behavior description, or quoted code. The
   Pre-Output Checklist explicitly requires concrete evidence per finding.

### Soft signals (lower confidence)

5. **No surrounding-file reads** — the transcript shows `read(diff.patch)`
   and `read(some-changed-file.ext)` but no reads of callers, helpers, or
   tests. Often correlates with diff-only review.
6. **No PR-narrative reconciliation** — in PR mode, output has no section
   addressing whether the PR description matches the code.
7. **Coverage-via-confirmation** — output contains one confirmed bug and
   nothing else, with skipped multi-model critique. Strong correlation with
   the failure mode of the same name in `SKILL.md`.
8. **Cleanliness bias** — LGTM verdict with no recorded reads beyond the
   diff itself.

## Output-only fallback checks

When no transcript is available, fall back to structural output checks:

- `### Independent Assessment` or equivalent section present.
- `### Multi-Model Critique` section OR documented skip.
- `### Grill` / `### Self-Critique` section with at least N paragraphs of
  content (heuristic: ≥ 3 sentences per question listed in `SKILL.md`).
- `### Detailed Findings` — each finding has a file reference.
- Verdict block present and well-formed (delegated to Dimension 2 parser).

## Fixtures

`fixtures/process/` holds transcript + review pairs with labeled violations:

```
fixtures/process/<case-id>/
├── transcript.jsonl
├── review.md
└── expected.json    # which violations should fire
```

Initial corpus targets:
- `narrative-anchoring-pr-first/` — read pr.md before forming assessment.
- `multi-model-silent-skip/` — no Step 5 section, no documented skip.
- `grill-headers-only/` — Step 6 has questions but no answers.
- `evidence-free-findings/` — findings with no file refs.
- `clean-baseline/` — all process steps respected.

## Why we don't try to grade "quality of thinking"

Inferring whether a Step 2 assessment is *actually* independent (vs.
written after the fact) from a transcript is unreliable. We measure
ordering and presence — the highest-signal coarse violations — and accept
that determined shortcutting can game any automated check. Manual spot
audits of a sampled subset cover the rest.

## Known failure modes of this dimension

- **Some adapters don't expose transcripts.** Fallback to output-only is
  strictly weaker.
- **Headers can be faked.** A skill that says "I am performing Step 5"
  without actually doing so will pass header checks. The transcript hard
  fails (Step 5 launch events) are stronger.
- **Standalone vs PR mode** — `SKILL.md` Step 3 doesn't apply in standalone
  mode. The checker must read `pr.md` presence to switch modes.
