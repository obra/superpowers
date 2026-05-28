# Evaluation Suite for the `code-review` Skill

This directory holds the evaluation suite that measures the **effectiveness**
of `skills/code-review/SKILL.md` — not the correctness of any particular
review, but how reliably the skill produces good reviews when applied by an
LLM agent.

It lives outside `skills/` on purpose: the suite is engineering infrastructure,
not part of the published plugin.

## Why an eval suite for a prompt?

`SKILL.md` is a long, evolving natural-language program. Like any other
program, edits can regress behavior in non-obvious ways:

- A reworded step subtly changes what bugs the agent catches.
- A removed sentence weakens calibration on a class of issues.
- A new "common failure mode" section accidentally encourages a new one.

The corpus and harness in this directory let us measure those regressions
instead of guessing.

## Five evaluation dimensions

| # | Dimension | Question it answers | v1 status |
|---|-----------|---------------------|-----------|
| 1 | **Detection quality** | Does the skill find real bugs and avoid flagging non-bugs? | **Automated harness** |
| 2 | **Severity / output quality** | Are findings well-formed, severities calibrated, verdict rules obeyed? | Scoring lib shared with v1; design only |
| 3 | **Process compliance** | Did the agent actually follow Steps 0–6? | Design only |
| 4 | **Prompt quality (meta)** | Does `SKILL.md` itself transfer expert reviewer behavior? | Design only |
| 5 | **Reproducibility / cost** | How stable / expensive are results across trials? | Built into v1 harness |

See `design/` for the per-dimension specification of each.

## Layout

```
evals/code-review/
├── README.md                     <- this file
├── design/                       <- per-dimension test specifications
│   ├── 01-detection-quality.md
│   ├── 02-output-quality.md
│   ├── 03-process-compliance.md
│   ├── 04-prompt-quality-meta.md
│   └── 05-reproducibility.md
├── fixtures/
│   ├── detection/                <- diffs + ground truth (split into dev/regression/holdout)
│   ├── output/                   <- labeled review outputs for format/severity scoring
│   ├── process/                  <- transcript fixtures for process compliance
│   └── prompt-meta/              <- artifacts for prompt-validator-generator runs
├── adapters/                     <- "reviewer adapters" — invoke a real LLM/CLI to review
├── harness/
│   ├── Run-DetectionEval.ps1     <- orchestrator
│   ├── lib/                      <- parser, matcher, schema validator
│   └── tests/                    <- Pester tests for the harness itself
└── results/                      <- gitignored: per-run output
```

## Quick start (detection harness)

```powershell
# Smoke test with the manual adapter on one case (you paste the review):
./harness/Run-DetectionEval.ps1 `
    -Adapter ./adapters/manual.ps1 `
    -Fixtures ./fixtures/detection/dev/ssrf-fetch-no-allowlist `
    -Trials 1

# Full dev split, 3 trials per case, with a real LLM adapter:
./harness/Run-DetectionEval.ps1 `
    -Adapter ./adapters/my-claude-adapter.ps1 `
    -Fixtures ./fixtures/detection/dev `
    -Trials 3 `
    -OutDir ./results/run-2026-05-28
```

## Design principles (from the rubber-duck critique)

1. **Detection is scored independently of severity, format, and process.**
   Mixing them produces noisy, gameable metrics.
2. **Evidence regions, not single lines.** A reviewer may flag the right bug
   at the missing-validation site OR at the dangerous call site — both count.
   Findings also match on semantic keywords as a fallback.
3. **Distractor cases are first-class.** "Looks like a bug but isn't" diffs
   measure false-positive rate honestly.
4. **`dev` / `regression` / `holdout` splits.** Holdout fixtures are never
   used while editing `SKILL.md`, preventing prompt-overfitting.
5. **Repeated trials are first-class.** LLMs are non-deterministic. We report
   `caught_in_any` / `caught_in_all` / variance, not just point estimates.
6. **Unmatched findings are queued for adjudication, not auto-counted as FP.**
   Synthetic fixtures often hide real issues; a finding outside the planted
   bug is sometimes legitimate. Cases marked `mature: true` opt in to strict
   FP counting.
7. **Baselines matter.** A bare "review this" prompt and an ablated skill (no
   Steps 5–6) are baselines; the skill should beat them, not just be "good".

## What this suite intentionally does NOT do

- Score the *quality of prose* in findings — too subjective to automate.
- Decide whether a verdict is "right" on real PRs — no ground truth.
- Replace human review for novel categories of bugs not in the corpus.

## Contributing fixtures

See `design/01-detection-quality.md` § "Authoring a new case".
