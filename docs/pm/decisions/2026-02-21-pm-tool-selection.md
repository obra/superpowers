# Decision Record: PM Tool Selection

**Date**: 2026-02-21
**Status**: Decided
**Decider**: Founder (human)
**Inputs**: Market research (market-researcher agent), evaluation against criteria

---

## Context

The pod-based SDLC pipeline needs a PM tool for AI employee coordination. Requirements:
- AI agents must be able to create/update tasks programmatically (CLI or API)
- SAFe constructs (Epics, Features, Stories, PI Planning)
- Self-hosted and source-modifiable for custom AI context fields
- Active maintenance and stable trajectory

## Options Evaluated

| Criterion | OpenProject | Taiga |
|-----------|------------|-------|
| CLI for AI agents | Official `op` CLI (pre-release, Go binary) | Community-only, no official support |
| REST API | APIv3 (OpenAPI 3.1), full entity coverage | REST v1 (functional, less formally spec'd) |
| SAFe support | Strong — documented SAFe use case, 4-level hierarchy | Weak — Epic → Story only, no PI construct |
| Source modifiability | Rails Engine plugin system (no fork required) | Must fork Django monorepo |
| Resource footprint | Heavy (4 GB RAM minimum) | Lighter |
| Maintenance trajectory | Active (v17.1.1 released 2026-02-18, commercial backing) | Fragile (Kaleidos pivoted, TaigaNext rehomed, Tenzu pre-alpha) |

## Decision

**Use OpenProject Community Edition.**

### Rationale

1. **SAFe hierarchy**: The pipeline uses Epic → Capability → Feature → Story → Task. OpenProject supports all five levels via configurable work package types. Taiga supports Epic → Story only.

2. **API quality**: OpenProject APIv3 is OpenAPI 3.1 spec'd, browsable, and covers every entity type the pipeline needs. Taiga's API is functional but less formally specified.

3. **Maintenance stability**: OpenProject GmbH released v17.1.1 one week before this decision. Taiga's organizational trajectory (Kaleidos exit, TaigaNext/Tenzu restart from scratch) introduces unacceptable risk for pipeline infrastructure.

4. **Extensibility**: OpenProject's Rails Engine plugin system allows adding custom AI context fields (pod brief hash, responsible agent, token budget) without forking. Taiga requires a source fork for data model extension.

The one area Taiga wins is Docker resource footprint. On constrained hardware, Taiga is the better choice. For this deployment, stability and API richness are the priority.

## Implementation Notes (Phase 5: PM Tool Integration)

- Deploy: OpenProject Community Edition via Docker Compose
- Auth: API key per agent role (orchestrator key, read-only Leads keys)
- Work package types to configure: Epic, Capability, Feature, Story, Task
- Custom fields to add: `pod_brief_hash` (text), `responsible_agent` (text), `phase` (list), `quality_level` (list: P1/P2/P3)
- Versions = PI (create "PI-001" version at pipeline start)
- MCP server option: `AndyEverything/openproject-mcp-server` (community, evaluate before adopting)
- Agents call REST APIv3 directly; CLI (`op`) for human-facing spot checks only

## What This Enables (Phases 5-6)

- Pipeline start → Create PI version in OpenProject
- Phase start → Create iteration / work package set
- Story completion → Update status via API
- Sync session → Post resolution as work package comment
- Pipeline end → Close PI, attach all artifacts

---

## Research Sources

- OpenProject API documentation: https://www.openproject.org/docs/api/
- OpenProject SAFe documentation: https://www.openproject.org/docs/use-cases/safe-framework/
- OpenProject CLI: https://github.com/opf/openproject-cli
- State of Taiga: https://community.taiga.io/t/state-of-taiga-as-a-whole/3831
- Full research: market-researcher agent output, 2026-02-21
