---
name: itradeaims-repo-bootstrap
description: Use when initializing, auditing, syncing, updating, or installing iTradeAIMS workflow adapters or shared agent skills in an iTradeAIMS-related repo.
---

# iTradeAIMS Repo Bootstrap

Use this skill from a global Codex skill installation or directly from the canonical iTradeAIMS workflows repo when a repo does not yet have local iTradeAIMS skills.

Canonical source lives in `D:\itrad\repos\itradeaims-agent-workflows`. Treat that repo as the control plane and product repos as targets.

## Critical Runtime Skill Gate

Before bootstrap, audit, sync, or adapter work in any iTradeAIMS repo, inspect the active Codex skill list already provided in the session context and confirm it includes the runtime workflow skills relevant to that repo type. Do not load every iTradeAIMS skill everywhere, and do not run shell preflight automatically just to answer a first prompt.

- Superpowers methodology skills: `superpowers:brainstorming`, `superpowers:writing-plans`, `superpowers:executing-plans`, `superpowers:verification-before-completion`, `superpowers:subagent-driven-development`, and `superpowers:finishing-a-development-branch`.
- For control-plane targets, do not require iTradeAIMS-prefixed skills to be active runtime skills. This repo owns the canonical iTradeAIMS skills under `skills/`; read the canonical skill source under `skills/` when needed.
- Product-repo skills: the control-plane/common skills plus only the repo-specific validation, release-readiness, bridge, or artifact-hygiene skills for that product repo type.
- Some skills are target-repo-specific and may not work outside the intended repo. Treat that as expected behavior, not a bug in the skill itself.

If any required Superpowers methodology skill or product-repo runtime skill for the target repo type is missing or unreadable, treat it as a CRITICAL runtime failure. First warn the user and ask whether to stop and repair skill loading or continue without those controls. Do not mutate files until the user explicitly chooses repair or continue.

## Workflow

1. Identify the target repo. If the user names a repo such as `itradeaims-indicators`, resolve it under `D:\itrad\repos\` when that path exists. Default to the current working directory only if the user does not name a target.
2. Check target repo status before mutation.
3. Run detection.
4. Run audit before mutation.
5. Preview startup pack.
6. If the repo type is wrong or ambiguous, ask before writing files.
7. Prefer dry run before mutation.
8. Install the matching adapter and shared skills only after the audit and dry run match the intended target.
9. Validate.
10. Report repo type, audit status, files installed, lock-file version, validation result, target repo dirty state, and any manual decisions still needed.

## Installation Contract

- Create or update `.agents/skills/`.
- Treat `.agents/skills/` as a reserved runtime skill root in product repos. Its direct children must be installed skill directories with `SKILL.md`; unrelated docs belong under `docs/`.
- Install canonical `.gitattributes` and `.editorconfig` line-ending guardrails when absent; if either file already exists but is incompatible, report drift and require a manual merge instead of overwriting by default.
- Write `.agents/itradeaims-workflows.lock.json`.
- Write `.agents/context/startup-pack.json` for product repos during explicit adapter install or sync.
- Do not require or install `.agents/context/startup-pack.json` in the control-plane repo.
- Treat MCP as advisory discovery and routing support; authoritative source files, repo policy, canonical skills, deterministic scripts, and current owner instructions remain the source of truth.
- Do not overwrite existing repo policy files.
- Do not edit product source during bootstrap.
- Do not commit unless the user explicitly asks.
- Do not install retrieval indexes, embeddings, caches, or generated memory stores into product repos.

## Repo Types

Read the repository type rules if automatic detection is unclear.