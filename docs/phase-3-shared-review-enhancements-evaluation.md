# Phase 3 Shared Review Enhancements — Behavioral Evaluation

Date: 2026-07-25

Scope: explicit evidence/hallucination and simplicity checks in the existing
task-level and whole-branch code-review prompts.

## Method

Fresh Claude Code 2.1.219 print sessions loaded one unmodified reviewer prompt
at a time. Scenarios prohibited tools so they measured the review contract
rather than repository mutation.

```sh
claude -p "$SCENARIO" --disable-slash-commands \
  --append-system-prompt-file REVIEWER_PROMPT.md \
  --model sonnet --max-turns 1 --output-format json
```

## Baseline

| Surface | Result |
|---|---|
| Whole-branch reviewer | **Partial.** It rejected a false `fetch(..., {retries: 3})` claim, unsupported test report, and five-layer append implementation, but attributed those decisions to generic testing and production-readiness questions. It had no explicit evidence classification or direct simplicity question. Session `d6dd4ef0-a335-4d21-b010-ae5a02e97953`. |
| Task reviewer | **Partial.** It rejected an unsupported cache option, bare “12 passed” claim, and speculative export framework through adjacent report-skepticism and “Extra” rules. It explicitly confirmed the template contained neither a hallucination/unsupported-assumption check nor “Can this be materially simpler?” Session `f7f69ae3-d2f1-4424-9f8e-5c2bdbf08639`. |

## Pass Criteria

Both review surfaces must:

- explicitly challenge load-bearing API, version, repository, behavior, and
  test-result claims using supplied evidence;
- use VERIFIED, INFERRED, or UNSUPPORTED only where material;
- ask whether the implementation can be materially simpler;
- identify premature abstractions and speculative extensibility;
- preserve correctness, security, maintainability, and necessary tests;
- preserve existing scope, severity, read-only, and review-package limits;
- reject preference-only rewrites and avoid verbose evidence ledgers.

Post-change results are recorded after GREEN evaluation.

## Post-Change Results

| Surface | Result |
|---|---|
| Whole-branch reviewer | **Pass after refactor.** The first GREEN run asserted an API was false from model memory (session `31439b11-09b6-4c72-8bfa-8c665087dd9d`), so it did not pass. After tightening, the complete scenario classified the API and test claims `UNSUPPORTED`, refused to assert API behavior from memory, named documentation/types/runtime evidence, rejected the unrelated network call and materially costly abstraction stack, and returned a blocking verdict. Session `2fc9f35e-c275-4706-98b4-9ba7dee26916`. |
| Task reviewer | **Pass.** It explicitly classified the cache capability `UNSUPPORTED`, requested version/API evidence, rejected bare test counts, asked the direct simplicity question, and identified the speculative framework. Session `ae819a63-d5c5-4f33-81b2-54e3bc25a4b0`. |
| Simplicity false positive | **Pass.** It retained a keystore interface with production and test implementations because the boundary directly satisfied security and deterministic-test requirements; it rejected line-count reduction as preference. Session `312cee6a-0686-4ef1-b208-9168a2555cdd`. |

The focused refactor regression classified an unidentified cache option
`UNSUPPORTED`, refused to assert existence or nonexistence from memory, and
named versioned types/docs or observed type/runtime output as required evidence.
Session `b62e090b-c148-45ac-8fe7-1061769823d4`.

## Limits

- The external Drill `evals/` checkout is absent, so these are fresh Claude
  Code print-session evaluations.
- Scenarios test reviewer decisions and prompt interpretation, not a complete
  SDD task or whole-branch execution trace.
