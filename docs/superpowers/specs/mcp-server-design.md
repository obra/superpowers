# Superpowers MCP Server — Design Spec

**Status:** Finalized  
**Date:** 2026-03-15  
**Version:** 0.1.0

---

## Problem Statement

Every existing Superpowers adapter has the same three failure modes:

1. **File-path coupling.** Installation requires knowing — and manually specifying — the absolute path to the cloned repository on each machine. This breaks CI/CD, ephemeral environments, and onboarding new contributors.
2. **Eager context loading.** Adapters like `.cline/bootstrap.md` and the OpenCode plugin inject the full bootstrap into the system prompt on every session, consuming significant context window before the agent has even received a user message.
3. **Platform proliferation.** Every new agent (Cline, Goose, Cursor, Codex, …) needs a bespoke adapter maintained in lockstep with the skills library. There is no single integration point.

An MCP server resolves all three problems simultaneously.

---

## Goals

| Goal | Description |
|------|-------------|
| **Lazy loading** | Skills are loaded only when requested, not injected eagerly into every session |
| **Zero file-path config** | The user specifies one config entry — the server location — with no repo paths |
| **Platform-universal** | Any MCP-compatible agent gets the full skill library with a single config block |
| **Single installation command** | `npx superpowers-mcp` or equivalent — no clone, no symlinks, no admin privileges |
| **Forwards-compatible** | New skills appear automatically without reconfiguring connected agents |

---

## Background: What Exists Today

### Skill Structure

Skills live in `skills/<name>/SKILL.md` with YAML frontmatter:

```yaml
---
name: brainstorming
description: "You MUST use this before any creative work..."
---
```

The body is the full instruction content. The `description` field is purpose-built for surfacing to agents so they can decide which skill to load.

There are currently **14 skills** in `skills/` and **13** in `universal/skills/` (mirrored). Additionally:

- `universal/CAPABILITIES.md` — platform-agnostic capability definitions
- `universal/bootstrap.md` — the universal bootstrap instruction document
- `universal/manifest.json` — machine-readable metadata for the universal package

### Existing Adapters (for reference)

| Adapter | Mechanism | Pain Point |
|---------|-----------|------------|
| `.claude-plugin/` | Marketplace JSON + plugin.json | Requires CC marketplace registration |
| `.cursor-plugin/` | plugin.json with path refs | Requires symlinks at known paths |
| `.opencode/` | JS plugin that reads from absolute paths | Requires clone at specific location |
| `.codex/` | Symlinks to `~/.agents/skills/` | Requires repo clone + manual junction on Windows |
| `.cline/` | Symlinks bootstrap.md to `.clinerules` | Requires repo clone + admin PowerShell for symlinks |

The OpenCode JS plugin (`superpowers.js`) is the most instructive reference — it reads `SKILL.md` files at runtime from a known relative path and injects content. The MCP server takes this pattern further: instead of injecting eagerly, it exposes the content as callable tools.

---

## Architecture

### Core Concept: Skills as MCP Tools

The MCP server acts as a **skill registry** — a thin layer between the skills directory and any MCP-capable agent. When an agent needs a skill, it calls a tool; the server reads and returns the file on demand.

```
┌──────────────────────┐     MCP Protocol      ┌─────────────────────────┐
│   MCP-Compatible     │ ◄───────────────────► │  superpowers-mcp server  │
│   Agent              │   JSON-RPC over stdio  │                         │
│  (Cline, Goose,      │                        │  ┌─────────────────┐   │
│   Claude Code, etc.) │                        │  │  skills/         │   │
└──────────────────────┘                        │  │    brainstorming │   │
                                                │  │    tdd/          │   │
                                                │  │    ...           │   │
                                                │  └─────────────────┘   │
                                                │  universal/CAPABILITIES │
                                                │  universal/bootstrap.md │
                                                └─────────────────────────┘
```

The server resolves the skills directory **relative to its own location** in the npm package, so no file-path configuration is required from the user.

---

## Tools

### `list_skills`

Returns a directory of all available skills with their name and description, so the agent can decide which skill to load without reading every file.

**Input:** none

**Output:**
```json
{
  "skills": [
    {
      "name": "brainstorming",
      "description": "You MUST use this before any creative work..."
    },
    {
      "name": "test-driven-development",
      "description": "Use when implementing any feature or bugfix..."
    }
  ]
}
```

**Implementation note:** Scans `skills/*/SKILL.md`, parses only the YAML frontmatter block, returns name + description. Does NOT read skill body content — preserves lazy loading.

---

### `load_skill`

Returns the full content of a specific skill's `SKILL.md`.

**Input:**
```json
{ "name": "brainstorming" }
```

**Output:**
```json
{
  "name": "brainstorming",
  "description": "You MUST use this before any creative work...",
  "content": "# Brainstorming Ideas Into Designs\n\n..."
}
```

**Implementation note:** Reads `skills/{name}/SKILL.md`. Returns a structured error if the skill does not exist. Strips YAML frontmatter from `content` (body only, since metadata is already in the envelope).

---

### `list_capabilities`

Returns the full content of `universal/CAPABILITIES.md` — the platform-agnostic capability mapping document that tells agents how to substitute missing tools with native equivalents.

**Input:** none

**Output:**
```json
{
  "content": "# Universal Agent Capabilities\n\n..."
}
```

---

### `get_bootstrap`

Returns the universal bootstrap document (`universal/bootstrap.md`) — the instructions that tell the agent how to use the skill system.

**Input:** none

**Output:**
```json
{
  "content": "# Bootstrap: Using Superpowers\n\n..."
}
```

**Design note:** This is deliberately a lazy pull. Agents call `get_bootstrap` when they first encounter Superpowers or when the user asks "do you have superpowers?" — not eagerly on every session start. This is the key improvement over the OpenCode plugin's system-prompt injection.

---

## Resources

MCP Resources let agents subscribe to content as URI-addressable documents. These are optional complements to the tool interface.

### `skill://{name}`

**URI pattern:** `skill://brainstorming`  
**MIME type:** `text/markdown`  
**Description:** Full SKILL.md content (body only, no frontmatter) for the named skill.

**Use case:** Agents that support resource subscriptions can "hold" a skill in their context window as a resource rather than embedding it in a tool call response. Useful for agents with resource-aware context management.

### `superpowers://bootstrap`

**URI:** `superpowers://bootstrap`  
**MIME type:** `text/markdown`  
**Description:** The universal bootstrap document.

### `superpowers://capabilities`

**URI:** `superpowers://capabilities`  
**MIME type:** `text/markdown`  
**Description:** The CAPABILITIES.md document.

---

## Installation

### Package Name

`superpowers-mcp`

Published to **npm** (not PyPI). Rationale:

1. The existing OpenCode plugin (`superpowers.js`) is JavaScript — a JS server keeps the codebase in a single language
2. Node.js is more universally installed than Python in agent tool environments
3. `npx` allows zero-install execution — the user never clones the repo
4. MCP SDK for JavaScript (`@modelcontextprotocol/sdk`) is mature and well-documented

### Single-Command Execution

```bash
npx superpowers-mcp
```

No installation step required. `npx` fetches and runs the package on demand.

For persistent installation:

```bash
npm install -g superpowers-mcp
superpowers-mcp
```

---

## Agent Configuration

The server communicates over **stdio** (standard input/output), which is the MCP transport supported by all major agent platforms.

### Cline (VSCode Extension)

In VSCode settings → Cline → MCP Servers, or in `.vscode/settings.json`:

```json
{
  "cline.mcpServers": {
    "superpowers": {
      "command": "npx",
      "args": ["superpowers-mcp"]
    }
  }
}
```

### Claude Code

In `claude_desktop_config.json` (or `claude_code_config.json` depending on version):

```json
{
  "mcpServers": {
    "superpowers": {
      "command": "npx",
      "args": ["superpowers-mcp"]
    }
  }
}
```

### Cursor

In `.cursor/mcp.json` (project-local) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "superpowers": {
      "command": "npx",
      "args": ["superpowers-mcp"]
    }
  }
}
```

### Goose

In `~/.config/goose/profiles.yaml` under the active profile:

```yaml
extensions:
  superpowers:
    type: stdio
    cmd: npx
    args:
      - superpowers-mcp
```

### OpenCode (alternative/fallback)

OpenCode already has a native skill tool + the existing JS plugin. The MCP server is an alternative for users who prefer the MCP interface:

```json
{
  "mcpServers": {
    "superpowers": {
      "command": "npx",
      "args": ["superpowers-mcp"]
    }
  }
}
```

---

## Directory Structure

```
.mcp/
├── README.md              # What this directory is, how to use it
├── package.json           # npm package manifest for superpowers-mcp
├── index.js               # MCP server entry point
├── lib/
│   ├── server.js          # MCP server setup (tools, resources, transport)
│   ├── skills.js          # Skill directory scanning and file reading
│   └── frontmatter.js     # YAML frontmatter parser (no external deps)
└── .npmignore             # Exclude dev files from published package
```

### Key Locations (at publish time)

The server resolves skill paths relative to its own `index.js` using:

```js
const SKILLS_DIR = path.resolve(__dirname, '../../skills');
const UNIVERSAL_DIR = path.resolve(__dirname, '../../universal');
```

This means the published npm package **must include** the `skills/` and `universal/` directories. The `.npmignore` should exclude `.claude-plugin/`, `.cline/`, `.opencode/`, etc. — only `skills/`, `universal/`, and `.mcp/` are needed in the package.

---

## Language Decision

**JavaScript (Node.js)** — confirmed.

| Criterion | JavaScript | Python |
|-----------|-----------|--------|
| Existing repo codebase | ✅ `.opencode/plugins/superpowers.js` already JS | — |
| Universal install tool | ✅ `npx` — no pre-install needed | ❌ `uvx`/`pipx` less universal |
| MCP SDK maturity | ✅ `@modelcontextprotocol/sdk` by Anthropic | ✅ also available |
| Windows compatibility | ✅ Node has better Windows support | ⚠️ Python path issues common |
| External dependencies | Minimal (just MCP SDK) | Same |

Decision: **JavaScript/Node.js**

---

## What the Agent Bootstrap Flow Looks Like

With the MCP server, the ideal agent flow is:

```
1. Session starts — no eager context injection
2. User sends first message
3. Agent calls list_skills → sees available skills + descriptions
4. Agent optionally calls get_bootstrap → understands the skill system
5. Agent identifies relevant skill(s)
6. Agent calls load_skill({ name: "brainstorming" }) → gets full instructions
7. Agent follows skill exactly
```

Compare to current Cline adapter:
```
1. Session starts → full bootstrap.md injected eagerly (~5KB context)
2. User sends first message
3. Agent manually reads .cline/skills/{name}/SKILL.md via file tools
   (requires knowing the file path exists on disk)
```

The MCP approach eliminates steps that depend on file system knowledge and defers loading until actually needed.

---

## Versioning and Updates

Since the package is published to npm, skill updates flow through normal semver:

- Skills change → bump patch/minor version → `npm publish`
- Users running `npx superpowers-mcp` get latest automatically (npx always fetches latest unless version pinned)
- Users who `npm install -g` need to manually `npm update -g superpowers-mcp`

---

## Constraints and Non-Goals

- **Phase 1 (this spec):** Read-only API — list, load, get. No write operations, no skill creation via MCP.
- **No authentication:** Skills are read-only markdown files. Auth adds complexity with no security benefit for this use case.
- **No HTTP transport:** stdio only in Phase 1. SSE/streamable HTTP can be added later if remote hosting becomes desirable.
- **No project-local skill merging:** Phase 1 serves only the bundled skills. Project-specific skills (`.opencode/skills/`, `.cline/skills/`) are a Phase 2 feature.
- **No replacing existing adapters:** The MCP server is additive. Existing platform-specific adapters remain in place for users who prefer them.

---

## Decisions

All implementation decisions are resolved:

| # | Question | Decision |
|---|----------|----------|
| 1 | **Package name** | `superpowers-mcp` on npm. Fallback scope: `@obra/superpowers-mcp` if name is taken. |
| 2 | **Skill source** | `skills/` only — the authoritative source. `universal/skills/` is a mirror and is ignored by the server. |
| 3 | **Frontmatter in `content`** | Stripped. Frontmatter fields (`name`, `description`) are already in the response envelope — returning them again in `content` would be redundant. |
| 4 | **Error format** | MCP `isError: true` flag on content responses, per MCP spec. Errors are returned as `{ type: "text", text: "<message>" }` content with `isError: true` on the tool result. |
| 5 | **`using-superpowers` in `list_skills`** | Included. Agents may want to explicitly load it, and omitting it would create a confusing gap between what `list_skills` returns and what `load_skill` accepts. |

---

## Verification Plan

After implementation (Phase 2), the following must pass:

### Automated

- `list_skills` returns all 14 skill names with correct descriptions parsed from frontmatter
- `load_skill({ name: "brainstorming" })` returns correct content without YAML frontmatter
- `load_skill({ name: "nonexistent" })` returns a structured error
- `list_capabilities` returns CAPABILITIES.md content
- `get_bootstrap` returns bootstrap.md content
- Resources `skill://brainstorming`, `superpowers://bootstrap`, `superpowers://capabilities` resolve correctly
- Server starts via `node .mcp/index.js` with no errors

### Manual Integration

- Configure server in Cline → run "do you have superpowers?" → agent correctly calls `get_bootstrap` and `list_skills`
- Configure server in Claude Code → verify tool calls appear in conversation
- `npx superpowers-mcp --version` prints version without error
- Cold start `npx superpowers-mcp` from a machine with no clone of the repo

---

*End of spec. No implementation code in Phase 1.*
