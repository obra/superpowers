# Rails Engineering Standards & Practices

Guidance distilled from 37signals’ “Vanilla Rails is plenty” and the local style guides. Bias toward the Rails defaults, avoid extra layers until pain demands it, and let rich domain models be the API controllers talk to.

## Architecture Principles

- Domain models (Active Record + POROs) are the system API; controllers/jobs call them directly. Avoid application-layer service/command objects unless duplication or orchestration pain appears.
- Prefer rich domain models with focused concerns to organize responsibilities. Extract supporting PORO collaborators when behavior grows, but keep the public API on the model (e.g., `recording.copy_to(bucket)`).
- CRUD-first controllers: start with resourceful routes/actions; add custom actions only when semantics demand it.
- Keep indirection honest: extract only after the “rule of three,” and collapse abstractions that aren’t earning their keep.
- Design for caching and write-time work early (precompute, counter caches, delegated types) to avoid heavy read-path computations.
- Capture state as records (events/rows) over booleans; let the database be the source of truth.

## Coding Standards

- Favor vanilla Rails and Ruby: thin controllers, rich models, ERB partials over component/decorator gems, strong params via `params.expect`.
- No default services/interactors; add PORO helpers behind model methods when needed. Avoid form objects unless the form truly spans multiple models.
- Organize models with narrowly focused concerns; prefer explicit method definitions over metaprogramming.
- Naming: positive, domain-first names (`active?`, `depleted?`), narrow public APIs, and predicates over status strings (`inquiry`).
- Views: helpers/partials/components with locals; push user-specific logic to Stimulus when caching; keep callbacks minimal and explicit.
- Prefer plain Ruby/Stimulus for interactions; avoid unnecessary frontend frameworks.

## Data & Persistence

- Design schema with constraints first: database validations, foreign keys, unique indexes; use reversible migrations without model classes.
- Avoid Redis for persistence; lean on Postgres-backed features (Solid Queue, advisory locks, etc.).
- Use delegated types for polymorphism; JSON columns with `store_accessor` where flexible attributes are needed.
- Normalize and clean at write-time (`normalizes`, callbacks kept minimal); avoid expensive read-time computation.
- Seed and fixture data should reflect real shapes; favor fixtures over factories for speed and determinism.
- Avoid N+1s via preloading; prefer scopes for reusable query logic; use transactions to enforce invariants.

## Testing Strategy

- Default: Minitest with fixtures; behavior-focused tests (happy + key failure paths) for every change. Avoid testing Rails internals or private methods directly—assert outcomes.
- Levels: component (models/POROs/jobs/services), controller/request (routing/params/status/render), integration (multi-model workflows, no internal mocks), minimal system tests for smoke flows only.
- External calls: WebMock for most cases; at least one VCR-backed integration test per external service. Mock only boundaries; never stub internals of the object under test.
- Data: fixtures first; inline records for edge cases. Respect multi-tenant scoping in all assertions. Use `travel_to` for time, `assert_enqueued_with` for jobs, and `perform_enqueued_jobs` when asserting side effects.
- Risk-based depth: more cases for high-impact/complex paths (state machines, polymorphism, migrations with data, multi-tenancy); happy-path-only for low-risk. Cover custom validations/associations, state transitions, callbacks with effects, Turbo broadcasts, and database constraints that encode business rules.
- Maintenance: tests must be isolated, parallel-safe, and fast. Fix flakes immediately; prefer `db:schema:load` on CI, parallelize workers, and keep system tests minimal to avoid brittleness.

## Security & Privacy

- Enforce strong parameter whitelisting with `params.expect`; avoid mass-assignment gaps.
- Default to server-side authorization predicates on models (`editable_by?`) instead of policy gems; secure controllers with `head :forbidden` when needed.
- Protect against common web vulns: CSRF enabled, escape output, strict upload handling, SSRF-safe webhooks, rate limiting on auth-sensitive endpoints.
- Secrets in env/config management, not in code; audit logging for sensitive actions; treat PII carefully with least privilege access.
- Prefer database constraints for integrity (unique, FK) to avoid validation races; queue jobs after commit to prevent races.

## Performance & Reliability

- Measure and cache deliberately: fragment/HTTP caching with thoughtful cache keys; avoid user-specific data in cached fragments.
- Do work at write-time: counter caches, denormalized columns, background jobs for heavy lifts with retries and idempotence.
- Preload to avoid N+1; memoize hot paths during rendering; add indexes for query patterns before shipping.
- Use Solid Queue/ActiveJob with transactional enqueue (`after_commit`); set timeouts/backoffs for external calls.
- Observe with structured logs and metrics; design for graceful degradation and clear incident playbooks.

## Dependencies

- Default stance: “Vanilla Rails is plenty.” Before adding a gem, ask if Rails already solves it and whether the dependency earns its upkeep.
- Prefer Rails defaults over heavy alternatives: no Devise/Pundit/ViewComponent/React/Sidekiq/Tailwind unless truly justified.
- Keep dependency surface small and up to date; vet licenses; use adapters around external APIs for isolation and testing.
- Prefer POROs and built-ins over meta-libraries; remove unused gems promptly.

## Error Handling & Logging

- Fail fast with clear errors; raise, don’t silently rescue, unless you can recover meaningfully.
- Normalize exceptions to domain-specific classes when it aids handling; let the controller/job decide HTTP status or retry behavior.
- Structured, contextual logging (request ids, actor/tenant ids) and correlation IDs for background work.
- Capture and alert on unhandled exceptions; log validation failures with context but avoid leaking sensitive data.

## Front-End Specifics

- Server-rendered HTML first with Turbo + Stimulus; avoid SPA frameworks unless requirements demand it.
- Use native CSS with layers/variables; prefer semantic class names over utility frameworks.
- Keep Stimulus controllers small and data-driven; interact with backend via forms, Turbo Streams, and progressive enhancement.
- Maintain accessibility: ARIA labels, keyboard navigation, focus management, and responsive layouts.
- Be caching-aware: keep personalized logic client-side (meta tags + Stimulus) when fragments are cached.

## Tooling & Standards Enforcement

- RuboCop with focused, agreed-on rules; EditorConfig for basics; minimal git hooks for lint/test on commit.
- bin/setup/bin/dev for environment parity; prefer foreman/procfile-style dev servers.
- CI runs tests, lint, and security scans on every PR; merges require green pipelines and small, reviewable diffs.
- ADRs or lightweight notes for significant architectural decisions; keep README and runbooks current.
- Dependabot/Renovate for updates with manual review; secret scanning enabled in CI.
