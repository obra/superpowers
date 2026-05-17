# Context Engine Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use the appropriate execution skill (`executing-plans` or `subagent-driven-development`) to implement this plan.

**Goal:** Automatically compute a git-based context snapshot on every session start so skills like code review and debugging receive pre-verified facts (changed files, blast radius) instead of gathering them through exploration.

**Architecture:** A new `context-engine.js` SessionStart hook runs git commands on every session start and writes `context-snapshot.json` to the project root. Two skills (`requesting-code-review`, `systematic-debugging`) gain a new step that reads the snapshot before dispatching agents or investigating. Everything is additive — no existing behavior changes, no new dependencies.

**Tech Stack:** Node.js (built-ins only: `child_process`, `fs`, `path`), git (universally available), existing hooks.json pattern.

**Assumptions:**
- Assumes git is available in PATH — will silently produce no snapshot if not (no crash, no blocking).
- Assumes `context-snapshot.json` at project root is acceptable alongside existing AI workspace files (project-map.md, session-log.md, etc.).
- Assumes Claude Code runs hooks with the user's project directory as the working directory — confirmed by the existing session-start bash hook using relative paths (`project-map.md`) that resolve correctly. `process.cwd()` in a Node.js hook is therefore the project directory.
- Tasks 1–3 have an ordering dependency and must be completed in a single session without deploying Task 2 in isolation (see Task 3 note).

---

### Task 1: Create `hooks/context-engine.js`

**Files:**
- Create: `hooks/context-engine.js`

**Does NOT cover:** Transitive blast radius (A imports B imports changed C — only B is found), dynamic imports with computed paths, non-git projects (fails silently, writes nothing), projects with no prior commits (HEAD~1 fails silently).

**Step 1: No automated test framework for hooks** — verified via smoke test in Step 3.

**Step 2: Implement**

Create `hooks/context-engine.js`:

```javascript
#!/usr/bin/env node
/**
 * SessionStart Hook — Context Engine
 *
 * Runs on every session start. Executes git commands to compute:
 *   - Recently changed files (last commit)
 *   - Blast radius: which tracked files reference each changed file
 *   - Recent commit history and change statistics
 *
 * Writes context-snapshot.json to the project root.
 * Auto-adds context-snapshot.json to .gitignore on first write.
 * Fails silently on any error — never blocks session start.
 *
 * Input:  stdin JSON with { cwd, ... } (falls back to process.cwd())
 * Output: stdout {} always
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MAX_FILES = 10;    // cap blast radius queries to avoid slowness on large diffs
const MIN_NAME_LEN = 3;  // skip very short filenames to avoid false-positive grep hits
const TIMEOUT_MS = 5000; // max time for any single git command

function run(cmd, cwd) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout: TIMEOUT_MS, cwd }).trim();
  } catch {
    return '';
  }
}

function ensureGitignored(cwd) {
  try {
    const gitignorePath = path.join(cwd, '.gitignore');
    let content = fs.existsSync(gitignorePath)
      ? fs.readFileSync(gitignorePath, 'utf8')
      : '';

    const lines = content.split('\n').map(l => l.trim());
    if (lines.includes('context-snapshot.json')) return; // already present

    const prefix = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
    const hasSection = content.includes('# AI assistant artifacts');

    if (!hasSection) {
      fs.appendFileSync(gitignorePath, `${prefix}\n# AI assistant artifacts\ncontext-snapshot.json\n`);
    } else {
      fs.appendFileSync(gitignorePath, `${prefix}context-snapshot.json\n`);
    }
  } catch {
    // Silently ignore — never block session start
  }
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  let cwd;
  try {
    const data = JSON.parse(input);
    cwd = data.cwd || process.cwd();
  } catch {
    cwd = process.cwd();
  }

  // Bail silently if not a git repo
  const gitDir = run('git rev-parse --git-dir', cwd);
  if (!gitDir) {
    process.stdout.write('{}');
    return;
  }

  const gitHash = run('git rev-parse HEAD', cwd);

  // Changed files in last commit
  const changedRaw = run('git diff --name-only HEAD~1..HEAD', cwd);
  const changedFiles = changedRaw ? changedRaw.split('\n').filter(Boolean) : [];

  // Change statistics — last line of --stat output is the summary
  const statOutput = run('git diff --stat HEAD~1..HEAD', cwd);
  const changeStat = statOutput ? statOutput.split('\n').pop() : '';

  // Recent commits
  const logRaw = run('git log --oneline -5', cwd);
  const recentCommits = logRaw ? logRaw.split('\n').filter(Boolean) : [];

  // Blast radius: for each changed file, find all tracked files that reference it by name
  const blastRadius = {};
  for (const file of changedFiles.slice(0, MAX_FILES)) {
    const basename = path.basename(file, path.extname(file));
    if (basename.length < MIN_NAME_LEN) continue;

    // Strip characters that could break the grep pattern
    const safeName = basename.replace(/[^a-zA-Z0-9_\-]/g, '');
    if (!safeName) continue;

    const refs = run(
      `git grep -l "${safeName}" -- ":(exclude)*.lock" ":(exclude)package-lock.json" ":(exclude)*.min.js" ":(exclude)*.map"`,
      cwd
    );
    blastRadius[file] = refs
      ? refs.split('\n').filter(f => f && f !== file)
      : [];
  }

  const snapshot = {
    generated_at: new Date().toISOString(),
    git_hash: gitHash,
    changed_files: changedFiles,
    change_stat: changeStat,
    recent_commits: recentCommits,
    blast_radius: blastRadius,
  };

  try {
    fs.writeFileSync(
      path.join(cwd, 'context-snapshot.json'),
      JSON.stringify(snapshot, null, 2)
    );
    ensureGitignored(cwd);
  } catch {
    // Silently ignore write errors — never block session start
  }

  process.stdout.write('{}');
}

main();
```

**Step 3: Verify task**

Run this smoke test from the plugin root (requires a git repo with at least one commit):
```bash
echo '{"cwd":"'$(pwd)'"}' | node hooks/context-engine.js && cat context-snapshot.json
```

Expected:
- Exit code 0, stdout is `{}`
- `context-snapshot.json` exists with populated `changed_files`, `recent_commits`, `git_hash`
- `blast_radius` is an object (may be empty if no files changed in last commit — that is correct)
- `.gitignore` contains `context-snapshot.json`

Also verify non-git fallback:
```bash
mkdir /tmp/test-nogit && echo '{"cwd":"/tmp/test-nogit"}' | node hooks/context-engine.js
```
Expected: exits cleanly, no `context-snapshot.json` created in `/tmp/test-nogit`.

**Step 4: Commit**
```bash
git add hooks/context-engine.js
git commit -m "Add context-engine.js SessionStart hook — writes context-snapshot.json with git blast radius"
```

---

### Task 2: Register `context-engine.js` in `hooks/hooks.json`

**Files:**
- Modify: `hooks/hooks.json`

**Does NOT cover:** Conditional execution based on project type — the hook always runs and fails silently on non-git projects.

**⚠️ Ordering note:** Do not commit this task independently without Task 3 already committed. Once this hook is registered, `context-snapshot.json` will be written on every session start. If Task 3's gitignore logic is not yet in place, the file appears as untracked in git status.

**Step 1: No failing test needed** — structural config change, verified by hook firing.

**Step 2: Implement**

Update the `SessionStart` array in `hooks/hooks.json`. Add a second entry — no matcher means it fires on every SessionStart. The full resulting `SessionStart` section:

```json
"SessionStart": [
  {
    "matcher": "startup|resume|clear|compact",
    "hooks": [
      {
        "type": "command",
        "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start",
        "async": false
      }
    ]
  },
  {
    "hooks": [
      {
        "type": "command",
        "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/context-engine.js\"",
        "async": false
      }
    ]
  }
]
```

**Step 3: Verify task**

Validate hooks.json is still valid JSON:
```bash
node -e "JSON.parse(require('fs').readFileSync('hooks/hooks.json','utf8')); console.log('valid')"
```
Expected: prints `valid`.

**Step 4: Commit** (immediately after Task 3 is also ready — commit both together or in rapid sequence)
```bash
git add hooks/hooks.json
git commit -m "Register context-engine.js as second SessionStart hook"
```

---

### Task 3: Auto-gitignore `context-snapshot.json`

**Files:**
- Modify: `hooks/context-engine.js` (the `ensureGitignored` call is already in Task 1's implementation — this task verifies it works and adds a pre-emptive `.gitignore` entry to the repo itself)

**Does NOT cover:** Projects that don't have a `.gitignore` at all — `ensureGitignored` creates one in that case, which is correct behaviour.

**Note:** `track-edits.js` is NOT modified. `context-snapshot.json` is written by a hook, not by the Edit/Write tool, so `track-edits.js`'s `ensureGitignored` logic is never triggered for it. The gitignore is handled entirely within `context-engine.js`. Adding it to `AI_ARTIFACTS` in track-edits would be dead code.

**Step 1: No failing test needed** — gitignore hygiene, verified in step 3.

**Step 2: Implement**

Add `context-snapshot.json` to the plugin repo's own `.gitignore` pre-emptively, so it's ignored from the moment the hook is registered (before any session runs):

```bash
# Verify .gitignore has the AI artifacts section already
grep "AI assistant artifacts" .gitignore
```

If the section exists, append `context-snapshot.json` under it. If not, add the section. The entry should appear alongside `project-map.md`, `session-log.md`, `state.md`.

**Step 3: Verify task**
```bash
grep "context-snapshot.json" .gitignore
```
Expected: line `context-snapshot.json` is present.

**Step 4: Commit**
```bash
git add .gitignore
git commit -m "Add context-snapshot.json to .gitignore — AI workspace artifact"
```

---

### Task 4: Update `requesting-code-review` to use context snapshot

**Files:**
- Modify: `skills/requesting-code-review/SKILL.md`

**Does NOT cover:** Injecting the raw snapshot JSON into the agent — only a formatted summary. Staleness detection requires reading `git_hash` from the snapshot and comparing to current HEAD; the SKILL.md instructs the skill to do this via a bash call.

**Step 1: No failing test** — skill instruction change.

**Step 2: Implement**

In `skills/requesting-code-review/SKILL.md`, replace the `## How` section:

```markdown
## How

1. Determine review range (`BASE_SHA` -> `HEAD_SHA`).
2. Check for `context-snapshot.json` at the project root:
   - If present: run `git rev-parse HEAD` and compare to `git_hash` in the file.
     - **Hashes match (fresh):** use `changed_files` and `blast_radius` as the review scope. Inject this summary into the code-reviewer prompt: *"Changed files: [list]. Also referenced by: [blast_radius callers]."*
     - **Hashes differ (stale):** note the snapshot is from a previous commit; use `changed_files` as a starting point but do not rely on `blast_radius`.
   - If absent: determine scope from `git diff --name-only BASE_SHA..HEAD_SHA` directly.
3. Dispatch `superpowers-optimized:code-reviewer` using `requesting-code-review/code-reviewer.md`.
4. Provide:
   - What changed (from context snapshot or git diff)
   - Scoped file list (changed files + blast radius callers if fresh snapshot available, or broad if not)
   - Requirement or plan reference
   - SHA range
   - Short summary
```

**Step 3: Verify task**

Read the updated SKILL.md and confirm:
- Step 2 is the context snapshot check (new)
- Step 3 is dispatch (unchanged)
- Step 4's "Provide:" list contains all four items: what changed, scoped file list, requirement/plan reference, SHA range, short summary
- All existing sections (Security Review, Adversarial Red Team, Auto-Fix Pipeline, Triage Rules, Output Requirement) are completely unchanged

**Step 4: Commit**
```bash
git add skills/requesting-code-review/SKILL.md
git commit -m "Use context-snapshot.json to scope code review before agent dispatch"
```

---

### Task 5: Update `systematic-debugging` to use context snapshot

**Files:**
- Modify: `skills/systematic-debugging/SKILL.md`

**Does NOT cover:** Replacing Phase 1's full investigation — the snapshot accelerates only the "what changed recently?" question. All five Phase 1 bullets must remain.

**Step 1: No failing test** — skill instruction change.

**Step 2: Implement**

In `skills/systematic-debugging/SKILL.md`, update Phase 1's third bullet only. The original reads:

```markdown
- Check recent changes (`git log`, `git diff`) — what changed since it last worked?
```

Replace with:

```markdown
- Check recent changes — what changed since it last worked?
  - If `context-snapshot.json` exists at the project root: read it. The `changed_files` and `recent_commits` fields answer this immediately without additional git commands.
  - Otherwise: run `git log --oneline -10` and `git diff HEAD~1..HEAD --name-only`.
```

All other Phase 1 bullets remain exactly as-is:
- "Read the **full** error output — not just the last line."
- "Reproduce the bug reliably. If you cannot reproduce, you cannot fix."
- "Add instrumentation (logging, breakpoints) at component boundaries."
- "Trace data/control flow backward from the error to its source."

Phase 0, Phases 2–4, the Iron Law, Rationalization Table, Escalation Rule, Red Flags, and Post-Fix section are all unchanged.

**Step 3: Verify task**

Read the updated SKILL.md and confirm:
- Phase 0 (known-issues check) is unchanged
- Phase 1 has all five bullets; the third bullet now checks context-snapshot.json first
- Phase 2, 3, 4 are unchanged
- Iron Law, Rationalization Table, Escalation Rule, Red Flags, Post-Fix — all unchanged

**Step 4: Commit**
```bash
git add skills/systematic-debugging/SKILL.md
git commit -m "Check context-snapshot.json in Phase 1 before running git commands manually"
```

---

## Final Verification Checklist

Run after all five tasks are complete:

```bash
# 1. Smoke test the hook directly
echo '{"cwd":"'$(pwd)'"}' | node hooks/context-engine.js && echo "Hook OK"

# 2. Verify snapshot was written
cat context-snapshot.json | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('Keys:', Object.keys(d).join(', '))"

# 3. Verify .gitignore contains the entry
grep "context-snapshot.json" .gitignore && echo "Gitignore OK"

# 4. Verify hooks.json is valid
node -e "JSON.parse(require('fs').readFileSync('hooks/hooks.json','utf8')); console.log('hooks.json valid')"

# 5. Verify SessionStart has two entries
node -e "const h=JSON.parse(require('fs').readFileSync('hooks/hooks.json','utf8')); console.log('SessionStart entries:', h.hooks.SessionStart.length)"
# Expected: SessionStart entries: 2

# 6. Non-git fallback
mkdir /tmp/test-nogit 2>/dev/null; echo '{"cwd":"/tmp/test-nogit"}' | node hooks/context-engine.js && echo "Non-git OK" && ls /tmp/test-nogit
# Expected: "Non-git OK", no context-snapshot.json in /tmp/test-nogit
```

Manual checks:
- [ ] `requesting-code-review/SKILL.md` step 2 is context check, step 4 Provide list has all original items
- [ ] `systematic-debugging/SKILL.md` Phase 1 has all five bullets, third bullet checks snapshot first
- [ ] All other skills are unchanged
- [ ] Plugin version unchanged (version bump is a separate task)
