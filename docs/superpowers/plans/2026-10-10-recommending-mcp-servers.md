# Recommending MCP Servers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `recommending-mcp-servers` skill plus three short hooks so brainstorming, writing-plans, and requesting-code-review recommend (and the reviewer uses) MCP servers that verify the work.

**Architecture:** All logic — the catalog at `~/.claude/superpowers/mcp-catalog.md`, approval, need-to-server matching, installed-status check — lives in the new skill. `brainstorming` invokes it and writes a `## MCP Servers` spec section; `writing-plans` carries it into a header line and verification steps; `requesting-code-review` passes it to the reviewer, who uses available servers and recommends missing ones. Hooks are 3–8 lines each.

**Tech Stack:** Markdown skills; bash structure test (`tests/context-skills/test-skill-structure.sh`); subagent scenario runs for behavior.

**Spec:** `docs/superpowers/specs/2026-10-10-recommending-mcp-servers-design.md`

**MCP Servers:** none — the deliverable is skill text; it is verified by the structure test and subagent scenario runs.

## Global Constraints

- Fork-only; never sent upstream. Branch `feat/recommending-mcp-servers`.
- Catalog path, exactly: `~/.claude/superpowers/mcp-catalog.md`. Never in a repository.
- Nothing is written to the catalog without the human partner's approval; subagents never write it.
- Never install a server; a plan never contains a task in which the agent installs an MCP server.
- At most 5 servers per recommendation table; "No MCP servers recommended" is a valid result.
- Every recommendation names the claim it verifies.
- Skill voice: "your human partner", never "the user"; no machine-specific paths or names (the structure test greps `/Users/`, `/home/`, `nilso`).
- New skill: frontmatter only `name` + `description`; description starts "Use when", ≤1024 chars, without the words "dispatch", "then", "step"; body ≤1000 words; has `## Red Flags`.
- Each hook is 3–8 added lines in its file (the checklist renumbering in brainstorming does not count).
- Do not reword existing upstream lines beyond the anchors this plan names.

## Review Focus

1. **Harness without `claude mcp list`** (Codex, Gemini…) — the skill must fall back to the harness's own command or the visible `mcp__*` tools, not stop. Test: Task 1 asserts the skill mentions `mcp__`.
2. **Server installed under a different tool prefix** (e.g. `mcp__plugin_playwright_…`) — status is judged by capability, not exact name. Test: Task 1 asserts the phrase `by capability`.
3. **Human partner declines every proposed entry** — continue without them, no re-asking loop. Test: Task 1 asserts `declines` appears.
4. **Hand-edited catalog** — append approved entries under their need heading; never rewrite or reorder existing entries. Test: Task 1 asserts `never rewrite`.
5. **Plan written without a spec** — writing-plans invokes the skill itself. Test: Task 3 asserts `superpowers:recommending-mcp-servers` in writing-plans.

---

### Task 1: `recommending-mcp-servers` skill

**Files:**
- Create: `skills/recommending-mcp-servers/SKILL.md`
- Modify: `tests/context-skills/test-skill-structure.sh`

**Interfaces:**
- Produces: skill name `superpowers:recommending-mcp-servers`; output table header `| Server | Need | Verifies | Status |`; status marks `✅ installed` / `➕ to install`; spec section heading `## MCP Servers`; empty result text `No MCP servers recommended`.
- Produces (test): function `check_mcp_hooks` in the structure test, called from `check_skill` when `$name` is `recommending-mcp-servers`; later tasks add assertions to it.

- [ ] **Step 1: Extend the structure test**

In `test-skill-structure.sh`: `expected_files` gains `recommending-mcp-servers) echo "SKILL.md" ;;`; the default list becomes `(handover obsidian recommending-mcp-servers)`; header comment mentions the third skill. Add a helper `has <file> <fixed-string> <label>` (`grep -qF`, pass/fail) and `check_mcp_hooks` with, for `skills/recommending-mcp-servers/SKILL.md`:

```bash
has "$f" '~/.claude/superpowers/mcp-catalog.md' "catalog path"
has "$f" '| Server | Need | Verifies | Status |' "output table"
has "$f" 'No MCP servers recommended' "empty result"
has "$f" 'mcp__' "fallback to visible tools"
has "$f" 'by capability' "status judged by capability"
has "$f" 'declines' "declined entries"
has "$f" 'never rewrite' "hand-edited catalog"
```

- [ ] **Step 2: Run it — expect FAIL**

Run: `bash tests/context-skills/test-skill-structure.sh recommending-mcp-servers`
Expected: FAIL on "expected file present: SKILL.md" and the seven content checks. Running with no args, only `recommending-mcp-servers` lines fail; every handover and obsidian line still passes.

- [ ] **Step 3: Write `skills/recommending-mcp-servers/SKILL.md`**

Frontmatter description, exactly:
`Use when designing, planning, or reviewing work whose claims could be verified by exercising it through an MCP server — a browser, a database, an API, library docs — or when brainstorming, writing-plans, or requesting-code-review hands off to it`

Sections: Overview (one paragraph: recommend servers that let the agent exercise and verify work, chosen by need); **The Catalog** (path; grouped by need; entry fields Name, capability, `Use when`, `Verifies`, `Install` — use the Playwright example from the spec verbatim); **Procedure** (the spec's four numbered actions: derive needs as claims → read catalog, draft missing entries, show, write after approval, append under the need heading and never rewrite or reorder existing entries, if your human partner declines continue without them and do not ask again this session → check installed via `claude mcp list` / harness command / visible `mcp__*` tools, judging status by capability since prefixes vary → return the table, ≤5 rows); **Where the table goes** (brainstorming: spec `## MCP Servers`; writing-plans: `**MCP Servers:**` header line; review: `[MCP_SERVERS]`); **Rules** (the spec's four); **Red Flags** table with at least these rows:

| Thought | Reality |
|---|---|
| "This server is popular, I'll list it" | Name the claim it verifies or drop it. |
| "I know the install command, I'll just add it" | Installing is your human partner's action. |
| "The table looks empty" | "No MCP servers recommended" is a result. |
| "I'll fix up the catalog while I'm here" | Append approved entries only; never rewrite. |

- [ ] **Step 4: Run it — expect PASS**

Run: `bash tests/context-skills/test-skill-structure.sh`
Expected: `Failed: 0` (all three skills).

- [ ] **Step 5: Commit**

```bash
git add skills/recommending-mcp-servers/SKILL.md tests/context-skills/test-skill-structure.sh
git commit -m "feat: recommending-mcp-servers skill with a human-approved catalog"
```

### Task 2: brainstorming hook

**Files:**
- Modify: `skills/brainstorming/SKILL.md:134-138` (architectural checklist), `:152-180` (process flow), `:184-187` (terminal states)
- Modify: `tests/context-skills/test-skill-structure.sh` (`check_mcp_hooks`)

**Interfaces:**
- Consumes: `superpowers:recommending-mcp-servers`, `## MCP Servers` (Task 1).

- [ ] **Step 1: Add assertions** for `skills/brainstorming/SKILL.md`:

```bash
has "$b" '6. **Recommend MCP servers**' "checklist step 6"
has "$b" '10. **Transition to implementation**' "checklist renumbered"
has "$b" 'superpowers:recommending-mcp-servers' "invokes the skill"
has "$b" '## MCP Servers' "spec section"
has "$b" '"User approves design?" -> "Recommend MCP servers" [label="yes"];' "flow edge in"
has "$b" '"Recommend MCP servers" -> "Write design doc";' "flow edge out"
has "$b" 'runs during brainstorming' "terminal-state clarification"
```

- [ ] **Step 2: Run — expect FAIL** on those seven lines.

- [ ] **Step 3: Edit brainstorming.** Insert checklist item 6 (`6. **Recommend MCP servers** — invoke `superpowers:recommending-mcp-servers` on the approved design; its table becomes the spec's `## MCP Servers` section`), renumber 6–9 → 7–10. In the flow: declare node `"Recommend MCP servers" [shape=box];` and replace the `"User approves design?" -> "Write design doc" [label="yes"];` edge with the two edges asserted above. After the terminal-state paragraph's first sentence add: `` `recommending-mcp-servers` runs during brainstorming, not after it. ``

- [ ] **Step 4: Run — expect PASS** (`Failed: 0`).

- [ ] **Step 5: Commit** — `feat(brainstorming): recommend MCP servers into the spec`

### Task 3: writing-plans hook

**Files:**
- Modify: `skills/writing-plans/SKILL.md:52-68` (Plan Document Header) and the "What a Step Contains" verification bullet
- Modify: `tests/context-skills/test-skill-structure.sh`

- [ ] **Step 1: Add assertions** for `skills/writing-plans/SKILL.md`:

```bash
has "$w" '**MCP Servers:** [from the spec' "header line"
has "$w" 'superpowers:recommending-mcp-servers' "invokes without a spec"
has "$w" 'installs an MCP server' "no install tasks"
```

Plus an order check: the line number of `**MCP Servers:**` is greater than that of `**Tech Stack:**` and less than `**Spec:**` (use `grep -nF … | head -1 | cut -d: -f1`).

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Edit writing-plans.** In the header template, after `**Tech Stack:**` add `**MCP Servers:** [from the spec's MCP Servers section, or "none" — servers marked ➕ are prerequisites your human partner installs before execution]`. Below the template add two sentences: when the spec has no `## MCP Servers` section, invoke `superpowers:recommending-mcp-servers` on the plan's scope first; a plan never contains a task in which the agent installs an MCP server. In "What a Step Contains", the verification-step bullet adds: name the MCP server when it is how the step is verified (e.g. "open /login via Playwright MCP; screenshot shows the form").

- [ ] **Step 4: Run — expect PASS.**

- [ ] **Step 5: Commit** — `feat(writing-plans): carry MCP servers into the plan header and verification steps`

### Task 4: requesting-code-review hook

**Files:**
- Modify: `skills/requesting-code-review/SKILL.md:36-40` (Placeholders)
- Modify: `skills/requesting-code-review/code-reviewer.md` (new block after `## Requirements / Plan`; placeholder list at `:206-210`)
- Modify: `tests/context-skills/test-skill-structure.sh`

- [ ] **Step 1: Add assertions:**

```bash
has "$r" '{MCP_SERVERS}' "SKILL.md placeholder"
has "$c" '[MCP_SERVERS]' "template placeholder"
has "$c" '## MCP Servers' "template section"
has "$c" 'Do not write the MCP catalog' "reviewer never writes catalog"
has "$c" 'under Recommendations' "missing servers recommended"
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Edit.** `SKILL.md` placeholder list gains `` - `{MCP_SERVERS}` - The plan's `MCP Servers` line, or "none" ``. In `code-reviewer.md`, after the `## Requirements / Plan` block, add a prompt section `## MCP Servers` containing `[MCP_SERVERS]` and three bullets (spec wording): use each listed server available in your session to exercise the change and report what you verified with evidence; a claim only verifiable with a server you do not have goes under Recommendations with the server and the claim; Do not write the MCP catalog. The bottom placeholder list gains `` - `[MCP_SERVERS]` — MCP servers from the plan, or "none" ``.

- [ ] **Step 4: Run — expect PASS.**

- [ ] **Step 5: Commit** — `feat(code-review): reviewer uses listed MCP servers and recommends missing ones`

### Task 5: behavior check (RED/GREEN)

**Files:**
- Modify: this plan — append `## Behavior Results` with one row per scenario run.

UNVERIFIED: whether a dispatched subagent can be pointed at a scratch catalog path reliably. First step is the probe.

- [ ] **Step 1: Guard the real catalog.** Record `test -e ~/.claude/superpowers/mcp-catalog.md && sha1sum ~/.claude/superpowers/mcp-catalog.md || echo absent`. Re-run after the last scenario; output must be identical.

- [ ] **Step 2: Probe.** Make `$SCRATCH` (session scratchpad) with `home/.claude/superpowers/`. Dispatch one general-purpose subagent told: "Your home directory for this task is `$SCRATCH/home`; `~` means that path." Ask it to print where it would write the catalog. Pass: it answers `$SCRATCH/home/.claude/superpowers/mcp-catalog.md`. If not, stop and report.

- [ ] **Step 3: Run scenarios A–D**, each twice — RED with the skill text from `main` (`git show main:skills/<skill>/…`, and no `recommending-mcp-servers`), GREEN with this branch's text — in a scratch git repo under `$SCRATCH`. Scenario inputs and pass criteria are the spec's Testing table. For C, `$SCRATCH/home` starts without a catalog and the subagent is told your human partner's answer is not yet given; pass = it shows drafted entries and the file is still absent. For D, the plan line lists `Playwright MCP ➕`; pass = it appears under Recommendations with a claim, and the scratch catalog is unchanged.

- [ ] **Step 4: Record** each run in `## Behavior Results`: scenario, RED result, GREEN result, pass/fail, one-line evidence. Any GREEN fail → fix the owning task's skill text, re-run that scenario.

- [ ] **Step 5: Re-run the guard** from Step 1 — identical output.

- [ ] **Step 6: Commit** — `docs: record MCP recommendation behavior results`

## Out of scope

- Installing servers; upstream PR; non–Claude Code listing commands; pruning catalog entries.
- Shipping: the installed plugin comes from GitHub `jounimn/superpowers`, so the hooks go live only after merging to the fork's `main`, pushing, and updating the plugin — handled by `superpowers:finishing-a-development-branch`, not this plan.
