# Superpowers + Aider Conventions

You are running inside a repo configured for Superpowers.

## Hard gate
- Do not edit non-doc files until the user explicitly says: `approved, start implementation`.
- Step 1 (brainstorming) and Step 2 (plan writing/approval) are **docs-only** phases. Allowed edits: `docs/plans/**` and `.aider/**`. Suggest code, but do not change source, tests, or configs until approval.
- If you are unsure whether approval happened, ask; default to docs-only.

## How to operate in Aider
- Assume the session already ran `/read .aider/SUPERPOWERS.md`, `/read ~/.config/superpowers/superpowers/aider/CONVENTIONS.md`, and `/read ~/.config/superpowers/superpowers/aider/SKILLS-INDEX.md`.
- Before responding or editing, `/read` the relevant skill file listed in `SKILLS-INDEX.md`. Do this every time you switch tasks (brainstorming, planning, TDD, debugging, finishing a branch, etc.).
- Keep context light: read only the skills you need for the current task.

## After approval
- Once the user says `approved, start implementation`, follow the plan, use TDD, and keep changes small. Re-run the relevant skills when changing phases (e.g., move from planning to execution or debugging).
- Always surface verification steps and run tests/linters the project provides.

## Optional model prefix
If your model honors system prompts, set a short `system_prompt_prefix` (outside this file) that restates the hard gate and the need to `/read` skills before acting.
