# FeatureForge Project Memory Integration

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Summary

FeatureForge should add an optional, repo-visible project-memory layer under `docs/project_notes/` together with a first-class `featureforge:project-memory` skill and narrow touch points in a small set of existing skills. The memory layer must stay explicitly supportive rather than authoritative, must never store secrets, and must not introduce a new workflow stage, runtime-state family, or readiness gate.

This design deliberately adopts the useful part of ProjectMemory, durable cross-session recall in normal repo docs, without importing the parts that would weaken FeatureForge's current trust model or inflate prompt surfaces.

## Problem Statement

FeatureForge already does the most important workflow things correctly:

- approved specs and plans are repo-visible and reviewable
- execution truth is grounded in approved-plan and evidence artifacts
- runtime-owned local state lives under `~/.featureforge/` instead of being improvised from conversation memory

The missing capability is narrower: FeatureForge still lacks one lightweight place to keep durable lessons that help future sessions but do not belong in the authoritative workflow chain.

Importing ProjectMemory verbatim would create three problems:

1. it would blur the line between supportive project memory and authoritative workflow truth
2. it would add broad instruction text to active prompt surfaces that FeatureForge is already trying to shrink
3. it would make it too easy to treat repo-visible memory files as acceptable places for secrets or credentials

FeatureForge therefore needs a FeatureForge-native memory layer rather than a straight copy.

## Desired Outcome

At the end of this work:

- FeatureForge ships a first-class `featureforge:project-memory` public skill for Codex and GitHub Copilot local installs.
- Durable project memory lives in a repo-visible, human-readable markdown subtree that is easy to review and maintain.
- Project memory remains explicitly supportive rather than authoritative.
- Approved specs, approved plans, execution evidence, review artifacts, and runtime-owned local state remain the only workflow-authoritative surfaces.
- Agents can consult or update memory at the right times without project memory turning into a new workflow stage, a new gate, or a second execution-state system.
- The memory layer stays compact enough to fit FeatureForge's prompt-surface discipline.

## Scope

In scope:

- a new public `project-memory` skill
- a repo-visible project-memory subtree and templates
- concise instruction-surface integration for the FeatureForge repo
- targeted routing and integration changes in existing skills
- validation and drift-prevention coverage for the new memory layer
- content-level validation for committed `docs/project_notes/*` files so obvious secret-like material and tracker drift are caught before they normalize
- a seeding rubric for the initial FeatureForge memory corpus so seed entries are intentionally distilled from authoritative artifacts or stable repo docs with explicit provenance
- a lightweight manual pruning and refresh policy so memory files stay compact, current, and useful over time without runtime automation
- explicit positive and negative examples in `skills/project-memory/examples.md` so the memory boundary is demonstrated concretely instead of left to interpretation
- a small stable reject vocabulary so fail-closed memory rejections are named consistently across the skill, examples, and validation
- an explicit allowed-write-set rule so `featureforge:project-memory` stays confined to memory files and its one narrow instruction-surface touch point
- an explicit non-instruction rule so repo-visible memory remains supportive context instead of becoming an agent-control surface
- dogfooding the memory layer inside the FeatureForge repository itself

Out of scope:

- introducing a new workflow stage
- introducing a runtime-owned memory command family in v1
- making project memory a required gate for planning, execution, review, QA, or finish
- moving memory into `~/.featureforge/projects/`
- storing secrets or credentials in repo-visible memory files
- migrating historical specs, plans, or execution evidence into memory summaries wholesale
- replacing existing FeatureForge artifact families with project-memory files

## Requirement Index

- [REQ-001][behavior] FeatureForge must ship a first-class `featureforge:project-memory` public skill that is discoverable through the existing shared skills install for Codex and GitHub Copilot local installs.
- [REQ-002][behavior] The v1 memory corpus must live in `docs/project_notes/` and must include `README.md`, `bugs.md`, `decisions.md`, `key_facts.md`, and `issues.md`.
- [REQ-003][behavior] `docs/project_notes/` must be explicitly documented as supportive project memory rather than authoritative workflow or execution state.
- [REQ-004][behavior] If project memory conflicts with approved spec, approved plan, execution evidence, review artifacts, or runtime-owned local state, the authoritative workflow surfaces must win and the memory files must be updated to match.
- [REQ-005][behavior] The memory skill must preserve the four-file memory model while adapting its semantics so `issues.md` is a lightweight cross-session work log rather than an active task tracker and `decisions.md` is a decision index with backlinks rather than a replacement for approved specs.
- [REQ-006][behavior] `key_facts.md` must be explicitly non-sensitive; the skill, templates, docs, and examples must forbid passwords, API keys, tokens, private keys, and other secrets in repo-visible memory files.
- [REQ-007][behavior] All project-memory repo writes must use the existing repo-safety write contract because memory files and `AGENTS.md` are repo-visible files.
- [REQ-008][behavior] The FeatureForge repository must add only a concise project-memory section to `AGENTS.md`; detailed protocols, examples, and maintenance rules must live in the new skill and companion refs rather than bloating top-level instruction surfaces.
- [REQ-009][behavior] `featureforge:using-featureforge` must route explicit memory-oriented requests to `featureforge:project-memory` without making project memory part of every session's default mandatory flow.
- [REQ-010][behavior] `featureforge:writing-plans`, `featureforge:systematic-debugging`, and `featureforge:document-release` must gain brief, targeted hooks that consult or update project memory when relevant without making memory a gate.
- [REQ-011][behavior] The FeatureForge repository must dogfood the memory system with an initial high-signal seed set rather than empty placeholder files only.
- [REQ-012][behavior] New project-memory content must prefer concise bullet-oriented entries and backlinks to authoritative artifacts over duplicated prose.
- [REQ-013][behavior] The memory skill must not create or require a new runtime-owned artifact family, schema family, or workflow phase in v1.
- [REQ-014][behavior] The FeatureForge skill, companion refs, and seed files must borrow the upstream ProjectMemory layout, concise dated entry style, and consult-before-rediscovery habits only where those elements remain compatible with FeatureForge's authority model, repo-safety contract, and no-secrets rule.
- [REQ-015][behavior] The initial `docs/project_notes/*` seed corpus in this repository must follow an explicit provenance rubric: each seed entry must be intentionally distilled from approved specs, approved plans, execution evidence, review artifacts, or stable repo docs, and every entry except purely local factual headings must carry a source backlink or `Last Verified` marker that makes the origin inspectable.
- [REQ-016][behavior] The skill guidance, boundary README, or companion refs must define a manual maintenance policy for each memory file type so stale or low-signal entries are pruned deliberately: recurring-only retention for `bugs.md`, breadcrumb-only retention for `issues.md`, periodic `Last Verified` refresh for volatile `key_facts.md` entries, and conservative retention for `decisions.md`.
- [REQ-017][behavior] `skills/project-memory/examples.md` must include both positive and negative examples for `bugs.md`, `decisions.md`, `key_facts.md`, and `issues.md`, including examples of rejected secret-like content, authority-blurring summaries, and `issues.md` entries that drift into live tracking rather than durable breadcrumbs.
- [REQ-018][behavior] The FeatureForge project-memory skill and companion refs must use a small stable reject vocabulary for fail-closed memory updates: `SecretLikeContent`, `AuthorityConflict`, `TrackerDrift`, `MissingProvenance`, `OversizedDuplication`, and `InstructionAuthorityDrift`.
- [REQ-019][behavior] Unless the user explicitly requests some other file edit, `featureforge:project-memory` may write only to `docs/project_notes/*` and the narrow project-memory section it owns in `AGENTS.md`; it must not expand into broad repo documentation edits under the guise of memory maintenance.
- [REQ-020][behavior] `docs/project_notes/*` must be treated as supportive context, not instruction authority. The skill, companion refs, examples, and validation must reject or rewrite imperative agent-control language that tries to override authoritative instructions, routing, or workflow truth.
- [REQ-021][behavior] If `docs/project_notes/` already exists in partial or malformed form, `featureforge:project-memory` must preserve valid existing content, create only the missing files or missing boundary content, normalize malformed boundary text when needed, and avoid overwriting substantive memory entries unless the user explicitly asks for a rewrite.

- [DEC-001][decision] `docs/project_notes/` is the correct storage path for v1 because it preserves "normal engineering docs" ergonomics while keeping supportive memory visibly separate from authoritative `docs/featureforge/` workflow artifacts.
- [DEC-002][decision] FeatureForge will add `README.md` inside `docs/project_notes/` because the memory subtree needs an explicit boundary document that prevents authority confusion.
- [DEC-003][decision] FeatureForge will not add `.github/copilot-instructions.md` in this repository for v1 solely to support project memory; `AGENTS.md` plus the public skill surface is sufficient and avoids adding another drift-prone instruction surface.
- [DEC-004][decision] FeatureForge will not add a dedicated runtime helper or CLI command family for project memory in v1; manual repo-visible markdown plus skill guidance is sufficient and materially safer.
- [DEC-005][decision] Memory files must summarize and link; they must not silently become a second issue tracker, second ADR system, or second execution log.
- [DEC-006][decision] Upstream ProjectMemory is source material, not executable truth; FeatureForge borrows the `docs/project_notes/` layout, four substantive files, concise dated markdown style, and memory-aware consult patterns, but rejects broad protocol injection, credential-oriented `key_facts` examples, and any wording that makes project memory an always-on authority surface.
- [DEC-007][decision] Initial seed entries are curated summaries with provenance, not free-form memory backfill; if a proposed seed item cannot name a stable source artifact or stable repo doc, it should not be seeded into v1.
- [DEC-008][decision] V1 maintenance remains manual rather than automated, but it is still contract-bound: the skill and docs must tell maintainers when to prune old bug and issue entries and when to refresh volatile facts instead of letting memory silently rot.
- [DEC-009][decision] The memory boundary should be taught with explicit "good" and "bad" examples in companion refs rather than by expanding top-level instructions; examples are the right place to show what FeatureForge accepts, rejects, or redirects.
- [DEC-010][decision] Reject classes are skill-level and validation-level vocabulary, not a new runtime protocol. FeatureForge needs stable names for memory rejection cases, but v1 should not add a runtime-owned error schema or state machine for them.
- [DEC-011][decision] The project-memory skill is a narrowly scoped editor, not a general documentation refactor tool. Its default write set is intentionally limited to `docs/project_notes/*` plus the one concise `AGENTS.md` section that points at the memory layer.
- [DEC-012][decision] Project memory is context only. Even when agents read it often, it may not become a backdoor instruction surface or prompt-injection channel; imperative control language belongs in authoritative instruction surfaces, not in `docs/project_notes/*`.

- [VERIFY-001][verification] Generated-skill tests, routing tests, and instruction-contract tests must be extended so the new skill is discoverable, concise, and aligned with the stated authority boundary.
- [VERIFY-002][verification] Validation must fail if active project-memory docs or skill text reintroduce unsafe secret-storage wording, imply workflow authority for project memory, or cause prompt-surface regressions that violate the repo's compaction direction.
- [VERIFY-003][verification] Validation must inspect committed `docs/project_notes/*` content for concrete contract drift, including obvious secret-like patterns and `issues.md` content that starts behaving like a live status tracker or execution log.

- [NONGOAL-001][non-goal] Project memory is not a substitute for approved specs, approved plans, execution evidence, review artifacts, or runtime state.
- [NONGOAL-002][non-goal] Project memory does not become a required readiness, review, QA, or finish gate in v1.
- [NONGOAL-003][non-goal] FeatureForge will not backfill exhaustive historical memory from old artifacts; only durable, high-signal knowledge should be seeded.

## Repo Reality Check

The current repository already distinguishes sharply between authoritative repo-visible workflow artifacts and runtime-owned local state. Active workflow truth lives under `docs/featureforge/specs/`, `docs/featureforge/plans/`, and paired execution evidence, while branch-scoped runtime state lives under `~/.featureforge/projects/`. That separation is one of FeatureForge's strongest properties and must not be diluted.

The current repository does not yet have a `docs/project_notes/` subtree, so project memory does not exist today as a first-class checked-in surface.

The current `AGENTS.md` is a high-signal instruction surface, but it still carries stale `Superpowers` branding and is already heavier than ideal. Project-memory integration should take advantage of that already-needed cleanup instead of expanding top-level instructions with a large new protocol block.

The current skill stack already routes work through `using-featureforge`, already uses repo-safety for repo-visible writes, and is already moving toward smaller top-level `SKILL.md` files with companion references. Project-memory integration must fit those directions rather than fight them.

UI scope for this spec is none.

## Design Principles

- Project memory is supportive memory only, never workflow authority.
- Repo-visible markdown is the product surface in v1; no new runtime-state family is introduced.
- Memory should summarize and backlink rather than duplicate existing authoritative artifacts.
- Active prompt surfaces should stay short; detailed operating instructions belong in companion refs.
- Secret handling must fail closed. If content would be unsafe in git, it does not belong in project memory.
- Memory should create compound-learning value, not maintenance theater. If an entry will not reduce future re-discovery, it should not be added.

## Upstream ProjectMemory Inputs

This design should use the upstream `SpillwaveSolutions/project-memory` repository as source material for the new FeatureForge skill, specifically:

- `README.md`
- `SKILL.md`
- `references/bugs_template.md`
- `references/decisions_template.md`
- `references/key_facts_template.md`
- `references/issues_template.md`

The upstream material provides the right ergonomic baseline, but it cannot be copied verbatim into FeatureForge.

| Upstream element | Keep in FeatureForge | Required adaptation |
|---|---|---|
| `docs/project_notes/` layout | yes | add an explicit boundary README and authority ordering so memory is visibly separate from workflow truth |
| Four substantive files: `bugs.md`, `decisions.md`, `key_facts.md`, `issues.md` | yes | keep the file taxonomy, but tighten semantics around backlinks, authority boundaries, and non-duplication |
| Concise dated markdown entries with bullet-oriented editing | yes | preserve the editing ergonomics, but require stronger backlinks and narrower content rules where FeatureForge needs them |
| "Check decisions before architecture changes" and "search bugs before rediscovery" habits | yes | express them as short hooks in touched FeatureForge skills rather than as broad always-on instruction blocks |
| Manual maintenance and cleanup instead of automation | yes | keep manual maintenance in v1 and avoid adding runtime-owned memory helpers or background cleanup flows |
| Broad `CLAUDE.md` and `AGENTS.md` protocol injection | no | FeatureForge should use one concise `AGENTS.md` section and focused platform-doc mentions instead of pasting a large protocol block into active prompt surfaces |
| `key_facts.md` examples that normalize credential-adjacent categories, connection-string patterns, or secret-location boilerplate | no, except for the non-sensitive parts | narrow `key_facts.md` to stable non-sensitive facts plus brief "where secrets live" pointers only; do not normalize examples that drift too close to real secret handling |
| `issues.md` examples with active status tracking such as `Completed`, `In Progress`, and `Blocked` | partially | keep the idea of short work breadcrumbs, but narrow the FeatureForge version so it cannot become a second active tracker or execution log |

FeatureForge should directly borrow the upstream strengths that make the memory system usable:

- the `docs/project_notes/` path
- the simple four-file model
- concise, dated, human-readable entries
- the idea that bugs, decisions, and key facts should be consulted before rediscovering them
- the "knowledge compound interest" framing that explains why memory is worth maintaining

FeatureForge should explicitly reject the upstream assumptions that do not fit this repo:

- broad agent-protocol injection into active instruction surfaces
- any suggestion that repo-visible memory should include credentials or credential-like configuration
- any version of `issues.md` that behaves like a live ticket tracker
- any framing that makes project memory feel more authoritative than approved specs, approved plans, evidence, reviews, or runtime state

## Solution Overview

### System Architecture

This feature should land as one optional memory subsystem plus a few narrow consult and update hooks. It should not become a new workflow controller, state machine, or approval surface.

Full system architecture:

```text
                         +----------------------------------+
                         | approved specs / plans / reviews |
                         | execution evidence / runtime     |
                         | state under ~/.featureforge/     |
                         +----------------+-----------------+
                                          |
                                          | authority wins
                                          v
user request
    |
    v
+--------------------------+
| using-featureforge       |
| explicit memory routing  |
+-----+--------------------+
      |
      +-------------------------------> other normal workflow routes stay unchanged
      |
      v
+--------------------------+        +---------------------------+
| featureforge:project-    |------->| featureforge repo-safety  |
| memory                   | write  | preflight for repo writes |
+-----+--------------------+        +-------------+-------------+
      |                                           |
      | consult / update                          v
      |                                 +-----------------------+
      +-------------------------------->| docs/project_notes/*  |
                                        | README.md             |
                                        | bugs.md               |
                                        | decisions.md          |
                                        | key_facts.md          |
                                        | issues.md             |
                                        +-----------------------+

planning work  -----------------------> optional consult decisions.md / key_facts.md
debugging work -----------------------> optional consult/update bugs.md
release docs -------------------------> optional memory follow-through

scripts/gen-skill-docs.mjs -----------> generated skill docs
tests / contract scans ---------------> enforce boundary, routing, and drift rules
```

Coupling and failure posture:

- the new memory layer is a leaf subsystem hanging off normal repo-visible docs, not a new control-plane authority
- repo-safety remains the only write gate for memory files and `AGENTS.md`
- the existing workflow-authoritative artifact families remain upstream of project memory in every conflict path
- if the memory layer is missing, stale, or not yet initialized, planning, debugging, and release still proceed because the hooks are consultative rather than gating

### Authority Model

FeatureForge must treat project memory as a supportive reference layer. The authoritative ordering stays:

1. approved specs under `docs/featureforge/specs/`
2. approved plans under `docs/featureforge/plans/`
3. execution evidence and review artifacts tied to approved work
4. runtime-owned local state under `~/.featureforge/projects/`
5. supportive project memory under `docs/project_notes/`

Project-memory files may:

- summarize durable lessons
- point to authoritative source artifacts
- preserve stable, repeatedly needed non-sensitive facts
- reduce repeated re-discovery across sessions

Project-memory files may not:

- declare workflow state
- replace approval headers
- replace execution evidence or review receipts
- replace runtime-owned status or phase truth
- become the only location of a load-bearing decision if an approved spec or plan already owns that decision
- act like an instruction surface that tells agents what to do, overrides authoritative guidance, or claims to control routing

Authority resolution must be explicit:

```text
docs/project_notes/* --------------------+
                                         |
approved spec -------------------------->| if conflict exists,
approved plan -------------------------->| authoritative artifact wins
execution evidence --------------------->| and memory is updated to match
review artifacts ----------------------->|
runtime-owned local state ------------->|
                                         v
                               durable memory stays aligned
```

### Storage Model

V1 storage is:

```text
docs/
  project_notes/
    README.md
    bugs.md
    decisions.md
    key_facts.md
    issues.md
```

This path keeps project memory collaborative and reviewable in git while preserving `docs/featureforge/` as the workflow-authoritative subtree.

### File Contracts

The v1 corpus uses one boundary document plus four substantive memory files:

| File | Purpose | Required content | Guardrails |
|---|---|---|---|
| `docs/project_notes/README.md` | Define the boundary of project memory | what memory is for, what it is not for, authority ordering, no-secrets rule, update guidance, conflict-resolution rule | must be the first document a human or agent can read to understand the boundary |
| `docs/project_notes/bugs.md` | Preserve recurring failures and expensive-to-rediscover fixes | date, short issue summary, root cause, fix, prevention or verification note, backlink to authoritative evidence when available | prefer "what to remember next time" over historical narrative; do not duplicate execution evidence |
| `docs/project_notes/decisions.md` | Preserve compact ADR-style memory for recurring architectural context | ADR identifier, date, context, decision, alternatives considered, consequences, backlink to authoritative source when one exists | if an approved spec or plan already owns the decision, this file is an index and summary, not the source of truth |
| `docs/project_notes/key_facts.md` | Preserve stable non-sensitive facts repeatedly needed across sessions | directory conventions, important commands, repo norms, service names, ports, URLs, environment names, public or non-secret identifiers, pointers to where secrets actually live | never include passwords, API keys, tokens, private keys, secret JSON blobs, or session tokens; include `Last Verified` or a source link when a fact could go stale |
| `docs/project_notes/issues.md` | Preserve lightweight cross-session work breadcrumbs | notable ticket, issue, PR, plan, or evidence references plus short "what changed" notes | not an execution tracker, not a replacement for plan progress, and not a day-by-day status log |

### Skill and Companion References

FeatureForge should add:

```text
skills/project-memory/
  SKILL.md.tmpl
  SKILL.md
  authority-boundaries.md
  examples.md
  references/
    bugs_template.md
    decisions_template.md
    key_facts_template.md
    issues_template.md
```

The top-level `SKILL.md` must stay concise and operational. It should cover only:

- when the skill applies
- what files it may create or update
- authority-boundary rules
- the no-secrets rule
- the repo-safety preflight requirement for repo-visible writes
- required outputs
- fail-closed behavior when the user asks memory to overwrite authoritative workflow truth

Longer explanation belongs in companion refs:

- `authority-boundaries.md` for the supportive-versus-authoritative model
- `examples.md` for concrete positive and negative entry examples, rejection cases, instruction-authority boundaries, and update patterns
- `references/*.md` for per-file templates

### Instruction-Surface Integration

`AGENTS.md` should gain one concise project-memory section that says, in substance:

- this repo keeps supportive project memory under `docs/project_notes/`
- check `decisions.md` before inventing a new cross-cutting approach when prior architecture may already exist
- check `bugs.md` when debugging recurring failures
- treat `docs/project_notes/` as supportive memory only; approved specs, plans, evidence, reviews, and runtime state remain authoritative
- never store secrets in `docs/project_notes/`
- use `featureforge:project-memory` for setup or structured updates

The repository docs surface should also be updated:

- `README.md`
- `docs/README.codex.md`
- `docs/README.copilot.md`

These docs should describe project memory as an optional supporting capability and name the new skill, but they must not imply that project memory is mandatory for every session.

### Workflow Touch Points

Project memory should help the existing workflow where it creates real leverage and stay invisible where it does not.

| Surface | Required change | Guardrail |
|---|---|---|
| `featureforge:using-featureforge` | Route explicit memory requests such as "set up project memory", "log this bug fix", "record this decision", or "update our key facts" to `featureforge:project-memory` | do not make project memory part of the default mandatory stack |
| `featureforge:writing-plans` | Remind planners to consult `decisions.md` and `key_facts.md` when durable prior knowledge exists, and note that later summary updates may be needed for important new approved decisions | project memory never overrides approved spec truth and never blocks planning |
| `featureforge:systematic-debugging` | Search `bugs.md` before assuming a failure is novel and update `bugs.md` after a meaningful recurring fix | keep the hook short and targeted; this is the highest compound-interest use case |
| `featureforge:document-release` | Update project memory when completed work creates durable knowledge future sessions will need | this is follow-through, not a finish gate |

The intended routing shape is:

```text
explicit memory request
        |
        v
using-featureforge
        |
        v
featureforge:project-memory
        |
        v
repo-safety preflight
        |
        v
docs/project_notes/*

planning work ----------> optional consult decisions.md / key_facts.md
debugging work ---------> optional consult and update bugs.md
release docs -----------> optional durable-knowledge update
```

### Repo-Safety and Write Model

Because `docs/project_notes/*` and `AGENTS.md` are repo-visible files, the project-memory skill must use the shared repo-safety preflight for writes. At minimum the skill must cover these write targets:

- `docs/project_notes/README.md`
- `docs/project_notes/bugs.md`
- `docs/project_notes/decisions.md`
- `docs/project_notes/key_facts.md`
- `docs/project_notes/issues.md`
- `AGENTS.md`

Default allowed write set:

- `docs/project_notes/*`
- the narrow project-memory section in `AGENTS.md`

Default disallowed write set unless the user explicitly asks for a broader edit:

- broad rewrites of `AGENTS.md`
- unrelated sections of `README.md` or platform docs
- specs, plans, execution evidence, or review artifacts
- runtime-owned files under `~/.featureforge/`

Project memory stays inside FeatureForge's existing protected-branch and explicit-approval contract. V1 does not add a separate memory-specific runtime helper, local-state family, or workflow phase.

### Dogfooding Inside This Repository

FeatureForge should use its own project-memory surface with a selective, high-signal initial seed set:

- `key_facts.md`: runtime, install, and layout facts that are repeatedly needed and safe to store
- `decisions.md`: a short index of stable architectural choices that future sessions are likely to revisit
- `bugs.md`: only recurring or expensive-to-rediscover failures
- `issues.md`: only a few notable recent work breadcrumbs with authoritative links

Do not bulk-import historical material. Empty placeholders and giant dumps are both failures. Seed only the entries that are likely to reduce future re-discovery.

The initial seed set must follow a simple provenance rubric:

- prefer approved specs, approved plans, execution evidence, review artifacts, and stable repo docs such as `README.md` as seed sources
- every seed entry should collapse one durable lesson or fact, not restate an entire source artifact
- every seed entry except purely local factual headings must include a source backlink or `Last Verified` marker
- if the source is unstable, disputed, or not yet authoritative, do not seed it
- if the seed entry would be longer than the memory value it creates, replace it with a shorter summary plus backlinks

Representative seed-collapse example:

```text
authoritative source:
approved spec says runtime state lives under ~/.featureforge/

bad memory seed:
"FeatureForge has a runtime architecture with multiple local state folders and a broader philosophy around state ownership..."

good key_facts seed:
- Runtime state root: `~/.featureforge/`
  Source: README.md
```

### Manual Maintenance Policy

V1 maintenance is intentionally manual. FeatureForge should not add automation, background cleanup, or runtime-owned retention state for project memory. But manual maintenance still needs a written rubric so the files remain compact and high-signal.

| File | Keep | Prune or refresh when |
|---|---|---|
| `bugs.md` | recurring failures, expensive-to-rediscover fixes, prevention notes with lasting value | remove or collapse entries when the bug was one-off, tied to obsolete code, or has not provided recurring value after the underlying system changed materially |
| `decisions.md` | durable cross-cutting decisions and stable rationale | rarely delete; instead supersede or annotate when a decision changes so the historical trail remains legible |
| `key_facts.md` | stable non-sensitive facts that future sessions repeatedly need | refresh `Last Verified` or source links when facts are volatile, rename or remove entries when infrastructure or commands change, and delete facts that are no longer true or useful |
| `issues.md` | a short rolling set of durable breadcrumbs to recent notable work | trim or archive older breadcrumbs once they stop helping future orientation, and do not retain routine micro-status that belongs in tickets, plans, or evidence artifacts |

The maintenance rule of thumb is simple:

- if an entry no longer helps a future session avoid re-discovery, remove or collapse it
- if an entry still helps but its source changed, refresh the backlink or `Last Verified`
- if an entry starts behaving like a tracker, log, or stale narrative, prune it back to a shorter durable memory or remove it entirely

### Reject Vocabulary

Fail-closed memory rejections should use a small stable vocabulary so the skill, companion examples, and validation all describe the same boundary:

| Reject class | Trigger | Required response |
|---|---|---|
| `SecretLikeContent` | proposed content includes passwords, tokens, keys, secret JSON, or other credential-like material | refuse the write, explain that project memory is repo-visible, and redirect to a secret manager, `.env`, password manager, or a "where secrets live" note only |
| `AuthorityConflict` | proposed content would override or contradict an approved spec, approved plan, evidence artifact, review artifact, or runtime-owned state | refuse the memory-first write, cite the authoritative surface, and require memory to backlink or align instead |
| `TrackerDrift` | proposed `issues.md` or other memory content behaves like a live task tracker, workflow status board, or execution log | reject the tracker-style entry and replace it with a shorter durable breadcrumb plus link to the real source of truth |
| `MissingProvenance` | a seed or summary entry claims durable knowledge without a stable source artifact, stable repo doc, or `Last Verified` marker where needed | do not add the entry yet; require a proper source or verification note first |
| `OversizedDuplication` | proposed memory content copies large chunks of specs, plans, release notes, or execution evidence instead of summarizing | reject the pasted narrative and require a concise summary plus backlinks |
| `InstructionAuthorityDrift` | memory content uses imperative agent-control language, tries to override authoritative instructions, or presents itself as routing or workflow truth | rewrite the entry as neutral factual context or reject it entirely, and move any real instruction to the proper authoritative surface if the user explicitly wants that |

These names are primarily for:

- skill guidance
- companion examples
- test and validation assertions
- crisp reviewer language during memory-related edits

They are not a new runtime error subsystem.

## Failure and Edge Cases

Project memory must fail closed around the same trust boundaries FeatureForge already protects elsewhere.

| Situation | Required behavior |
|---|---|
| Project memory conflicts with approved spec, approved plan, evidence, review artifact, or runtime state | authoritative artifact wins and memory is updated to match |
| User asks to store a password, token, key, or other secret in memory | refuse the write, remind the user that project memory is repo-visible, and redirect to a safe secret-management location or a "where secrets live" note only |
| Proposed memory entry duplicates large chunks of a spec, plan, or execution log | replace duplication with a short summary and backlinks |
| `issues.md` starts carrying workflow status or execution progress | treat that as contract drift and fail validation |
| Validation flags obvious secret-like content or live-tracker drift in committed memory files | fail closed, require the content to be rewritten or removed, and do not rely on README policy text alone |
| Memory content starts reading like prompt instructions or tries to override authoritative behavior | treat it as `InstructionAuthorityDrift`; rewrite it as neutral factual context or reject it |
| Proposed seed entry has no stable source artifact or stable repo doc behind it | do not seed it yet; either find a proper source or leave it out of v1 |
| Memory files grow stale or bulky because nobody knows when to trim them | follow the manual maintenance rubric in the skill and boundary docs; prune, refresh, or supersede entries rather than letting low-signal history accumulate |
| A memory-oriented request starts turning into a broad doc refactor | stop at the default allowed write set and require an explicit user request before editing other files |
| `docs/project_notes/` already exists but one file is missing or the boundary README is malformed | preserve valid existing entries, create only the missing pieces, and normalize the malformed boundary content without rewriting unrelated memory entries |
| A touched skill or repo does not yet have `docs/project_notes/` | treat project memory as optional support and continue; lack of memory must not block planning, debugging, release, or review |
| A fact in `key_facts.md` is volatile or easy to stale | attach `Last Verified` or a source backlink so later agents can validate it quickly |

## Observability and Validation

V1 does not add runtime telemetry for project memory. Its primary observability model is repo-visible content plus deterministic validation that fails when the contract drifts.

Required validation coverage:

- generated-skill tests prove the new skill exists and is checked in
- contract tests prove the new skill includes the supportive-not-authoritative rule, the no-secrets rule, and the repo-safety requirement
- routing tests prove `using-featureforge` routes explicit memory requests correctly
- instruction-contract and doc tests prove `AGENTS.md` and platform docs stay concise and preserve the authority boundary
- validation fails if active memory docs or examples reintroduce secret-unsafe wording
- content scans fail if committed memory files contain obvious secret-like patterns or if `issues.md` drifts toward active status tracking instead of durable breadcrumbs
- validation fails if committed memory files or companion examples contain imperative instruction-like language that tries to act as an authoritative agent-control surface
- contract or doc tests assert that the stable reject vocabulary is present and used consistently in the skill and companion examples
- prompt-budget or structural tests fail if touched top-level skills regress materially in size

This is enough observability for v1 because the feature is repo-visible, deterministic, and intentionally avoids runtime-owned state.

## Rollout and Rollback

### Rollout

This should land as a compact sequence of slices, not one giant patch:

1. boundary contract, templates, and seeded memory files
2. skill generation and explicit routing
3. `AGENTS.md` and platform-doc integration
4. targeted workflow touch points
5. validation hardening

That order stabilizes the highest-risk decision, the authority boundary, before routing and workflow fan-out begin.

### Rollback

Rollback is intentionally simple:

- revert the touched skill and documentation changes
- remove the `docs/project_notes/` subtree if the entire feature is being backed out
- do not perform any runtime-state cleanup because v1 introduces no runtime-owned memory family

Because the design uses ordinary repo-visible markdown rather than a new state machine or data migration, rollback is a normal repo revert rather than a special recovery procedure.

## Risks and Mitigations

| Risk | Why it matters | Mitigation |
|---|---|---|
| Project memory becomes a second workflow truth | That would directly weaken FeatureForge's strongest property: authoritative workflow artifacts and runtime state | keep the authority boundary explicit in the skill, `README.md`, `AGENTS.md`, and tests; require backlinks to authoritative artifacts rather than duplicated truth |
| `issues.md` turns into a second execution tracker | That would duplicate approved-plan and execution-evidence surfaces | narrow `issues.md` to brief cross-session breadcrumbs with links and fail validation when it drifts toward workflow state |
| `key_facts.md` becomes a secret leak vector | Repo-visible memory is the wrong place for secrets | remove all secret-unsafe wording, add explicit "where secrets live" guidance, and add tests that fail on unsafe phrasing |
| `AGENTS.md` gets larger instead of smaller | The repo is already trying to reduce top-level prompt surface | keep the added section short and move details to companion refs |
| Empty files rot and nobody uses the system | A memory layer with no signal creates noise, not leverage | seed the repo with a small set of high-value entries and update memory only where it buys future recall |
| Memory quality decays after setup | Stale or bloated entries would make the layer less trustworthy and increase prompt noise | document a manual pruning and refresh rubric so maintainers know what to keep, what to trim, and when to refresh `Last Verified` facts |
| The skill drifts into broad repo documentation edits | That would blur the feature boundary and make review/write safety harder to reason about | constrain the default write set to `docs/project_notes/*` and the narrow `AGENTS.md` memory section unless the user explicitly broadens scope |
| The skill grows into automation theater | Extra helpers and schemas would add complexity without real value in v1 | keep v1 as repo-visible markdown plus skill guidance and revisit automation only if actual usage shows a clear bottleneck |

## Implementation Phases

### Phase 1: Boundary Contract and Template Foundation

Goal: define the memory boundary clearly before adding routing or dogfooding behavior.

File touch points:

- add `skills/project-memory/SKILL.md.tmpl`
- add generated `skills/project-memory/SKILL.md`
- add `skills/project-memory/references/bugs_template.md`
- add `skills/project-memory/references/decisions_template.md`
- add `skills/project-memory/references/key_facts_template.md`
- add `skills/project-memory/references/issues_template.md`
- add `skills/project-memory/authority-boundaries.md`
- add `skills/project-memory/examples.md`
- update `scripts/gen-skill-docs.mjs` if the generator needs resolver or companion-ref wiring for the new skill
- add `docs/project_notes/README.md`
- add `docs/project_notes/bugs.md`
- add `docs/project_notes/decisions.md`
- add `docs/project_notes/key_facts.md`
- add `docs/project_notes/issues.md`

Required work:

1. Write the new skill contract with a compact top-level instruction surface.
2. Adapt the four substantive memory templates for FeatureForge:
   - tighten `key_facts.md` to non-sensitive content only
   - require backlinks in `bugs.md`, `decisions.md`, and `issues.md` where practical
   - narrow `issues.md` so it cannot become a second execution log
3. Add `docs/project_notes/README.md` as the explicit boundary document.
4. Define the initial-seed provenance rubric in the skill examples or companion refs so seed entries are distilled from authoritative artifacts or stable repo docs rather than written from memory.
5. Seed the initial memory files with a minimal high-signal set of real entries rather than empty placeholders alone.
6. Include at least one worked example that shows how to collapse an approved spec, plan, evidence artifact, or stable repo doc into a short memory entry with a backlink.
7. Document the manual pruning and refresh policy in the skill refs or boundary README so maintainers know when to trim bugs and issues entries and when to refresh volatile facts.
8. Populate `examples.md` with positive and negative examples for every memory file type, including at least one rejected secret-like `key_facts.md` example, one authority-blurring summary that must be replaced by backlinks, and one `issues.md` example that is too tracker-like for FeatureForge.
9. Use the stable reject vocabulary in the skill and examples so rejected cases are named consistently rather than described ad hoc.
10. Document the default allowed write set so the skill stays confined to memory files and the narrow `AGENTS.md` section unless the user explicitly broadens scope.
11. Add positive and negative examples that distinguish neutral memory context from imperatively worded agent instructions, and show how `InstructionAuthorityDrift` is rewritten or rejected.
12. Define partial-initialization behavior so existing valid memory files are preserved and only missing or malformed pieces are normalized by default.

Acceptance criteria:

- the new skill exists
- the memory subtree exists
- every memory file has FeatureForge-adapted semantics
- the authority boundary is explicit in both the skill and `docs/project_notes/README.md`
- the initial seed files follow the provenance rubric instead of ad hoc summarization
- the maintenance rubric is documented clearly enough that future cleanup is consistent and manual rather than improvised
- `examples.md` teaches the boundary with concrete accept/reject pairs rather than generic prose alone
- rejected memory cases are named consistently through the stable reject vocabulary
- the skill's default allowed write set is explicit and narrow enough to keep project-memory edits reviewable
- memory files are explicitly bounded as context rather than instruction authority
- the skill has a deterministic partial-initialization rule that preserves valid existing memory content

### Phase 2: Routing and Instruction-Surface Integration

Goal: make project memory discoverable without making it mandatory for every session.

File touch points:

- update `skills/using-featureforge/SKILL.md.tmpl`
- update generated `skills/using-featureforge/SKILL.md`
- update `AGENTS.md`
- update `README.md`
- update `docs/README.codex.md`
- update `docs/README.copilot.md`

Required work:

1. Add explicit memory-routing language to `using-featureforge`.
2. Add one concise project-memory section to `AGENTS.md`.
3. Fold the already-needed naming cleanup into the touched `AGENTS.md` edit instead of preserving stale `Superpowers` branding around the new section.
4. Document the new skill in the repo and platform docs as an optional support skill.

Acceptance criteria:

- explicit memory requests route correctly
- `AGENTS.md` points to project memory without becoming bloated
- the repo and platform docs describe the memory layer accurately and safely

### Phase 3: Targeted Workflow Touch Points

Goal: use project memory where it materially helps while refusing to turn it into a gate.

File touch points:

- update `skills/systematic-debugging/SKILL.md.tmpl`
- update generated `skills/systematic-debugging/SKILL.md`
- update `skills/writing-plans/SKILL.md.tmpl`
- update generated `skills/writing-plans/SKILL.md`
- update `skills/document-release/SKILL.md.tmpl`
- update generated `skills/document-release/SKILL.md`

Required work:

1. Add a brief `bugs.md` consult and update hook to debugging.
2. Add a brief `decisions.md` and `key_facts.md` consult hook to planning.
3. Add a brief project-memory follow-through hook to document release.
4. Confirm none of the touched skills introduce a hard gate, approval requirement, or phase dependency on project memory.

Acceptance criteria:

- three existing skills gain useful memory touch points
- none of those skills make project memory part of a readiness or finish gate
- top-level prompt surfaces remain controlled

### Phase 4: Validation and Drift Prevention

Goal: keep the memory layer aligned over time instead of letting it silently rot.

File touch points:

- update `tests/codex-runtime/skill-doc-contracts.test.mjs`
- update `tests/codex-runtime/skill-doc-generation.test.mjs`
- update `tests/runtime_instruction_contracts.rs`
- update `tests/using_featureforge_skill.rs`
- update any doc-scan or generation-budget tests required by the current validation suite

Required work:

1. Add assertions that forbid unsafe secret wording in active memory docs and skill text.
2. Add assertions that the supportive-not-authoritative boundary is present in the new skill and the memory README.
3. Add assertions that `using-featureforge` routes explicit memory intents correctly.
4. Add content-level scans for committed `docs/project_notes/*` files that catch obvious secret-like material and `issues.md` tracker drift.
5. Add prompt-budget or structural assertions if needed so the new skill and touched skills do not regress the repo's compaction direction.

Acceptance criteria:

- the test suite actively guards the authority boundary
- secret-unsafe wording is rejected automatically
- the new memory layer stays aligned with routing and instruction surfaces

## Acceptance Criteria

This spec is complete when the repository can demonstrate all of the following:

1. FeatureForge ships a `featureforge:project-memory` skill.
2. The repo contains a `docs/project_notes/` subtree with an explicit boundary README and four adapted memory files.
3. The memory layer is clearly marked as supportive rather than authoritative.
4. Unsafe secret-storage wording is absent from active memory docs, skill docs, and examples.
5. `using-featureforge` routes explicit memory requests to the new skill.
6. `writing-plans`, `systematic-debugging`, and `document-release` contain concise project-memory touch points.
7. Project-memory writes are described as normal repo-visible writes governed by repo-safety.
8. The FeatureForge repository itself contains a small, real seed memory corpus.
9. Validation coverage prevents drift in authority boundaries, unsafe wording, and routing behavior.
10. Validation coverage also catches obvious secret-like content and active-tracker drift inside committed memory files.
11. The initial seed corpus is traceable back to authoritative artifacts or stable repo docs through explicit backlinks or `Last Verified` markers.
12. The skill or boundary docs define when to prune stale bugs and issue breadcrumbs and when to refresh volatile key facts.
13. `skills/project-memory/examples.md` contains concrete good-versus-bad examples for each memory file type, including rejected secret-like and authority-blurring cases.
14. The skill and companion refs use the stable reject vocabulary consistently for fail-closed memory cases.
15. The skill's default allowed write set is limited to `docs/project_notes/*` and the narrow project-memory section in `AGENTS.md` unless the user explicitly asks for broader edits.
16. Memory files and companion examples reject imperative instruction-like language and keep `docs/project_notes/*` in the role of supportive context only.
17. The skill preserves valid existing memory content and only creates missing files or normalizes malformed boundary content unless the user explicitly asks for a broader rewrite.
18. No new workflow stage, runtime-owned memory state family, or readiness gate is introduced.
