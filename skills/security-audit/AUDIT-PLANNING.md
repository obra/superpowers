## Full audit planning

The coverage, prior-run, profile, and budget requirements in this section apply only in full audit mode.

### Coverage and prior runs

No one pass is complete. Build a deterministic coverage plan before hunting and update it after every agent result. [RECONNAISSANCE.md](RECONNAISSANCE.md) defines the stable coverage units and [HUNTING.md](HUNTING.md) defines coverage-critic waves. The parent alone updates the ledger.

If prior runs exist, read every compatible `coverage-ledger.json` and `findings.json` before planning the current run:

1. Compare the relevant current source with each prior record and unit. A prior source ref alone is not evidence that a path is unchanged.
2. Carry a prior `confirmed` record into the current candidate set only when its relevant source and conditions are unchanged and its evidence still meets the current contract. Link it to a current ledger unit seeded `planned`, preserve its fingerprint, exclude only that carried root cause from hunters, and send the carried record through the current final verification path; the Phase 3 verifier that re-checks it becomes that unit's assignment owner and moves it to `candidate`.
3. When relevant source for a prior `confirmed` record changed, create a current planned revalidation unit. Do not put that record on the hunter exclusion list. It remains confirmed only if current independent validation establishes the current path and result.
4. Make prior `needs_validation`, `deferred`, `blocked`, `out_of_scope`, and any changed-source unit current work. A still-external `needs_validation` record may be carried only after the current source trace is checked and linked by fingerprint to a current `planned` unit whose verifier re-check supplies its owner and evidence; the record keeps the unresolved blocker. These prior states never suppress a current unit.
5. A prior same-source covered unit may inform priority, but it remains visible in the current ledger. A prior `rejected` record suppresses only the unchanged failed claim, not coverage of its unit; changed evidence creates current work.
6. Read the prior profile and scope. A prior `quick` or scoped ledger contributes only its recorded evidence and gaps, never an implied "rest is fine."

If no prior ledger exists, say so in the final coverage statement. Never imply that one run exhausts the target.

### Run profiles and scope

During full audit setup, pick a profile from the user's request or propose one from the target's size and stakes. Record it in `run-metadata.json` (`profile`, `scope_paths`) and state it in the report. The default is `standard`.

- **`quick`** — a bounded pass for small targets, re-runs, or a fast first look. Coarsen ledger units to surface × boundary × attack class (subsystem uses the fixed canonical `profile/quick/all-in-scope-subsystems` identifier), run exactly one hunter wave followed by exactly one final coverage-critic pass, and use one fresh verifier per candidate for both candidate validation and final record verification. Do not launch a follow-up hunter wave: record the critic's accepted discoveries and reassignments as `deferred`.
- **`standard`** — the workflow as written.
- **`deep`** — for high-stakes or large targets. Split ledger units per subsystem and lifecycle mode, run critic waves to a clean pass, keep candidate validation and final record verification as separate fresh agents, and give `prior_covered_same_source` units an independent second pass.

A **scoped run** audits a subset: named paths, one subsystem, one companion domain, or the diff between two source refs. Seed ledger units only for in-scope surfaces and record everything else as `out_of_scope` — never as `covered`. A scoped or `quick` run must present itself as partial coverage.

Profiles change breadth and redundancy, never the evidence bar. Do not scale away the candidate gate, the source/local execution boundary, `needs_validation` discipline, schema validation, or independent verification of `confirmed` records.

#### Cost budget

The ledger makes spend countable: one unit is roughly one hunter assignment, and one surviving candidate is one or two verifier assignments depending on profile. When the user sets a budget — or the parent proposes one for a large target — record `budget` in `run-metadata.json` as a maximum number of agent invocations across all phases.

Apply the strict budget gate before launching any reconnaissance agent. Reserve the four baseline reconnaissance calls, one final post-wave critic for `quick` or one post-wave plus one distinct final-clean critic for `standard`/`deep`, and at least one verifier call. Add focused reconnaissance only after repeating this gate for each extra call. If the requested budget cannot fund that minimum, launch no agent: ask for a larger budget, narrower scope, or different profile. If the request remains unchanged, set `run_status: "incomplete"` with `incomplete_reason: "budget_cannot_fund_reconnaissance_and_reserves"` and report that no audit pass ran.

Spend it in this order:

1. Count reconnaissance, every post-wave critic, and the separate final-clean critic as agent invocations.
2. **Reserve critics and validation before hunting.** For `quick`, reserve its one post-wave final critic. Before every `standard` or `deep` hunter wave, reserve one immediate post-wave critic plus one distinct final-clean critic. Also reserve verifier cost from the profile (about 1 or 2 agents per expected candidate; when in doubt reserve 30% of the balance after critic reservation). Never assign hunters into either reserve.
3. Assign hunters to units in priority order until the hunting allowance is spent. Spend the reserved post-wave critic immediately after that wave; keep the final-clean and validation reserves intact.
4. Before a later wave, reserve its new post-wave critic again. If the remaining budget cannot cover the required critic calls and validation reserve, launch no hunters from that wave, mark its planned units `deferred` with reason `budget_cannot_reserve_critics_and_validation`, and use the retained final-clean critic to record the resulting gap.

Before wave 1, update the pre-recon estimate with seeded units, implied hunter count, mandatory critic calls, validation reserve, and whether the remaining budget covers the plan. If it clearly cannot, say so and propose either a tighter scope or a coarser profile instead of silently thinning evidence. If later facts consume the required final-critic reserve, launch no hunters, mark all planned work deferred, set the run incomplete with reason `critic_budget_exhausted`, and make no complete-coverage claim.

A strict total-agent budget can still be exceeded by an unexpectedly large candidate set or by a material Phase 5 replacement that needs another independent verifier. If the remaining budget cannot validate every candidate, stop hunting, validate candidates in fingerprint order while the budget permits, and set `run_status: "incomplete"` plus `incomplete_reason: "validation_budget_exhausted"`. Keep each unvalidated fingerprint linked to a `candidate` ledger unit with that unresolved reason. Do not put an unvalidated candidate in `findings.json`, relabel it `needs_validation`, or report the run as complete. Phase 6 may produce a partial report only if its first section states that candidate validation is incomplete and lists the affected fingerprints and units. Never exceed a user-set strict budget silently.
