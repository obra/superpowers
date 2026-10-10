---
name: recommending-mcp-servers
description: Use when designing, planning, or reviewing work whose claims could be verified by exercising it through an MCP server — a browser, a database, an API, library docs — or when brainstorming, writing-plans, or requesting-code-review hands off to it
---

# Recommending MCP Servers

## Overview

Reading code shows what the work says it does. An MCP server lets you
exercise it: open the page, query the table, call the endpoint, check the
library's current docs. Recommend the servers that let you verify this
work's claims, chosen by need, from a catalog your human partner approved.

**Core principle:** every recommended server names the claim it verifies.
No claim, no recommendation.

## The Catalog

The catalog lives at `~/.claude/superpowers/mcp-catalog.md` — global to
your human partner, shared by every project, never committed to any
repository. It does not ship with this skill; it is created the first time
you need it. Entries are grouped by need, not by server:

```markdown
# MCP Catalog

Approved by the human partner. Entries are added only after approval.

## Browser automation
- **Playwright MCP** — drive a real browser: click, fill, screenshot, console.
  Use when: web UI, end-to-end flows.
  Verifies: "the page renders", "the flow completes", "no console errors".
  Install: `claude mcp add playwright -- npx @playwright/mcp@latest`
```

Each entry has: name, one-line capability, `Use when`, `Verifies` (the
claims it lets you check), and `Install` (the harness command).

## Procedure

1. **Derive needs.** From the input — an approved design, a plan, or a
   diff — list what must be tested, queried, or observed to show the work
   is correct. Write each need as a claim: "the login form submits", "the
   migration adds the column".
2. **Read the catalog.** If it does not exist, or no entry covers a need,
   draft the missing entries and show them to your human partner. Write
   them only after approval, creating the file and its directory if
   needed. Append each approved entry under its need heading; never
   rewrite or reorder existing entries — your human partner may have
   edited them by hand. If your human partner declines an entry, continue
   without it and do not propose it again this session.
3. **Check what is installed.** Run `claude mcp list` in Claude Code, the
   harness's own command elsewhere, or look at the `mcp__*` tools visible
   in your session. Judge each server by capability, not by exact name —
   the same server can appear under different prefixes (for example
   `mcp__playwright__…` or `mcp__plugin_playwright_…`). When a different
   installed server covers the need, name the installed server in the
   row, not the catalog's. Mark each row ✅ installed or ➕ to install —
   never ✅ on a row whose named server is not installed.
4. **Return the table** — at most 5 servers, the ones that verify the most
   important claims:

   | Server | Need | Verifies | Status |
   |--------|------|----------|--------|

   When no need justifies a server, the result is the line
   `No MCP servers recommended`.

## Where the Table Goes

- **brainstorming** — the spec's `## MCP Servers` section.
- **writing-plans** — the plan header's `**MCP Servers:**` line; ➕ servers
  are prerequisites your human partner installs before execution.
- **requesting-code-review** — the reviewer's `[MCP_SERVERS]` input.

## Rules

- Never install a server. Installing is your human partner's action.
- Every recommendation names the claim it verifies. "Might be useful" is
  not a reason.
- `No MCP servers recommended` is a valid result. Do not pad the table.
- Subagents (for example the code reviewer) never write the catalog —
  they cannot ask for approval. They report missing servers; the main
  agent brings any new entry to your human partner.

## Red Flags

| Thought | Reality |
|---------|---------|
| "This server is popular, I'll list it" | Name the claim it verifies or drop it. |
| "I know the install command, I'll just add it" | Installing is your human partner's action. |
| "The table looks empty" | `No MCP servers recommended` is a result. |
| "I'll fix up the catalog while I'm here" | Append approved entries only; never rewrite. |
| "I'm sure this server exists, no need to ask" | Unapproved entries are how invented names get in. Show the draft first. |
| "It's not in `claude mcp list` under that name" | Judge by capability; prefixes vary by install route. |
| "Another server does this, so the catalog's one is ✅" | Name the server that is installed; the catalog's stays ➕. |
