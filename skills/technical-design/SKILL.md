---
name: technical-design
description: Use when drafting or extending a technical design with PRD/TRD links or pasted requirements, resuming a TD session, configuring doc-platform access, recording open decisions without stopping the rest of the doc, or when the team asks for agentic TD authoring on Lark or Confluence.
---

# Technical Design (Lark / Confluence)

Agentic TD workflow for shared doc platforms. The TD must be precise enough to feed directly to an agent for planning + execution and produce stable expected results. Eliminate assumptions: every PRD requirement and every implementation decision must be confirmed, documented, or explicitly marked `待定`.

## Required References

Before authoring, read these files in this skill:

- `lark-doc-protocol.md` — doc-platform config, Lark/Confluence protocol, and no-tool fallback.
- `local-config-template.md` — first-use local config template.
- `td-template.md` — local TD Markdown template and canonical sample/checklist.
- `be-development-guidelines.md` — backend design constraints.
- `edit-log-template.md` — resumable Edit Log format.

## Hard Rules

- **First use:** read `$TECHNICAL_DESIGN_CONFIG` or `~/.config/technical-design/config.md`; if missing/incomplete, ask for doc platform auth info (Lark / Confluence), default TD save location, and Edit Log convention, then save a local config from `local-config-template.md`.
- **Ask TD placement first** unless the user already provided TD URL this turn or local config has an explicit default for new TDs.
- **Existing TD:** engineer provides TD link. **New TD:** create it under the configured default save location. Use local `td-template.md` for document structure; do not reference third-party sample/template links.
- **REQUIRED SUB-SKILL:** use **brainstorming** for every requirement clarification and every solution decision.
- **Slow is fast:** do not draft multiple modules in parallel. Confirm one requirement/layer before writing it into TD, then continue deeper or move to the next module.
- **One blocked decision ≠ stop the TD** only when unrelated next work is already confirmed. Record local blockers as `待定`; stop only if the user explicitly pauses/stops.

## Session Start

1. Use `lark-doc-protocol.md` and local config. If platform tooling is unavailable, ask for exported/pasted TD + Edit Log; do not pretend to read/update remote docs.
2. Read TD + Edit Log before edits. If Edit Log is missing, create it from `edit-log-template.md` and link it from TD.
3. Get PRD/TRD links or pasted requirements.
4. Read the required references above.

## TD Flow

1. **Understand PRD first.** Build Feature List from all technical + non-technical requirements. Each item needs brainstorming discussion and confirmation before becoming stable TD content.
2. **Design from coarse to fine:** solution overview → module → service → API/contract → key flow & logic → data store → rollout/testing.
3. At each level, use brainstorming to discuss options, trade-offs, and the recommended choice. Only write confirmed decisions into TD. If not decidable, record `待定` with enough context to resume.
4. Ensure coverage: every Feature List item maps to TD sections and implementation-relevant decisions.

## Diagrams

- Complex interactions: use Feishu whiteboard; also provide text description for agent readability.
- Key flows and complex flows: include flow chart.
- Complex logic/algorithms: describe the concrete algorithm steps, state transitions, edge cases, and failure handling clearly enough for implementation.

## 待定 and Edit Log

For missing information or user says `待定`:

1. Prefer Feishu comment on the exact anchor: question, context, assumptions removed, options, what is needed, owner.
2. If comments are unavailable, insert an inline `待定` callout block.
3. Add/Edit Log entry with TD location, link/path, current phase, progress, unfinished work, and next action.

## Common Mistakes

- Writing a broad overview without confirming each PRD requirement.
- Parallel-writing multiple modules before higher-level decisions are confirmed.
- Leaving assumptions in prose instead of converting them to decisions or `待定`.
- Letting brainstorming default to repo specs / `writing-plans`; in this workflow the artifacts are Feishu TD + Edit Log.
