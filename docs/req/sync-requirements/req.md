# sync-requirements Requirements

## Purpose
Preserve durable requirements learned during Superpowers-driven work by merging dated design specs, implementation plans, branch evidence, and session-only user requests into long-lived PRD-style requirements documents.

## Requirements

### Requirement: Durable Requirements Storage
The system SHALL store long-lived module requirements in `docs/req/<module>/req.md`.

#### Scenario: Creating a module requirements document
- **WHEN** durable requirements for a module do not yet have a req document
- **THEN** the agent creates `docs/req/<module>/req.md`
- **AND** the document uses `# <module> Requirements`, `## Purpose`, and `## Requirements` sections

#### Scenario: Preserving dated execution artifacts
- **WHEN** syncing durable requirements from Superpowers work
- **THEN** the agent SHALL keep dated brainstorming specs under `docs/superpowers/specs/`
- **AND** the agent SHALL keep dated implementation plans under `docs/superpowers/plans/`
- **BUT** the agent MUST NOT rewrite or archive those dated artifacts as part of requirements sync

### Requirement: Requirement Authoring Convention
The system SHALL define a reusable authoring convention for PRD-style requirements documents.

#### Scenario: Writing normative requirements
- **WHEN** the agent writes a requirement body
- **THEN** the requirement uses `SHALL` or `MUST` for required behavior
- **AND** the requirement uses `SHALL NOT` or `MUST NOT` for prohibited behavior
- **BUT** the requirement MUST NOT use weak substitutes such as "should avoid" or "does not usually"

#### Scenario: Writing verifiable scenarios
- **WHEN** the agent documents a concrete behavior or use case
- **THEN** it uses a `#### Scenario: <name>` heading
- **AND** scenario steps use `**WHEN**` and `**THEN**` at minimum
- **AND** `**GIVEN**` is used only when an initial state matters
- **AND** `**AND**` is used for additional conditions or outcomes
- **AND** `**BUT**` is used only for prohibited behavior, exceptions, or negative expectations

### Requirement: Requirements Sync Skill
The system SHALL provide a `sync-requirements` skill that owns durable requirements synchronization.

#### Scenario: Resolving sync context
- **WHEN** the agent starts requirements sync
- **THEN** it looks for referenced or recently created design specs under `docs/superpowers/specs/`
- **AND** it looks for referenced or recently created plans under `docs/superpowers/plans/`
- **AND** it considers branch commits, task reports, progress ledgers, final summaries, and active-session user requirements
- **BUT** it MUST NOT invent a work context when the relevant artifacts cannot be inferred uniquely

#### Scenario: Capturing session-only requirements
- **WHEN** the user adds or changes requirements after the original spec or plan
- **THEN** the sync workflow includes those session-only user requirements in the durable requirements analysis
- **AND** later explicit user messages supersede conflicting earlier spec or plan text

#### Scenario: Skipping non-durable details
- **WHEN** extracting durable requirements from a session or branch
- **THEN** the agent skips transient test failures, debugging dead ends, local command output, implementation accidents, and branch management choices
- **BUT** the agent SHALL preserve one of those details if the user explicitly changed the intended durable behavior

### Requirement: Convention-Aware Merge
The system SHALL merge requirements by intent rather than copying dated artifacts verbatim.

#### Scenario: Updating target req documents
- **WHEN** a durable behavior is new
- **THEN** the sync workflow adds a new `### Requirement:` block
- **AND** additional examples or edge cases become new `#### Scenario:` entries under an existing requirement
- **AND** changed behavior updates the existing requirement or scenario while preserving unrelated content

#### Scenario: Preserving existing requirements
- **WHEN** the target req document contains requirements not mentioned by the current work
- **THEN** the sync workflow preserves that existing content
- **BUT** it SHALL remove behavior only when the current work explicitly deprecates it

#### Scenario: Idempotent sync
- **WHEN** the sync workflow runs more than once for the same durable requirements
- **THEN** it reports requirements or scenarios that are already synchronized
- **BUT** it MUST NOT duplicate equivalent requirements or scenarios

### Requirement: Ambiguity and Failure Handling
The system SHALL stop or ask when safe requirements sync cannot be completed confidently.

#### Scenario: No reliable sync context
- **WHEN** no design spec, plan, commits, or session requirements can be identified
- **THEN** the agent reports that there is nothing reliable to sync
- **AND** it returns to the caller without editing req documents

#### Scenario: Ambiguous module selection
- **WHEN** multiple target modules are plausible
- **THEN** the agent asks one multiple-choice question that lists plausible module names and their rationale
- **BUT** the agent MUST NOT silently choose a module in ambiguous cases

#### Scenario: Existing requirement conflict
- **WHEN** a target module requirements document contains ambiguous or contradictory existing requirements
- **THEN** the agent asks the user before editing those requirements

#### Scenario: File write failure
- **WHEN** writing a req document fails
- **THEN** the agent stops and reports the exact path and failure

### Requirement: Finishing Workflow Prompt
The system SHALL offer requirements sync before completing a development branch.

#### Scenario: Completed implementation reaches branch finishing
- **WHEN** implementation tasks are complete and verification has passed
- **THEN** `finishing-a-development-branch` asks whether to sync durable requirements into `docs/req/<module>/req.md`
- **AND** the prompt includes options to sync now, skip sync and continue finishing, or cancel finishing
- **AND** choosing sync delegates to `sync-requirements`
- **BUT** `finishing-a-development-branch` MUST NOT inline the requirements merge algorithm

#### Scenario: User cancels finishing during sync prompt
- **WHEN** the user chooses to cancel finishing from the requirement sync prompt
- **THEN** the agent stops before presenting merge, PR, keep, or discard options

### Requirement: Static Workflow Verification
The system SHALL include static regression coverage for the requirements sync workflow.

#### Scenario: Verifying sync-requirements invariants
- **WHEN** the static skill test runs
- **THEN** it verifies the `sync-requirements` skill name, canonical req path, dated spec and plan inputs, session-only requirement handling, idempotency, OpenSpec independence, and requirement authoring conventions
- **AND** it verifies `SHALL NOT`, `MUST NOT`, and `**BUT**` support

#### Scenario: Verifying finishing and README integration
- **WHEN** the static skill test runs
- **THEN** it verifies the finishing workflow prompts for requirements sync after tests pass and before environment detection
- **AND** it verifies README documents `sync-requirements` before `finishing-a-development-branch` in the basic workflow
