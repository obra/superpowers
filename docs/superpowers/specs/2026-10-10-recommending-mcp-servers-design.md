# Recommending MCP Servers — Design

Date: 2026-10-10
Status: design approved in-session by Nilson; spec pending review
Branch: `feat/recommending-mcp-servers` off `main` (v6.4.2) — fork-only, never sent upstream

## Goal

When superpowers designs, plans, or reviews work, it should recommend the
MCP servers that would let the agent actually exercise and verify that
work — a browser for a UI, a database client for a schema change — instead
of leaving verification to reading code. MCP servers help most when
testing new things, and today no skill mentions them.

One new skill, **`recommending-mcp-servers`**, owns the logic. Three short
hooks call it or carry its output: `brainstorming` (into the spec),
`writing-plans` (into the plan header and verification steps), and
`requesting-code-review` (the reviewer uses or recommends servers).

## Scope decisions (settled with Nilson)

- **Fork-only.** Upstream `AGENTS.md` rejects changes that promote
  third-party projects; naming concrete servers is fine in this fork.
- **A curated catalog outside the repo.** The catalog lives at
  `~/.claude/superpowers/mcp-catalog.md` — global to the human partner,
  shared by all projects, never committed to any repository. It does not
  ship with the skill; it is created the first time the skill needs it.
- **The agent drafts, the human partner approves.** The agent proposes
  catalog entries (from the project's needs and from what is installed);
  nothing is written to the catalog until the human partner approves it.
  This is the guard against invented or stale server names.
- **Reasoning by need.** Recommendations start from what the work needs to
  verify, then look up the catalog — never from a list of favorite servers.
- **Review uses and recommends.** The reviewer uses listed servers that are
  available in its session to exercise the change, and recommends missing
  servers when a claim cannot be verified without them.
- **Hooks stay short** (3–8 lines each) so merging upstream releases into
  the fork stays cheap. All logic lives in the new skill.

## The skill: `skills/recommending-mcp-servers/SKILL.md`

Description (frontmatter): `Use when designing, planning, or reviewing work
whose claims could be verified by exercising it through an MCP server — a
browser, a database, an API, library docs — or when brainstorming,
writing-plans, or requesting-code-review hands off to it`.

### Catalog format

`~/.claude/superpowers/mcp-catalog.md`, grouped by **need**, not by server:

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
claims it lets the agent check), and `Install` (the harness command).

### Procedure

1. **Derive needs** from the input (spec design, plan, or diff): what must
   be tested, queried, or observed to show the work is correct. Write each
   need as a claim ("the login form submits", "the migration adds the
   column").
2. **Read the catalog.** If it does not exist, or no entry covers a need,
   draft the missing entries, show them to the human partner, and write
   them only after approval (creating the file and its directory if
   needed). If the human partner declines, continue without them.
3. **Check what is installed** — `claude mcp list` in Claude Code, or the
   harness's own command, or the `mcp__*` tools visible in the session —
   and mark each recommendation ✅ installed or ➕ to install.
4. **Return a table** of at most 5 servers:

   | Server | Need | Verifies | Status |
   |--------|------|----------|--------|

### Rules

- Never install a server. Installing is the human partner's action.
- Every recommendation names the claim it verifies. "Might be useful" is
  not a reason.
- "No MCP servers recommended" is a valid result. Do not pad the table.
- Subagents (e.g. the code reviewer) never write the catalog — they cannot
  ask for approval. They report missing servers; the main agent brings any
  new entry to the human partner.

## Hooks

### `brainstorming` (architectural path only)

- Checklist: a new step between "Present design" and "Write design doc":
  **Recommend MCP servers** — invoke `superpowers:recommending-mcp-servers`
  on the approved design; its table becomes the spec's `## MCP Servers`
  section. Later steps renumber.
- Process flow: a matching node between "User approves design?" (yes) and
  "Write design doc".
- Terminal-state paragraph: one sentence clarifying that
  `recommending-mcp-servers` runs *during* brainstorming, so the rule "the
  ONLY skill you invoke after brainstorming is writing-plans" still holds.
- Spike and bounded paths are unchanged: they produce no spec.

### `writing-plans`

- Plan Document Header gains, after `**Tech Stack:**`:
  `**MCP Servers:** [from the spec's MCP Servers section, or "none"]`.
- If the plan has no spec with that section, invoke
  `superpowers:recommending-mcp-servers` on the plan's scope first.
- Verification steps name the server when it is how the step is verified
  (e.g. "Verify: open /login via Playwright MCP; screenshot shows the form").
- ➕ servers are listed as prerequisites for the human partner before
  execution. A plan never contains a task in which the agent installs an
  MCP server.

### `requesting-code-review`

- `SKILL.md`: new placeholder `{MCP_SERVERS}` — the plan's `MCP Servers`
  line, or "none".
- `code-reviewer.md`: a short section:
  - For each listed server that is available in your session, use it to
    exercise the change and report what you verified, with evidence.
  - If a claim in the diff can only be verified with a server you do not
    have, add it under **Recommendations**: the server and the claim it
    would verify.
  - Do not write the MCP catalog.

## Testing

- **Structure test** — extend `tests/context-skills/test-skill-structure.sh`
  to cover `recommending-mcp-servers` with the existing checks (name matches
  directory, description starts "Use when", ≤1024 chars, referenced files
  exist, no "the user"), plus hook presence:
  - `skills/brainstorming/SKILL.md` contains
    `superpowers:recommending-mcp-servers` and `## MCP Servers`;
  - `skills/writing-plans/SKILL.md` contains `**MCP Servers:**`;
  - `skills/requesting-code-review/SKILL.md` and `code-reviewer.md` both
    contain `{MCP_SERVERS}`.
- **Behavior check (writing-skills RED/GREEN, light)** — a subagent in a
  scratch repo with a temporary `HOME`, so the real catalog is never
  touched; baseline without the skill vs with it:

  | # | Scenario | Pass when |
  |---|----------|-----------|
  | A | Spec for a web app with a UI | Spec has `## MCP Servers` with 1–5 entries, each naming the claim it verifies and ✅/➕ |
  | B | Pure CLI library, no UI, DB, or network | "No MCP servers recommended", or only justified entries — no padding |
  | C | No catalog exists | Agent drafts entries and asks for approval; the file does not exist before approval |
  | D | Review with a plan listing a missing server | Reviewer lists it under Recommendations with its claim and does not write the catalog |

## Out of scope

- Installing MCP servers automatically.
- Any upstream PR.
- Concrete listing commands for harnesses other than Claude Code (the skill
  says "the harness's own command, or the visible `mcp__*` tools").
- Pruning stale catalog entries — revisit if it becomes a problem.
