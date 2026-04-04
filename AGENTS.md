# Codex-Only Superpowers

## Product Definition

- This repository is a Codex-only fork of Superpowers.
- Codex CLI is the primary target surface.
- Codex CLI on macOS, Linux, WSL, and native Windows is part of the supported product surface.
- Codex App compatibility is secondary and should not distort the main workflow.

## Operating Rules

- Use Codex-native terminology in all docs, skills, prompts, and tests.
- Prefer `AGENTS.md`, native skill discovery, `update_plan`, `spawn_agent`, and Codex shell/file tools over translated legacy tool concepts.
- Do not describe Codex behavior through translated legacy tool mappings.

## Workflow Priority

- Preserve the Superpowers workflow philosophy: brainstorming, specs, plans, isolated execution, review, verification, finish.
- Rewrite implementation language and repository structure to feel natively Codex-first.
- Remove active non-Codex product surface rather than maintaining compatibility layers.

## Validation

- Run the Codex-only validation scripts before claiming this reorganization is complete.
- Treat lingering non-Codex platform names and translated tool aliases as bugs unless intentionally preserved in archived history.
