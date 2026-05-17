# Flawless Audit — Implementation Plan

_Created: 2026-04-14 | Scope: 5 tiers, 20 changes | Risk: low-medium_

## Overview

This plan addresses 20 concrete issues found during a full audit of all 21 skills, 14 hooks, 2 agents, and the cross-session memory layer. Organized into 5 tiers ordered by impact: bugs first, then memory improvements, scope gates, new skills, and polish.

**Guiding principle:** Sharpen, don't sprawl. Every change fixes an observed issue or fills a verified gap. No speculative features.

---

## Tier 1 — Fix bugs that erode trust

### Task 1.1: Fix context-engine.js per-project watermark

**Problem:** `LAST_HEAD_FILE` is a single global file (`~/.claude/hooks-logs/last-session-head.txt`). When the user works on multiple projects, project A's HEAD overwrites project B's watermark. Cross-session diff then shows wrong files.

**File:** `hooks/context-engine.js:28-31`

**Fix:** Hash the project's `cwd` and include it in the filename.

```javascript
// BEFORE
const LAST_HEAD_FILE = path.join(
  process.env.HOME || process.env.USERPROFILE || '.',
  '.claude', 'hooks-logs', 'last-session-head.txt'
);

// AFTER
const { createHash } = require('crypto');
function getLastHeadFile(cwd) {
  const hash = createHash('md5').update(cwd).digest('hex').slice(0, 12);
  return path.join(
    process.env.HOME || process.env.USERPROFILE || '.',
    '.claude', 'hooks-logs', `last-session-head-${hash}.txt`
  );
}
```

Then replace all references to `LAST_HEAD_FILE` with `getLastHeadFile(cwd)` — there are 3: the read at line 110, the write at line 130, and the constant declaration itself (removed).

**Verification:** Run `node -e "require('./hooks/context-engine')"` — no crash. Manually test with two different cwd values; confirm different filenames are generated.

---

### Task 1.2: Fix context-engine.js diff base

**Problem:** `changedFiles` uses `HEAD~1..HEAD` (last commit only). If a user made 5 commits since last session, only the last commit's files appear in `changed_files`. The cross-session watermark already solves this for `cross_session_files`, but `changed_files` is redundant and misleading when it disagrees.

**File:** `hooks/context-engine.js:92-97`

**Fix:** When cross-session watermark exists and is valid, use it as the diff base for `changed_files` too. Fall back to `HEAD~1` only when no watermark exists (first session ever).

```javascript
// BEFORE
const changedRaw = run('git diff --name-only HEAD~1..HEAD', cwd);

// AFTER
const diffBase = lastHead && lastHead !== gitHash && mergeBase === lastHead
  ? lastHead
  : 'HEAD~1';
const changedRaw = run(`git diff --name-only ${diffBase}..HEAD`, cwd);
```

This requires restructuring: move the `lastHead` read + `mergeBase` check BEFORE the `changedFiles` computation. The cross-session section (lines 103-125) currently runs after `changedFiles` — swap the order.

**Verification:** After a multi-commit session, `changed_files` and `cross_session_files` should be identical (not different).

---

### Task 1.3: Fix context-engine.js blast radius false positives

**Problem:** `git grep -l "${safeName}"` matches any occurrence of the basename string, including comments, strings, and documentation — not just imports/references. A file named `auth.js` matches every file containing the word "auth" in any context.

**File:** `hooks/context-engine.js:146-149`

**Fix:** Add a secondary filter that checks whether the grep hit is likely an import/require/reference rather than a prose mention. Use a pattern-based heuristic:

```javascript
// After the git grep, filter results through a quick relevance check
const importPatterns = [
  new RegExp(`(import|require|from).*${safeName}`, 'i'),
  new RegExp(`[./]${safeName}[./'";\`]`),
];

blastRadius[file] = refs
  ? refs.split('\n').filter(f => {
      if (!f || f === file) return false;
      // Quick content check: does the reference look like an import?
      try {
        const content = run(`git grep -h "${safeName}" -- "${f}"`, cwd);
        return importPatterns.some(p => p.test(content));
      } catch { return true; } // fail-open: keep the ref if check fails
    })
  : [];
```

**Trade-off:** This adds one `git grep -h` per referencing file (content, not filenames). Bounded by `MAX_FILES=10` and typically 0-5 refs per file, so worst case ~50 extra git greps — well within the 5s timeout per command.

**Verification:** Edit a file with a common-word basename. Confirm blast radius only shows files that actually import/reference it, not files that mention the word in comments.

---

### Task 1.4: Fix stop-reminders.js isSignificantSession patterns

**Problem:** `isSignificantSession` catches `SKILL.md`, hooks, `skill-rules.json`, `CLAUDE.md`, and `agents/*.md` — but misses spec and plan files (`docs/superpowers-optimized/specs/*.md`, `docs/superpowers-optimized/plans/*.md`). When a session creates or modifies a design spec, the decision-log reminder doesn't fire.

**File:** `hooks/stop-reminders.js:291-299`

**Fix:** Add patterns for spec/plan docs and the plugin manifest:

```javascript
const sigPatterns = [
  /SKILL\.md$/i,
  /[/\\]hooks[/\\][^/\\]+\.js$/,
  /[/\\]hooks[/\\]session-start$/,
  /skill-rules\.json$/,
  /CLAUDE\.md$/i,
  /agents[/\\][^/\\]+\.md$/i,
  // NEW: specs and plans are architectural decisions worth logging
  /[/\\]specs[/\\][^/\\]+\.md$/i,
  /[/\\]plans[/\\][^/\\]+\.md$/i,
  // NEW: plugin manifest changes affect all platforms
  /plugin\.universal\.yaml$/,
];
```

**Verification:** Create a mock edit log with a `docs/superpowers-optimized/specs/test.md` entry. Confirm `isSignificantSession` returns `true`.

---

### Task 1.5: Fix subagent-guard.js detection gaps

**Problem:** `ACTION_VERB` pattern only covers `invoking?|using|use|running?|called?|calling`. Missing: `activate`, `trigger`, `execute`, `launch`, `spawn`, `start`. Also missing: detection of the Skill tool being called directly (subagent says "I'll use the Skill tool to invoke...").

**File:** `hooks/subagent-guard.js:48-53`

**Fix:**

```javascript
// BEFORE
const ACTION_VERB = '(?:invoking?|using|use|running?|called?|calling)\\s+(?:the\\s+)?';

// AFTER
const ACTION_VERB = '(?:invoking?|using|use|running?|called?|calling|activat(?:e|ing)|trigger(?:ing|ed)?|execut(?:e|ing)|launch(?:ing|ed)?|spawn(?:ing|ed)?|start(?:ing|ed)?)\\s+(?:the\\s+)?';

// Add Skill tool detection to VIOLATION_PATTERNS
const VIOLATION_PATTERNS = [
  /Invoke the superpowers-optimized/i,
  /I'm using the .+ skill/i,
  // NEW: detect Skill tool invocation
  /Skill\s*\(\s*["']?superpowers/i,
  /skill:\s*["']?(superpowers|using-superpowers|brainstorming|deliberation)/i,
  ...SKILL_NAMES.map(name => new RegExp(ACTION_VERB + name, 'i')),
];
```

**Verification:** Run the existing `test-skill-activator.js` tests (they don't cover subagent-guard, but confirm no regression). Manually test: `echo '{"last_assistant_message":"I activated the brainstorming skill"}' | node hooks/subagent-guard.js` — should output `decision: "block"`.

---

### Task 1.6: Fix executing-plans worktree requirement

**Problem:** Step 2 says "Set Up Workspace — Ensure isolated workspace is ready (`using-git-worktrees`)" unconditionally. Some tasks don't need worktree isolation (e.g., documentation changes, config tweaks, or when the user is already on a feature branch).

**File:** `skills/executing-plans/SKILL.md:49-50`

**Fix:** Make worktree conditional:

```markdown
### Step 2: Set Up Workspace
If working on main/master branch AND the plan involves code changes:
- Set up isolated workspace via `using-git-worktrees`.

If already on a feature branch, or the plan is documentation/config only:
- Skip worktree setup. Confirm with user that the current branch is appropriate.
```

**Verification:** Read the updated file and confirm the conditional language is clear.

---

## Tier 2 — Improve memory recall

### Task 2.1: Weighted memory recall in skill-activator.js

**Problem:** `searchSessionLog` uses a flat boolean match (any keyword hit = match). This produces false positives: a session-log entry about "hooks" matches every prompt mentioning "hooks" regardless of context. No recency weighting — a 6-month-old entry ranks equally with yesterday's.

**File:** `hooks/skill-activator.js:217-267`

**Fix:** Replace flat boolean matching with weighted scoring:

```javascript
function searchSessionLog(cwd, keywords) {
  // ... (existing file read + entry parsing unchanged) ...

  // Score each entry instead of boolean match
  const scored = [];
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];
    const entryLower = entry.toLowerCase();

    // Keyword density: count how many keywords hit
    const hits = keywords.filter(kw => entryLower.includes(kw)).length;
    if (hits === 0) continue;

    // Density score: proportion of query keywords matched
    const densityScore = hits / keywords.length;

    // Recency score: entries closer to the end of the file score higher
    // (entries array is oldest-first, so i/length gives recency 0..1)
    const recencyScore = (i + 1) / entries.length;

    // Combined score: density weighted 70%, recency 30%
    const score = (densityScore * 0.7) + (recencyScore * 0.3);

    scored.push({ entry, score });
  }

  // Sort by score descending, take top N
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, MAX_MEMORY_ENTRIES).map(s => {
    const truncated = s.entry.length > MAX_ENTRY_CHARS
      ? s.entry.slice(0, MAX_ENTRY_CHARS).trimEnd() + '\n*(entry truncated)*'
      : s.entry;
    return truncated;
  });
}
```

**Also apply the same scoring to `searchKnownIssues`** (lines 293-336) — same pattern, same fix.

**Verification:** Run existing tests in `tests/codex/test-skill-activator.js`. Add a test case with multiple entries where a recent 2-keyword-match entry should rank above an older 1-keyword-match entry.

---

## Tier 3 — Add scope gates and missing steps

### Task 3.1: Frontend-design scope gate

**Problem:** `frontend-design` SKILL.md jumps straight into Design System Generation (Step 1: Analyze Requirements). For projects with an existing design system, this creates friction — the AI generates a new design system instead of reading the existing one.

**File:** `skills/frontend-design/SKILL.md` — insert after line 15 (before "## Design System Generation")

**Fix:** Add a scope gate:

```markdown
## Scope Gate — Before Anything Else

1. Check: does the project already have a design system, component library, or style guide?
   - Look for: `tailwind.config`, `theme.ts/js`, `tokens.json`, `design-system/`, `styles/`, existing component library (shadcn, MUI, Chakra, etc.)
2. If YES (existing design system):
   - Read and reference the existing system. Do NOT generate a new one.
   - Skip to "Quality Standards" section — apply those standards within the existing design framework.
   - Only generate new design tokens if the existing system has clear gaps for the requested feature.
3. If NO (greenfield):
   - Proceed with full Design System Generation below.
```

**Verification:** Read the updated file and confirm the gate is positioned before the generation steps.

---

### Task 3.2: TDD test infrastructure bootstrap

**Problem:** `test-driven-development` SKILL.md says "Write one small failing test" as step 1 — but in a greenfield project with no test runner configured, this fails immediately with a confusing error. The skill assumes test infrastructure exists.

**File:** `skills/test-driven-development/SKILL.md` — insert after the Cycle section (after line 29)

**Fix:** Add a bootstrap check:

```markdown
## Test Infrastructure Check

Before writing the first test, verify the project has a test runner:

1. Check for test config: `jest.config.*`, `vitest.config.*`, `pytest.ini`, `pyproject.toml [tool.pytest]`, `go.mod`, `Cargo.toml`, `.rspec`, `phpunit.xml`
2. Check for test script: `npm test`, `yarn test`, `make test`, or equivalent
3. If no test infrastructure exists:
   - Ask the user: "No test runner detected. Should I set up [recommended runner for this language/framework]?"
   - If yes: install and configure the minimal test runner. Write one smoke test to confirm it works.
   - If no: note that TDD requires a test runner and proceed only if the user provides an alternative.

Do not skip this step — a "failing test" that fails because the runner doesn't exist teaches nothing.
```

**Verification:** Read the updated file.

---

### Task 3.3: finishing-a-development-branch PR template enrichment

**Problem:** The PR description template in Option 2 (lines 46-50) doesn't reference session-log.md decisions. The "Notable decisions" section could be auto-populated from session-log entries written during the branch's lifetime.

**File:** `skills/finishing-a-development-branch/SKILL.md:45-50`

**Fix:** Add a session-log integration step:

```markdown
### Option 2
- Push feature branch
- Create PR with a description that includes:
  - **What changed** — one-paragraph summary of the change set
  - **Why** — the motivation or problem this solves (link to plan doc if one exists)
  - **How to verify** — exact commands or steps a reviewer can run to confirm the change works
  - **Notable decisions** — any trade-offs made, alternatives rejected, or non-obvious choices.
    If `session-log.md` has `[saved]` entries written during this branch's lifetime, extract the Decisions and Rejected bullets from the most recent entry and include them here. This ensures PR reviewers see the "why" without needing to read the log.
- Keep worktree by default (remove only if user asks)
```

**Verification:** Read the updated file.

---

### Task 3.4: using-superpowers "existing project without memory" soft gate

**Problem:** The fresh project gate (entry sequence step 2) only fires when the user has *creation intent* AND no `project-map.md`. But an existing project without memory files (user says "fix this bug" in a repo with no project-map/session-log) never triggers any awareness of the memory layer. The AI just works blind.

**File:** `skills/using-superpowers/SKILL.md` — after step 2 (line 80), add step 2b

**Fix:**

```markdown
   **Step 2b — Existing project memory check** (runs only when step 2 did NOT fire):
   If the user's request is non-trivial (not micro) AND `project-map.md` does not exist AND the project has 10+ files:
   - Mention once (do not block): *"Note: this project has no project-map.md. I'll work fine without it, but if you want faster orientation in future sessions, I can generate one after this task. Just say 'map this project'."*
   - Do not repeat this notice in subsequent tasks within the same session.
```

**Verification:** Read the updated file.

---

### Task 3.5: Fix deliberation → premise-check loop prevention

**Problem:** `deliberation` SKILL.md says in its Next Step output: "the reframe changes the scope — revisit premise-check before continuing" (line 99). `premise-check` can also route back to deliberation. No explicit loop breaker exists.

**File:** `skills/deliberation/SKILL.md:99`

**Fix:** Add a loop guard:

```markdown
### Next step
[One of:
- "proceed to brainstorming with this framing"
- "return to user — the decision needs more information before proceeding"
- "the reframe changes the scope — revisit premise-check before continuing"
  *(Loop guard: if premise-check has already been invoked for this task, skip it and proceed directly to brainstorming. Never cycle between deliberation and premise-check more than once.)*
]
```

**Verification:** Read the updated file.

---

### Task 3.6: Clarify state.md vs plan.md roles

**Problem:** `context-management` SKILL.md mentions state.md has "Active plan tasks and their status" (line 68) and the session-log section says "Task checklists → state.md" (line 93). But `executing-plans` uses the plan.md file itself for task tracking (checkboxes). Users and the AI can be confused about which file tracks task progress.

**File:** `skills/context-management/SKILL.md` — in the Procedure section, after step 2

**Fix:** Add a clarification note:

```markdown
   **state.md vs plan.md:**
   - `plan.md` (or `docs/.../plans/*.md`): the authoritative task list with checkboxes. Owned by `executing-plans`. Updated as tasks complete.
   - `state.md`: a session-boundary snapshot of *where you are* in the plan — current task, blockers, what's verified. It references the plan but does not duplicate the task list.
   
   If a plan exists, state.md should say "Executing plan at docs/.../plan.md, currently on Task 3" — not copy the full task list.
```

**Verification:** Read the updated file.

---

## Tier 4 — New skills (via /skill-creator)

### Task 4.1: Create Refactoring skill

**Rationale:** The routing guide in using-superpowers maps "refactor" to `brainstorming`, but refactoring is fundamentally different from new feature design. Refactoring preserves behavior while changing structure — it needs a behavior-locking test step, scope containment, and incremental verification that brainstorming doesn't provide.

**Invoke:** `/skill-creator` with:
- Name: `refactoring`
- Purpose: Structured refactoring with behavior preservation — lock behavior with tests before changing structure, verify incrementally, scope containment
- Key sections: Behavior Lock (test first), Scope Definition (what changes, what doesn't), Incremental Steps (one structural change at a time, tests green after each), Completion Gate (all tests green, no behavior change)
- Priority: high
- Keywords: refactor, restructure, reorganize, clean up, extract, inline, simplify, decouple, modularize
- Update skill-rules.json and using-superpowers routing guide

### Task 4.2: Create Performance Investigation skill

**Rationale:** Performance issues are distinct from bugs (systematic-debugging) and from new features (brainstorming). They need measurement-first methodology: profile before guessing, establish baselines, verify improvements with numbers.

**Invoke:** `/skill-creator` with:
- Name: `performance-investigation`
- Purpose: Measure-first performance investigation — profile, baseline, hypothesize, fix, re-measure
- Key sections: Baseline (measure current state with numbers), Profile (identify actual bottleneck, not guessed one), Hypothesize (what specific change will improve which metric by how much), Fix and Measure (apply one change, re-measure, compare to baseline)
- Priority: medium
- Keywords: slow, performance, optimize, speed, latency, throughput, memory, profiling, benchmark, bottleneck
- Update skill-rules.json and using-superpowers routing guide

### Task 4.3: Create Dependency Management skill

**Rationale:** Dependency updates, migrations, and security vulnerability fixes follow a specific pattern: audit impact, check breaking changes, update incrementally, verify. Currently unmapped — the AI either does it ad-hoc or routes through brainstorming (wrong tool).

**Invoke:** `/skill-creator` with:
- Name: `dependency-management`
- Purpose: Structured dependency updates, migrations, and vulnerability fixes — audit, plan, update incrementally, verify
- Key sections: Audit (what needs updating and why — security, deprecation, feature), Impact Assessment (breaking changes, peer dependency conflicts), Update Strategy (one at a time or batched by risk level), Verification (tests, build, runtime check)
- Priority: medium
- Keywords: dependency, dependencies, upgrade, update packages, npm update, pip upgrade, outdated, vulnerability, CVE, security advisory, breaking change, migration guide
- Update skill-rules.json and using-superpowers routing guide

---

## Tier 5 — Polish and hardening

### Task 5.1: Fix session-start awk parser fragility

**Problem:** The awk parser for session-log.md (session-start lines 295-303) has a subtle bug: when a `[saved]` entry is the last entry in the file (no `## ` header follows it), the entry is only flushed in the `END` block. But the entry-end detection pattern (`/^## / && !/\[saved\]/`) means that a `[saved]` entry followed by another `[saved]` entry will merge them into one block (the first `[saved]` header triggers `found=1; block=""` which resets the block, but the `block = block "\n" $0` on the header line itself gets the new header appended to an empty string, losing the previous block).

Actually, re-reading: the pattern `/^## .* \[saved\]/` triggers `found=1; block=""` — this RESETS block to empty. Then `found { block = block "\n" $0 }` appends the current line. So consecutive `[saved]` entries: the second entry's header resets block, discarding the first entry's content. The first entry never gets pushed to `saved_entries[]` because it's only pushed by the non-saved header pattern or END.

**File:** `hooks/session-start:295-303`

**Fix:** Flush the previous block when a new `[saved]` header is encountered:

```awk
/^## .* \[saved\]/ {
    if (found && block != "") saved_entries[++n] = block;
    found=1; block=""
}
found { block = block "\n" $0 }
/^## / && !/\[saved\]/ && found && block != "" { saved_entries[++n] = block; found=0; block="" }
END { if (found && block != "") saved_entries[++n] = block
      start = (n > 2) ? n-1 : 1
      for (i = start; i <= n; i++) print saved_entries[i] }
```

The key change is adding `if (found && block != "") saved_entries[++n] = block;` at the START of the `[saved]` header rule, before resetting.

**Verification:** Create a test session-log.md with 3 consecutive `[saved]` entries (no non-saved entries between them). Run the awk command. Confirm all 3 are parsed and the last 2 are output.

---

### Task 5.2: Add constraint extraction suggestion to systematic-debugging

**Problem (from DIOS D2):** After fixing a bug, the post-fix section only suggests adding to `known-issues.md`. But some bugs reveal permanent architectural constraints (e.g., "this API doesn't support concurrent calls") that should go to `project-map.md` Critical Constraints instead.

**File:** `skills/systematic-debugging/SKILL.md:128-131`

**Fix:** Expand the post-fix section:

```markdown
## Post-Fix: Update Knowledge Base

After resolving a bug:
1. **Recurring error?** (environment-dependent, configuration, platform-specific, external-state) → offer to add the error→solution mapping to `known-issues.md` using the format defined in `error-recovery`.
2. **Permanent constraint discovered?** (API limitation, platform behavior, library quirk that will never change) → offer to add it to `project-map.md` Critical Constraints section via `context-management`. These are facts that every future session needs, not just error→fix mappings.
```

**Verification:** Read the updated file.

---

## Execution Order

1. **Tier 1** (Tasks 1.1–1.6): Fix sequentially. Each is independent but affects trust.
2. **Tier 2** (Task 2.1): Implement weighted scoring. Run tests.
3. **Tier 3** (Tasks 3.1–3.6): Apply skill edits. All are independent markdown changes.
4. **Tier 4** (Tasks 4.1–4.3): Use `/skill-creator` for each. Update `skill-rules.json` and `using-superpowers` routing guide after each.
5. **Tier 5** (Tasks 5.1–5.2): Fix awk parser, expand debugging post-fix.

## Verification Strategy

- After Tier 1: `node -e "require('./hooks/context-engine')"` + `node -e "require('./hooks/stop-reminders')"` + `node -e "require('./hooks/subagent-guard')"` — no crashes
- After Tier 2: `cd tests/codex && node test-skill-activator.js` — all existing tests pass
- After Tier 3: Manual read of each modified SKILL.md
- After Tier 4: Confirm new skills have frontmatter, are in skill-rules.json, and appear in routing guide
- After Tier 5: Test awk parser with multi-entry session-log

## Files Modified

| Tier | File | Type |
|------|------|------|
| 1.1-1.3 | hooks/context-engine.js | Bug fix |
| 1.4 | hooks/stop-reminders.js | Bug fix |
| 1.5 | hooks/subagent-guard.js | Bug fix |
| 1.6 | skills/executing-plans/SKILL.md | Scope fix |
| 2.1 | hooks/skill-activator.js | Enhancement |
| 3.1 | skills/frontend-design/SKILL.md | Scope gate |
| 3.2 | skills/test-driven-development/SKILL.md | Missing step |
| 3.3 | skills/finishing-a-development-branch/SKILL.md | Enhancement |
| 3.4 | skills/using-superpowers/SKILL.md | Soft gate |
| 3.5 | skills/deliberation/SKILL.md | Loop guard |
| 3.6 | skills/context-management/SKILL.md | Clarification |
| 4.1 | skills/refactoring/SKILL.md (NEW) | New skill |
| 4.2 | skills/performance-investigation/SKILL.md (NEW) | New skill |
| 4.3 | skills/dependency-management/SKILL.md (NEW) | New skill |
| 4.1-4.3 | hooks/skill-rules.json | New rules |
| 4.1-4.3 | skills/using-superpowers/SKILL.md | Routing updates |
| 4.1-4.3 | hooks/subagent-guard.js | SKILL_NAMES additions |
| 5.1 | hooks/session-start | Bug fix |
| 5.2 | skills/systematic-debugging/SKILL.md | Enhancement |
