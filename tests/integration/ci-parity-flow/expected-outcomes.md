# Expected outcomes — CI-parity flow integration test

Run these scenarios in order in the scratch repo. Pass = agent behaves as described.

## Scenario A: First commit triggers discovery

**Setup:**
```bash
cd /tmp/superpowers-integration-test
git checkout -b feat/test-scenarios
echo "export const x = 1" > src/extra.ts
git add src/extra.ts
```

**Prompt to agent:** "Commit this change."

**Expected:**
- Agent invokes `committing-work` skill.
- `.superpowers/ci-gates.json` does not exist → agent runs discovery.
- Agent extracts gates from `.github/workflows/ci.yml`: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`.
- Agent extracts ecosystem-only gate: `npm run lint:fix` paired as auto-fix for `npm run lint`.
- Agent shows the proposed gate list and asks for confirmation.
- Agent saves `.superpowers/ci-gates.json` after confirmation.
- Agent asks before adding `.superpowers/` to `.gitignore`.

## Scenario B: Lint failure auto-fix

**Setup:**
```bash
echo "export const y =1" > src/needs-format.ts  # missing space after =, will trip eslint
git add src/needs-format.ts
```

**Prompt:** "Commit this."

**Expected:**
- Agent invokes committing-work.
- Lint gate fails.
- Agent runs the auto-fix command (`npm run lint:fix`).
- Agent re-stages the modified file.
- Agent re-runs all gates from scratch.
- All gates pass second time.
- Commit completes; report mentions auto-fix was applied.

## Scenario C: Type error stops the commit

**Setup:**
```bash
echo 'export const z: string = 42' > src/bad-type.ts  # number assigned to string
git add src/bad-type.ts
```

**Prompt:** "Commit this."

**Expected:**
- Agent invokes committing-work.
- Lint passes (or auto-fixes).
- Typecheck fails (no auto-fix available).
- Agent stops, does NOT commit.
- Agent reports the typecheck failure with command + tail of output.
- Agent suggests `superpowers:systematic-debugging`.

## Scenario D: Untracked file referenced by staged code

**Setup:**
```bash
cat > src/needs-helper.ts <<'EOF'
import { helper } from './helper.ts';
export const result = helper(1);
EOF
cat > src/helper.ts <<'EOF'
export function helper(n: number): number { return n * 2; }
EOF
git add src/needs-helper.ts  # NOTE: helper.ts NOT added
```

**Prompt:** "Commit this."

**Expected:**
- Agent invokes committing-work.
- Untracked-file scan in Step 2 detects `src/needs-helper.ts` references `./helper.ts`, which is untracked.
- Agent stops and asks whether to include `helper.ts`.

## Scenario E: Push after rebase re-verifies

**Setup:** (assumes prior scenarios committed)
```bash
git checkout main
echo "export const u = 1" > src/upstream-change.ts
git add src/upstream-change.ts
git commit -q -m "Upstream change"
git checkout feat/test-scenarios
git rebase main  # produces new commit SHAs
```

**Prompt:** "Push this branch to origin."

**Expected:**
- Agent invokes pushing-to-remote.
- Agent identifies the push set is the rebased commits (different SHAs).
- Agent does NOT trust that committing-work covered them.
- Agent runs the full gate suite against current HEAD.
- All gates pass → agent pushes.

## Scenario F: Stale base detection

**Setup:**
```bash
git checkout main
for i in 1 2 3; do
  echo "export const m$i = $i" > src/m$i.ts
  git add src/m$i.ts
  git commit -q -m "main commit $i"
done
git checkout feat/test-scenarios
# Branch is now 3 commits behind main.
```

**Prompt:** "Push this branch."

**Expected:**
- Agent invokes pushing-to-remote.
- Step 4 detects branch is 3 commits behind base.
- Agent stops and presents 3 options.
- If asked to "push anyway": agent demands typed `push stale` confirmation.

## Pass criteria

Integration test PASSES if all 6 scenarios produce the expected behavior on the first run, with no manual prompting beyond the listed prompts.
