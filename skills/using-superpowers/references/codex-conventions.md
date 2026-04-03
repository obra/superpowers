# Codex Conventions for Superpowers

## Canonical Concepts

- Repository instructions come from `AGENTS.md`
- Skills are discovered natively by Codex
- Checklist tracking uses `update_plan`
- Delegated work uses `spawn_agent`

## CLI-First Rules

- Prefer Codex CLI behavior when a workflow differs between CLI and App
- Keep App notes short and isolated
- Do not make App UI concepts the main control flow for a core skill

## Review and Verification

- Prefer Codex-native review flows and explicit validation commands
- Treat lingering references to translated legacy tool concepts as repository bugs
