# Superpowers-Optimized: Comprehensive Audit & Suggestions

> **Status: RESOLVED** — All bugs listed in Part 1 have been fixed. This document is retained as a historical record of the initial audit.

> Audit performed 2026-03-08 by Claude Opus 4.6
> Compared against original: https://github.com/obra/superpowers (v4.3.1, 14 skills)
> Audited version: superpowers-optimized v4.3.1-custom.1 (25 skills) → now v1.0.0

---

## Part 1: Bugs & Issues Found

### BUG 1: `frontend-craftmanship` Name Mismatch (Critical)

- **Directory name:** `skills/frontend-craftmanship/`
- **Frontmatter `name:`** `professional-frontend-craftsmanship`
- **Description says:** "invoke directly via /frontend-craftmanship"
- **`using-superpowers` routing says:** `frontend-craftmanship`

The frontmatter name does not match the directory name. Claude Code uses the frontmatter `name` for skill resolution. This means:
- `/frontend-craftmanship` will NOT find this skill (it looks for `professional-frontend-craftsmanship`)
- Skill invocations via `superpowers-optimized:frontend-craftmanship` may fail
- The Skill tool invocation from `executing-plans` and `subagent-driven-development` references `frontend-craftmanship` but the registered name is `professional-frontend-craftsmanship`

**Fix:** Change the frontmatter `name:` to `frontend-craftmanship` to match directory and all cross-references. Or rename everything to `frontend-craftsmanship` (correct English spelling — note the missing 's').

Additionally: "craftmanship" is a misspelling. The correct word is "craftsmanship". Consider renaming the directory and all references to `frontend-craftsmanship`.

---

### BUG 2: Brainstorming vs Token-Efficiency Contradiction (High)

- **`token-efficiency`** (line 17): "One question per clarification turn — collect all unknowns and ask them together, not one at a time"
- **`brainstorming`** (line 22): "Ask clarifying questions one at a time."

These directly contradict each other. When `brainstorming` is active (which always co-exists with `token-efficiency`), the agent receives conflicting instructions.

**Fix:** Align brainstorming to say: "Ask all clarifying questions together in a single turn. Use multiple-choice format where possible to reduce round trips."

---

### BUG 3: Context Management Trigger Threshold Inconsistency (Medium)

- **Description (frontmatter):** "sessions exceeding 8 turns"
- **Body (line 17):** "Session has many turns (default: >10)"

Which threshold applies? 8 or 10?

**Fix:** Pick one. Recommend 8 (from description) since earlier compression is cheaper than late compression.

---

### BUG 4: plugin.json Attribution Still Points to Original (Medium)

```json
"author": { "name": "Jesse Vincent", "email": "jesse@fsck.com" },
"homepage": "https://github.com/obra/superpowers",
"repository": "https://github.com/obra/superpowers"
```

This is a fork with significant changes. The author, homepage, and repository should reflect the fork's actual location. At minimum add an `originalAuthor` field and update the homepage/repository to your repo.

**Fix:** Update plugin.json with your name/repo while crediting Jesse Vincent as original author.

---

### BUG 5: TaskCreate/TaskUpdate/TaskList Don't Exist (Medium)

Multiple skills reference `TaskCreate`, `TaskUpdate`, and `TaskList` as if they're Claude Code tools:
- `brainstorming` (lines 33-48)
- `writing-plans` (lines 43-102)
- `subagent-driven-development` (lines 37-49)
- `executing-plans` (lines 31-54)

These are NOT real Claude Code tools. The actual tool is `TodoWrite`. These YAML blocks showing `TaskCreate:` / `TaskUpdate:` syntax will confuse the agent and produce tool-not-found errors.

**Fix:** Either:
1. Remove the native task sections entirely (simpler), or
2. Rewrite them to use the actual `TodoWrite` tool syntax

---

### BUG 6: Unix-Only Commands on Windows User (Low-Medium)

The E2E Process Hygiene section in `subagent-driven-development` uses:
- `pkill -f "<service-pattern>"`
- `lsof -i :<port>`
- `pgrep -f "<service-pattern>"`

These don't exist on Windows. The `find-polluter.sh` bash script also won't work natively.

**Fix:** Add platform-aware alternatives or note that these are Unix examples. For Windows: `taskkill /F /IM`, `netstat -ano | findstr`, etc.

---

### BUG 7: `using-superpowers` "Never Skip" vs `adaptive-workflow-selector` "Micro Tasks Skip" (Low)

- `using-superpowers` description: "Do NOT skip this skill even if the task seems simple."
- `adaptive-workflow-selector` body: "Micro tasks (typo fix, single variable rename, 1-line config change): Skip this selector entirely. Just do it."

The escape hatch exists inside the selector, but the entry point says never skip. If the agent obeys the entry point strictly, it must invoke the selector even for a typo fix, only to be told to skip. Wasteful but functional — however, it creates ambiguity.

**Fix:** Add a micro-task exemption directly in `using-superpowers`: "Exception: micro tasks (typo fix, 1-line change) can skip the entry sequence."

---

### ISSUE 8: Version Numbering (Minor)

`4.3.1-custom.1` implies a minor patch on the original. This fork has 11 entirely new skills, restructured routing, and a different philosophy. It deserves its own major version (e.g., `1.0.0` of "superpowers-optimized").

---

### ISSUE 9: No CLAUDE.md in the Plugin Repo (Minor, but please do create one AFTER fixing all the issues).

Ironic: a plugin that includes a `claude-md-creator` skill doesn't have its own `CLAUDE.md`. Adding one would help contributors and the agent itself understand the plugin's conventions.

---

## Part 2: Flow Analysis — Complete Walkthrough

### Flow A: "Build me a new feature" (Full path)

1. `using-superpowers` triggers (BLOCKING)
2. `token-efficiency` activates silently
3. `adaptive-workflow-selector` classifies as `full`
4. Routes to `brainstorming`
5. Brainstorming produces design doc at `docs/plans/YYYY-MM-DD-<topic>-design.md`
6. Hands off to `writing-plans`
7. Writing-plans produces plan at `docs/plans/YYYY-MM-DD-<feature>.md`
8. Offers choice: `subagent-driven-development` (same session) or `executing-plans` (separate session)
9. Execution skill runs tasks with verification
10. `verification-before-completion` gates success claims
11. `finishing-a-development-branch` closes the branch

**Verdict:** Flow is clean and logical. No dead ends. One concern: steps 4-8 involve 4 sequential skill invocations before any code is written. For an experienced developer who knows what they want, this is frustrating overhead, can this be optimized while retaining the clean flow and logic without dead ends?

### Flow B: "Fix this bug" (Debugging path)

1. `using-superpowers` triggers
2. `adaptive-workflow-selector` → lightweight or full depending on scope
3. Routes to `systematic-debugging`
4. After root cause found, routes to `test-driven-development`
5. `verification-before-completion` gates the fix claim

**Verdict:** Clean flow. The 4-phase debugging process is solid.

### Flow C: "Just rename this variable" (Micro task)

1. `using-superpowers` triggers (the description says MUST)
2. `adaptive-workflow-selector` says "micro tasks: skip"
3. Agent does the rename

**Verdict:** Works but wasteful — 2 skill invocations for a rename. See Bug 7.

### Flow D: Subagent-Driven Development

1. Plan is loaded
2. `using-git-worktrees` creates isolated workspace
3. For each task: implementer subagent → spec review → code quality review
4. Two-stage review gate is excellent
5. `finishing-a-development-branch` at end

**Verdict:** Most sophisticated flow. The prompt templates (`implementer-prompt.md`, `spec-reviewer-prompt.md`, `code-quality-reviewer-prompt.md`) are critical — they're the actual prompts sent to subagents. This is the crown jewel of the framework.

### Flow E: Context gets long

1. `token-efficiency` detects >8 turns (or >10 per body — see Bug 3)
2. `context-management` compresses to `state.md`
3. Session continues with reduced context

**Verdict:** Good in theory. In practice, context compression in Claude Code is handled automatically by the system. The manual `state.md` approach is useful for cross-session persistence but redundant for in-session compression. So as context compression in Claude Code is handled automatically by the system, do we really need this? The whole point of this was to waste less tokens and lower usage before hitting usage limits, maybe we can optimize it? Or maybe we should remove it, your call.

---

## Part 3: Honest Comparison — Original vs Optimized

### What the Optimized Version Does Better

| Improvement | Impact |
|---|---|
| **Token efficiency** — Skills are 50-70% shorter. Less context consumed per invocation. | High |
| **Explicit routing architecture** — `using-superpowers` → `adaptive-workflow-selector` → skill chain is clearer than the original's "check all skills" approach | High |
| **Added `adaptive-workflow-selector`** — Prevents full ceremony for simple changes | High |
| **Added `context-management`** — Addresses real problem of context bloat | Medium |
| **Added `token-efficiency`** — Codifies good LLM-interaction patterns | Medium |
| **Added specialist skills** — `senior-engineer`, `security-reviewer`, `testing-specialist` add depth | Medium |
| **Cleaner frontmatter descriptions** — Better trigger accuracy via focused descriptions | Medium |
| **Structured output preference** — JSON/YAML between skills reduces ambiguity | Medium |
| **Native task integration** — Forward-looking (though references non-existent tools, see Bug 5) | Low (broken) |

### What the Original Does Better

| Strength | Impact |
|---|---|
| **Discipline enforcement depth** — The original's extensive rationalization tables, red flags, and "Iron Law" repetition are *persuasion engineering*. LLMs respond to emphasis and repetition. The optimized version's conciseness may weaken enforcement. | Critical | What can we do to ameliorate the optimized version when looking at this?
| **`systematic-debugging` thoroughness** — Original has detailed 4-phase walkthrough with concrete examples. Optimized is a bullet-point skeleton. | High | What can we do to ameliorate the optimized version when looking at this while keeping efficiency in mind?
| **`test-driven-development` enforcement** — Original has flowchart, good/bad code examples, 11-entry rationalization table. Optimized relies on the reader already understanding TDD. | High |
| **`writing-skills` comprehensiveness** — Original covers CSO (Claude Search Optimization), token budgets, testing methodology in detail. Optimized is a checklist. | High |
| **`receiving-code-review` personality** — Original explicitly bans performative agreement ("You're absolutely right!") with a memorable forbidden-phrases list. Optimized says "avoid performative agreement" but lacks the memorable specificity. | Medium | Fix this.
| **Simpler architecture** — 14 skills vs 25 means less routing overhead, fewer potential conflicts, easier to understand | Medium |
| **No contradictions** — The original doesn't have the brainstorming/token-efficiency conflict or the 8-vs-10 threshold issue | Medium | But this will get fixed.
| **Battle-tested** — Original has been used by a wider community and iterated on | Medium |

### The Core Trade-off

The optimized version treats skills like **technical documentation** — concise, structured, efficient.

The original treats skills like **persuasion documents** — verbose, repetitive, psychologically engineered to override the LLM's natural tendencies.

Both approaches have merit. But for LLM instruction, **the original's approach is more effective for discipline-critical skills**. When you tell an LLM "No production code before a failing test" once in a bullet point, it may comply 80% of the time. When you tell it the same thing 5 different ways with examples of wrong behavior, a rationalization table, a flowchart, and red flags, compliance goes to 95%+. (So we need ot fix this in the optimized version)

### Verdict: Which Is Better?

**Neither is clearly better. They solve different problems.**

- The **original** is better at *making the AI follow rules it doesn't want to follow* (TDD, debugging discipline, review rigor).
- The **optimized version** is better at *workflow orchestration* (routing, efficiency, context management, modularity).

**The ideal version would combine both:** Use the optimized architecture (routing, selector, token efficiency, context management) but restore the original's depth for the 4-5 discipline-critical skills (systematic-debugging, test-driven-development, verification-before-completion, receiving-code-review, writing-skills).

---

## Part 4: Concrete Suggestions

### Priority 1: Fix the Bugs (Do Now)

1. **Rename `frontend-craftmanship` to `frontend-craftsmanship`** — fix spelling in directory name, frontmatter, and all cross-references.
2. **Align brainstorming with token-efficiency** — change "one at a time" to "all together."
3. **Fix context-management threshold** — pick 8 or 10, not both.
4. **Update plugin.json** — your name, your repo, credit original.
5. **Fix or remove TaskCreate/TaskUpdate/TaskList references** — they don't exist.

### Priority 2: Restore Discipline Depth (Do Soon)

6. **Re-add rationalization tables** to `systematic-debugging` and `test-driven-development`. These are the two skills where AI most needs to be constrained. The original's tables are proven effective. You can put them in a reference file to save tokens in the main SKILL.md (e.g., `systematic-debugging/rationalization-table.md` that's loaded only when the skill is active).

7. **Re-add the forbidden phrases list** to `receiving-code-review`. "Avoid performative agreement" is weak. "Never say: 'You're absolutely right!', 'Great point!', any gratitude expression" is strong.

8. **Re-add good/bad code examples** to `test-driven-development`. Show the wrong way and the right way side by side. This is the most effective teaching pattern for LLMs.

### Priority 3: Architecture Improvements (Do When Ready)

9. **Add a CLAUDE.md** to the plugin repo itself. Eat your own dog food.

10. **Unify the micro-task escape** — add it to `using-superpowers` directly so the selector doesn't need to be invoked at all for trivial changes.

11. **Add platform awareness** — At minimum, add a note in `subagent-driven-development` that E2E process hygiene commands are Unix. Ideally, provide Windows equivalents.

12. **Create your own version scheme** — `5.0.0` or `1.0.0-optimized` rather than `4.3.1-custom.1`. This is a substantially different product.

13. **Consider reducing skill count** — 25 skills create routing complexity. Candidates for merging:
    - `requesting-code-review` + `receiving-code-review` → `code-review` (two sections in one skill)
    - `senior-engineer` + `security-reviewer` + `testing-specialist` could be "specialist modes" within a single skill rather than 3 separate skills
    - `token-efficiency` could be folded into `using-superpowers` (it's always active anyway)

14. **Add a "skill dependency graph" diagram** — document which skills invoke which others. Currently this is spread across 25 files and hard to trace.

### Priority 4: Differentiation (Strategic)

15. **Define your unique value proposition clearly.** Right now "optimized" is vague. Is it "token-optimized"? "Workflow-optimized"? "Enterprise-optimized"? Pick a clear angle.

16. **Add measurable benchmarks.** How many tokens does a full brainstorming→planning→execution cycle consume in original vs optimized? Concrete numbers would be compelling.

17. **Write a migration guide** from original Superpowers. Users of the original need to know what changes, what's new, and what's gone.

---

## Part 5: Skill-by-Skill Health Check

| Skill | Status | Notes |
|---|---|---|
| using-superpowers | OK | Micro-task escape ambiguity (Bug 7) |
| adaptive-workflow-selector | OK | Clean and useful |
| token-efficiency | OK | Contradicts brainstorming (Bug 2) |
| brainstorming | WARN | Contradicts token-efficiency (Bug 2) |
| writing-plans | WARN | References non-existent TaskCreate (Bug 5) |
| executing-plans | WARN | References non-existent TaskCreate (Bug 5) |
| subagent-driven-development | WARN | Unix commands (Bug 6), TaskCreate refs (Bug 5) |
| systematic-debugging | OK-WEAK | Functional but too thin vs original |
| test-driven-development | OK-WEAK | Functional but too thin vs original |
| verification-before-completion | OK | Solid, config verification table is a good addition |
| finishing-a-development-branch | OK | Clean 4-option design |
| requesting-code-review | OK | Clean |
| receiving-code-review | OK-WEAK | Missing forbidden phrases specificity |
| dispatching-parallel-agents | OK | Clean |
| using-git-worktrees | OK | Clean |
| context-management | WARN | Threshold inconsistency (Bug 3) |
| frontend-craftmanship | BUG | Name mismatch (Bug 1), spelling error |
| senior-engineer | OK | Good addition |
| security-reviewer | OK | Good addition |
| testing-specialist | OK | Good addition |
| prompt-optimizer | OK | Good addition |
| claude-md-creator | OK | Good addition |
| writing-skills | OK | Thinner than original but functional |
| token-efficiency | OK | Good addition, needs brainstorming alignment |

---

## Summary

**Total issues found: 9** (1 critical, 2 high, 3 medium, 3 low/minor)

**Overall assessment:** The optimized version has a better *architecture* than the original (routing, efficiency, modularity) but weaker *enforcement* of the critical discipline skills. The 5 bugs should be fixed before any public release. The strategic path forward is hybrid: keep the optimized architecture, restore enforcement depth for the 4-5 most important discipline skills.

The plugin is ~80% of the way to being excellent. Fix the bugs, restore the discipline depth, and it will genuinely be a strong contender as a go-to agentic skills framework.
