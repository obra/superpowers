---
name: context-management
description: >
  Use in long or noisy sessions to persist durable state across session
  boundaries via state.md. Also generates project-map.md when asked to map
  the project. Triggers on: user explicitly asks to "save state", "compress
  context", "map this project", "generate project map", "create project map",
  cross-session handoff needed, or repeated failures indicate context is
  getting stale.
---

# Context Management

## Route first — read this before anything else

| User said | Go to |
|---|---|
| "map this project" / "generate project map" / "create project map" / "update project map" | [Project Map](#project-map) section |
| "save state" / "compress context" / session ending with ongoing work | [Procedure](#procedure) section |
| Starting a task on a project with existing history | Grep `session-log.md` first, then proceed |

Do not default to `state.md` for a map request. Do not default to `project-map.md` for a save-state request.

---

## Purpose

Claude Code automatically compresses context within a session. This skill has two complementary responsibilities:

1. **Cross-session persistence** — `state.md` preserves decisions and progress for the *current task* when a session ends mid-work.
2. **Accumulated project memory** — `session-log.md` builds a searchable history of decisions, rejected approaches, and hard-won facts across sessions. Written manually via this skill — only when there is something worth preserving.

## When to Use

- User explicitly asks to save state or compress context
- Work will continue in a new session and progress must be preserved
- Complex multi-step task has significant accumulated decisions/evidence
- Starting a new task on a project with existing history — grep the log first
- Repeated failures suggest the session has accumulated stale/conflicting context

## Procedure

### At the start of any non-trivial task

Before diving in, grep `session-log.md` for history relevant to the current task.

**Step 1 — Extract keywords.** Take the 2-3 most distinctive nouns from the task description. Avoid generic words ("fix", "update", "file") — use domain nouns ("hook", "auth", "deploy", "staleness").

**Step 2 — Grep each keyword individually first:**
```bash
grep -i "<keyword1>" session-log.md | tail -20
grep -i "<keyword2>" session-log.md | tail -20
```
Check the hit count before reading results. This tells you whether to narrow or widen before committing to any output.

**Step 3 — Adjust based on hit count:**
- **0 hits on all keywords** → fall back to `project-map.md` Critical Constraints. Relevant history may have been promoted there instead of staying in the log. If still nothing, proceed without history.
- **1–10 hits** → read them. Surface past decisions, rejected approaches, and constraints.
- **>10 hits on one keyword** → narrow with a second term: `grep -i "<kw1>" session-log.md | grep -i "<kw2>" | tail -20`

**Step 4 — Surface what matters.** If relevant entries are found, state them explicitly before proceeding: what was decided, what was rejected, what constraints apply. Don't silently absorb them — make them visible so the user can confirm or override.

### When saving state (explicit invocation)

1. Extract durable artifacts only:
   - Approved design decisions
   - Active plan tasks and their status
   - Verified facts/evidence
   - Open questions/risks

   **state.md vs plan.md:**
   - `plan.md` (or `docs/.../plans/*.md`): the authoritative task list with checkboxes. Owned by `executing-plans`. Updated as tasks complete.
   - `state.md`: a session-boundary snapshot of *where you are* in the plan — current task, blockers, what's verified. It references the plan but does not duplicate the task list.
   
   If a plan exists, state.md should say "Executing plan at docs/.../plan.md, currently on Task 3" — not copy the full task list.

2. Write `state.md` at the project root with concise sections:
   - `Current Goal`
   - `Decisions`
   - `Plan Status`
   - `Evidence`
   - `Open Issues`

3. **Check for superseded entries before appending.** Grep `session-log.md` for 2-3 keywords from the current decision:
   ```bash
   grep -i "<keyword>" session-log.md
   ```
   Read any matching `[saved]` entries and ask: does the new decision *directly contradict* an old one? If yes, append `[superseded by YYYY-MM-DD]` to the old entry's header line — do not delete it. If the old entry is merely related but not contradicted, leave it unchanged. This is a judgment call, not a mechanical keyword match.

4. Append a `[saved]` entry to `session-log.md`:

**What belongs here vs state.md:**
- `session-log.md [saved]`: permanent decisions, anti-patterns to avoid, carry-forward open items
- `state.md`: active task status, in-progress plans, checklists, version bump readiness — anything that will be resolved soon

**Never include in a [saved] entry:**
- Test results or verification confirmations ("11/11 tests pass")
- Task checklists, file changelogs, or release notes → use `state.md`
- "How it works" walkthroughs → read the code
- Speculative analysis not approved for implementation → use a design doc in `docs/`
- One-time confirmations ("file deleted", "folder removed")
- Newly discovered permanent architectural constraints → add to `project-map.md` Critical Constraints instead

**Hard limits per component — enforce while writing, not after:**
- Goal: 1 line, ≤15 words
- Decisions: ≤5 bullets for multi-subsystem sessions, ≤3 for single-topic. Each bullet: decision + one-sentence why, ≤25 words total. No prose, no rationale beyond the why.
- Rejected: ≤3 bullets, ≤15 words each. What to avoid — not the full story of why it failed.
- Open: ≤2 items, ≤12 words each.

If a decision doesn't fit in 25 words, the explanation belongs in a design doc. Cut the explanation, not the decision.

Total entry backstop: 250 words / 1500 chars. If exceeded, a bullet violated its limit — find it and cut it. Typical single-topic sessions should target ~120 words; the higher cap exists for multi-subsystem sessions that genuinely touched 5+ areas.

```markdown
## YYYY-MM-DD HH:MM [saved]
Goal: <one line>
Decisions:
- <what was chosen and the one-sentence why — not how it works>
Rejected: <what NOT to try, one line each — the anti-pattern knowledge>
Open: <carry-forward items only>
```

5. After appending the `[saved]` entry, update the stop-hook marker so the decision-log reminder resets:
   ```bash
   node -e "require('fs').writeFileSync(require('path').join(process.env.HOME||process.env.USERPROFILE||'.', '.claude','hooks-logs','last-saved-entry.txt'), new Date().toISOString())"
   ```
   This prevents the stop hook from re-firing the decision-log reminder on every subsequent stop in the same session.

6. In a new session, read `state.md` first to restore task context, then grep `session-log.md` for relevant history.

## session-log.md Format and Maintenance

The log contains a single entry type:

- **[saved]** — written by this skill when explicitly invoked: full decision record including goals, rationale, rejected approaches, and key facts.

**File management:**
- Lives at the project root alongside `CLAUDE.md` and `package.json`
- Keep under 200 entries — prune entries older than 6 months when it exceeds this
- When a decision is permanently superseded (e.g., the approach was replaced), mark it rather than deleting: append `[superseded by YYYY-MM-DD]`
- Do NOT log trivial sessions (the stop hook already filters these out)

**For cross-project recall** (finding how a similar problem was solved in a different codebase): `session-log.md` is per-project and keyword-searchable only. Cross-project recall is outside the scope of this system.

## Project Map

`project-map.md` is the semantic memory layer — it captures the project's structure, key file purposes, and critical non-obvious constraints so that future sessions can orient without re-globbing or re-reading known files. Generate it once; update it when the project changes.

### When to generate or update

- User says "map this project", "generate project map", or "update project map"
- First time setting up memory on a new project
- After a major refactor where many files moved or changed purpose

### Generation procedure

1. **Check for git:**
   ```bash
   git rev-parse --git-dir 2>/dev/null
   ```
   - If git exists → record `git rev-parse HEAD` as the staleness hash.
   - If git does NOT exist → offer: *"No git repository detected. Shall I run `git init`? It enables precise staleness tracking for `project-map.md` — creates a `.git` folder, touches none of your files. If you'd prefer not to, I'll fall back to file timestamp comparison instead, which works fine but is slightly less precise."*
     - User confirms → run `git init --quiet`, then proceed with git hash.
     - User declines → use generation timestamp as the staleness marker.

2. **Map the structure:** Glob the project, identify the top-level directories and their purpose. Do not enumerate every file — summarise by directory.

3. **Document key files:** For each file that is load-bearing, non-obvious, or frequently referenced, write one line describing what it does and why it matters. Aim for 10–20 entries. Skip files whose purpose is obvious from their name.

4. **Capture critical constraints:** The highest-value section. These are non-obvious facts that are not visible in the code itself — quoting rules, platform differences, version sync requirements, things that caused bugs before. Pull these from `session-log.md` `[saved]` entries and from `known-issues.md` if they exist.

5. **Identify hot files:** From `session-log.md` history, list the files most frequently appearing in `Files:` lines. These are the ones most likely to need freshness checks on future sessions.

6. **Write `project-map.md` at the project root** — same level as `CLAUDE.md` and `package.json`, never in `docs/` or any subdirectory. The session-start hook looks for it with `ls project-map.md 2>/dev/null` from the project root — if it's anywhere else, the hook cannot find it and every future session loses the map. Use this format:

```markdown
# Project Map
_Generated: YYYY-MM-DD HH:MM | Git: <short-hash> | (or: Staleness: timestamps)_

## Directory Structure
<dir>/ — <one-line purpose>
<dir>/ — <one-line purpose>

## Key Files
<path> — <what it does and why it matters>
<path> — <what it does and why it matters>

## Critical Constraints
- <non-obvious fact that would cost time to rediscover>
- <non-obvious fact that would cost time to rediscover>

## Hot Files
<path>, <path>, <path>
```

### Update procedure

When the staleness check in the entry sequence flags changed files:
1. Re-read only the flagged files.
2. Update their entries in the Key Files section.
3. Update the git hash / timestamp in the header.
4. If any new critical constraints were discovered this session, add them.

Keep `project-map.md` under 150 lines. If it grows beyond that, it is not a map — it is documentation. Prune file entries for things that are now obvious from context.

## Guardrails

- Do not drop user-provided constraints.
- Do not rewrite requirements; preserve intent.
- If uncertain whether old context matters, keep a short reference in `Open Issues`.
- Keep `state.md` under 100 lines — if it's longer, it's not compressed enough.
