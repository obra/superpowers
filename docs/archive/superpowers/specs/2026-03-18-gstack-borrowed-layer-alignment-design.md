# Gstack Borrowed Layer Alignment
**Workflow State:** CEO Approved
**Spec Revision:** 3
**Last Reviewed By:** plan-ceo-review

## Summary

Selectively align four recent `gstack` improvements into Superpowers' already-borrowed runtime/skill layer without changing Superpowers' workflow authority model:

1. more natural trigger-phrase skill descriptions
2. a shared repo/branch slug helper
3. fresher update-check cache behavior with `--force`
4. shared branch grounding in the generated preamble

This is a narrow alignment spec. It does not create an ongoing upstream-sync policy, does not expand Superpowers into newer `gstack` product surfaces, and does not weaken helper-owned workflow routing.

## Problem

Superpowers already includes a borrowed-from-`gstack` layer: shared preamble behavior, runtime helper patterns, and some skill/review assets. That layer has diverged in healthy ways where Superpowers added stronger workflow-state ownership, explicit artifact contracts, execution evidence, and supported helper boundaries.

But the divergence is uneven. Recent `gstack` changes surfaced four improvements that would materially help Superpowers without requiring a broader product shift:

- descriptions that better match real user phrasing
- centralized repo/branch identity derivation
- fresher release visibility in update checks
- consistent branch capture in the shared preamble

Today those areas are split across templates, generated docs, and helpers in a way that creates avoidable drift:

- some skill descriptions are still more formal than users' actual requests
- repo slug and sanitized branch derivation are duplicated in multiple places
- update-check caching is coarser than it needs to be for release visibility
- branch grounding is not consistently provided from one shared runtime source

The goal is not "make Superpowers more like `gstack`." The goal is to absorb the useful parts of recent upstream changes into the borrowed layer while preserving the reasons Superpowers intentionally diverged.

## Goals

- Improve skill discoverability from natural language without changing workflow-stage authority.
- Centralize repo slug and sanitized branch derivation behind one shared helper.
- Make release detection fresher while preserving Superpowers-specific semver handling.
- Provide one shared branch-grounding source for generated skill preambles.
- Keep this work as a narrow alignment package with a minimal diff.

## Not In Scope

- A general upstream-sync policy for future `gstack` changes.
- Importing newer `gstack` product surfaces such as office hours, design review, or design consultation flows.
- Changing workflow stages, approval rules, or execution recommendation semantics.
- Making a new public slug CLI contract in v1.
- Replacing Superpowers' current semver comparison or local-ahead behavior.
- Using branch identity as an approval signal.

## Existing Context

Superpowers already has the key architectural boundaries this spec must preserve:

- `bin/superpowers-workflow-status`, `bin/superpowers-workflow`, and `bin/superpowers-plan-execution` own workflow progression and execution-state authority.
- generated skill docs come from `scripts/gen-skill-docs.mjs` and template `SKILL.md.tmpl` files
- the shared preamble already centralizes runtime root detection, update checks, and session bookkeeping
- repo-relative specs and plans remain the approval record; local manifests are rebuildable indexes

This matters because the four changes belong to different ownership layers:

- description matching belongs to templates and routing tests
- repo/branch identity belongs to shared helper logic and generated preambles
- update freshness belongs to `bin/superpowers-update-check`
- workflow progression stays where it already lives

## Design Principles

### Preserve Workflow Authority

The workflow helpers remain the only authority for stage progression. A skill description may help the agent notice a candidate skill, but it may not become an alternate router.

### Align At The Right Boundary

Take useful `gstack` behavior only at the layer Superpowers actually owns:

- templates/frontmatter for discovery text
- shared helper/generator layer for repo and branch identity
- update-check helper for release freshness

Do not import broader behavior from unrelated `gstack` product surfaces.

### Fail Closed

When alignment work touches routing-sensitive areas, the system must prefer the earlier safe stage over guessing. This especially applies to Item 1.

### Keep The Diff Small

Prefer centralization over new abstractions. This spec should remove duplication and tighten contracts, not create a large new subsystem.

## Dream State Delta

```text
CURRENT STATE                         THIS SPEC                               12-MONTH IDEAL
partial borrowed-layer drift          narrow borrowed-layer alignment          intentional sync policy only if the
and duplicated identity logic         with helper-owned workflow preserved     borrowed surface keeps expanding
```

## Proposed Architecture

This spec adds or changes behavior in three places:

1. template/generator layer
2. shared helper layer
3. update-check helper layer

It explicitly does not add a new workflow-routing authority.

### Ownership Diagram

```text
user request
   |
   v
using-superpowers
   |
   v
workflow helpers ------------------------------+
   |                                           |
   | owns stage progression                    |
   |                                           |
   +--> template descriptions (candidate only) |
   +--> generated preamble (_BRANCH grounding) |
   +--> shared slug helper                     |
   +--> update-check freshness                 |
```

### Authority Rule

```text
description text -> suggests a skill candidate
workflow helper  -> decides whether that skill is valid now
approved docs    -> decide approval state
execution helper -> decides execution handoff path
```

### Dependency Graph

```text
BEFORE
template frontmatter ----------> generated skill docs
skill-local shell snippets ----> repo slug + sanitized branch derivation
shared preamble ---------------> runtime root detection, update checks, sessions
workflow helpers -------------> stage and approval authority

AFTER
template frontmatter ----------> generated skill docs
                                     |
                                     v
                              candidate skill discovery only

superpowers-slug -------------> repo slug + branch identity consumers
                                     |
                                     +--> workflow-state artifact paths
                                     +--> QA artifact paths
                                     +--> branch-finish artifact paths

generated shared preamble ----> _BRANCH grounding for generated skills
superpowers-update-check -----> freshness policy and cache behavior
workflow helpers -------------> stage and approval authority
```

The architectural rule is that the borrowed-layer alignment may improve discovery and shared runtime consistency, but it may not create a second authority path around the workflow helpers.

### Architecture-Specific Data Flows

#### Flow A: Description Discovery

```text
user request
  -> candidate description match
  -> workflow helper state lookup
  -> chosen safe skill

shadow paths:
- no useful description match -> workflow helper still routes conservatively
- overly broad description text -> contract tests and evals fail the change
- helper disagreement with wording -> helper wins and earlier-safe stage is chosen
```

#### Flow B: Repo/Branch Identity

```text
git remote + git branch
  -> superpowers-slug
  -> SLUG / BRANCH
  -> local artifact paths

shadow paths:
- missing remote -> deterministic fallback slug
- detached HEAD -> deterministic branch fallback
- slash-heavy branch names -> sanitized BRANCH
- helper failure -> caller fails closed instead of inventing a new derivation
```

#### Flow C: Update Freshness

```text
installed version + remote version + cache state
  -> superpowers-update-check
  -> UP_TO_DATE / UPGRADE_AVAILABLE / JUST_UPGRADED

shadow paths:
- stale UP_TO_DATE cache -> short TTL forces refresh
- recent UPGRADE_AVAILABLE cache -> sticky reuse avoids noisy refetching
- malformed version text -> existing semver handling remains authoritative
- remote failure -> no false success cache write
```

#### Flow D: Branch Grounding

```text
current git branch
  -> generated shared preamble
  -> _BRANCH
  -> interactive question context / branch-aware messaging

shadow paths:
- missing branch name -> current fallback value is surfaced consistently
- long-lived session on changed branch -> fresh preamble evaluation re-grounds context
- branch capture absent -> generated-doc contract tests fail
```

### Single Points Of Failure, Scaling, And Security Boundary

This change does not add a network service, database, or new auth surface. The main failure class is correctness drift in local runtime helpers and generated docs.

Single points of failure:

- `superpowers-slug` if callers stop owning their current fallback behavior before the helper is stable
- `superpowers-update-check` if cache-policy changes regress version truthfulness
- skill description edits if routing tests are weaker than the broadened wording

Scaling posture:

- 10x and 100x load are not the dominant concerns here because these are local helper and prompt-generation paths
- the real scale risk is repo-surface scale: more skills, more wrappers, and more generated docs can amplify a weak shared contract quickly

Security boundary:

- this spec does not introduce a new external attack surface
- the main security-sensitive area is shell/path handling in slug derivation and cached-file handling in update checks
- callers must reject shell-unsafe assumptions and keep repo-relative path handling conservative

### Production Failure Scenarios

| Area | Realistic Failure | Expected Rescue |
| --- | --- | --- |
| Description alignment | a late-stage skill description becomes too broad and starts competing with earlier stages | deterministic contract tests and routing evals block the change |
| Shared slug helper | repo remote is absent or branch state is detached | helper returns deterministic fallback values and callers avoid ad hoc re-derivation |
| Update freshness | cache policy change causes stale "up to date" confidence or bad upgrade prompting | preserve existing semver logic, keep remote-failure behavior conservative, and verify with helper tests |
| Branch grounding | generated preamble change misses some skills and branch context becomes inconsistent | generated-doc contract tests fail and regeneration is blocked until fixed |

### Rollback Posture

If this alignment ships and causes regressions:

1. revert description broadening first if routing confidence changes
2. revert shared-helper adoption sites while keeping prior inline derivation until helper behavior is fixed
3. revert cache-policy changes independently from the other items
4. keep workflow-helper authority unchanged throughout rollback so the earlier safe stage remains available

## Proposed Changes

### 1. Trigger-Phrase Skill Descriptions

Rewrite selected `description:` fields in template frontmatter so they better match natural user phrasing, but only within strict classes:

- broad-safe skills may gain broader natural-language triggers
- stage-gated skills may gain natural phrasing only if they still name the prerequisite artifact or approval state
- execution/completion skills must remain clearly post-approval and post-implementation

This allows better discovery for requests like "review this implementation plan" or "qa this without fixing anything" while keeping generic phrases like "build this" or "start implementing" away from late-stage skills.

#### Hard Constraints

- descriptions may not authorize a workflow transition
- late-stage skills must continue to encode prerequisites in the description text
- routing must still fail closed to the earliest safe stage when helper state disagrees with user wording

#### Explicit Non-Changes

- no new workflow status values
- no relaxation of helper-first routing
- no broadening of `plan-eng-review`, `executing-plans`, or `finishing-a-development-branch` into generic implementation triggers

### 2. Shared Repo/Branch Slug Helper

Add an internal `bin/superpowers-slug` helper that emits:

- `SLUG`
- `BRANCH`

This becomes the single source of truth for the narrow set of places that currently re-derive repo slug and sanitized branch names separately.

The helper is internal-first in v1. It exists to centralize identity derivation for runtime artifacts and skill-local shell snippets, not to create a new public CLI contract.

To stay aligned with `gstack`, the helper's `BRANCH` value is the sanitized artifact branch token. The generated shared preamble still owns raw `_BRANCH` capture for interactive grounding.

If the helper emits shell-assignment output, it must own shell escaping for every emitted value. Consumers may only evaluate the helper's full escaped assignment contract; they may not concatenate helper-derived values into new shell fragments or partially reconstruct the contract themselves.

In this spec's recommended architecture, `superpowers-slug` is a Bash-first internal helper. It must not become a new supported public PowerShell surface in v1. If a future change needs direct PowerShell parity for this helper contract itself, that should be decided explicitly in a follow-up spec rather than implied here.

#### Branch Value Ownership

The revised design intentionally keeps two branch representations, and they are not interchangeable:

| Surface | Value Shape | Allowed Uses | Must Not Be Used For |
| --- | --- | --- | --- |
| `superpowers-slug` | `BRANCH` = sanitized artifact branch token | manifest names, QA/test-plan/report artifact names, branch-finish artifact paths, other filesystem-safe identifiers | interactive question grounding, user-facing branch messaging, approval semantics |
| generated shared preamble | `_BRANCH` = raw current branch | interactive questions, branch-aware messaging, session grounding | artifact file names, manifest keys, path derivation |

Concrete example:

- actual branch: `feature/auth/refactor`
- helper output: `BRANCH=feature-auth-refactor`
- generated preamble grounding: `_BRANCH=feature/auth/refactor`

If a caller needs both artifact-safe naming and user-facing grounding, it should consume both sources directly rather than transforming one into the other ad hoc.

#### Primary Effect

- fewer duplicated regex fragments
- consistent artifact paths across workflow state, QA artifacts, and branch-finish flows
- easier future changes to slug sanitization rules because there is only one derivation point

#### Explicit Non-Changes

- no public compatibility promise for the helper output beyond internal use
- no repo fingerprint or UUID work in this spec
- no change to which artifacts are authoritative

### 3. Update-Check Freshness

Adopt the useful parts of `gstack`'s newer cache policy inside `bin/superpowers-update-check`:

- shorter TTL for cached `UP_TO_DATE`
- longer sticky TTL for cached `UPGRADE_AVAILABLE`
- explicit `--force` cache busting

Superpowers keeps the behavior it already does better:

- semver-aware version comparison
- normalization for versions with prefixes
- local-ahead handling
- existing snooze semantics unless tests force a targeted change

#### Primary Effect

- users learn about new releases sooner
- troubleshooting and direct refresh become easier with `--force`
- upgrade prompts stay informative without becoming noisy

#### Explicit Non-Changes

- no replacement of `compare_versions()`
- no change in ownership away from `bin/superpowers-update-check`
- no separate release-notification subsystem

### 4. Shared Branch Grounding In The Preamble

Extend the generated shared preamble so it captures `_BRANCH` once, centrally, instead of leaving branch discovery to scattered skill-local snippets.

This is a grounding improvement, not a workflow-state change. It makes interactive questions and branch-aware messaging more consistently anchored to the current checkout.

#### Primary Effect

- all generated skills have one shared branch context
- less duplicated shell in skill docs
- better branch grounding in long-lived or multi-session work

#### Explicit Non-Changes

- branch name is not an approval signal
- no new state-machine transitions
- no change to the branch-scoped manifest model

## Coupling And Sequencing

Items 2 and 4 should be designed and implemented together because both are really about shared repo/branch identity and grounding. Item 1 should come after that foundation because it is routing-sensitive and benefits from a cleaner shared preamble. Item 3 is comparatively isolated and can land after the routing-sensitive work.

Recommended sequence:

1. shared slug helper + generated `_BRANCH`
2. description alignment + routing guardrails
3. update-check freshness
4. regeneration, docs, and release notes

## Code Quality Constraints

This change should be implemented as a small extension of existing runtime surfaces, not as a new subsystem.

### Preferred Shape

The intended implementation shape is:

- targeted edits to existing template files and `scripts/gen-skill-docs.mjs`
- targeted edits to `bin/superpowers-update-check`
- targeted edits to the existing workflow/runtime consumers that currently re-derive repo or branch identity
- targeted additions to existing deterministic tests and routing eval coverage
- for Item 1, those eval additions must remain item-local: fixed repo-versioned scenario and rubric artifacts, synthetic git fixtures, runner/judge instruction artifacts, and bounded local evidence bundles; they must not grow into a reusable repo-wide eval framework or new runtime surface
- at most one new internal helper: `bin/superpowers-slug`

### DRY Rules

- repo slug and sanitized branch derivation should exist in one shared implementation path
- generated preamble branch capture should come from one generator source, not repeated skill-local shell fragments
- late-stage description constraints should be enforced by shared contract tests, not repeated ad hoc wording checks

### Naming And Boundary Rules

- helper and variable names should describe ownership plainly: `superpowers-slug`, `SLUG`, `BRANCH`, `_BRANCH`
- internal helper names must not imply public support if the contract is intentionally internal-first
- new abstractions should be rejected if an existing helper, generator, or test harness can own the behavior cleanly

### Complexity Ceiling

In hold-scope mode, the implementation should be treated as suspect if it requires:

- more than one new helper binary
- new service layers or class hierarchies
- duplicated slug/branch logic in multiple languages without a clearly owned source of truth
- more than a small set of directly relevant file families:
  - generator/templates
  - runtime helpers
  - existing workflow consumers
  - tests/evals
- for Item 1 evals, scenario/rubric instructions, synthetic git fixtures, and bounded local evidence bundles count only as item-local test assets inside `tests/evals`, not as a reusable eval subsystem or persistent product surface

If the implementation appears to need materially more structure than that, the design should be challenged before coding continues.

## Risks And Failure Modes

| Risk | Trigger | Failure Mode | Required Protection |
| --- | --- | --- | --- |
| Description drift becomes routing drift | broad late-stage wording | users get nudged toward later skills too early | wording constraints plus routing regressions |
| Internal helper becomes accidental public surface | docs or tests over-promote `superpowers-slug` | future compatibility burden | keep helper internal-first and document sparingly |
| Update freshness regresses current semantics | port mirrors `gstack` too literally | local-ahead or semver normalization breaks | preserve existing comparison logic and expand tests |
| Branch grounding leaks into workflow authority | `_BRANCH` is treated as more than context | approval semantics become muddled | keep branch capture informational only |

## Error And Rescue Registry

This spec uses review-level named failure classes. Implementation may map them to shell exit paths, Node exceptions, PowerShell wrapper behavior, or deterministic test failures, but it may not collapse them into anonymous "something went wrong" handling.

| Codepath | What Can Go Wrong | Failure Class | Rescued? | Rescue Action | User Sees |
| --- | --- | --- | --- | --- | --- |
| Description template rewrite | a late-stage skill loses prerequisite wording or gains an over-broad trigger | `DescriptionContractViolation` | Y | contract tests fail and block the change | explicit failing test naming the offending skill contract |
| Routing-safety verification | broadened wording routes later than helper state allows | `RoutingSafetyRegression` | Y | routing tests or evals fail before merge | explicit routing regression output |
| `superpowers-slug` remote derivation | repo remote is missing or unusable | `MissingGitRemote` | Y | emit deterministic fallback slug | stable fallback artifact paths rather than a crash |
| `superpowers-slug` branch derivation | HEAD is detached or branch name is unavailable | `MissingBranchContext` | Y | emit deterministic fallback branch value | stable fallback branch-scoped paths |
| `superpowers-slug` execution | git inspection fails unexpectedly or helper output is malformed | `SlugDerivationFailure` | Y | caller surfaces an explicit diagnostic and fails closed instead of re-deriving ad hoc | explicit helper failure rather than silent drift |
| branch representation ownership | helper `BRANCH` is used for user-facing grounding or `_BRANCH` is used for artifact derivation | `BranchRepresentationContractViolation` | Y | contract tests fail and name the ownership mixup directly | explicit contract failure before merge |
| update-check cache read | cache file is unreadable, malformed, or stale beyond policy | `UpdateCacheReadFailure` | Y | ignore the broken cache and recompute from fresh inputs when possible | no false "up to date" confidence from corrupt cache |
| update-check remote lookup | remote version fetch fails or returns unusable content | `RemoteVersionFetchFailure` | Y | preserve conservative behavior and avoid writing a false success result | no misleading upgrade prompt |
| version comparison | version text cannot be normalized safely | `InvalidVersionString` | Y | preserve current semver-aware comparison guardrails and suppress misleading output | no false upgrade/downgrade claim |
| generated preamble branch capture | `_BRANCH` is missing from generated skill docs | `PreambleContractViolation` | Y | generated-doc contract tests fail until the generator output is corrected | explicit generation/test failure |
| regeneration discipline | template changes are not reflected in generated docs | `GeneratedDocDrift` | Y | regeneration checks fail closed | explicit stale-generated-doc failure |
| Item 1 eval execution | runner bootstrap fails, judge times out or is ambiguous, outcome block is malformed, or evidence persistence fails | `Item1EvalExecutionFailure` | Y | fail the affected scenario and keep the overall eval gate closed | explicit eval failure with closed gate |

### Failure Modes Registry

| Codepath | Failure Mode | Rescued? | Test? | User Sees? | Logged? |
| --- | --- | --- | --- | --- | --- |
| description alignment | over-broad trigger text weakens stage discipline | Y | Y | pre-merge contract/eval failure | Y |
| shared slug helper | remote or branch context missing | Y | Y | deterministic fallback behavior | N/A |
| shared slug helper | helper fails unexpectedly | Y | Y | explicit helper diagnostic and fail-closed caller behavior | Y |
| branch ownership split | helper `BRANCH` and `_BRANCH` are silently swapped | Y | Y | explicit contract-test failure | Y |
| update freshness | corrupt cache state | Y | Y | no false freshness claim | Y |
| update freshness | remote lookup fails | Y | Y | no misleading upgrade notice | Y |
| branch grounding | `_BRANCH` omitted from generated docs | Y | Y | explicit contract-test failure | Y |
| Item 1 routing eval | runner bootstrap, judge execution, outcome parsing, or evidence persistence fails | Y | Y | affected scenario fails and the overall eval gate remains closed | Y |

No failure in this spec may ship as `RESCUED=N`, `TEST=N`, and `USER SEES=Silent`.

## Security And Threat Model

This change does not add a new server, auth system, secret store, or external user-facing API. Its security posture is mostly about handling local repo metadata and remote release metadata conservatively so helper behavior cannot be distorted by unsafe shell, path, or cache assumptions.

### Security Invariants

- workflow helpers remain the only authority for stage progression; broadened skill descriptions are not a trust-boundary bypass
- helper-derived repo and branch values are treated as untrusted input until normalized or sanitized for their destination
- cache state is not trusted blindly; malformed or stale cache content must be ignored rather than treated as truth
- remote version text is not trusted until it passes existing normalization and comparison guardrails
- no new secrets, credentials, or user-data classes are introduced by this change

### Threat Model

| Threat | Likelihood | Impact | Mitigation In Spec | Residual Risk |
| --- | --- | --- | --- | --- |
| per-run routing-eval evidence or synthetic fixture content is mistaken for authoritative workflow state, or leaks outside the bounded local evidence path | Low | Medium | keep Item 1 instruction artifacts repo-versioned, keep per-run evidence bundles non-authoritative and outside the repo, and retain only bounded local review/debug evidence | low after explicit contract tests and review tooling |
| shell-sensitive branch or remote values influence helper behavior unexpectedly | Medium | Medium | centralize slug derivation, sanitize helper `BRANCH`, quote shell-sensitive values, and fail closed on helper errors | low after deterministic helper tests |
| helper-derived values leak into unsafe path composition | Medium | Medium | keep helper output internal-first, preserve conservative repo-relative path handling, and avoid ad hoc re-derivation by callers | low to medium if callers ignore the contract |
| malformed cache file causes false freshness confidence | Medium | Medium | ignore unreadable or invalid cache state and recompute when possible | low |
| remote version text causes misleading upgrade state | Low to Medium | Medium | preserve current semver normalization and invalid-version handling | low |
| broadened descriptions weaken workflow trust boundaries | Medium | Medium | helper-first routing, prerequisite wording constraints, and routing regressions/evals | low to medium because wording changes remain judgment-sensitive |

### Input Validation And Trust Boundaries

Trusted inputs do not expand in this spec. The main untrusted inputs are:

- git remote data used for repo identity fallback
- current branch name or detached-HEAD state
- cached update-check content on disk
- remote version text returned by release lookup

Required handling:

- sanitize branch-derived values before using them in artifact names
- keep raw branch or remote values out of ad hoc shell re-evaluation paths; only the helper's full escaped assignment contract may be evaluated by consumers
- reject malformed cache content instead of degrading into false success
- reject or suppress unusable remote version text instead of guessing

### Authorization, Secrets, And Data Classification

- no new authorization model is introduced
- no new secret or credential handling is introduced
- no production PII or user-content storage is introduced
- repo-versioned Item 1 scenario, runner, and judge instruction artifacts remain authoritative review inputs, while per-run routing-eval evidence bundles remain non-authoritative local debug assets outside the repo with bounded retention
- the main persisted data affected by this spec remains local repo/runtime metadata plus bounded local eval evidence: repo slug, branch context, cache state, generated docs, and per-run routing-eval bundles

### Dependency And Injection Posture

- this spec does not require new third-party packages
- the main injection classes to guard are shell/path injection from repo metadata and trust-boundary regression from overly broad description text
- prompt-injection style risk is limited here because the change edits static skill descriptions rather than introducing new user-controlled prompt channels, but routing still needs explicit guardrails because descriptions influence candidate-skill discovery

### Auditability

This spec does not require a new security audit log. It does require explicit diagnostics and deterministic test coverage for helper failures, contract drift, malformed cache/version inputs, and per-run eval evidence handling so security-relevant failures are visible rather than silent.

## Data Flow And Interaction Edge Cases

### Data Flow Tracing

#### Flow 1: User Request To Safe Skill

```text
USER REQUEST
  -> candidate description match
  -> workflow helper state lookup
  -> selected safe skill

shadow paths:
- ambiguous wording matches multiple candidate skills -> helper state still decides earliest safe stage
- no useful candidate match -> helper-led routing remains conservative
- wording implies a later stage than current artifact state -> helper wins and user stays on earlier safe stage
- helper unavailable -> manual fallback inspection path applies
```

#### Flow 2: Repo/Branch Identity To Artifact Paths

```text
git remote + branch state
  -> superpowers-slug
  -> SLUG / BRANCH
  -> consumer-specific artifact path

shadow paths:
- remote missing -> deterministic fallback slug
- detached HEAD -> deterministic fallback branch
- branch contains path separators or shell-significant characters -> sanitized helper `BRANCH`
- raw branch context stays separate from filesystem-safe `BRANCH`; `_BRANCH` remains the raw grounding token elsewhere in the spec
- multiple worktrees on same repo -> branch-scoped artifact paths prevent collisions
```

#### Flow 3: Update Freshness Resolution

```text
installed version + cache state + remote version
  -> superpowers-update-check
  -> freshness decision
  -> user-visible upgrade signal or silence

shadow paths:
- cache corrupted -> ignore cache and recompute conservatively
- cache stale but says UP_TO_DATE -> short TTL forces refresh
- remote fetch fails -> no false upgrade/no false freshness claim
- --force requested -> bypass cached decision path
```

#### Flow 4: Generated Branch Grounding

```text
current branch
  -> generated shared preamble
  -> _BRANCH
  -> branch-aware question context and messaging

shadow paths:
- session persists while branch changes -> fresh preamble execution re-grounds context
- generator update misses some skills -> generated-doc contract tests fail
- branch name unavailable -> fallback branch value is surfaced consistently
```

#### Flow 5: Item 1 Agent-Executed Eval

```text
repo-versioned scenario/rubric artifacts
  -> isolated runner subagent
  -> synthetic git-backed fixture workspace
  -> raw runner transcript/output + structured outcome block
  -> isolated judge subagent
  -> local evidence bundle under ~/.superpowers/projects/<slug>/...
  -> pass/fail verdict

shadow paths:
- scenario artifact revision/fingerprint mismatch -> regenerate the run rather than reuse stale evidence
- fixture bootstrap failure, runner/judge error, or timeout -> fail the affected scenario closed
- missing or malformed structured outcome block -> judge cannot infer the intended route and fails the scenario
- raw branch grounding and sanitized artifact pathing get mixed up -> branch ownership split fails closed
```

### Interaction Edge Cases

| Interaction | Edge Case | Handled? | How |
| --- | --- | --- | --- |
| prompt routing | user asks to "start implementing" while the spec is still draft | Y | helper-first routing keeps the workflow at the earlier safe stage |
| prompt routing | user request could match multiple broadened descriptions | Y | description text suggests candidates only; helper state resolves the winner |
| prompt routing | no description matches cleanly | Y | manual/helper fallback still routes conservatively |
| slug derivation | repo has no `origin` remote | Y | fallback slug path remains deterministic |
| slug derivation | repo is in detached HEAD state | Y | fallback branch behavior remains deterministic |
| slug derivation | two worktrees exist for the same repo on different branches | Y | branch-scoped artifact paths prevent collisions |
| update check | cache file is malformed | Y | cache is ignored rather than trusted |
| update check | remote lookup fails during refresh | Y | no misleading upgrade result is emitted |
| update check | user forces a refresh while a stale cache exists | Y | `--force` bypasses cache reuse |
| generated docs | template changes land without regeneration | Y | generated-doc checks fail closed |
| generated docs | branch changes between sessions | Y | `_BRANCH` is recaptured from the current checkout during the next run |
| eval routing | scenario/rubric artifact is stale versus the current spec revision or fingerprint | Y | the run is regenerated rather than reused |
| eval routing | synthetic fixture workspace fails bootstrap | Y | the affected scenario fails closed |
| eval routing | runner output lacks the required structured outcome block | Y | judge cannot infer the intended route and the scenario fails |
| eval routing | raw `_BRANCH` grounding and sanitized `BRANCH` pathing are mixed up | Y | branch ownership stays explicit and contract-checked |

The important rule is that edge cases in this spec should degrade toward explicit diagnostics, deterministic fallback values, or the earlier safe workflow stage. They should not degrade toward silent drift.

## Test And Verification Requirements

This spec requires deterministic coverage, and Item 1 also requires agent-executed routing-eval coverage.

### Test Diagram

```text
NEW UX FLOWS
- natural-language request discovery against broadened skill descriptions
- user-visible upgrade freshness signaling from update-check results
- branch-grounded interactive question context in generated skills

NEW DATA FLOWS
- git remote + branch state -> slug helper -> artifact path consumers
- template descriptions -> generated skill docs -> candidate-skill discovery
- version/cache inputs -> update-check freshness decision
- current branch -> generated preamble -> _BRANCH-backed messaging

NEW CODEPATHS
- shared slug helper success and fallback branches
- generator-owned _BRANCH insertion path
- update-check split TTL and --force path
- description-contract enforcement for stage-gated and execution skills

NEW INTEGRATIONS / EXTERNAL CALLS
- git remote / branch inspection
- remote release version lookup already owned by update-check
- runner-subagent execution of routing-sensitive scenarios
- judge-subagent review of captured routing behavior

NEW ERROR/RESCUE PATHS
- DescriptionContractViolation
- RoutingSafetyRegression
- MissingGitRemote
- MissingBranchContext
- SlugDerivationFailure
- BranchRepresentationContractViolation
- UpdateCacheReadFailure
- RemoteVersionFetchFailure
- InvalidVersionString
- PreambleContractViolation
- GeneratedDocDrift
```

### Coverage Matrix

| Surface | Happy Path Test | Failure / Edge Test | Test Type |
| --- | --- | --- | --- |
| `superpowers-slug` | normal remote and branch produce stable `SLUG/BRANCH` output | missing remote, detached HEAD, slash-heavy branch, shell-significant branch fixtures, malformed helper output handling | deterministic helper test |
| generated `_BRANCH` preamble | generated skills include `_BRANCH` once from the shared preamble source | template changed but generated docs stale; branch field omitted from generated output | generator/contract test |
| branch ownership contract | helper `BRANCH` stays artifact-only and `_BRANCH` stays grounding-only | swapped ownership or ad hoc transformation fails with `BranchRepresentationContractViolation` coverage | deterministic contract test |
| description guardrails | broad-safe skills broaden safely and late-stage skills keep prerequisites | forbidden broadening phrases or missing prerequisite wording fail | deterministic contract test |
| helper-first routing | earlier-safe stage still wins when wording sounds late-stage | helper disagreement, ambiguous candidate matches, no clean match | workflow sequencing test + agent-executed routing eval |
| update freshness | fresh remote check reports correct status and cache reuse works by policy | stale cache, corrupt cache, remote failure, invalid version text, local-ahead, `--force` | deterministic helper test |

### Required Test Posture

- deterministic tests are mandatory for every helper, generator, and contract path introduced here
- Item 1 requires both deterministic contract coverage and routing-behavior coverage because the risk is model-facing, not just text-shape-facing
- time-sensitive update-check tests should control timestamps explicitly to avoid flaky wall-clock assertions
- helper tests must use repo fixtures for missing-remote and detached-HEAD cases rather than relying on the developer's ambient repo state
- helper tests for any escaped shell-assignment contract must include shell-significant branch fixtures: spaces, quotes, dollar signs, and command-substitution-looking text

### Hostile And Ship Tests

- ship-at-2am confidence test: broadened descriptions still route to the earlier safe stage when artifact state is behind user wording
- hostile QA test: prompts like "finish this branch", "start implementing", or "review the architecture" try to bypass the current stage and still fail closed
- chaos test: corrupt update-check cache plus unavailable remote plus forced refresh still avoids a false success claim

### Flakiness Risks

- clock-sensitive TTL assertions in update-check tests
- runner/judge nondeterminism in routing-sensitive prompt tests
- git fixture setup for detached HEAD and missing remotes

Mitigations:

- freeze or inject timestamps in deterministic tests
- keep agent-run eval coverage narrow, explicit, and compared against a fixed scenario set plus a fixed judge rubric
- isolate git fixture setup inside dedicated test fixtures/scripts

### Eval Policy For Item 1

Item 1 must not rely on deterministic description-contract tests alone. At least one focused routing eval suite is required before merge for any change that broadens late-stage skill discoverability, because candidate-skill drift is the failure mode most likely to escape purely deterministic checks.

For this spec, that routing eval suite should be defined as agent workflow, not static prompt text:

- this stays Item 1-local; it does not authorize or require a reusable repo-wide LLM-eval framework
- this routing-eval gate is limited to single-turn initial-routing scenarios; multi-turn pushback or broader conversation-routing coverage belongs in a follow-up change if later needed
- each eval uses a fresh isolated runner subagent and a fresh isolated judge subagent
- each eval run chooses runner and judge models explicitly at execution time and records those chosen models in the evidence bundle, but this spec does not pin exact model identifiers
- each runner scenario starts from the real `using-superpowers` entry contract and installed skill set rather than a custom shortcut prompt that bypasses the normal top-level routing surface
- each scenario executes in a minimal synthetic temporary fixture workspace that is itself a real initialized git repo, with explicit branch, remote, artifact-state files, and runner context instead of borrowing the live branch state, copying the live repo, or relying on prose-only state descriptions
- the runner is read-only: it may inspect the provided fixture/context and produce a routing result, but it may not write files, sync workflow artifacts, or mutate repo state
- the controller captures the raw runner transcript/output for each scenario
- the runner ends with a small structured outcome block for each scenario, naming the scenario identifier, chosen safe stage/skill, forbidden routes rejected, and a short rationale
- the judge reads the raw runner evidence plus the scenario fixture and expected-safe-stage rubric
- pass/fail is strict per scenario: the runner must clearly route to the expected safe stage and must not endorse any forbidden later-stage route; ambiguous or mixed outputs fail
- fixture bootstrap failures, runner or judge errors or timeouts, malformed structured outcome blocks, missing evidence, and judge ambiguity all fail the affected scenario and the overall eval gate closed rather than degrading to advisory or deterministic-only coverage
- each scenario evaluation persists one evidence bundle containing the scenario-set identifier, scenario identifier, chosen runner/judge models, raw runner transcript/output, raw judge transcript/output or structured judge rationale, scenario-artifact revision/fingerprint, judge verdict, and final pass/fail result
- persisted eval evidence lives under `~/.superpowers/projects/<slug>/...` with bounded retention and is treated as non-authoritative review/debug evidence rather than a repo-authoritative artifact

Thin orchestration code may exist later if the repo wants a helper entrypoint, but the substantive test definition should live in item-local scenario instructions and judge instructions, not in a JS-only prompt payload that bypasses actual agent workflow.

### Deterministic Tests

- helper tests for `superpowers-slug` covering normal remotes, missing remotes, slash branches, shell-significant branch fixtures, and detached HEAD fallback
- contract tests that generated preambles include `_BRANCH`
- contract tests that helper `BRANCH` is only used for artifact-safe identifiers and `_BRANCH` is only used for grounding
- contract tests that late-stage skill descriptions still encode prerequisites
- update-check tests for `--force`, split TTL behavior, semver normalization, and local-ahead handling
- workflow sequencing tests that helper-first routing language remains intact

### Eval Coverage

Expand routing eval scenarios so prompts that sound late-stage still route to the earlier safe stage when helper state requires it, and evaluate those scenarios through the runner-subagent plus judge-subagent flow.

The suite must also include a small positive-control subset where a later-stage route is actually correct for the fixture state, with at least one positive-control scenario per affected late-stage skill family, so Item 1 cannot pass by routing everything earlier than necessary.

For this spec, the scenario artifact must define a fixed repo-versioned minimum scenario matrix for the affected late-stage skill families. Additive scenarios are allowed later, but the minimum floor stays stable and reviewable across revisions.

Examples:

- "review the architecture" while state is still pre-spec
- "write the plan" while spec is still draft
- "start implementing" while plan is still draft
- "finish this branch" before completion prerequisites are satisfied

The eval design for this spec should therefore include:

- an Item 1-specific scenario artifact that defines each routing scenario, its explicit artifact-state fixture, the expected-safe-stage outcome, and the forbidden later-stage routes
- a small positive-control subset in that scenario artifact, with at least one scenario per affected late-stage skill family, so the suite checks both "does not route too late" and "does not route too early"
- a fixed repo-versioned minimum scenario matrix in that scenario artifact for this spec's affected late-stage skill families, with optional additive scenarios allowed above that floor
- a minimal synthetic temporary fixture-workspace setup for each scenario so the runner operates against a real git repo plus actual artifact-state files rather than prose-only state, mocked repo metadata, or copied live-repo complexity
- an Item 1-specific runner instruction artifact used by a fresh isolated runner subagent
- an Item 1-specific judge instruction artifact used by a fresh isolated judge subagent
- the authoritative Item 1 scenario, runner, and judge instruction artifacts are versioned in the repo for reviewability and reproducibility, and each evidence bundle records the scenario identifier plus the scenario/rubric artifact revision or fingerprint; temporary fixture workspaces and per-scenario evidence remain outside the repo under `~/.superpowers/projects/<slug>/...`
- a required structured runner-outcome shape so the judge does not have to infer the intended route from freeform prose alone
- a persisted evidence artifact for each run under `~/.superpowers/projects/<slug>/...` that keeps the raw runner evidence and judge result reviewable after the run completes

## Acceptance Criteria

- workflow helpers remain the sole authority for stage progression
- late-stage skill descriptions still encode prerequisites and do not become generic implementation triggers
- duplicated repo/branch derivation is removed from the known borrowed-layer sites and centralized
- generated skills share branch grounding from one preamble source
- update checks detect new versions faster while preserving current Superpowers version semantics
- the change remains a narrow alignment package rather than expanding into broader upstream-sync policy or product-surface growth

## Performance Posture

This spec does not introduce a high-throughput runtime path. Its performance bar is about avoiding unnecessary local process churn and preserving the current cheapness of common workflow operations.

### Main Performance Risks

- repeated git inspection in multiple consumers instead of one shared slug/branch derivation path
- repeated regeneration or broad file rewrites when only targeted template/generator changes are needed
- update-check freshness changes that increase remote fetch frequency without improving correctness
- routing tests or evals that become so broad they dominate development feedback time

### Expected Performance Rules

- repo and branch identity should be derived once per caller path, not re-parsed ad hoc in several shell fragments
- the shared slug helper should reduce duplicated work overall, not add another layer that callers bypass
- update-check freshness should use the cache policy to reduce unnecessary remote requests while still shortening stale `UP_TO_DATE` windows
- generated-doc validation should stay focused on direct contract drift, not force unrelated regeneration work
- bounded, purposeful eval coverage must keep Item 1 item-local: a fixed repo-versioned minimum scenario matrix, per-scenario evidence bundles, minimal synthetic git fixtures, fresh isolated runner/judge subagents, and bounded local evidence under `~/.superpowers/projects/<slug>/...`

### Stress Perspective

At 10x or 100x human usage, the likely breakpoints are still:

- too many redundant local process invocations
- flaky or slow eval suites becoming part of the merge gate
- unnecessary remote version checks under repeated interactive startup

The spec's answer is not deeper optimization work. It is disciplined ownership:

- one derivation path for slug/branch identity
- one generator-owned preamble source for `_BRANCH`
- bounded, purposeful eval coverage
- cache TTLs that improve truthfulness without creating gratuitous network chatter

## Observability And Debuggability

This spec does not justify a new telemetry system. Its observability bar is that regressions in helper behavior, generated-doc contracts, or routing safety must be visible quickly to a developer or reviewer using the repo's normal local and CI surfaces.

### Required Visibility Surfaces

- deterministic helper tests must fail with named contract or failure-class context, not generic assertion noise
- routing-sensitive regressions must be visible through runner transcripts plus focused judge output tied to the specific scenario, and the persisted evidence bundle must carry the scenario identifier, scenario/rubric artifact fingerprint, chosen runner/judge models, and final verdict so a single run is traceable end to end
- generated-doc drift must remain visible through generator/contract checks
- update-check freshness failures must remain visible through helper tests and explicit helper diagnostics
- workflow-safe fallback behavior must stay explainable through existing workflow inspection surfaces rather than hidden inside prompt wording

### Debuggability Rules

- when shared slug derivation fails, callers should surface an explicit diagnostic instead of silently re-deriving values differently
- when `_BRANCH` grounding is missing, the failure should be discoverable from generated-doc checks or rendered generated docs
- when update freshness behaves unexpectedly, the relevant cache-policy branch should be inferable from deterministic tests and helper output
- when Item 1 regresses, reviewers should be able to see both the deterministic contract failure and the persisted per-scenario routing-eval evidence bundle under `~/.superpowers/projects/<slug>/...`, with named diagnostics for fixture bootstrap failures, judge timeouts, malformed structured outcome blocks, and evidence-persistence failures so infra breaks stay distinct from model verdicts

### Out Of Scope For This Change

- no new metrics or tracing pipeline
- no new dashboard or alerting system
- no new admin/debug UI beyond existing helper/test/review surfaces
- no repo-authoritative eval artifact written into the working tree for normal runs

The intent is not to under-invest in observability. It is to keep this change aligned with the repo's actual operating model: local helpers, generated docs, deterministic tests, agent-run eval instructions, judge outputs, and review-time inspection tools.

## Deployment And Rollout

This change does not need a runtime feature flag. Its rollout safety comes from sequencing, test gates, and easy reversibility.

### Rollout Order

1. land the shared slug/helper and `_BRANCH` grounding foundation
2. land description broadening together with deterministic routing guardrails and the required focused agent-executed routing eval suite
3. land update-check freshness changes with deterministic cache/version coverage
4. regenerate docs, update release notes, and confirm contract checks pass on the final combined diff

### Release Gates

Before merge, the rollout must have:

- passing deterministic helper, generator, and workflow tests for all touched paths
- the required focused agent-executed routing eval suite for Item 1, executed against the repo-versioned minimum scenario matrix and the versioned scenario/runner/judge instruction artifacts for the current spec revision, with each evidence bundle recording the scenario identifier plus the scenario/rubric artifact revision or fingerprint
- regenerated skill docs in sync with template/generator changes
- `RELEASE-NOTES.md` coverage for the user-visible runtime behavior changes

### Rollback Posture

If the combined change regresses:

- revert description broadening first if routing confidence is affected
- revert shared-helper adoption sites if artifact-path truth changes
- revert update-check freshness independently if release signaling becomes misleading
- if the Item 1 eval architecture itself regresses, restore the last known-good repo-versioned scenario/rubric/instruction artifacts and regenerate any stale evidence bundles rather than relying on an ad hoc local scenario set
- keep workflow-helper authority untouched so fallback-to-earlier-safe-stage remains available throughout rollback

### Deploy-Time Risk Window

The main deploy-time risk is not partial infrastructure migration. It is merging a logically coupled set of helper/template/test changes out of order. The rollout should therefore prefer small but coherent slices that remain individually testable.

### Post-Merge Verification

After merge or before release packaging:

- run the helper and contract test suite on the merged branch
- confirm generated docs are clean and up to date
- verify the agent-executed routing eval for Item 1 still passes against the merged repo-versioned minimum scenario matrix and that the persisted evidence bundles record the current artifact revision/fingerprint
- verify release notes or equivalent documentation mention the new runtime behavior accurately

## Long-Term Trajectory

This spec should leave Superpowers in a more intentional state, not a more coupled one.

### Desired 12-Month Outcome

A year from now, success looks like:

- borrowed-layer ergonomics are cleaner and less duplicated than they were before this change
- workflow routing is still clearly helper-owned, even after broader natural-language discovery
- repo and branch identity derivation still has one obvious source of truth
- update-check freshness is more truthful without having expanded into a broader release-notification subsystem
- no one mistakes this spec for a standing requirement to mirror `gstack` feature-for-feature
- the Item 1 eval contract remains item-local, with a fixed repo-versioned minimum scenario matrix, scenario/rubric artifacts, and bounded local evidence, rather than turning into a reusable repo-wide eval framework

### Path Dependency And Reversibility

This change is intentionally reversible:

- description broadening can be rolled back independently if routing confidence erodes
- shared slug-helper adoption can be rolled back to prior inline derivation if the helper contract proves wrong
- update freshness can be tuned or reverted independently without changing workflow authority
- `_BRANCH` grounding can remain a shared preamble concern without becoming an approval-state dependency
- the Item 1 eval artifacts can be regenerated or tightened without promoting their scenario fixtures or evidence bundles into a general-purpose product surface

The main long-term risk is not technical lock-in; it is conceptual drift. If future changes start treating this narrow alignment as evidence that Superpowers should automatically absorb every upstream `gstack` refinement, the project will lose architectural clarity.

### Ecosystem Fit

This spec fits the repo's current direction because it:

- strengthens existing helper/generator/test surfaces instead of introducing a parallel subsystem
- preserves repo-tracked docs and helper-owned routing as the core workflow architecture
- keeps the borrowed layer explicit and reviewable rather than letting drift accumulate invisibly

### One-Year Readability Test

A new engineer reading this spec in 12 months should be able to answer four questions quickly:

1. what did we borrow from `gstack` here?
2. what did we intentionally not borrow?
3. why are descriptions allowed to broaden without owning routing?
4. when would we revisit whether this borrowed layer needs a broader policy?

If the spec stops answering those questions cleanly, it has become too muddy and should be revised rather than treated as permanent doctrine.

## Alternatives Considered

### Direct Parity Backport

Rejected because it would import `gstack` behavior too literally and increase the chance that Item 1 competes with helper-owned routing.

### Infrastructure-Only Sync

Rejected because it avoids the riskiest piece, but also leaves a real borrowed-layer usability gap unresolved.

### Broader Upstream-Sync Strategy

Rejected because it is a different project. This spec is intentionally narrow and tactical.

## Deferred Work

If Superpowers continues borrowing substantial new `gstack` surface area, a separate future spec may define how recurring upstream drift should be reviewed. That is explicitly deferred from this change.
