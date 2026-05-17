# Auto-Improve Loop — Design Document

_Date: 2026-03-24_

## Summary

An autoresearch-style loop that automatically optimizes skill triggering accuracy in the superpowers-optimized plugin. Inspired by Karpathy's autoresearch pattern: make one atomic change, test mechanically, keep or revert, repeat.

## Scope

### v1 (current — minimal proof of concept)

- Local Node.js scorer that evaluates `skill-rules.json` against test prompts
- 3 test prompts with expected skill matches
- Orchestrator script launches one Claude session to optimize `skill-rules.json`
- Git-based keep/revert per experiment
- Results logged to `results.tsv`
- `--max-turns 10` to keep session usage low

### Non-goals (v1)

- No SKILL.md description optimization (v3)
- No complexity classification optimization (v4)
- No live dashboard
- No auto-restart on rate limits
- Overfitting prevention is minimal with only 3 test cases

## Architecture

```
tools/autoimprove/
├── run.sh                  # Entry point — launches Claude with the meta-prompt
├── prompt.md               # Autoresearch meta-prompt for Claude
├── eval.js                 # Local Node.js scorer
├── test-cases.json         # Test prompts with expected skill matches
└── results.tsv             # Experiment log (auto-generated, gitignored)
```

## Data Flow

```
run.sh
  └─→ claude -p prompt.md --max-turns 10 --dangerously-skip-permissions
        │
        ├─→ Reads current skill-rules.json + test-cases.json
        ├─→ Runs: node eval.js  →  baseline score
        │
        │   ┌── LOOP ──────────────────────────────┐
        ├─→ │ Analyzes which checks fail and why    │
        ├─→ │ Makes ONE atomic edit to skill-rules  │
        ├─→ │ git commit -m "experiment: ..."       │
        ├─→ │ Runs: node eval.js  →  new score      │
        ├─→ │ If improved → keep, log to results    │
        ├─→ │ If worse → git reset HEAD~1, log      │
        │   └── REPEAT until max-turns ─────────────┘
        │
        └─→ Final summary printed
```

## eval.js — Mechanical Scorer

Re-implements the matching logic from `hooks/skill-activator.js` (~30 lines) to avoid import path issues. Reads `hooks/skill-rules.json` and `tools/autoimprove/test-cases.json`.

### Scoring per test case (3 binary checks each):

1. Did the expected skill appear in the top-3 matches? (yes/no)
2. Was the expected skill ranked #1? (yes/no)
3. Was there no false-positive high-priority match above it? (yes/no)

### Aggregate score

`total checks passed / total checks × 100%`

## test-cases.json — v1 Starter Set

```json
[
  {
    "prompt": "My API is returning 500 errors intermittently, here's the stack trace...",
    "expectedSkill": "systematic-debugging",
    "expectedRank": 1
  },
  {
    "prompt": "I want to build a new notification system for the app",
    "expectedSkill": "brainstorming",
    "expectedRank": 1
  },
  {
    "prompt": "Can you look over my changes before I merge to main?",
    "expectedSkill": "requesting-code-review",
    "expectedRank": 1
  }
]
```

## Safety Constraints

- Claude may ONLY edit `hooks/skill-rules.json` during the loop
- `eval.js` verifies via `git diff --name-only` that only skill-rules.json changed before accepting
- git reset reverts any regression immediately
- `--max-turns 10` caps the session length

## prompt.md — Meta-Prompt Protocol

The meta-prompt instructs Claude to:
1. Read current `skill-rules.json` and `test-cases.json`
2. Run `node tools/autoimprove/eval.js` for baseline
3. Analyze which test cases fail and why
4. Make ONE atomic change to `skill-rules.json`
5. Commit with descriptive message
6. Re-run eval and compare scores
7. Keep (if improved) or `git reset HEAD~1` (if worse/equal)
8. Log result to `tools/autoimprove/results.tsv`
9. Repeat until max-turns exhausted
10. Print final summary

Key rules:
- NEVER edit any file except `hooks/skill-rules.json`
- ONE change per iteration (not multiple)
- Prefer general patterns over specific keywords (avoid overfitting)
- Simpler is better — removing something and getting equal results is a win

## Failure Modes

### Critical (mitigated)

1. **Claude edits wrong files** — Blocked by explicit constraint in meta-prompt + eval.js file-change verification
2. **eval.js path dependency on skill-activator.js** — Avoided by re-implementing matching logic inline

### Minor (accepted for v1)

1. **Overfitting to 3 test prompts** — Acceptable for proof of concept. v2 adds more diverse prompts + negative tests.

## Expansion Path

| Version | Addition | What changes |
|---------|----------|--------------|
| v1 (now) | 3 test prompts, skill-rules.json only, local eval | Proves the loop works |
| v2 | 10+ test prompts including negative tests | More test-cases.json entries |
| v3 | SKILL.md description optimization via CLI eval | New eval mode in eval.js + CLI calls |
| v4 | Complexity classification (labeled micro/lightweight/full prompts) | New test-cases-classification.json + CLI eval |
| v5 | Cross-skill coherence (full pipeline routing) | Multi-turn CLI sessions |

Each version is additive — architecture stays the same, test suite and targets grow.

## Future Session Prompt

To expand the loop in a later session, paste:

> I have an auto-improve loop at `tools/autoimprove/`. It's currently at v1 (3 test prompts, skill-rules.json only, local Node.js eval). I want to expand it to the next tier. Read `tools/autoimprove/prompt.md`, `test-cases.json`, `eval.js`, and the expansion path in `docs/superpowers-optimized/specs/2026-03-24-autoimprove-design.md`. Then:
>
> 1. Add more test prompts to `test-cases.json` (including negative tests — prompts that should NOT trigger certain skills)
> 2. If the current tier is already maxed out (score plateaued at 100%), move to the next version tier (v2→v3→v4→v5 as described in the design doc)
> 3. Run `./tools/autoimprove/run.sh` and show me the before/after scores
