---
name: ace-device-onboarding
description: "Use when onboarding new hardware devices to ACE with device definitions, simulators, nodes, and ace-hub sharing. Enforces Clarify → Design → Plan → Execute → Verify → Share."
user-invocable: false
---

# ACE Paradigm 2 — Device & Simulator Onboarding

Transform device manuals and SDKs into ACE-orchestratable assets: device definitions,
simulators, nodes, workflows, and ace-hub sharing.

## Hard rule: do not write code before Clarify is complete

**You MUST NOT call `Write`, `Edit`, `Bash` with mutating commands, or any CLI like
`ace device create` until all five Phase-1 Clarify gates below are satisfied.** The ONLY
tools allowed in Phase 1 are `AskUserQuestion`, `Read`, `Glob`, `Grep`, `TodoWrite`, and
read-only `Bash` (e.g. `ls`, `cat`). If you feel the urge to skip ahead, call
`AskUserQuestion` instead.

## Phase 1 — Clarify (gather, don't build)

Use `AskUserQuestion` to collect exactly five answers, **one question per call**:

| Gate id       | Question                                                                    |
|---------------|-----------------------------------------------------------------------------|
| `device_info` | What device / instrument? (model, vendor, physical vs virtual)              |
| `manuals`     | What manuals / documentation are available? (PDFs, API docs, URLs)          |
| `sdk`         | What SDK / API is available? (Python package path, REST, vendor C/C++ lib)  |
| `goal`        | What's the goal? Full automation, HITL, or future capability only?          |
| `safety`      | Any safety constraints or dangerous operations to guard against?            |

Rules:
- Ask **one question at a time** via `AskUserQuestion`. Do not batch.
- After each answer, acknowledge briefly (one line) and immediately ask the next gate.
- If the human only says "just do it" / "you decide" / "pick sensible defaults", still
  collect all five answers. The non-interactive exception below applies only when the
  same prompt already supplies all five answers and an exact acceptance contract.
- You may use `Read` / `Glob` / `Grep` to inspect SDK source **only when the human explicitly
  points you at a file path** in their answer. Do not run exploratory `Read` or `Bash` on
  your own initiative during Phase 1.
- Outside the pre-approved non-interactive path, **each gate MUST use
  `AskUserQuestion`** — do not infer answers from context or skip gates.

### Pre-approved non-interactive brief

For headless automation only, the user may explicitly say "do not ask questions" and
provide all five answers plus an exact output/verification contract in the same prompt.
In that case:

1. Extract the five answers from the prompt and SDK source the user named.
2. Treat the requested approach and outputs as already approved.
3. State the extracted assumptions once in the execution log; do not call
   `AskUserQuestion`, write speculative alternatives, or re-open approved decisions.
4. Proceed directly to a short task list and TDD execution.

This fast path is invalid when any safety constraint, SDK source, or success criterion is
missing, or when any physical-device action is required. Never infer that physical
hardware is safe. For a valid fast path, the same pre-approval applies throughout
Phases 2–5: skip their interactive design, plan, create, and local simulator/code-only
run gates when those operations are listed in the acceptance contract. It never
pre-approves physical-device actions or `ace hub push`; either requirement makes the run
interactive.

For the interactive path, when all five gates are collected, summarise the answers back
to the human in one short message and explicitly ask for approval to move to Phase 2.
For a valid non-interactive brief, log the supplied answers and proceed.

## Phase 2 — Design (brainstorming + spec)

Once Phase 1 is approved:

1. **Check if a spec already exists**: look for `docs/superpowers/specs/*-onboarding.md`.
2. **If NO spec exists**, propose **2 or 3** onboarding approaches:
   - **Approach A**: Pure software simulator + full automation.
   - **Approach B**: Human-in-the-loop with traces for future automation.
   - **Approach C**: Hybrid (simulator for safe ops, HITL for destructive ops).
   State pros/cons briefly. Call `AskUserQuestion` for the human to choose (A / B / C / Other).
   For a valid pre-approved non-interactive brief, use its approved approach directly.
3. **Write the spec** to `docs/superpowers/specs/YYYY-MM-DD-<device>-onboarding.md`
   summarising the 5 Clarify answers and the chosen approach.
4. **If spec already exists and is approved**, skip to Phase 3.

## Phase 3 — Plan (write plan, then confirm before execution)

1. **Write a plan** to `docs/superpowers/plans/YYYY-MM-DD-<device>-onboarding-plan.md`
   enumerating the concrete tasks for Phases 4–6. A typical breakdown:
   - Create `type.json` (when using `type_ref`) + `device.json` + `device.py`
   - Write test → implement each backend operation (RED/GREEN)
   - Add `node.json` metadata for editor/discovery when useful; add `node.py` only for
     custom logic that cannot route through the device backend
   - Compose workflow JSON, run end-to-end
   - Write `CLAUDE_BENCHMARK_STATUS.md`

2. **Present the plan** to the human via `AskUserQuestion` and **wait for explicit approval**
   before starting any execution work. For a valid pre-approved non-interactive brief,
   record the short task list and proceed without another approval gate.

3. Once approved, create the corresponding task items via `TodoWrite` or `TaskCreate`
   and mark them `in_progress` / `completed` as you go.

**Do NOT start Phase 4 until the human has approved the plan or a valid non-interactive
brief has pre-approved it.**

## Phase 4 — Execute with TDD

**Iron law: no production code without a failing test first.**

1. RED — write a failing test.
2. GREEN — minimum code to pass.
3. REFACTOR — clean up, test stays green.

**HITL gates — call `AskUserQuestion` before EACH of these CLI operations:**
- `ace device create` — ask: "Ready to create device definition. Proceed?"
- `ace node create` — ask: "Ready to create node(s). Proceed?"
- `ace workflow run` — ask: "Ready to run end-to-end workflow. Proceed?"
- `ace hub push` — ask: "Ready to push to ace-hub. Proceed?"

Do NOT batch these into one confirmation. Each destructive CLI call gets its own
`AskUserQuestion` gate. The human must explicitly approve before each operation. The
only exception is a valid pre-approved non-interactive brief, which may cover local
artifact creation and simulator/code-only runs named in its acceptance contract.
Physical-device actions and `ace hub push` always require an interactive gate.

### Scope Boundary

Run `ace store info` first and create adapter layers only in its active Store. Resolution
priority is `$ACE_STORE_DIR`, then explicit scope, then an enabled repo Store, then the
user Store:
- explicit override: `$ACE_STORE_DIR`
- repo scope: `<git-root>/.ace/store/`
- user scope: `<ACE_USER_DIR>/store/` (default `~/.ace/store/`)

Assets use:
- `devices/<type>/<impl>/` — device definitions
- `nodes/<device-family>/<operation>/` — optional node metadata/custom implementations
- `workflows/` — workflow definitions

Never modify ACE framework core. Work around limitations in your adapter.

### Efficiency

- Don't loop on `Bash` for debugging — read error messages and fix in one pass.
- Don't create excessive tasks. 5–10 `TodoWrite` items is ideal.
- Keep tool calls minimal: aim for < 100 total tool calls.


## Phase 5 — Verify

1. Unit tests per node / per device backend — all must pass.
2. End-to-end: `ace workflow run <test-workflow>` must succeed.
3. **Show the workflow run output** to the human — paste the full stdout/stderr
   so they can see the result (e.g. "2+3=5, 5-1=4, 4*4=16, 16/2=8.0").

Fix failures before marking Phase 5 complete.

## Phase 6: Evolution & Sharing

**Before invoking ace-evolve**, write `CLAUDE_BENCHMARK_STATUS.md` in workspace root:
  - Files created, commands run, how to reproduce, Phase-1 answers (verbatim).

**Then invoke `ace:ace-evolve`** for LLM-driven evolution闭环.

The `ace-evolve` skill will:
1. Gather context (traces, `CLAUDE_BENCHMARK_STATUS.md` Known Quirks, existing insights)
2. Analyze patterns with LLM (PCFL failures, CDSI breakthroughs)
3. Distill and promote insights (L1→L2→L3→L4)
4. Apply changes (update CLAUDE.md, create entity memories)
5. Share evolution artifacts to ace-hub (with HITL approval)

The ace-evolve skill will read Known Quirks from `CLAUDE_BENCHMARK_STATUS.md`
and convert them into negative knowledge (L2 insights).

**After ace-evolve completes, push onboarded artifacts to ace-hub:**

**HITL gate:** call `AskUserQuestion` before each `ace hub push`.

```bash
# Push device with memory
ace hub push <device-id> --type device --commit

# Push nodes
ace hub push <node-id> --type node

# Push workflows
ace hub push <workflow-id> --type workflow --commit
```

## Reference Templates

**A concrete device has exactly one backend.** Put SDK calls and ordinary operation
handlers in `device.py`. Use `node.py` only for custom/composite logic that is not a
device capability.

- **`device.json` template** → see `references/device-json-template.md`
- **`device.py` backend template** → see `references/device-py-template.md`

### Scope Reminder

**Hierarchy:** `devices/<device_type>/<implementation>/`
- Example: `devices/stm/nanonis/` (hardware), `devices/stm/simulator/` (simulator)

| Layer | Content | Location |
|-------|---------|----------|
| Device definition | Capability contract, SDK config | `device.json` (in `<type>/<impl>/`) |
| Device backend | Connection, SDK calls, ordinary operation routing | `device.py` (in `<type>/<impl>/`) |
| Node metadata | Editor schemas and descriptions | optional `nodes/<family>/<operation>/node.json` |
| Custom node logic | Cross-device/composite logic not owned by one backend | optional `node.py` |
| SDK installation | Reproducible package declaration | `metadata.sdk_install` |

New assets must use `device_backend`, `metadata.sdk_install`, and imports from
`ace.core.*`. Legacy keys (`simulator`, `simulator_id`, `metadata.sdk`, and
`metadata.sdk_path`) are read-only compatibility and must not be generated.

## Anti-Patterns — STOP Immediately

- Writing code before all 5 Clarify gates are answered or supplied in a valid
  non-interactive brief → STOP, go back to Phase 1
- Skipping `AskUserQuestion` without a valid non-interactive brief → STOP, ask now
- Skipping a required physical-device or `ace hub push` gate → STOP, ask first
- Running `Bash` exploratory commands during Phase 1 → STOP, ask first
- Starting execution before plan approval or a valid non-interactive brief → STOP,
  present plan first
- 100+ tool calls without completion → simplify approach
