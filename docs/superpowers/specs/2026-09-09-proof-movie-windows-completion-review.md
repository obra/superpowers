# Adversarial review of the Windows completion spec

**Reviewed draft:** `cd5e0bd7`.
**Spec:** [Windows completion design](2026-09-09-proof-movie-windows-completion-design.md).
**Reviewer:** Independent Codex subagent `/root/review_windows_completion`, given the user goal, current spec, and relevant source paths without the controller's full conversation.
**Scope:** Design correctness, scope discipline, existing-code compatibility, and sufficient Windows acceptance. Read-only review; no implementation, runtime tests, provisioning, remote-host work, or additional agents.

## Initial verdict

Revise before implementation. The reviewer judged the narrowed architecture proportionate and found five mandatory contract corrections. None required restoring the old framework, platform matrix, or eval infrastructure.

| Finding | Evidence in the reviewed source | Spec correction |
| --- | --- | --- |
| R1 — Producer attribution and success (P1) | Probe `dispatch` depends on `native_producer`; Bash `emit_bash` selects the first saved pipeline status. The draft required attribution but omitted the input field and aggregate success rule. | Include the field; limit its promise to a direct native invocation or first pipeline stage followed by logging. Keep raw PowerShell status and observed errors distinct. A failed/unknown identified producer cannot yield a successful command result. |
| R2 — Cached ASR verification (P1) | `narrate`'s unchanged-WAV/manifest branch bypasses all transcription, including under `--verify on`. The controller independently identified and sent this case to the reviewer, who confirmed it. | Explicit `on` verifies reused WAVs as well as new audio. Add the off→on cached-clip case to the focused checks; unchanged text does not establish verified audio. |
| R3 — Complete asynchronous control (P2) | Probe reads exactly the next consecutive request filename; arbitrary positive IDs can block it. Duplicate rejection prevents resubmitting solely to wait for an existing result. | Specify consecutive IDs, one controller, visible next ID, and prompt gap/duplicate rejection. Add a wait-only `result` command; distinguish acknowledgment from completion and client timeout from cancellation. |
| R4 — Timeout/shutdown state (P2) | Probe command timeout terminates the session, but the draft left this ambiguous. Probe dispatch publishes close/cancel replies before cleanup. | Command timeout records unknown and tears down the session. Define active-take/pending-command behavior for close/cancel. Successful shutdown completion is published only after resource cleanup, separately from acknowledgment. |
| R5 — Event timing and automatic capture (P2) | Draft allowed nearly two-second duplicate intervals while requiring only total-duration accuracy; a transient could be omitted without failing that duration check. | Specify monotonic boundaries, capture request/completion timestamps, conservative placement on the output grid, and visible gaps. Require several ordered TUI states in automatic frames before exit; a manual checkpoint cannot substitute. |

The controller checked R1–R4 against the cited implementation paths and R5 against the actual capture/export contract before editing. The revisions add focused checks inside the existing Windows validation work, not new infrastructure.

## Boundaries retained

- Fixed geometry removes runtime resize support. It does not prove wrapping/redraw correctness.
- Periodic screenshots are a proposed implementation choice. Existing successful single screenshots do not establish sustained capture correctness.
- A focused actual Windows cadence/wrapping test remains required before further recorder extraction. Its failure requires a bounded design decision, not automatic expansion into the old plan.
- The three Windows shell runs may share downloaded model caches and fixture setup, but each must produce its own final-code evidence.
- Existing agents remain stopped. This newly authorized reviewer performs review only.

## Scoped recheck

The same reviewer rechecked R1–R5 and contradictions introduced by their revisions. **All five are resolved sufficiently for implementation; no new concrete blocker or mandatory scope reduction was found.** The revised design is ready to guide implementation when execution is authorized.

The reviewer found no evidence that fixed-geometry periodic screenshots fail as a design. Sustained capture and wrapping correctness remain unproven runtime questions covered by the focused Windows decision gate. Design approval does not establish Windows support or replace that test.

Both review passes were read-only. The controller changed only this review record and the completion spec; implementation did not resume.
