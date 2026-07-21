# Superpowers Team Template — Design Spec

**Date:** 2026-07-21
**Status:** Approved for planning
**Author:** rbh227 (with Claude)
**Upstream:** Built on [Superpowers](https://github.com/obra/superpowers) by Jesse Vincent (obra), MIT.

---

## Problem

Teams adopting Claude Code have wildly uneven experience. Some members have used it
for months; others just got access. New hires are expected to "know how to work with
Claude" but in reality that skill takes time and knowledge to build. The current
options — courses, classes, tribal knowledge — are slow and don't produce a *unified*
way of working. A team ends up with N members each using Claude differently.

## Goal

A repository a team **clones once** and turns into a **unified, team-tailored Claude
Code workflow** that every member shares — and that a brand-new member learns by
*using guided tools*, not by taking a course. The repo is built directly on the
Superpowers methodology and gives full credit to it.

Explicit non-goal: this is **not** a library of finished skills, and **not**
documentation *about* Superpowers. It is scaffolding + a generator + a teaching layer
on top of the real Superpowers engine.

## Success criteria

- A team leader can go from `git clone` to a published, team-specific workflow in an
  afternoon, without writing skill internals by hand.
- A new member installs two plugins, runs `/getting-started`, and is working inside the
  team's shared flow the same day.
- Members extend the system (`/new-skill`, `/new-connector`, `/new-workflow`) and learn
  what each artifact *is* while building it.
- The Superpowers engine stays byte-for-byte upstream, so the leader can pull upstream
  improvements with one command.
- Zero duplicated skills, commands, or hook plumbing between engine and team layer.

---

## Architecture

One repo, one private marketplace, **two plugins**.

```
superpowers-team-template/
├── skills/                 ← Superpowers engine — BYTE-FOR-BYTE upstream (clean sync)
├── hooks/                  ← engine bootstrap — untouched
├── scripts/
│   └── sync-engine.sh      ← leader's "pull upstream skills+hooks + bump version"
├── .claude-plugin/
│   └── marketplace.json    ← lists 2 plugins: superpowers + team-workflow
├── LICENSE                 ← MIT, Jesse Vincent (kept, unmodified)
├── README.md               ← rewritten: credits Superpowers, explains the template
├── CLAUDE.md               ← rewritten: team-facing, not superpowers' contributor guide
├── docs/team-template/     ← THIS project's own specs/plans (survives house-cleaning)
└── team/                   ← the team plugin (source: ./team)
    ├── .claude-plugin/plugin.json   ← name renamed by /team-setup (placeholder: team-workflow)
    ├── intake/             ← what we do / use / test / style — written by /team-setup
    ├── skills/             ← generated + hand-written TEAM skills
    ├── docs/               ← committed internal documentation (a connector target)
    ├── generators/         ← /new-skill, /new-connector, /new-workflow, /getting-started
    ├── workflow.md         ← generated canonical team flow (composition)
    └── CLAUDE.md           ← generated team conventions / style / glossary

(personal skills route OUT to ~/.claude/skills/ — follow the person, never committed here)
```

### Why two plugins, not one

- **Clean upstream sync.** The engine (`skills/`, `hooks/`) is never modified, so pulling
  new Superpowers releases is a scoped checkout, never a conflict-prone merge.
- **Legible boundary (pedagogy).** A member opening the tree immediately sees "here is the
  engine, here is OUR team layer." The lesson "here's how you extend it" is only legible
  if the boundary is visible.
- **Native composition.** Two plugins is the idiomatic Claude Code way to compose. The
  team plugin's skills auto-trigger and expose as `/<team>:<skill>` on the same rails as
  the engine — no merging into the engine's folder required.

### Why nothing is duplicated

- **Skills:** the team plugin never re-implements brainstorming/planning/TDD/etc. The
  generated `workflow.md` is a *composition* that names engine skills in order and adds
  team skills only for genuine gaps.
- **Commands:** Superpowers ships no `commands/` dir — its slash entries ARE its skills
  (`/superpowers:<skill>`). Team skills get `/<team>:<skill>` for free. The generators
  (`/new-skill` …) are new, not collisions.
- **Hooks:** team skills auto-trigger through the engine's existing `session-start`
  bootstrap (good frontmatter `description` = auto-invocation). No second hook is shipped.
  Always-on team conventions live in the generated `team/CLAUDE.md`, not a duplicated hook.

---

## The core loop

1. **Intake** — Leader runs `/team-setup`. Claude interviews them Superpowers-style (one
   question at a time), writes structured markdown into `team/intake/*` (`what-we-do.md`,
   `what-we-use.md`, `our-conventions.md`, `testing.md`, `connectors.md`), and renames the
   team plugin from the `team-workflow` placeholder to the org's choice (rewrites
   `plugin.json` + `marketplace.json`). Intake files stay plain markdown — hand-editable,
   re-runnable.

2. **Generate** — Leader runs the workflow generator. It reads all of `team/intake/*` and:
   - **composes** `team/workflow.md`: the canonical team flow, ordered, each step mapped to
     an existing engine skill where one fits;
   - **gap-analyzes** the described flow against the Superpowers methodology and *proposes*
     improvements (missing review step → wire in `requesting-code-review`; uncovered
     staging smoke test → scaffold a thin `staging-smoke` team skill stub) — presented for
     approval, never auto-fabricated;
   - writes `team/CLAUDE.md` (conventions/style/glossary distilled from intake);
   - writes connector config (MCP entries + doc-pointer files) from "what we use";
   - writes a thin `team-workflow` trigger skill so the shared flow actually *fires* when a
     member starts work, instead of being a doc nobody opens.

   Governing principle: **compose and scaffold, never hallucinate.** Reuse engine skills to
   the hilt; only add team skills for real gaps; get approval before writing.

3. **Publish** — Leader commits and pushes. Members run:
   ```
   /plugin marketplace add <team-git-url>
   /plugin install superpowers@<team-marketplace>
   /plugin install <team-name>@<team-marketplace>
   ```
   Both plugins come from the **one team marketplace**, so the **engine version is pinned by
   the team** — everyone runs the same Superpowers, which is the whole point of "unified."

4. **Work & extend** — Members work inside the shared flow. They extend it anytime:
   - `/new-skill` — asks "team or personal?", teaches skill anatomy *as it interviews*
     (trigger description, body, red-flags), writes to `team/skills/` (committed) or
     `~/.claude/skills/` (personal, global to that member).
   - `/new-connector` — "doc, MCP tool, or convention?" → wires the right kind, explaining
     each as it goes.
   - `/new-workflow` — composes engine + team skills into a workflow.
   - `/getting-started` — teach-only mindset piece: how to work with Claude Code
     effectively, when to brainstorm vs plan, why skills exist. Points to real Superpowers.

---

## Key decisions (resolved during brainstorming + grill)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Team layer location | Dedicated `team/` namespace (not interleaved into `skills/`) |
| 2 | Consumption model | Plugin-first hybrid: plugin for auto-trigger everywhere; repo clone for leader's intake/generation |
| 3 | Skill discovery | `team/` is its own second plugin in the same repo/marketplace |
| 4 | Personal vs team scope | Team → committed `team/skills/`; personal → `~/.claude/skills/`; one generator routes by asking |
| 5 | Intake mechanism | Interactive `/team-setup` skill writes the files; templates are the schema |
| 6 | Generator behavior | Assembler **+ gap-analyzer** (opinionated, approval-gated, never fabricates) |
| 7 | Teaching delivery | Teach-while-doing generators + one standalone `/getting-started` mindset doc |
| 8 | Engine install source | One team marketplace, **team-pinned** engine version |
| 9 | Declutter scope | Clean house, Claude-Code-first; engine `skills/`+`hooks/` stay pristine |
| 10 | Upstream sync | Scoped-checkout `scripts/sync-engine.sh` (fetch → checkout `skills hooks` → bump → commit) |
| 11 | Naming | Template: "Superpowers Team Template"; team plugin placeholder: `team-workflow` |

### House-cleaning (decision 9b) — what goes / stays

- **Keep pristine:** `skills/`, `hooks/` (engine — required for clean sync), `LICENSE`.
- **Replace:** top-level `README.md` and `CLAUDE.md` with team-facing versions that credit
  Superpowers up front.
- **Remove:** superpowers' own dev history (`docs/superpowers/plans`, `docs/superpowers/specs`),
  `CODE_OF_CONDUCT.md`, `RELEASE-NOTES.md`, `.github/FUNDING.yml`, the "We're Hiring" content,
  and non-Claude-Code harness plumbing (`.pi`, `.opencode`, `.cursor-plugin`, `.kimi-plugin`,
  `.codex-plugin`, `GEMINI.md`, `AGENTS.md`, `gemini-extension.json`). Other-harness support
  becomes a documented add-back, not a default.
- **This project's own planning docs** live in `docs/team-template/` so they survive the
  removal of `docs/superpowers/*`.

### Attribution (non-negotiable)

- `LICENSE` (MIT, Jesse Vincent) kept unmodified; engine `plugin.json` author fields kept.
- README leads with: *Built on [Superpowers](https://github.com/obra/superpowers) by Jesse
  Vincent — MIT. This repo is a team-onboarding template layered on top; all workflow
  methodology is theirs.*
- `/getting-started` points members to the upstream project.

---

## Sync mechanism (`scripts/sync-engine.sh`)

Deliberate, reviewable, never automatic. Roughly:
```
git fetch upstream
git checkout upstream/<tag-or-ref> -- skills hooks
# bump engine version in .claude-plugin/marketplace.json
git commit -m "Sync engine to <tag>"
```
Only ever touches `skills/` + `hooks/`, so the files removed in house-cleaning can never be
resurrected, and the whole team stays pinned to one engine version (decision 8).

---

## Out of scope for v1

- Multi-harness support for the *team* plugin (Claude Code first; add-back documented).
- Automatic/scheduled upstream sync (leader runs it deliberately).
- A GUI or web onboarding flow.
- Publishing to any public marketplace (teams use private git marketplaces).

## Open questions for the implementation plan

- Exact intake file set and their internal schema/prompts.
- The rename operation's precise edits (`plugin.json`, `marketplace.json`, any references).
- How `/new-connector`'s "doc" path handles committed `team/docs/` vs external MCP sources.
- Whether `/getting-started` is a skill, a doc, or both.
</content>
</invoke>
