# SDD lifecycle metrics: evaluation results

**Date:** 2026-08-22  
**Scope:** Task 13 sanitized evidence for v1 lifecycle metrics.

This document records reproducible local checks and manual behavior evidence.
It does not claim an externally graded Quorum or Gauntlet result. Raw prompts,
transcripts, event streams, secrets, and unrestricted reviewer text remain
outside the repository.

## Environment and provenance

| Item | Value |
| --- | --- |
| Host | WSL2, `Linux UN-NITRO5`, kernel `6.18.33.2-microsoft-standard-WSL2` |
| Windows bridge | Windows 10 Home Single Language, version 2009, build 26200 |
| Node used for deterministic checks | `/tmp/node-task12/bin/node` v22.18.0 |
| Git / Bun | Git 2.43.0; temporary Bun 1.3.14 used for eval fixture tooling |
| Shell lint | Temporary Ubuntu ShellCheck 0.9.0 extraction under `/tmp` |
| Temporary directory | `TMPDIR=/tmp` |
| Harness | Codex desktop collaboration multi-agent harness; `fork_turns: none` where recorded |
| Current evidence agent | `/root/task13_verifier`; parent agent `/root` |
| Model disclosure | Task13 agents `/root/task13_green_happy`, `/root/task13_green_resume`, `/root/task13_green_report_failure`, `/root/task13_green_ignore`, and evidence writer `/root/task13_verifier`: `gpt-5.6-luna`. Parent exact model/build unavailable. |
| Nested delegation | Unavailable in manual GREEN harness; controller performed named implementation/review boundaries directly and did not fabricate subagents. |

## Deterministic verification

Commands used exact Task 13 Step 1 command bodies, with `/tmp/node-task12/bin`
prepended to `PATH` and `TMPDIR=/tmp`.

| Command | Result | Evidence |
| --- | --- | --- |
| `node --test tests/metrics/*.test.mjs` | PASS | 84 tests, 84 pass, 0 fail. |
| `bash tests/claude-code/test-sdd-workspace.sh` | PASS | 13 assertions pass. |
| `bash tests/claude-code/test-sdd-metrics-instructions.sh` | PASS | Exit 0; script is silent. |
| `bash tests/codex/test-package-codex-plugin.sh` | FAIL under default locale | 31 pass, 1 fail: ZIP timestamp expected `(1980, 1, 1, 0, 0, 0)`, actual `(1980, 1, 1, 1, 0, 0)`. |
| `TZ=UTC bash tests/codex/test-package-codex-plugin.sh` | PASS | 32/32 assertions pass when timezone is normalized. Default Europe/Paris remains a known one-hour failure. |
| `bash tests/codex-plugin-sync/test-sync-to-codex-plugin.sh` | PASS | 56 assertions pass. |
| `scripts/lint-shell.sh` | PASS with temporary ShellCheck extraction | Prior verification used ShellCheck 0.9 extracted under `/tmp`; default host run is unverified because `shellcheck` is absent from `PATH`. |

The default environment therefore is not an all-pass reproduction: package
timestamp normalization requires `TZ=UTC`, and shell lint requires the
temporary ShellCheck tool path. No source change is inferred from either host
condition.

## RED versus GREEN behavior evidence

The RED baseline is commit `de4f6b7` (Task 9 runtime, before SDD/finishing
instrumentation). These are approved manual Codex collaboration runs, not
Quorum/Gauntlet run IDs.

| Scenario | RED evidence | GREEN/manual evidence |
| --- | --- | --- |
| `sdd-metrics-happy-path` | `/root/red_happy`: 6 checks passed, CLI exited 2 with `No runs found`; no metrics directory. | `/tmp/sdd-metrics-green-happy.Bksm7D`; run `20260822T120000Z-9cae0009-green`; 20 events, sequences 1–20; CLI/report PASS; report-only commit `349d8e5`; SDD scratch removed; report path only in HEAD. Manual PASS. |
| `sdd-metrics-resume` | `/root/red_resume`: seeded prefix preserved, 6 events ended `run_blocked`, no sequence-7 `run_resumed`. | `/tmp/sdd-metrics-green-resume.GwUuM0`; seeded six-line prefix SHA-256 `5f42fc4bbf2bbf10c1eddd66afa359e27f3eb4c4fb60b8a7a8b0f47ffdc87940` preserved; first append sequence 7 `run_resumed`; one run directory; sequences 1–22; final `run_passed`; report-only commit `46bd98f`. Manual PASS. |
| `sdd-metrics-report-failure` | `/root/red_report_failure`: six checks passed but no lifecycle evidence existed. | `/tmp/sdd-metrics-green-report-failure.4XJmjU`; lifecycle reached truthful PASS/`run_passed`; report persistence visibly failed with `ENOTDIR`; blocker regular file and `run.json`/`events.jsonl` remained; no report commit; PASS/PASS finishing menu remained available. Manual PASS for failure handling. |
| Fresh ignore setup | Not part of RED scenario trio. | `/tmp/sdd-metrics-green-ignore.rTlfnV`; one `/.superpowers/metrics/` info/exclude rule, ignored probe, tracked `.gitignore` unchanged, initial events 1–5. Manual PASS for setup/preflight only. |

The ignore follow-up fixed review-discovered nested-CWD resolution, missing
separator newline in an existing exclude file, concurrent duplicate rules,
linked-worktree shared-scope ambiguity, and helper-failure continuation. The
stale-lock recovery fix was also exercised in the final manual report; these
claims are limited to the focused deterministic checks recorded in scratch
evidence.

No external final verdict or Quorum run ID exists. GREEN labels mean manual
checks against independent artifacts and deterministic gates, not graded
production performance.

## Task 11 wording microtests

Five controls and five candidate samples were manually scored for each case.
The table retains only sanitized outcomes.

| Case | Controls | Candidates | Result |
| --- | --- | --- | --- |
| New-run canonical shape/types | 0/5 exact | 5/5 exact | Candidate converged. |
| Dual review, shared review ID | 0/5 exact | 5/5 exact after refinement | Candidate converged. |
| Stable `F-001` through rereview | 0/5 canonical; stable ID only | 5/5 exact | Candidate converged. |
| Blocked resume sequence/envelope | 0/5 canonical; sequence/ID fragments only | 5/5 exact | Candidate converged. |
| Node unavailable finalization | continuation only; 0/5 canonical | 5/5 exact | Candidate preserved events, continued SDD, printed deferred command. |
| Forbidden content | 5/5 clean | 5/5 clean | No forbidden raw content in either group. |

Sequence wording follow-up: initial dual-review candidate was 1/5 correct
when given an existing *next* sequence; revised wording reached 5/5. Neutral
definite pre-write EIO follow-up reached 4/5 complete candidates (one omitted
one required case), while controls reached 0/5. Uncertain-write physical-tail
reconciliation reached 5/5 candidates. These are manual wording samples, not
statistical evaluation.

Node-unavailable degradation evidence used five controls and five candidates:
controls continued but did not produce canonical final events; candidates
preserved the event stream, continued development, and emitted exactly:

```text
node <plugin-root>/bin/superpowers.mjs metrics <plan-path>
```

## Regression scenarios

The selected existing scenario names were:

- `sdd-quality-reviewer-catches-planted-defect`
- `sdd-spec-constraint-preserved`
- `sdd-rejects-extra-features`
- `sdd-escalates-broken-plan`
- `finishing-branch-untracked-plan-at-cleanup`

Live Quorum/Gauntlet regression runs were not performed: no Gauntlet binary and
no usable `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` were available. No run IDs or
PASS claims are made. Scenario structure and deterministic repository tests
remain separate evidence.

## Pilot lifecycle

Manual two-task pilot used plan `docs/superpowers/plans/math-plan.md` in
temporary repositories/checkouts. Happy path run:

- run `20260822T120000Z-9cae0009-green`;
- events persisted at `.superpowers/metrics/docs/superpowers/plans/math-plan/<run-id>/events.jsonl` after `.superpowers/sdd/math-plan` cleanup;
- `--json`, terminal output, and Markdown report agreed on `PASS`;
- report-only HEAD commit `349d8e5 docs(metrics): update math-plan report`, with only `docs/superpowers/reports/math-plan.md` changed;
- default CLI read was exit 0; pre/post status was identical and no files changed.

The initial happy run exposed unignored generated metrics. After the product
helper fix, the controller applied the final helper and reverified a clean Git
status. Fresh `/root/task13_green_ignore` independently verified the updated
startup recipe; the focused helper test separately passed 20/20 assertions. Report-failure scratch
cleanup was not claimed; its scenario assertion covers persistence and menu
behavior, not cleanup.

Resume pilot reused seeded run `20260818T120000Z-sdd-metrics-resume`, retained
the exact six-event prefix, appended from sequence 7, and ended at sequence
22 with `run_passed`; report-only commit was `46bd98f`.

Report-failure pilot used a regular file at `docs/superpowers/reports`, showed
the visible `ENOTDIR` failure, preserved events and blocker, and made no report
commit. This confirms failure visibility and event durability, not report
generation success.

## Platform and Node limitations

Windows PowerShell detected Windows 10 build 26200, but read-only
`Get-Command node.exe,npm.exe` returned none. Windows metrics, CLI path-with-
spaces, UTF-8 table, Git argument, and Windows report-path checks are therefore
unverified. WSL POSIX path/report tests passed under Node v22.18.0.

When Node is unavailable, lifecycle recording continues and reporting is
deferred; the exact command is the one shown in the microtest section. No
separate live Quorum run without Node was required or claimed.

## Evidence boundary

This document intentionally excludes raw prompts, transcripts, secrets, raw
JSONL, unrestricted reviewer prose, and private evaluator artifacts. It reports
manual PASS only where artifact checks and command output support it.
