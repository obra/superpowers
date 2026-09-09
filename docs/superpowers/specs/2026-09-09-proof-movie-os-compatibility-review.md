# Proof movie compatibility: adversarial design review

**Date:** 2026-09-09

**Reviewed draft:** `a36d831d6f9764b6a1355b23f318519701f37029`

**Design:** [OS compatibility spec](2026-09-09-proof-movie-os-compatibility-design.md)

## Method and limits

Two independent agents reviewed the committed draft with separate contexts and
read-only assignments. `review_terminal_spec` examined native terminal control,
shell outcomes, ttyd, and lifecycle. `review_platform_spec` examined the platform
contract, dependency feasibility, and acceptance evidence. The author separately
checked the shared pipeline against the actual imported scripts and verified the
review findings before revising the design.

The independent reviewers found no Critical issues and four Important design
gaps. They did not run native Windows recording. This is adversarial review of a
specification, not skill pressure testing or OS acceptance testing.

## Findings and disposition

| Finding | Evidence/failure scenario | Design revision |
| --- | --- | --- |
| T1: PowerShell outcome was underspecified (Important) | A failed cmdlet can leave an earlier native exit code at zero, or a successful cmdlet can leave it nonzero. PowerShell 5.1 expression wrappers can alter the success variable. Native-exit-only tests miss this. | Separate shell success, native exit attribution, errors, and unknown/interrupted completion. Capture status before logging; define atomic beats and opaque script behavior. Record both PowerShell 5.1 and 7 with mixed cmdlet/native and error fixtures. |
| T2: Process ownership omitted descendants (Important) | ttyd terminates its Windows shell with `TerminateProcess`; this does not by itself prove children/grandchildren stop. A worker can keep writing after a cancelled recording. | Establish a Windows Job Object before children run, with kill-on-close and no breakaway; account for Unix PTY process groups. Drain output during bounded shutdown. Require owned descendants to exit while an unrelated sentinel survives. |
| T3: Output observation could attach to the wrong shell (Important) | ttyd spawns a process per initialized terminal WebSocket. Opening a separate observer socket creates another shell rather than attaching to the filmed one. | One persistent supervisor and one terminal client. Observe the filmed page's existing connection through CDP, use writable mode and a readiness round trip, and control takes through ordered request files. Test nonce, shell identity, state, and command continuity. |
| P1: OS and feature coverage were not joined (Important) | The original acceptance rows could be satisfied by proving features on one OS and doing smoke runs elsewhere, leaving genuinely headless Linux or WSL local voice untested. | Assign P/B/T/V/L fixture groups to each required OS/architecture environment. Require positive headless and WSL voice runs, separately map shell checks, and reserve verified desktop claims for backends with real successful takes. |
| A1: Nested ASR helper inherited the filmed project (author finding) | Imported `narrate` uses nested `uv run --with faster-whisper ...` without disabling project discovery. An unrelated project Python requirement can prevent the helper from launching. | Disable nested helper project discovery; require compatible interpreter selection and a fixture proving no dependency on, or mutation of, the filmed project's environment/lockfile. |

Additional clarifications retain the existing `movie` scene's own-audio/duration
exception, use the exact scene-kind names in the fixture, distinguish helper
UTF-8 pipes from arbitrary native command encodings, and require shell-specific
agent evals to prove the actual tool shell rather than the agent's launch shell.

## Verification performed during review

- Inspected ttyd's `src/protocol.c`: process creation is associated with the
  initialized terminal client, and input depends on writable mode.
- Inspected ttyd's `src/pty.c`: Windows shell termination uses `TerminateProcess`.
- Checked Microsoft's PowerShell automatic-variable documentation, Job Objects,
  and ConPTY shutdown documentation. These support the design corrections; they
  do not establish that the future recorder implements them correctly.
- Reproduced uv project discovery in a temporary directory containing a
  `pyproject.toml` requiring Python `>=9.99`.
  `uv run --offline python -c 'print("ASR child launched")'` exited 2 with an
  interpreter-resolution error; adding `--no-project` before `python` exited 0.
  This isolates the project-discovery issue without claiming an actual ASR/model
  test was run.
- Located the external eval checkout at
  `/Users/drewritter/prime-rad/superpowers-evals`, commit `66f08529`, and read its
  Windows guest agent instructions. They establish a native guest launch path,
  not a PowerShell tool adapter or a completed movie eval.

## Recheck and remaining work

Both original reviewers rechecked the revised design. The terminal reviewer
confirmed T1/T2/T3 resolved for implementation planning with no new Critical or
Important contradictions. The platform reviewer confirmed P1 resolved with no
new findings. The terminal reviewer also checked CDP's documented receive events
and binary payload representation and found no demonstrated accessibility blocker
for the proposed observer. No independent review finding remains open.

Runtime validation remains implementation work: the first planned task is a
bounded native Windows probe of same-session ttyd observation, PowerShell/Git Bash
completion, persistent takes, and descendant cleanup. Its result determines
whether the specified adapters can proceed unchanged. The next design deliverable
is the implementation plan; the runtime probe is a prerequisite within that plan,
not a test claimed to have passed during specification review.

The eventual skill changes still require before/after pressure tests and the
OS acceptance matrix. This review must not be cited as that evidence.
