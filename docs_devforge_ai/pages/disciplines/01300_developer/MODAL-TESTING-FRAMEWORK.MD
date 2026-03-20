# Modal Testing Framework

Status: Draft v1.0 (2025-08-05)
Owner: QA/Platform Engineering
Review Cadence: Monthly (aligns with docs/0000_DOCUMENTATION_GUIDE.md standards)

Executive Summary
This document introduces a standardized, role-aware testing framework for modals across the application. It defines architecture, setup, usage, APIs, CI/CD integration, performance, security, troubleshooting, and a contributor rollout model that enables targeted participation without granting full repository access. It aligns with existing documentation standards and contributor policies, and provides actionable checklists to accelerate adoption.

Related Documents (Internal)
- Documentation standards and patterns: [0000_DOCUMENTATION_GUIDE.md](./0000_DOCUMENTATION_GUIDE.md)
- System architecture: [0200_SYSTEM_ARCHITECTURE.md](./0200_SYSTEM_ARCHITECTURE.md)
- Modal architecture/design: 
  - [1300_00180_MODAL_ARCHITECTURE_DESIGN.md](./1300_00180_MODAL_ARCHITECTURE_DESIGN.md)
  - [0975_MODAL_ARCHITECTURE_DESIGN.md](./0975_MODAL_ARCHITECTURE_DESIGN.md)
  - Contracts post-award modal docs, e.g.:
    - [1300_00435_02_UpsertFileModal_Documentation.md](./1300_00435_02_UpsertFileModal_Documentation.md)
    - [1300_00435_02_UpsertCloudModal_Documentation.md](./1300_00435_02_UpsertCloudModal_Documentation.md)
    - [1300_00435_02_UpsertUnstructuredModal_Documentation.md](./1300_00435_02_UpsertUnstructuredModal_Documentation.md)
    - [1300_00435_02_UpsertUrlModal_Documentation.md](./1300_00435_02_UpsertUrlModal_Documentation.md)
    - [1300_00435_03_CorrespondenceReplyModal_Documentation.md](./1300_00435_03_CorrespondenceReplyModal_Documentation.md)
    - [1300_00435_03_MinutesCompileModal_Documentation.md](./1300_00435_03_MinutesCompileModal_Documentation.md)
- Contributor policies and access architecture:
  - [1300_00180_CONTRIBUTOR_GUIDELINES.md](./1300_00180_CONTRIBUTOR_GUIDELINES.md)
  - [1300_00180_CONTRIBUTOR_ACCESS_ARCHITECTURE.md](./1300_00180_CONTRIBUTOR_ACCESS_ARCHITECTURE.md)
- Modal test routes and harnesses:
  - client routes: client/src/pages/modal-test-page/routes.js
  - client routes (temp): client/src/pages/modal-test-page/tempRoutes.js
  - UI harness (vanilla): modal-ui-test-harness.html
  - React harness: modal-react-test-harness.html

1) Repository Context and Discovery

1.1 Documentation patterns and access notes
- The documentation follows strict naming and structure conventions per [0000_DOCUMENTATION_GUIDE.md](./0000_DOCUMENTATION_GUIDE.md): four-digit prefixes, standard sections, version history, and validation audits.
- Modal system documentation exists under multiple domain-specific files (00435 Contracts Post-Award) and two modal architecture design docs.
- A getting-started and starter.html flow exists for running client/server and opening a modal test route quickly (see “Modal Test Route” section in [0000_DOCUMENTATION_GUIDE.md](./0000_DOCUMENTATION_GUIDE.md)).

1.2 Contributor roles and permissions (current state)
- [1300_00180_CONTRIBUTOR_ACCESS_ARCHITECTURE.md](./1300_00180_CONTRIBUTOR_ACCESS_ARCHITECTURE.md) proposes a fork-based model with strong isolation:
  - Core team owns the main repo. Contributors use per-user forks with branch protection.
  - Only assigned code is synced; sensitive IP and secrets are not exposed.
  - Automation handles fork creation, branch protection, and PR workflow.
- [1300_00180_CONTRIBUTOR_GUIDELINES.md](./1300_00180_CONTRIBUTOR_GUIDELINES.md) enforces:
  - 5-digit prefixes for files, mirrored test structure with .test.js suffix.
  - Branch naming and commit style guidance.
  - All new code must have tests, and documentation must be updated.

1.3 Gaps and inconsistencies for modal testing rollout
- There is no consolidated, test-specific framework doc for modals; guidance is fragmented across architecture and page-specific docs.
- CI expectations for modal tests (test commands, coverage thresholds, reports) aren’t centralized.
- Access model references isolation, but a minimal, local-only test harness and fake services specifically tailored for modal tests is not fully specified in contributor docs.
- Standard fixtures, stubs, data contracts for modal tests are not uniformly described across modal docs.
- Clear guidance for where modal test files live and how to run them in parallel is implied but not codified.

This document fills these gaps.

2) Modal Testing Framework Documentation

2.1 Overview
Purpose
- Provide a uniform, deterministic way to build, run, and validate modal behavior across disciplines and modal types with minimal coupling and no access to privileged services.

Scope
- Unit, component, and integration-level tests for modal UI, behavior, validation, data plumbing, and interaction with shared services.
- Non-goals: full end-to-end flows across protected backends; use fakes/mocks instead.

Benefits
- Determinism: stable results with strict isolation and pre-defined fixtures.
- Speed: local-only, mock-first execution with parallelization.
- Safety: no production secrets, no privileged endpoints.
- Consistency: shared fixtures, harness, naming, templates.

Design goals
- Works with the three-state modal pattern and base classes defined in modal architecture docs.
- Local-first with swappable adapters to run in app, harness, or CI without code drift.
- Provide a clear API for test authors; hide complexity in helpers.

Supported modal types
- Local file upload modals, cloud import modals, unstructured data modals, agent/AI-powered modals, and form/config modals as per architecture docs.

Integration with app architecture
- Mirrors modal creation via factory/services described in [1300_00180_MODAL_ARCHITECTURE_DESIGN.md](./1300_00180_MODAL_ARCHITECTURE_DESIGN.md) and [0975_MODAL_ARCHITECTURE_DESIGN.md](./0975_MODAL_ARCHITECTURE_DESIGN.md).
- Uses “modal test routes” and harnesses to surface modals in isolation.

2.2 Architecture

Core components
- Test Runner: Uses project-standard test runner (assumption: Jest + React Testing Library for React components; adjust if the repo uses a different runner).
- Harnesses:
  - React harness (modal-react-test-harness.html + React mounting helpers)
  - Vanilla harness (modal-ui-test-harness.html) for DOM-only checks
  - Route-based harness via client/src/pages/modal-test-page/routes.js
- Adapters:
  - Service Adapters: replace network/storage/services with in-memory or fake implementations
  - Data Adapters: schema validation and contract enforcement for modal props and outputs
- Fixtures:
  - Static datasets for files, metadata, numbering, and AI tool configurations
  - Snapshot schemas for modal input/output payloads
- Helpers:
  - Modal factory wrapper for tests
  - Render utilities
  - Event simulation utilities (drag/drop, paste, key navigation)
- Reporters:
  - JUnit/HTML reporters for CI
  - Coverage instrumentation

Data flow
- Test loads a modal via factory/harness
- Modal interacts with adapters (not real services)
- Assertions performed on DOM state, dispatched actions, and adapter calls
- Optional snapshot verification for payloads

Lifecycle
- Setup: load fixtures, configure adapters, mount modal
- Act: simulate user interactions
- Assert: DOM and calls
- Teardown: unmount modal, clean fakes, reset globals

Configuration model
- test.config.js (assumed): central toggles for adapters, timeouts, coverage thresholds
- env vars: see section 2.3 for standardized environment toggles

Dependency graph
- Tests -> Harness/Render Helpers -> Modal Factory -> Modal Code -> Adapters/Fixtures

CI hooks
- Pre-merge checks run the same commands as local
- Reporting emitted for pipeline aggregation

2.3 Setup and Installation

Prerequisites
- Node.js LTS, npm
- PowerShell 7 on Windows (matches docs standard)
- For React tests, React Testing Library and Jest (assumption if not present)
- No external services required

Environment setup
- Optional: use docs/starter.html for quick commands (see [0000_DOCUMENTATION_GUIDE.md](./0000_DOCUMENTATION_GUIDE.md))
- Ensure client dev server can run if using route-based manual checks

Installation steps
- Root: npm install
- Client: cd client && npm install
- Server: if needed for local mocks only; not required for modal tests

Configuration files
- jest.config.js or equivalent test runner config
- test.config.js for modal testing options (create if missing)
- tsconfig/jest-babel if applicable

Environment variables (standardized for tests)
- TEST_MODE=local-only
- TEST_SEED=1337 (deterministic randomization)
- TEST_TIMEOUT=10000
- TEST_PARALLEL=true
- Use dummy keys for any API-like adapters (never real keys)

Platform-specific notes
- Windows: prefer PowerShell commands in docs
- macOS/Linux: equivalent bash commands can be used; ensure parity in scripts if added

2.4 Usage

Where to place tests
- Mirror modal source paths with .test.js suffix.
- Example:
  - client/src/pages/00435-contracts-post-award/components/modals/00435-02-UpsertFileModal.js
  - client/src/pages/00435-contracts-post-award/components/modals/00435-02-UpsertFileModal.test.js

Naming conventions
- Match the five-digit prefix and modal code segment in the test filename.
- Use describe blocks that reflect modal type and behavior: “UpsertFileModal: validation”, “UpsertFileModal: file size limits”.

Writing tests
- Use render helpers to mount modal with default fixtures.
- Override fixtures via a builder where needed.
- Prefer user-event utilities for realistic UI interactions.
- Assert against visible labels and roles to support accessibility.

Running tests
- npm test — run unit/component tests
- npm run test:ci — with reporters and coverage (assumed; add if missing)
- Open harness pages for manual verification:
  - http://localhost:3001/#/modal-test?discipline=Safety&modal=UpsertUrlModal (see [0000_DOCUMENTATION_GUIDE.md](./0000_DOCUMENTATION_GUIDE.md))

Organizing tests
- Group by modal type and by behavior: validation, state transitions, integration with adapters, accessibility.

Fixtures
- Common fixtures: valid/invalid files, metadata sets, numbering configs
- JSON schema snapshots for input/output payloads
- Place shared fixtures under test_data/modals/ or client/src/common/test/fixtures/modals/ (choose one and keep consistent)

Mocking/stubbing strategies
- Replace service calls with in-memory adapters:
  - Document numbering
  - Storage path generation
  - AI tool invocation
- For agent/AI modals, use deterministic fake responses keyed by TEST_SEED.

Example test cases
- Validation: empty form, invalid file type, oversize file, missing required metadata.
- Interactions: drag/drop file, edit metadata, toggle processing options.
- Integration: ensure handleSubmit calls adapter with correct payload and path.

Debugging techniques
- Use screen.debug() in RTL
- Enable verbose logs via TEST_DEBUG=1
- Re-run a single test file: npm test -- 00435-02-UpsertFileModal.test.js

2.5 API Reference

Public test helpers
- renderModal(type, props, options): mounts modal with default adapters/fixtures
  - type: ‘local’ | ‘cloud’ | ‘unstructured’ | custom
  - props: partial modal props; defaulted to common fixtures
  - options: { withA11y: boolean, container: HTMLElement, adapterOverrides: {...} }
  - returns: { screen, user, unmount, adapters }

- buildFixture(name, overrides): returns a fixture object by name (e.g., “validPdf”, “oversizeFile”)
  - names: validPdf | validDocx | oversizeFile | unsupportedType | minimalMetadata | fullMetadata

- expectSubmitPayload(schemaName, payload): validates payload against schema snapshot
  - schemaName: upsert-file-payload-v1, cloud-import-payload-v1, unstructured-payload-v1
  - throws on mismatch; prints diff

Configuration options (test.config.js)
- timeouts: number
- retries: number (default 0; see flaky handling below)
- coverageThreshold: { global: { branches, functions, lines, statements } }
- adapters: select default adapter flavors (e.g., “strict”, “lenient”)

Error handling behavior
- Adapters throw domain errors with codes for predictable assertions:
  - E_VALIDATION, E_STORAGE_PATH, E_SCHEMA, E_UNSUPPORTED_TYPE
- UI surfaces accessible error messages with role=alert

Return types
- Helpers return testing-library constructs and references to adapters for assertions.

Extension points
- Register new modal types with test factory registry
- Add adapter flavors via adapterRegistry.register(<name>, factory)
- Provide additional fixture sets per discipline

2.6 CI/CD Integration

Commands
- npm run test:modals — focused run on modal tests
- npm run test:ci — all tests with CI reporters
- npm run coverage — coverage report generation

Coverage thresholds (recommended defaults)
- Global: branches 70%, functions 80%, lines 80%, statements 80%
- Raise gradually as adoption matures

Parallelization
- Enable Jest maxWorkers=50% by default in CI to balance load vs stability
- Shard by filename pattern if build minutes are constrained

Reporting
- junit.xml for pipelines
- html coverage artifacts
- Optional: summary comment on PR via CI bot

Integration with pipelines
- Required checks:
  - Modal test suite passing
  - Coverage threshold met for files changed under components/modals/
- Gate merges for modal-affecting changes until both checks pass

Failure surfacing
- CI annotates failing tests inline on PR
- Logs include adapter error codes and schema diffs where relevant

2.7 Performance and Reliability

Determinism
- All tests use seeded randomness (TEST_SEED)
- Network calls are prohibited; adapters must be synchronous or controlled async

Timeouts and retries
- Default test timeout 10s
- Retries disabled by default; flaky tests must be fixed, not retried
- Temporary retries allowed in quarantined jobs only

Isolation and cleanup
- Each test mounts/unmounts modal; no shared global state
- AfterEach: reset adapters, clear timers, restore spies

Handling flaky tests
- Quarantine by filename suffix .flaky.test.js only with maintainer approval
- File issue with root cause hypothesis and remediation plan

2.8 Security and Privacy

Data handling
- No PII or production content in fixtures
- Use synthetic data sets and redacted samples

Redaction strategies
- Any copied logs or payloads are filtered for secrets and personal data
- Snapshots store sanitized values only

Secrets management
- Never require real API keys for modal tests
- If env vars are required, they must be dummy values and validated by adapters

Sandboxing
- Tests run in local-only mode with adapters blocking network and filesystem writes unless writing to a temp directory under test-only paths

2.9 Troubleshooting

Common errors and resolutions
- E_SCHEMA: check fixture payload vs schema snapshot; update snapshot only with review
- E_UNSUPPORTED_TYPE: ensure fixture file mimics supported extensions and mime types
- Validation errors not visible: assert for role=alert; ensure component renders error region
- Drag/drop not working: use user-event upload helpers or simulate DataTransfer correctly
- Coverage not generated: ensure test runner is invoked with instrumentation

Escalation and issue filing
- Label: “modal-testing”
- Provide: test file path, adapter flavor, fixture names, schema name, full error with code
- If harness page issue: include route URL and querystring used

3) Contributor Access and Rollout Plan

3.1 Current access controls (assessment)
- The fork-based isolation model in [1300_00180_CONTRIBUTOR_ACCESS_ARCHITECTURE.md](./1300_00180_CONTRIBUTOR_ACCESS_ARCHITECTURE.md) is well aligned for enabling testing contributions without full repo access, but explicit modal-testing scaffolds (fixtures/adapters) need to be surfaced to contributors’ forks.

3.2 Role-based access model (for modal testing)
Roles
- Maintainer: full read/write; approve CI/pipeline changes; modify framework internals
- Core Contributor: write modal tests; propose framework changes via PR
- External Contributor: read framework; write tests under assigned directories; run tests locally/CI in fork
- Guest Tester: read-only to docs and harness; cannot push tests

Permissions mapping
- Maintainer: read/run/write tests; modify internals; approve CI changes
- Core Contributor: read/run/write tests; limited internals changes via PR
- External Contributor: read/run/write tests only within assigned areas; no internals modification
- Guest Tester: read and run locally via harness, no write

Repository structure recommendations
- Centralize test helpers/adapters/fixtures:
  - client/src/common/test/modals/ (helpers, adapters, fixtures, schemas)
  - Modal tests co-located next to modal source files
- Optionally split as a package if monorepo tooling exists later (e.g., packages/modal-testing/)

Branch protection rules and code owners
- Code owners for testing framework internals: QA/Platform
- Required checks on paths:
  - client/src/common/test/modals/**
  - client/src/pages/**/components/modals/**/*.test.js
- PRs modifying framework internals require at least one Maintainer approval

3.3 Exposing framework without full app access
Minimal reproducible harnesses
- Provide modal-react-test-harness.html and modal-ui-test-harness.html within contributor forks
- Include a minimal React app entry mounting a modal example with fake adapters

Mock services
- Publish adapters with no external dependencies; all data in fixtures
- Disallow any network request in default adapter flavors

Test data contracts and schema snapshots
- Ship JSON schemas for payloads (e.g., upsert-file-payload-v1.json)
- Provide snapshot update guidelines and require review for changes

Fixtures and adapters without secrets
- Store fixtures in repo; ensure no production data
- Adapters must not read env secrets; accept only explicit dummy vars

Local-only runnable test environment
- npm test for automated runs
- Harness pages opened directly in browser for manual UI checks (no server required when using static harness; for route-based, run client dev server)

Containerized setup (optional)
- Provide a Dockerfile.dev-test that installs deps and runs tests; useful for consistent CI and fork environments

3.4 Onboarding steps

Access request workflow
- Contributor registers in Contributor Hub (per access architecture doc)
- Maintainer assigns role and creates fork with modal-testing skeleton

Environment provisioning
- Fork includes:
  - modal harness pages
  - adapters/fixtures
  - example modal tests

Credentials/tokens (scoped)
- None required for modal tests; dummy variables only

Secret management guardrails
- Pre-commit hook rejects addition of keys/secrets within test files
- CI scans verify no secrets present

3.5 Governance and review

Approval criteria
- Tests deterministic and pass without retries
- Coverage maintained or improved
- No external calls; adapters used correctly
- Accessibility assertions for errors and labels exist where appropriate

Escalation paths
- Maintainer owns final decisions on framework changes
- Use repository Discussions for proposals; tag with “modal-testing-proposal”

4) Deliverables

This document: docs/modal-testing-framework.md (this file).

Internal links included to existing docs and harness assets as listed at the top.

Actionable Checklists

A) Setup and run tests locally
- [ ] npm install at root and client
- [ ] Ensure TEST_MODE=local-only
- [ ] Run: npm test or npm run test:modals
- [ ] Open harness (optional): modal-react-test-harness.html or http://localhost:3001/#/modal-test?discipline=Safety&modal=UpsertUrlModal
- [ ] Verify reports and coverage artifacts generate

B) Add a new modal test
- [ ] Create *.test.js next to modal source file with matching prefix/code
- [ ] Use renderModal with default fixtures
- [ ] Add at least one validation, one interaction, and one integration assertion
- [ ] Assert accessible error messaging (role=alert)
- [ ] Run locally and ensure deterministic pass

C) Integrate tests into CI
- [ ] Add npm run test:modals and npm run test:ci scripts if missing
- [ ] Configure coverage thresholds (branches 70 / functions 80 / lines 80 / statements 80)
- [ ] Emit JUnit and HTML coverage reports
- [ ] Protect branches requiring modal test job to pass
- [ ] Gate merge on coverage thresholds for changed modal files

D) Onboard a restricted-access contributor
- [ ] Create contributor fork with modal-testing skeleton
- [ ] Include adapters, fixtures, harness pages, and one example test
- [ ] Confirm no secrets or privileged services required
- [ ] Provide this document and Contributor Guidelines links
- [ ] Verify CI runs on fork with the modal tests

Changelog
- v1.0 (2025-08-05): Initial version establishing modal testing framework, adapters/fixtures strategy, CI integration, contributor rollout, and security posture.

Assumptions and Recommended Defaults
- Test runner: Jest + React Testing Library for modal components; if repo uses another runner, map concepts 1:1.
- Directory layout for shared testing assets: client/src/common/test/modals/ (helpers, adapters, fixtures, schemas).
- CI reporters: JUnit XML + HTML coverage.
- Coverage thresholds as specified; adjust upward over time.
- No production services or secrets needed for modal tests; all faked locally.

Appendix: Quick Commands

Using the docs starter page (copy-paste)
- See [0000_DOCUMENTATION_GUIDE.md](./0000_DOCUMENTATION_GUIDE.md) starter.html for one-click copy commands.

PowerShell copy-paste
- Initiate deps:
  - npm install && cd client && npm install && cd ..
- Run client (if using route harness):
  - cd client && npm run dev
- Open modal test route after client starts:
  - http://localhost:3001/#/modal-test?discipline=Safety&modal=UpsertUrlModal

Directory Pointers (non-executable references)
- client/src/pages/modal-test-page/routes.js
- client/src/pages/modal-test-page/tempRoutes.js
- modal-ui-test-harness.html
- modal-react-test-harness.html