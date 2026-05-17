# Auto-Improve Loop v1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use the appropriate execution skill (`executing-plans` or `subagent-driven-development`) to implement this plan.

**Goal:** Build a working autoresearch-style loop that optimizes `skill-rules.json` triggering accuracy via local Node.js eval and a Claude orchestrator session.
**Architecture:** A `tools/autoimprove/` directory containing an entry script (`run.sh`), a local scorer (`eval.js`), test cases (`test-cases.json`), and a meta-prompt (`prompt.md`). The entry script launches Claude headless; Claude reads rules, runs eval, makes one change, tests, keeps/reverts, repeats.
**Tech Stack:** Bash, Node.js (no dependencies), Claude CLI (`claude -p`)
**Assumptions:**
- `claude` CLI is installed and in PATH — will NOT work without it
- Git is initialized in the repo — will NOT work without git (needed for commit/revert)
- Pro subscription handles rate limits — will NOT work if API key auth is used instead

---

### Task 1: Add tools/autoimprove/ to .gitignore

**Files:**
- Modify: `.gitignore`

**Why first:** The tool files are NOT part of the plugin. Gitignoring before creating them prevents accidental tracking. Only `results.tsv` is auto-generated; ALL tool files are local-only.

**Step 1: Add gitignore entry**
Append to `.gitignore`:
```
# Auto-improve tool (not part of the plugin — local optimization tooling)
tools/
```

**Step 2: Verify**
Run: `tail -3 .gitignore`
Expected: Shows the tools/ entry.

**Step 3: Commit**
```bash
git add .gitignore
git commit -m "chore: gitignore tools/ directory (local optimization tooling)"
```

---

### Task 2: Create test-cases.json

**Files:**
- Create: `tools/autoimprove/test-cases.json` (gitignored — no commit)

**Step 1: Create the file**
Write 3 test cases with naive prompts that don't use skill keywords directly. Each case has `prompt`, `expectedSkill`, `expectedRank`.

```json
[
  {
    "prompt": "My API is returning 500 errors intermittently and I can't figure out why. Here's what the logs show...",
    "expectedSkill": "systematic-debugging",
    "expectedRank": 1
  },
  {
    "prompt": "I want to build a new notification system for the app that sends alerts when orders ship",
    "expectedSkill": "brainstorming",
    "expectedRank": 1
  },
  {
    "prompt": "Can you look over my changes before I merge to main? I want to make sure nothing is broken",
    "expectedSkill": "requesting-code-review",
    "expectedRank": 1
  }
]
```

**Step 2: Verify**
Run: `node -e "const t = require('./tools/autoimprove/test-cases.json'); console.log(t.length + ' test cases loaded'); t.forEach(c => console.log('  ' + c.expectedSkill))"`
Expected: `3 test cases loaded` with skill names listed.

No commit — file is gitignored.

---

### Task 3: Create eval.js — Local Scorer

**Files:**
- Create: `tools/autoimprove/eval.js` (gitignored — no commit)
- Read (reference only): `hooks/skill-activator.js`, `hooks/skill-rules.json`

**Step 1: Implement the scorer**
Re-implement the matching logic from `skill-activator.js` inline. Do NOT import skill-activator.js — re-implement to avoid path dependency issues.

The scorer must:
1. Load `hooks/skill-rules.json` (resolve path relative to repo root via `path.join(__dirname, '..', '..', 'hooks', 'skill-rules.json')`)
2. Load `tools/autoimprove/test-cases.json`
3. Define `PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }` — must match skill-activator.js exactly
4. Define `CONFIDENCE_THRESHOLD = 2` — must match skill-activator.js exactly
5. For each test case, run the matching algorithm:
   - For each rule: score = (keyword substring matches × 1) + (intent pattern regex matches × 2)
   - Discard rules with score < CONFIDENCE_THRESHOLD
   - Sort by priority first (critical > high > medium > low), then by score descending — **this two-level sort is critical, it matches the real activator**
   - Take top 3
6. Note: Skip the `isMicroTask()` gate — our test prompts are multi-sentence and will never trigger it. Document this skip in a code comment.
7. Note: `skill-rules.json` has two separate rules for `context-management` (different priorities). The scorer must handle duplicate skill names correctly — each rule is scored independently.
8. Score 2 binary checks per test case:
   - `topN`: Did expectedSkill appear in the top-3 matches? (yes/no)
   - `rank1`: Was expectedSkill the #1 ranked match? (yes/no)
9. Print per-case results and aggregate score
10. Output the score as the last line in format `Score: N/M (P%)` for easy parsing

**Output format (must be parseable by the orchestrator):**
```
=== Auto-Improve Eval ===
[PASS] systematic-debugging: topN=yes rank1=yes (2/2)
[PASS] brainstorming: topN=yes rank1=yes (2/2)
[FAIL] requesting-code-review: topN=yes rank1=no (1/2)
---
Score: 5/6 (83%)
```

**Step 2: Verify**
Run: `node tools/autoimprove/eval.js`
Expected: Outputs score table with per-case results and aggregate percentage. Should run in <100ms.

No commit — file is gitignored.

---

### Task 4: Dry Run — Verify eval.js produces correct baseline

**Files:**
- None (verification only)

**Why here:** Verifying eval.js immediately after creation, before building anything else on top of it.

**Step 1: Run eval against current skill-rules.json**
Run: `node tools/autoimprove/eval.js`
Expected: Produces a score. Likely not 100% — the test prompts are intentionally tricky (naive, no direct skill keywords).

**Step 2: Manually verify one case**
Pick the test case with the lowest score. Manually trace the matching logic against `skill-rules.json` to confirm eval.js is scoring correctly (not a bug in eval.js).

**Step 3: If eval.js has bugs, fix them before proceeding.**
No commit — verification gate only.

---

### Task 5: Create prompt.md — The Meta-Prompt

**Files:**
- Create: `tools/autoimprove/prompt.md` (gitignored — no commit)

**Step 1: Write the autoresearch meta-prompt**

The prompt must contain:
1. **Role**: "You are an autonomous optimization agent. Your job is to improve skill-triggering accuracy by modifying hooks/skill-rules.json."
2. **Context**: "Run `node tools/autoimprove/eval.js` to see the current score. Run `cat tools/autoimprove/test-cases.json` to see what prompts are being tested. Run `cat hooks/skill-rules.json` to see the current rules."
3. **Protocol**: The exact loop steps:
   - Read current skill-rules.json and test-cases.json
   - Run `node tools/autoimprove/eval.js` for baseline score
   - Analyze which test cases fail and why (which keywords/patterns are missing or wrong)
   - Make ONE atomic change to hooks/skill-rules.json
   - Run `git add hooks/skill-rules.json && git commit -m "experiment: <description>"`
   - Verify only skill-rules.json changed: `git diff --name-only HEAD~1` — if other files appear, run `git reset HEAD~1` immediately
   - Re-run `node tools/autoimprove/eval.js` for new score
   - If score improved: keep the commit, log as "kept"
   - If score equal or worse: run `git reset HEAD~1`, log as "reverted"
   - Append result to `tools/autoimprove/results.tsv`
   - Repeat
4. **Safety constraints**:
   - "You may ONLY edit `hooks/skill-rules.json`. Do NOT touch any other file."
   - "Make ONE atomic change per iteration. Not two, not three. One."
   - "Do NOT add new rules — only modify existing rules' keywords and intentPatterns arrays."
5. **Quality heuristics**:
   - "Prefer general intent patterns over specific keywords (avoid overfitting to test prompts)"
   - "Simpler is better — removing a keyword while maintaining score is a win"
   - "If a test fails because the prompt has no keywords that match, add an intentPattern (regex), not a keyword"
   - "Don't add the exact words from a test prompt as keywords — that's overfitting"
6. **Logging**: "Append each experiment to `tools/autoimprove/results.tsv`. If the file doesn't exist, create it with a header line. Columns: `iteration\tcommit\taction\tscore_before\tscore_after\tstatus`"
7. **Termination**: "Continue until you run out of turns. On your final turn, print a summary: starting score, final score, number of experiments, number kept, number reverted."
8. **NEVER STOP instruction**: "Do not pause to ask questions. The human is not watching. If something is unclear, log it to results.tsv as a note and move on."

**Step 2: Verify**
Run: `cat tools/autoimprove/prompt.md | head -5`
Expected: File exists and starts with the role/context section.

No commit — file is gitignored.

---

### Task 6: Create run.sh — Entry Point

**Files:**
- Create: `tools/autoimprove/run.sh` (gitignored — no commit)

**Step 1: Write the orchestrator script**

Usage: `./tools/autoimprove/run.sh [max_turns]` — accepts a positional number (default 10).

```bash
#!/bin/bash
# Auto-Improve Loop v1 — Entry Point
# Usage: ./tools/autoimprove/run.sh [max_turns]
#   max_turns: number of Claude turns (default: 10)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MAX_TURNS="${1:-10}"

cd "$REPO_ROOT"

echo "=== Auto-Improve v1 ==="
echo "Repository: $REPO_ROOT"
echo "Max turns: $MAX_TURNS"
echo "Time: $(date)"
echo ""

echo "=== Baseline Score ==="
node tools/autoimprove/eval.js
echo ""

echo "=== Starting Optimization Loop ==="
claude -p "$(cat tools/autoimprove/prompt.md)" \
  --max-turns "$MAX_TURNS" \
  --dangerously-skip-permissions

echo ""
echo "=== Final Score ==="
node tools/autoimprove/eval.js
echo ""

if [ -f tools/autoimprove/results.tsv ]; then
  echo "=== Experiment Log ==="
  cat tools/autoimprove/results.tsv
else
  echo "(no experiment log generated)"
fi
```

**Step 2: Make executable and verify**
Run: `chmod +x tools/autoimprove/run.sh && echo "run.sh created and executable"`
Expected: Confirmation message.

No commit — file is gitignored.
