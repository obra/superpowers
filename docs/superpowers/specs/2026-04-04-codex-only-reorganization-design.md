# Codex-Only Reorganization Design

Date: 2026-04-04
Status: Approved for planning

## Goal

Reorganize this repository into a Codex-only fork of Superpowers that preserves the original workflow philosophy while rewriting its language, tools, structure, installation flow, and validation model to be natively aligned with Codex.

## Problem Statement

The current repository still behaves like a multi-platform distribution whose primary mental model is Claude Code. Codex support exists, but much of the repository asks Codex to translate Claude-centric concepts rather than follow Codex-native instructions directly.

This creates several problems:

- Core skills use Claude-specific tool vocabulary such as `Skill`, `Task`, and `TodoWrite`
- Repository entry points and contributor guidance are still centered on `CLAUDE.md`
- Installation, update, and testing documentation are split across multiple platforms
- Compatibility layers and platform-specific directories make the repository harder to reason about as a Codex product
- Meta-skills reinforce Claude-oriented authoring patterns, which causes the bias to reappear over time

The result is a fork that technically includes Codex support, but is not structurally optimized for Codex.

## Approved Constraints

- This fork is a Codex-only product
- Superpowers workflow philosophy must remain intact
- Codex CLI is the primary target surface
- Codex App is secondary compatibility, not the design center
- Backward compatibility with the upstream multi-platform structure is not required
- Aggressive removal or restructuring is allowed when it improves Codex fit

## Product Definition

This repository is no longer defined as "Superpowers for many coding-agent platforms."

It is redefined as:

> A Codex-native distribution of Superpowers for OpenAI Codex, optimized for Codex CLI first, with best-effort compatibility for Codex App where the same workflow can be expressed cleanly.

This has several direct implications:

- Codex concepts become first-class and un-translated
- Non-Codex distribution targets are removed from the product surface
- The repository should look like a Codex product even before reading any deep documentation
- Any workflow text that requires Codex to mentally map from Claude concepts is considered design debt

## Core Design Principles

### 1. Preserve philosophy, replace the implementation language

The following Superpowers workflow stays intact:

`brainstorming -> spec -> writing-plans -> isolated execution -> review -> verification -> finish`

What changes is how the workflow is expressed:

- `AGENTS.md` replaces `CLAUDE.md` as the canonical repository instruction file
- Codex native skill discovery replaces Claude-specific skill-loading assumptions
- `update_plan` replaces `TodoWrite`
- `spawn_agent` and Codex agent roles replace `Task tool` and named Claude subagents
- Codex-native CLI/App behaviors replace marketplace, plugin-hook, and Claude-specific environment assumptions

### 2. Codex must be able to act directly from the text

Repository instructions and skill content should describe Codex-native behaviors without translation layers.

If a skill tells Codex to do something, Codex should be able to perform that action from the instruction itself rather than through a mental mapping like:

- "Task tool" -> "spawn_agent"
- "TodoWrite" -> "update_plan"
- "Skill tool" -> "native skill loading"

Those mappings are useful during migration but should not remain as the main operating language.

### 3. CLI-first, App-compatible

The design target is Codex CLI because it offers the strongest direct control over:

- slash commands
- approvals
- review flows
- prompt/session steering
- local repo execution

Codex App support is secondary:

- core workflow text should still avoid CLI-only assumptions where unnecessary
- when App behavior diverges, the main flow should remain CLI-first and App caveats should be isolated into short compatibility notes
- App-specific UI features should not become the primary control flow for core skills

### 4. Remove product ambiguity

Any file that makes the product appear multi-platform when it is no longer intended to be multi-platform should be removed, rewritten, or relocated.

The repository should have one clear answer to:

- what this is
- who it is for
- how it is installed
- how it is validated

## Repository Reorganization

### Canonical entry points

The repository should promote the following entry points:

- `AGENTS.md` as the canonical repository instruction file
- `README.md` as the Codex-only product overview
- `.codex/INSTALL.md` as the short installation handoff entry point
- `docs/README.codex.md` as the detailed Codex installation and usage guide
- `skills/` as the primary product payload

### Top-level structure direction

The reorganized repository should center around:

- `AGENTS.md`
- `README.md`
- `.codex/`
- `docs/`
- `skills/`
- `agents/`
- `tests/`

The repository should stop presenting non-Codex plugin packaging as part of its core identity.

## Canonical Instruction System

### `AGENTS.md` becomes authoritative

The root `AGENTS.md` becomes the repository's true instruction source and should explicitly define:

- this repository is a Codex-only fork
- Codex-native terminology is required
- CLI-first behavior is preferred
- App compatibility is secondary
- non-Codex compatibility layers are not part of the product surface

The current `AGENTS.md -> CLAUDE.md` symlink should be removed.

`CLAUDE.md` should either be deleted or fully absorbed into `AGENTS.md` if any content remains useful after rewrite.

### `using-superpowers` becomes Codex-native

`skills/using-superpowers/SKILL.md` should be rewritten as the core operating contract for Codex users.

It should:

- describe skill use in Codex-native terms
- reference `AGENTS.md` and native skill discovery
- speak in terms of `update_plan`, `spawn_agent`, native shell/file tools, and Codex execution norms
- remove Claude/Copilot/Gemini/OpenCode translation guidance
- stop describing other platforms as first-class participants in the workflow

Any supporting reference files under `skills/using-superpowers/references/` should be reduced to Codex-only references, if they are still needed at all.

## Skill Rewrite Strategy

Skills should be divided into three rewrite classes.

### Class A: Full rewrite

These skills currently encode Claude-centric behavior and should be rewritten rather than patched line-by-line:

- `skills/using-superpowers/SKILL.md`
- `skills/subagent-driven-development/SKILL.md`
- `skills/requesting-code-review/SKILL.md`
- `skills/executing-plans/SKILL.md`
- `skills/writing-skills/SKILL.md`
- Codex-relevant platform portions of `skills/brainstorming/visual-companion.md`

Why:

- They rely on Claude-specific tool names or named subagent assumptions
- They shape other workflows and future maintenance behavior
- Partial edits would leave the underlying mental model unchanged

### Class B: Partial rewrite

These skills are philosophically reusable but need Codex-native mechanics and examples:

- `skills/writing-plans/SKILL.md`
- `skills/verification-before-completion/SKILL.md`
- `skills/using-git-worktrees/SKILL.md`
- `skills/finishing-a-development-branch/SKILL.md`
- `skills/dispatching-parallel-agents/SKILL.md`
- `skills/receiving-code-review/SKILL.md`
- `skills/systematic-debugging/SKILL.md`
- `skills/test-driven-development/SKILL.md`

Expected changes:

- update examples and tool references
- update review and subagent coordination language
- separate CLI-first path from App compatibility notes where needed

### Class C: Preserve with cleanup

Purely conceptual or platform-neutral reference files can remain with targeted cleanup:

- debugging reference notes
- anti-pattern reference files
- algorithmic or conceptual supporting docs that do not encode platform assumptions

These files should still be scanned for:

- Claude-specific persona language
- path examples under `~/.claude`
- obsolete references to non-Codex tooling

## Meta-Skill Language Reset

`writing-skills` requires special treatment because it governs future repository evolution.

The rewritten Codex version should:

- replace "future Claude" framing with "future Codex" framing
- replace Claude-centric discovery language with Codex-native trigger logic
- treat `.agents/skills` and `AGENTS.md` as the normal context model
- point to Codex official skills guidance instead of Anthropic-oriented guidance
- remove any assumption that Claude is the default reader and Codex is an adaptation target

Without this reset, the repository will drift back toward Claude-oriented authoring even after an initial cleanup.

## Documentation Reorganization

### `README.md`

Rewrite the root README as a Codex-only product page with this structure:

1. What Superpowers is for Codex
2. Why this fork exists
3. Installation
4. Core workflow
5. Skill overview
6. Validation/testing expectations
7. Contributing to the Codex fork

It should not contain:

- platform comparison sections
- Claude marketplace instructions
- Cursor install instructions
- OpenCode, Gemini, or Copilot install sections

### `docs/README.codex.md`

Promote this file to the detailed operational guide:

- manual install
- skill discovery model
- local skill layout
- updates/uninstall
- Codex CLI usage notes
- App compatibility notes where necessary

### `.codex/INSTALL.md`

Keep this file short and optimized for "tell Codex to fetch and follow this file."

It should:

- install the repository into a Codex-friendly location
- set up skill discovery cleanly
- avoid stale feature-flag assumptions unless explicitly re-validated

### Testing docs

Replace Claude-specific testing docs with Codex-only validation guidance covering:

- static content checks
- forbidden-term checks
- repository structure checks
- sample Codex invocation checks
- regression criteria for rewritten core skills

## Installation and Configuration Direction

The installation flow should align with Codex's documented skill model:

- `AGENTS.md` for persistent instructions
- `.agents/skills` and/or repo-local skill discovery paths
- `.codex/config.toml` for configuration and optional role definitions

Where useful, the product may also leverage:

- Codex agent roles under `[agents]`
- per-role config files for reviewer or worker specialization
- native Codex review capabilities as part of the documented workflow

## CLI vs App Policy

### CLI

The primary experience should assume:

- interactive CLI session
- slash commands are available
- local git operations are normal
- work happens in a developer-controlled repo checkout

### App

App compatibility is maintained only where it does not distort the core workflow.

If a skill needs a short App note, it should:

- describe the limitation briefly
- preserve the same workflow philosophy
- avoid making App UI behavior the main path

## Testing and Validation Model

The current Claude-centered testing model must be replaced.

The new validation stack should include:

### 1. Static structural validation

Checks that:

- `AGENTS.md` exists and is canonical
- prohibited multi-platform directories are absent after migration
- required Codex docs and entry points exist

### 2. Forbidden language validation

Checks that core product files do not contain stale terms such as:

- `Claude Code`
- `Cursor`
- `OpenCode`
- `Gemini`
- `Copilot`
- `Skill tool`
- `Task tool`
- `TodoWrite`

Exceptions may be allowed only in historical migration notes if those notes are intentionally retained.

### 3. Skill quality validation

Checks that:

- core skills describe Codex-native actions
- rewrite targets no longer require translation from Claude concepts
- descriptions remain good trigger surfaces for Codex skill invocation

### 4. Behavioral spot checks

Use representative Codex prompts to verify:

- the right skills trigger
- the workflow language is coherent
- core skills do not contradict Codex-native behavior

Perfect full automation is not required immediately, but the validation philosophy must switch from "did Claude behave correctly?" to "is this repository structurally and behaviorally correct for Codex?"

## Removal Policy

The following categories are expected to be removed or fully retired from the product surface:

- `.claude-plugin/`
- `.cursor-plugin/`
- `.opencode/`
- `GEMINI.md`
- `gemini-extension.json`
- `hooks/`
- `docs/README.opencode.md`
- `docs/windows/`
- non-Codex tool mapping references

The following items require specific review before removal because they may contain reusable content:

- `CLAUDE.md` content worth migrating into `AGENTS.md`
- platform-neutral scripts under `skills/brainstorming/scripts/`
- historical plans/specs that still document useful Codex-compatible architectural intent

## Migration Phases

### Phase 1: Establish Codex identity

- make `AGENTS.md` canonical
- rewrite root product messaging
- rewrite Codex installation docs
- remove obvious non-Codex top-level messaging

### Phase 2: Rewrite core operating skills

- rewrite `using-superpowers`
- rewrite `subagent-driven-development`
- rewrite `requesting-code-review`
- rewrite `executing-plans`
- rewrite `writing-skills`

This phase locks in the new operating language for the repository.

### Phase 3: Update the surrounding workflow skills

- adjust planning, worktree, finishing, verification, debugging, and parallel-agent skills
- apply CLI-first/App-secondary behavior rules

### Phase 4: Rebuild documentation and validation

- replace or rewrite testing docs
- add Codex-only validation scripts/checklists
- ensure root docs match actual behavior

### Phase 5: Remove legacy non-Codex product surface

- delete retired directories and files
- clean references and dead links
- run final forbidden-term and structure checks

## Acceptance Criteria

The reorganization is complete when all of the following are true:

- The repository clearly presents itself as Codex-only
- `AGENTS.md` is canonical and no longer delegated to `CLAUDE.md`
- Core skills use Codex-native concepts directly
- Core workflow philosophy remains recognizably Superpowers
- README and installation docs describe only the Codex product surface
- Claude/Cursor/OpenCode/Gemini/Copilot distribution artifacts are removed from the active product surface
- Tests and validation docs no longer depend on real Claude sessions
- A Codex user can read the repository from the top and understand how to install, use, and extend it without seeing another platform treated as primary

## Risks

### Risk: shallow terminology swap

If the rewrite only replaces nouns without changing the underlying behavioral model, Codex will still be forced to translate Claude assumptions.

Mitigation:

- fully rewrite Class A skills
- validate on behavior and instruction coherence, not just grep output

### Risk: philosophy drift

In aggressively localizing for Codex, the fork could lose the actual Superpowers workflow character.

Mitigation:

- keep the workflow spine explicit in docs and skills
- treat philosophy preservation as a non-negotiable acceptance criterion

### Risk: hidden Claude assumptions in low-visibility files

Meta-skills, example files, helper docs, and tests can silently reintroduce Claude-first behavior.

Mitigation:

- use forbidden-term scans
- explicitly review meta-skills and examples

## Reference Basis

The design above is aligned with current Codex documentation for:

- AGENTS.md instructions and discovery
- skill structure and skill discovery
- Codex CLI feature model
- slash commands
- Codex configuration and agent-role configuration

Primary references:

- https://developers.openai.com/codex/guides/agents-md/
- https://developers.openai.com/codex/skills/
- https://developers.openai.com/codex/cli/features/
- https://developers.openai.com/codex/cli/slash-commands/
- https://developers.openai.com/codex/config-reference/
