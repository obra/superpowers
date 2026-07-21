# Superpowers Team Template

**Onboard your whole team to Claude Code — working the same way — in an afternoon.**

<p align="center">
  <img src="assets/readme/1-hero.png" alt="How the Team Template fits together: your team on top, a generated Team Layer in the middle, the frozen Superpowers engine at the base" width="720">
</p>

> **Built on [Superpowers](https://github.com/obra/superpowers) by Jesse Vincent (obra) — MIT.**
> This repo is a team-onboarding template layered on top. All of the workflow
> methodology — brainstorming, planning, TDD, subagent-driven development,
> review — is Superpowers' work. Go star the original.

---

## The one-sentence mental model

**You use Superpowers exactly as you always would.** The template adds a thin
**team layer** on top that customizes and documents that same workflow for how
*your* team actually works. It doesn't replace the Superpowers flow — it points
it at your team.

If you already know Superpowers, you already know how to use this. The rest is
just setup.

---

## Architecture — two plugins, one private marketplace

Your team clones **one repo**. Inside it are two plugins:

- **`superpowers`** — the engine, kept **byte-for-byte upstream**. You never
  edit it; you sync it.
- **`team-workflow`** (you rename it to your team) — your intake answers, the
  workflow generated from them, your connectors, and any team skills you build.

<p align="center">
  <img src="assets/readme/2-architecture.png" alt="Two plugins in one private marketplace. The superpowers plugin holds skills/ and hooks/, synced from upstream and never edited. The your-team plugin holds intake, generators, and generated skills. sync-engine.sh only touches the engine." width="900">
</p>

The dividing line is the whole point: `./scripts/sync-engine.sh` pulls new
Superpowers releases into the engine and **never touches your team's work**.
Upstream improvements and your customizations never collide.

---

## Two lifecycles

There are exactly two ways anyone interacts with this template: a leader sets it
up **once**, and every member uses it **every day**.

### 1. Setup — run once, by the team leader

<p align="center">
  <img src="assets/readme/3-setup-lifecycle.png" alt="Setup flow: /team-setup interviews the leader and fills team/intake/, then /generate-workflow composes engine skills into team/workflow.md, team/CLAUDE.md, connectors, and a trigger skill, which you commit and push." width="900">
</p>

`/team-setup` interviews you one question at a time and writes your answers into
`team/intake/*.md`. Then `/generate-workflow` turns that intake into your team's
actual working system — composing existing engine skills wherever they fit and
scaffolding thin stubs (never hallucinated skills) where something's genuinely
missing. Review it, commit, push. Done.

### 2. Daily use — every member, every task

<p align="center">
  <img src="assets/readme/4-daily-lifecycle.png" alt="Daily flow: a member describes their goal, the team trigger skill routes them into team/workflow.md, and the Superpowers engine skills auto-fire in order: brainstorm, plan, test-driven implementation, review, ship." width="900">
</p>

A member describes a goal in plain language. The team trigger skill points them
at `team/workflow.md`, and the Superpowers engine skills auto-fire from what they
said — brainstorm → plan → TDD → review → ship. **No commands to memorize.** It's
the workflow you'd use anyway, aimed at how your team works.

---

## A worked example — the "Company Z" dev team

Meet a realistic team, so the two lifecycles above stop being abstract.

**Company Z's platform team, 9 developers.** Their institutional knowledge lives
in **Confluence** — a deploy runbook, a "how we cut a release" page, coding
standards, an incident playbook. Their Claude Code adoption is uneven: **Dana and
Sam** have used it for months and have built up personal skills and sharp habits;
**Priya** (the lead) uses it some; **Marcus** got access last week and is still
finding his feet. Everyone works slightly differently, and none of that hard-won
practice is shared. That's the problem this template exists to fix.

### Act 1 — Priya sets it up (once)

Priya forks the template privately, clones it, opens it in Claude Code, and runs:

```
/team-setup
```

It renames the plugin to `platform-z` and then **interviews her one question at a
time** — how work flows from idea to shipped, what stack they use, their review
rules, how they test before merge. She's not writing skills; she's answering
questions, and her answers land in `team/intake/*.md`.

When the interview reaches connectors, she wires their Confluence in so Claude can
actually *use* it:

```
/platform-z:new-connector
> Is this a doc, MCP tool, or convention?  →  MCP tool (Confluence)
```

Now Claude can **read the team's Confluence runbooks on demand** — the release
page, the deploy runbook — at the moment a task needs them, instead of Priya
pasting stale snapshots. She also records their "squash-merge only, PR needs one
approval" rule as an always-on convention.

Then:

```
/platform-z:generate-workflow
```

This reads the intake and **composes** their flow out of existing Superpowers
engine skills — mapping "shape the idea" → `brainstorming`, "turn it into a plan"
→ `writing-plans`, "build it" → `test-driven-development`, "before merge" →
`requesting-code-review`, and so on — and writes `team/workflow.md`. Where the
intake had a **gap** (Company Z described no explicit review step), it doesn't
silently patch it: it *proposes* wiring in `requesting-code-review` and waits for
Priya's yes. She approves, reviews the result, and:

```
git commit -am "platform-z workflow" && git push
```

Company Z now has one shared, documented workflow. Total time: an afternoon.

> **What's real vs. aspirational.** Today `/team-setup` is an *interview*, and
> Confluence is wired in as a *connector Claude reads on demand* — it captures the
> knowledge in people's heads and makes the wiki live. It does **not** yet crawl
> every Confluence page and git-history commit and auto-draft the workflow with no
> questions asked. That deeper "point it at our wiki and our repo history and let
> it synthesize everything" is the natural next connector to build on top of this
> — the interview + live-connector approach is what ships today.

### Act 2 — Marcus's first real cycle (day 6 on the job)

Marcus picks up ticket `PLZ-482: add rate-limiting to the auth endpoint`. He's new
to Claude Code, so he does the only thing he needs to:

```
/getting-started      # 3-minute orientation, points him at team/workflow.md
```

Then he just describes the task — no command incantation:

> "I need to add rate-limiting to our auth endpoint, ticket PLZ-482."

From here the workflow carries him, and he watches it happen:

1. **Brainstorm** (`superpowers:brainstorming` auto-fires) — Claude asks whether
   he wants per-IP or per-account limits, pulls **Company Z's API conventions
   straight from Confluence** via the connector Priya wired, and lands on an
   approach.
2. **Plan** (`superpowers:writing-plans`) — writes a short plan; Marcus approves.
3. **Build, test-first** (`superpowers:test-driven-development`) — failing test
   for "6th request in a minute is rejected" → implementation → green.
4. **Review** (`superpowers:requesting-code-review`) — the step Priya wired in
   during setup; Marcus gets review feedback before he ever opens a PR.
5. **Ship** — squash-merge, one approval, exactly the convention Priya recorded.

Marcus didn't need to *know* Company Z's standards — the workflow and the
connectors knew them for him. He shipped his first ticket the same way Dana would.

### Act 3 — Dana promotes a personal skill to the whole team

Dana (the months-long veteran) has a personal skill she wrote ages ago for
generating their DB-migration boilerplate the way Company Z likes it. It's been
helping only her. Now she shares it:

```
/platform-z:new-skill
> team or personal?  →  team
```

The skill interviews her, teaches the anatomy as it goes, and writes the result to
`team/skills/` — committed, shared, auto-triggering for **everyone**. The veterans'
accumulated edge stops being private. Next time Marcus touches a migration, Dana's
skill fires for him too.

That's the whole arc: **Priya captures the team once, connectors make the wiki
live, the shared workflow levels Marcus up to the team's standard on day 6, and
Dana's private expertise becomes everyone's.**

---

## Use cases (quick reference)

<details open>
<summary><b>1. A leader sets up the team</b></summary>

```
# in the cloned repo, in Claude Code
/team-setup            # name the plugin, answer the interview
/<your-team>:generate-workflow   # review the proposed workflow, approve gap fixes
git commit && git push # your team now shares one workflow
```
</details>

<details>
<summary><b>2. A new member's first day</b></summary>

```
/plugin marketplace add <your-team-repo-url>
/plugin install superpowers@<your-marketplace>
/plugin install <your-team-name>@<your-marketplace>
/getting-started       # orientation: the mindset + a pointer to team/workflow.md
```
Then just describe what you want to build. Skills fire on their own.
</details>

<details>
<summary><b>3. A member extends the toolkit</b></summary>

| You want to add… | Run | It produces |
|---|---|---|
| A reusable technique | `/new-skill` | a `SKILL.md` (team-shared or personal) |
| An ordered multi-step flow | `/new-workflow` | a workflow composed of engine + team skills |
| A doc, MCP tool, or convention | `/new-connector` | wired-in context the agent will use |

Each of these **teaches while it builds** — you finish understanding the anatomy,
not just holding a generated file.
</details>

<details>
<summary><b>4. Keeping the engine current</b></summary>

```
./scripts/sync-engine.sh <upstream-ref>
```
Pulls a new Superpowers release into `skills/` + `hooks/` and bumps the pinned
version. Nothing under `team/` is touched — your customizations are safe.
</details>

---

## Quickstart

**Leader:** fork this repo privately → clone → open in Claude Code → `/team-setup`
→ generate the workflow → commit & push.

**Member:** add the marketplace, install both plugins, run `/getting-started`.

(Both are spelled out with commands in the Use cases above.)

---

## Repo layout

| Path | What it is | Edit it? |
|---|---|---|
| `skills/`, `hooks/` | The Superpowers engine | **No** — synced from upstream |
| `team/intake/` | Your team's answers (from `/team-setup`) | Via the skill, or by hand |
| `team/skills/` | Generators + your generated/authored team skills | Yes |
| `team/workflow.md` | Your canonical flow (generated) | Regenerate or hand-tune |
| `scripts/sync-engine.sh` | Pulls upstream engine + bumps version | Run it |
| `docs/team-template/` | This project's specs and plans | Yes |

---

## Regenerating the diagrams

The four diagrams above are rendered from editable HTML sources in
`assets/readme/src/` via headless Chrome (the hand-drawn look is baked into the
PNGs so it renders anywhere):

```
bash assets/readme/src/render.sh
```

---

## Credit

This template stands entirely on **[Superpowers](https://github.com/obra/superpowers)**
by Jesse Vincent (obra). See `LICENSE` (MIT). Every engine skill you'll use —
`brainstorming`, `writing-plans`, `test-driven-development`, and the rest — is
their work.
