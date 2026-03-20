# First Version Spec — OpenClaw Memory Stack Giveaway

## Product Intent

A downloadable zip that users can hand to OpenClaw to install a sane, layered memory system without smashing their workspace.

## Design Principles

1. **File truth beats magic.** Durable truth lives in files.
2. **Tiny bootstrap.** `MEMORY.md` and `AGENTS.md` stay lean.
3. **Layer separation.** Each memory layer has one job.
4. **Patch, don’t replace.** Existing operator files get managed inserts, not rewrites.
5. **Optional upgrades.** OpenStinger is additive, not required for v1.

## Memory Model

### Layer A — Routing
- `MEMORY.md`
- `AGENTS.md`
- job: tell the agent where to look and which rules survive compaction

### Layer B — Session recovery
- `lossless-claw`
- job: preserve/recover long current-thread context
- not canonical long-term truth

### Layer C — Durable knowledge
- `~/life/` PARA
- `summary.md` + `items.json`
- canonical source of durable facts

### Layer D — Operational residue
- `memory/YYYY-MM-DD.md`
- job: daily timeline and short-horizon continuity

### Layer E — Automatic recall
- Gigabrain memory slot plugin
- job: pre-prompt recall, capture, dedupe, vault mirror

### Layer F — Cross-session graph recall
- OpenStinger
- job: semantic + temporal recall across sessions
- optional in v1

## What v1 Installs

### Files created if missing
- `memory/.gitkeep`
- `MEMORY.md`
- `PARA.md`
- `WORKSPACE_MEMORY_SYSTEM.md`
- `docs/memory-stack-local-notes.md`

### Patches applied if target files exist
- `AGENTS.md`: managed memory-stack rules block
- `MEMORY.md`: managed routing/index block
- `PARA.md`: managed PARA conventions block

### Guidance emitted, not auto-forced
- OpenClaw config snippets for Gigabrain + lossless-claw
- OpenStinger integration notes/snippets
- gateway restart reminder when config changes matter

## Durable File Patching Convention

Managed block markers:

```md
<!-- MEMORY-STACK-GIVEAWAY:START -->
...managed content...
<!-- MEMORY-STACK-GIVEAWAY:END -->
```

Rules:
- if block exists, replace only inside the block
- if file exists without block, append block at end
- if file missing, create starter file then insert block

## Preflight Checks

- target workspace exists
- `AGENTS.md` readable or creatable
- `MEMORY.md` readable or creatable
- shell tools available: `bash`, `cp`, `mkdir`, `date`
- if OpenStinger mode requested:
  - detect `docker`
  - detect `docker compose` or `docker-compose`
  - optionally detect `python`

## Explicit Non-Goals for v1

- no automatic plugin installation from npm/pip
- no direct mutation of hidden OpenClaw config unless user approves
- no OpenStinger infra bootstrapping by default
- no migration/import of old memory systems

## Recommended User Flow

1. unzip package
2. point OpenClaw at package
3. run `INSTALL_PROMPT.md`
4. review proposed config patch
5. approve config changes separately if desired
6. restart gateway if config changed

## Success Criteria

- target workspace gets layered memory docs/files
- bootstrap files remain small
- managed blocks are idempotent
- backups are recoverable
- user can install from zip with one clear prompt
