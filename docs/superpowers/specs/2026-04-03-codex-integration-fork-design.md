# Codex Integration Fork — Design Spec

## Problem

The superpowers plugin (`obra/superpowers`) is installed via `claude-plugins-official` and auto-updates. Custom modifications (codex-gate integration) get overwritten. Local skills (`~/.claude/skills/`) can't use the `superpowers:` namespace prefix, so they can't be referenced by other superpowers skills. A project-scoped memory was used as a workaround to remind Claude to invoke codex-gate — this is fragile and doesn't scale across projects.

## Solution

Fork `obra/superpowers` into a private repo (`sskys18/claude-skills`), add codex-gate as a native skill, and modify 3 existing skills to integrate Codex at 3 points in the workflow. Register as a separate marketplace (`codex-integration`) so the fork replaces the official superpowers plugin without renaming.

## Repo Setup

### Git

```
repo:     ~/Mine/claude-skills
origin:   sskys18/claude-skills (private)
upstream: obra/superpowers

branch:   main (upstream + custom modifications)
```

Sync upstream: `git fetch upstream && git merge upstream/main`

### Plugin Identity

| Field | Value |
|-------|-------|
| plugin.json `name` | `superpowers` (already this value upstream — no change needed) |
| marketplace.json `name` | `codex-integration` |
| settings.json enable | `"superpowers@codex-integration": true` |
| settings.json disable | `"superpowers@claude-plugins-official": false` |

`plugin.json` requires zero changes — upstream already has `name: "superpowers"`. This is what gives skills the `superpowers:` namespace prefix. Zero internal cross-reference updates needed.

## Codex Integration Points

### Point 1: Spec Review (brainstorming)

After Claude subagent reviews the design doc, before user reviews.

```
Write design doc
    -> Claude subagent spec review loop (existing, unchanged)
    -> Codex spec review (NEW)
        -> /codex:rescue with the spec doc as input
        -> Independent second opinion on design quality
        -> If issues: fix, re-run Codex review
        -> If approved: proceed
    -> User reviews final spec
    -> writing-plans
```

**Modified file:** `skills/brainstorming/SKILL.md`
- Add step between "Spec review loop" and "User reviews written spec" in the checklist
- Add Codex spec review section describing the flow
- Update the process flow diagram

### Point 2: Execution Delegation (executing-plans, subagent-driven-development)

At each task execution decision point, present Codex as a third option.

```
Per task:
    1. Inline (Claude handles directly)
    2. Subagent (Claude subagent, fresh context)
    3. Codex execute (delegate via /codex:rescue)

    If Codex chosen:
        -> Build detailed task spec (description, files, constraints, acceptance criteria)
        -> Run /codex:rescue with full spec
        -> --background for tasks touching 3+ files
        -> Continue superpowers review cycle on Codex output
```

**Modified files:**
- `skills/executing-plans/SKILL.md` — add `superpowers:codex-gate` to Integration section
- `skills/subagent-driven-development/SKILL.md` — add `superpowers:codex-gate` to Integration section

### Point 3: Final Review Gate (after requesting-code-review)

After Claude's code review, before finishing-a-development-branch. Independent Codex review.

```
requesting-code-review (Claude's review complete)
    -> Codex independent review (NEW)
        -> Assess scope: git diff --shortstat
        -> Standard changes: /codex:review
        -> High-risk (security, auth, data, architecture): /codex:adversarial-review
        -> Present results verbatim (reviewer independence principle)
        -> approve: proceed to finishing-a-development-branch
        -> needs-attention: present findings, user picks which to fix, fix, re-review
    -> finishing-a-development-branch
```

**Modified files:**
- `skills/requesting-code-review/SKILL.md` — add cross-reference: "After review is complete, invoke `superpowers:codex-gate` for independent Codex review before proceeding to `superpowers:finishing-a-development-branch`"
- `skills/finishing-a-development-branch/SKILL.md` — add `superpowers:codex-gate` as prerequisite in Integration section

## Updated Superpowers Flow

```
superpowers:brainstorming
    -> spec review: Claude subagent -> Codex review -> User review    [Point 1]
    |
superpowers:writing-plans
    |
superpowers:using-git-worktrees
    |
superpowers:executing-plans / superpowers:subagent-driven-development
    -> per task: inline / subagent / Codex execute                    [Point 2]
    -> superpowers:test-driven-development (within execution)
    |
superpowers:requesting-code-review (Claude's review)
    |
superpowers:codex-gate (Codex independent review)                     [Point 3]
    |
superpowers:verification-before-completion
    |
superpowers:finishing-a-development-branch
```

## Files Changed (from upstream)

| File | Change Type | Description |
|------|------------|-------------|
| `skills/codex-gate/SKILL.md` | NEW | Codex integration skill — 3 parts: spec review, execution delegation, final review gate |
| `skills/brainstorming/SKILL.md` | MODIFIED | Add Codex spec review step after Claude subagent review, before user review |
| `skills/executing-plans/SKILL.md` | MODIFIED | Add `superpowers:codex-gate` to Integration section |
| `skills/subagent-driven-development/SKILL.md` | MODIFIED | Add `superpowers:codex-gate` to Integration section |
| `skills/requesting-code-review/SKILL.md` | MODIFIED | Add cross-reference to `superpowers:codex-gate` as next step |
| `skills/finishing-a-development-branch/SKILL.md` | MODIFIED | Add `superpowers:codex-gate` as prerequisite |
| `.claude-plugin/marketplace.json` | MODIFIED | Set name to `codex-integration`, update owner |

7 files changed from upstream. `plugin.json` is NOT in this list — it requires no changes.

## Codex-Gate Skill Structure

The `codex-gate` SKILL.md contains all 3 integration points in one file. Each part documents: when it activates, the flow, execution steps, and critical rules.

### Part 1: Spec Review

**When this activates:** During `superpowers:brainstorming`, after the Claude subagent spec review loop passes, before user reviews the spec.

**Execution steps:**
1. Read the spec document path from the brainstorming workflow
2. Build a Codex review task:
   ```
   Task: Review this design spec for completeness, consistency, and implementability.
   
   Context: This spec was written during a brainstorming session and has already
   passed a Claude subagent review. You are providing an independent second opinion.
   
   Files in scope: <spec file path>
   
   Constraints:
   - Do NOT rubber-stamp. Look for gaps that would cause problems during implementation.
   - Focus on: completeness, internal contradictions, ambiguous requirements, scope creep, YAGNI
   - Do NOT suggest stylistic changes or minor rewording
   
   Acceptance criteria:
   - Status: Approved | Issues Found
   - If issues: list each with section reference and why it matters
   ```
3. Run `/codex:rescue` with the review task
4. Present Codex output verbatim to the user
5. If issues found: fix them, re-run Codex review (max 2 iterations, then surface to user)
6. If approved: proceed to user review

**Critical rules:**
- Do NOT tell Codex what Claude's spec review found or what was fixed — reviewer independence
- Do NOT paraphrase or filter Codex output
- If Codex and Claude's reviews contradict, present both findings and let the user decide

### Part 2: Execution Delegation

**When this activates:** Inside `superpowers:subagent-driven-development` or `superpowers:executing-plans`, at each task execution decision point.

**Execution steps:**
1. Present the execution choice:
   ```
   How should I execute this task?
   1. Inline (I handle it directly)
   2. Subagent (Claude subagent — fresh context)
   3. Codex execute (delegate to Codex via /codex:rescue)
   ```
2. If the user picks **Codex execute**:
   - Build a detailed task spec (see Task Spec Format below)
   - Run `/codex:rescue` with the full spec
   - Use `--background` for tasks touching 3+ files
   - Wait for result via `/codex:result`
   - Continue the superpowers review cycle (spec-compliance -> code-quality) on Codex's output
3. If the user doesn't specify, default to existing superpowers behavior (Claude subagent).

**Critical rules:**
- The task spec must be detailed, not a one-liner — Codex has no session context
- Codex output goes through the same review cycle as any other implementer

### Part 3: Final Review Gate

**When this activates:** After `superpowers:requesting-code-review` completes, before `superpowers:finishing-a-development-branch`.

**Execution steps:**
1. Assess scope: `git diff --shortstat`
2. Choose review type:
   - Standard changes -> `/codex:review`
   - High-risk (security, auth, data, architecture) -> `/codex:adversarial-review`
   - User explicitly requests adversarial -> use that regardless of scope
3. Run the review:
   - Small changes (1-2 files): foreground with `--wait`
   - Larger changes: background with `--background`, check `/codex:status`
4. Present results verbatim
5. Gate decision:
   - `approve` -> proceed to `superpowers:finishing-a-development-branch`
   - `needs-attention` -> present findings, user picks which to fix, fix them, re-review (max 2 iterations, then surface to user)
6. Never auto-fix review findings without user confirmation

**Critical rules:**
- Codex review runs in a fresh context — no knowledge of Claude's implementation reasoning
- Do NOT tell Codex what the fix was or why — it sees only task + diff + code
- Present Codex output exactly as received (reviewer independence principle)

### Task Spec Format (for /codex:rescue)

Used by Part 2 (task delegation):

```
Task: <description>
Context: <architecture, related files, current behavior>
Files in scope: <specific paths>
Constraints: <what NOT to do, limits, patterns to follow>
Acceptance criteria: <verification, tests, behavior changes>
Current code: <relevant snippets>
```

### Reviewer Independence Principle

Applies to Part 1 and Part 3: Codex reviews in a fresh context with no knowledge of Claude's reasoning. Do not tell Codex what the implementation rationale was. Present Codex output verbatim — it's the user's second opinion, not Claude's to filter.

## Installation Steps

### Preconditions

- `gh` CLI must be authenticated (`gh auth status`)
- `obra/superpowers` must be accessible (`git ls-remote https://github.com/obra/superpowers.git`)
- `~/Mine/claude-skills/` exists as the current blind copy repo (will be grafted onto upstream history)

### Phase 1: Establish upstream tracking and private origin

The existing `~/Mine/claude-skills/` directory is a blind copy of upstream with this spec file committed (4 commits). Rather than deleting and re-cloning, we graft it onto upstream's git history.

1. Add upstream remote and fetch:
   ```
   cd ~/Mine/claude-skills
   git remote add upstream https://github.com/obra/superpowers.git
   git fetch upstream
   ```
2. Rebase spec commits onto upstream history:
   ```
   git rebase --onto upstream/main --root main
   ```
   This places our spec commits on top of upstream's full history. Resolve any conflicts (upstream files vs blind copy — should be minimal since the copy was identical).
3. Create private repo and set as origin:
   ```
   gh repo create sskys18/claude-skills --private
   git remote add origin git@github.com:sskys18/claude-skills.git
   git push -u origin main
   ```
   Verify remotes: `upstream` → `obra/superpowers`, `origin` → `sskys18/claude-skills`

### Phase 2: Codex integration modifications

4. Create `skills/codex-gate/SKILL.md` from scratch using the content defined in this spec's "Codex-Gate Skill Structure" section (Parts 1, 2, 3). Do not copy from `~/.claude/skills/codex-gate/` — the spec is the source of truth for the final skill content.
5. Modify `skills/brainstorming/SKILL.md`: add Codex spec review step after Claude subagent review, before user review
6. Modify `skills/executing-plans/SKILL.md`: add `superpowers:codex-gate` to Integration section
7. Modify `skills/subagent-driven-development/SKILL.md`: add `superpowers:codex-gate` to Integration section
8. Modify `skills/requesting-code-review/SKILL.md`: add cross-reference to `superpowers:codex-gate` as next step after review
9. Modify `skills/finishing-a-development-branch/SKILL.md`: add `superpowers:codex-gate` as prerequisite
10. Update `.claude-plugin/marketplace.json`: set name to `codex-integration`, update owner (check current value first — upstream may use `superpowers-dev` or another name)

### Phase 3: Publish and switch

11. Commit all changes and push to `sskys18/claude-skills`
12. Add `codex-integration` marketplace to `~/.claude/settings.json` under `extraKnownMarketplaces`:
    ```json
    "codex-integration": {
      "source": {
        "source": "github",
        "repo": "sskys18/claude-skills"
      }
    }
    ```
    Verify this matches the schema by comparing with the existing `openai-codex` entry in `~/.claude/settings.json`.
13. In `~/.claude/settings.json` `enabledPlugins`, set `"superpowers@claude-plugins-official": false`
14. In `~/.claude/settings.json` `enabledPlugins`, add `"superpowers@codex-integration": true`
15. Restart Claude Code and verify skills load with `superpowers:` prefix

## Rollback

If Phase 3 step 18 fails (skills don't load correctly):
1. In `~/.claude/settings.json`, set `"superpowers@claude-plugins-official": true`
2. Remove or set `"superpowers@codex-integration": false`
3. Restart Claude Code — original superpowers restored
4. Debug the fork at `~/Mine/claude-skills/` without blocking work

## Cleanup

After installation is verified working (Phase 3 step 18 passes):
- Remove `~/.claude/projects/-Users-sskys-Mine-codex-bridge/memory/feedback_codex_gate_auto.md`
- Remove `~/.claude/skills/codex-gate/` directory (now lives inside the plugin)
- Update `~/.claude/projects/-Users-sskys-Mine-codex-bridge/memory/MEMORY.md` to remove the codex-gate-auto entry
