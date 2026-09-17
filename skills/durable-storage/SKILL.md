---
name: durable-storage
description: Configure, and consult, where Superpowers writes durable specs and plans — filesystem `docs/superpowers/` by default, or a configured ObsidianRAG vault — plus the shared filename convention (Jira-key or kebab-case) both use. Use when configuring durable-storage behaviour, or when `brainstorming`/`writing-plans` need a destination path and filename for a spec or plan.
---

# Durable Storage

## Central Rule

> Specs and plans are durable artifacts. Where they're written is configurable, but the decision — destination and filename — is made in exactly one place, so `brainstorming` and `writing-plans` never duplicate this logic.

---

## Scope

This skill governs **durable artifacts only**: specs and plans.

It does NOT govern `.superpowers/` internal execution or session state — for example the brainstorming visual-companion's session directories (`​.superpowers/brainstorm/...`). That stays exactly where it is today: local, gitignored, ephemeral/persist-for-review-only. This skill never redirects that into Obsidian.

---

## Default Behaviour (No Configuration)

* Specs → `docs/superpowers/specs/<filename>.md`
* Plans → `docs/superpowers/plans/<filename>.md`

This is the existing filesystem behaviour and is unchanged unless a custom provider is configured below.

---

## Configuration

Config lives at `.superpowers/config.json` — the same directory Superpowers already uses for local, non-durable state, and which is already gitignored at the repo root. This keeps environment-specific details (like a personal vault name) out of Git entirely.

```json
{
  "durableStorage": {
    "provider": "default",
    "obsidianRag": {
      "vault": "<vault name from your ObsidianRAG MCP config>",
      "root": "Superpowers"
    }
  }
}
```

* `provider` — `"default"` (filesystem; the default) or `"obsidian-rag"`.
* `obsidianRag.vault` — required when `provider` is `"obsidian-rag"`. The vault's logical **name**, exactly as your ObsidianRAG MCP server configures it (see its `help` tool) — never a filesystem path. Superpowers never hardcodes or discovers a physical vault location.
* `obsidianRag.root` — folder under the vault root that holds all Superpowers artifacts. Defaults to `Superpowers` if omitted.

If the file, or the `durableStorage` key, is missing or unreadable, behave exactly as `"provider": "default"`.

### Setting It Up

1. Ask what provider to use (default, or ObsidianRAG with a vault name).
2. If ObsidianRAG: confirm its MCP tools are actually reachable in this environment (e.g. its `help` tool responds) before switching the provider. If they're not available, say so plainly and do not write the config — do not fake or assume the integration.
3. If reachable, call `help` and check the requested vault name appears in its configured vaults. If it doesn't, tell the user (likely a typo, or the vault isn't set up yet) and let them confirm before proceeding — their ObsidianRAG config can change independently later, so this is advisory, not a hard block.
4. Write `.superpowers/config.json` with the requested settings.
5. Report exactly what changed — previous provider → new provider, and vault/root if applicable.
6. Do not stage or commit `.superpowers/config.json`. Same Git-safety rule as every other Superpowers skill: the user owns Git history.

---

## Storage Provider Abstraction

### `default`

Write the file directly to the filesystem path shown above, with normal file tools. No MCP call involved.

### `obsidian-rag`

Use the ObsidianRAG MCP tools directly. Never write to the vault's filesystem location, even if it happens to be knowable — the point of this provider is that Superpowers only ever talks to it through ObsidianRAG's own interface.

* Create, or fully rewrite, a spec/plan with its `write_note` tool.
* Pass `vault` explicitly, from config. Do **not** pass `project` — ObsidianRAG's own `project` concept routes across a separate, pre-curated set of vaults associated with named projects, which is a different thing from the `<ProjectName>` path segment this skill derives below.
* `path` = `<root>/<ProjectName>/Specs/<filename>.md` or `<root>/<ProjectName>/Plans/<filename>.md`. Note: **`Specs`/`Plans` sit directly under `<root>/<ProjectName>/`** — there is no `Projects/` directory anywhere in the path.
* Overwriting an existing spec/plan with `write_note` during the same working session (e.g. incorporating review feedback before the user has approved it) is expected, not a bug — specs/plans are whole documents, regenerated in full, not appended to.
* If the config says `obsidian-rag` but its MCP tools are unreachable when a write is actually attempted, stop and tell the user. Do not silently fall back to the filesystem default, and do not report a write as having happened when it didn't.

---

## Project Name

Derive `<ProjectName>` from the repository being worked on:

1. Inside a Git repository: the top-level directory's name — `basename "$(git rev-parse --show-toplevel)"`.
2. Otherwise: the current working directory's name.
3. If neither is reliable, don't invent one — ask the user for the project name.

Use this name as-is for the path segment; don't slugify or rename it beyond what's required to be a valid path component.

---

## Filename Convention

Applies to both specs and plans, on both providers — this replaces the old date-prefixed default names (`YYYY-MM-DD-<topic>-design.md` / `YYYY-MM-DD-<feature-name>.md`) with the scheme below.

1. **Look for a Jira key in the current Git branch name.** Match a generic pattern for a Jira-style key — a project prefix of at least two letters, a hyphen, then digits (e.g. `CLIK-1234`, `PROJ-42`) — rather than hardcoding any specific project prefix. Match case-insensitively, but preserve the exact case found in the branch.
   * Exactly one distinct key found → use it: `<KEY>-<kebab-case-description>.md` (e.g. `CLIK-1234-prompt-compiler.md`).
   * No key found → go to step 2.
   * More than one *distinct* key found → don't guess. Ask the user which is the primary key, unless the branch/project already provides a reliable way to resolve it (none exists in this repo today).
2. **No Jira key: generate a concise, human-friendly kebab-case description** of the actual work (e.g. `prompt-compiler.md`, `superpowers-storage-configuration.md`) — not a raw copy of the branch name, if a clearer description of the work is available.
3. **Filename stability.** Decide the filename once, when the spec/plan is first created, and never rename it afterward — not because the plan was revised, not because the team's understanding of the task evolved. If the work turns into a genuinely different piece of work, that's a new artifact with its own filename, not a rename of the existing one.

---

## Primary Agent Performs This

Determining a destination and filename, and configuring the provider, are reasoning the primary agent does directly — never a dedicated storage-decision or configuration subagent.

---

## Consumed By

* `superpowers:brainstorming` (architectural path) — specs.
* `superpowers:writing-plans` — plans.

Neither skill duplicates this logic. Both ask "what's the destination and filename for this artifact?" and get the answer from here.

---

## Git Safety

This skill writes durable artifacts (specs/plans) and, when configuring, the local `.superpowers/config.json`. It never stages, commits, or otherwise touches Git history — the user decides what, if anything, gets committed.
