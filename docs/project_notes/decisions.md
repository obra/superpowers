# Decisions

- PM-001 | 2026-03-29 | Keep project memory under `docs/project_notes/` as supportive context only.
  Context: FeatureForge needs durable memory without creating a second workflow control plane.
  Decision: Store v1 memory in repo-visible markdown under `docs/project_notes/` while leaving approved specs, plans, execution evidence, review artifacts, and runtime state authoritative.
  Alternatives considered: keep memory only in runtime-local state, or spread it across broader repo instruction surfaces.
  Consequence: Memory stays easy to inspect in git, but entries must summarize and backlink instead of replacing workflow artifacts.
  Source: `docs/featureforge/specs/featureforge-project-memory-integration-spec.md`

- PM-002 | 2026-03-29 | Seed only curated high-signal entries with inspectable provenance.
  Context: Free-form backfill would turn project memory into a second tracker or ADR system.
  Decision: Keep the initial corpus limited to durable facts, decisions, bugs, and issue breadcrumbs that can cite an approved artifact or stable repo doc.
  Alternatives considered: seed empty placeholder files only, or bulk-import historical notes without source discipline.
  Consequence: The seed corpus stays small and useful, and future entries without provenance should be rejected.
  Source: `docs/featureforge/specs/featureforge-project-memory-integration-spec.md`
