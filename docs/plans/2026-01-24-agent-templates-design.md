# Agent Template Rendering Design

**Date:** 2026-01-24  
**Author:** Codex & User  
**Status:** Design Complete, Awaiting Implementation

## Overview

Unify all agent-specific documentation, installation guides, tests, and examples under a template + render workflow so references like `CLAUDE.md` vs `AGENTS.md` and “for claude” vs “for codex” are never hand-edited. Templates become the single source of truth, and a renderer generates correct, agent-specific outputs for Claude Code, Codex, and OpenCode.

## Goals

- Eliminate hardcoded agent references from shared files.
- Keep a single canonical source for docs/tests/examples.
- Generate agent-specific outputs deterministically.
- Preserve public endpoints/paths (e.g., `.codex/INSTALL.md`).
- Make adding a new agent a configuration change, not a rewrite.

## Non-Goals

- Changing skill content or workflow semantics.
- Replacing the existing plugin/CLI implementations.
- Introducing a full localization/i18n system.

## Architecture

### Core Components

1. **Templates** (`templates/`)
   - Mirrors real repo paths (e.g., `templates/docs/README.codex.md`).
   - Uses placeholders like `{{AGENT_NAME}}`, `{{AGENTS_MD}}`, `{{SKILLS_DIR}}`, `{{CLI_CMD}}`.

2. **Agent Configs** (`agents/*.json`)
   - One JSON per agent (`claude`, `codex`, `opencode`).
   - Defines names, file paths, CLI commands, and OS-specific values.

3. **Targets Map** (`templates/targets.json`)
   - Maps template paths → output paths.
   - Drives full-regeneration for a given agent.

4. **Renderer Script** (`scripts/render-agent.js`)
   - Resolves placeholders + partials.
   - Validates missing placeholders.
   - Writes to a destination directory (`--out`) or repo paths (`--write`).

### Partial Includes

Templates support `{{> partial-name}}`. The renderer resolves in this order:

1. `templates/_partials/partial-name.<agent>.<ext>`
2. `templates/_partials/partial-name.<ext>`

This allows small agent-specific overrides without duplicating full files.

## Data Flow

1. Choose agent (`--agent codex`).
2. Load `agents/codex.json`.
3. Expand templates using `targets.json`.
4. Resolve partials.
5. Validate that no `{{...}}` remains.
6. Write outputs to `--out` or in-place with `--write`.

## Error Handling

- **Unknown agent:** fail with a list of valid agents.
- **Missing placeholder:** fail with file + placeholder name.
- **Missing partial:** fail with template + missing partial path.
- **Unresolved placeholders after render:** fail with file list.

## Testing & Validation

- **Render check:** ensure all agents render without unresolved placeholders.
- **Agent-specific assertions:** confirm key strings per agent (e.g., `AGENTS.md` vs `CLAUDE.md`).
- **Template lint:** prevent hardcoded agent names in shared templates (allow in agent-specific partials).

These checks can run in CI or a local script (e.g., `npm run render:check`).

## Migration Plan

1. Create `templates/`, `agents/`, and `scripts/render-agent.js`.
2. Copy current files into templates and replace agent-specific strings with placeholders.
3. Render outputs for each agent to regenerate:
   - `README.md`
   - `docs/README.*.md`
   - `.codex/INSTALL.md`
   - `.opencode/INSTALL.md`
   - tests/examples/scripts referencing a specific agent
4. Add a “generated file” header where safe (`<!-- GENERATED -->` or `# GENERATED`).
5. Document the render workflow in the main README.

Public install URLs remain unchanged, but their content is now generated from templates.

## Open Questions

- Should generated outputs remain committed for all paths, or only for public endpoints?
- What is the minimal banner format for generated files in non-markdown formats?
- Should the renderer support OS-specific variants beyond Windows snippets?

