# GREEN (post-skill): scenario-6

**Scenario file:** `scenario-6-auto-stage.txt`
**Run date:** 2026-05-01 20:47:31
**Plugin loaded:** superpowers fork at `/Users/joeshirey/Code/GitHub/superpowers/.worktrees/managing-backlog-items`
**Skill:** managing-backlog-items (HEAD: 1174a3c)

## Scenario

```
You're working on a project with a tracked BACKLOG.md at the repo root. You just helped the user add an item to the backlog (they approved your draft, you appended it).

The user just said: "Great, now let's commit the auth changes we were working on before."

The auth changes are in src/auth/*.ts. Commit them.
```

## Agent transcript

This is a role-play scenario, so I'll simulate the actions I'd take since we're not in a real repo. Here's the full transcript:

---

## Reasoning

The user said to commit "the auth changes." But I just modified `BACKLOG.md` too — that change is sitting in the working tree. The critical thing here is to **only stage `src/auth/*.ts`**, not `BACKLOG.md`. If I do `git add .` or `git add -A`, I'd accidentally bundle the backlog change into the auth commit. That would be wrong — the user specifically scoped the commit.

## Skills Invoked

1. **`superpowers:committing-work`** — invoked immediately because we're about to create a git commit. This skill requires running all CI gates before committing.

## Actions Taken (in order)

### Step 1: Discover CI gates (no cache exists)

I'd look for CI config and ecosystem manifests:

```
# Check for CI configs
ls .github/workflows/*.yml
# Check package.json for scripts
cat package.json
```

**Simulated discovery result** — say `package.json` has `lint`, `typecheck`, and `test` scripts, and `.github/workflows/ci.yml` runs them:

```
Discovered CI gates from .github/workflows/ci.yml, package.json:

1. [lint]      npm run lint                  auto-fix: npm run lint -- --fix
2. [typecheck] npm run typecheck             auto-fix: (none)
3. [test]      npm test                      auto-fix: (none)

Confirm this list, or edit before saving.
```

I'd wait for user confirmation, then write `.superpowers/ci-gates.json`.

### Step 2: Stage check + untracked-file scan

Run `git status`. Expected output would show:

```
Changes not staged for commit:
  modified:   BACKLOG.md
  modified:   src/auth/middleware.ts
  modified:   src/auth/session.ts
  modified:   src/auth/types.ts
```

**Critical decision here:** The user said "commit the auth changes." I stage only the auth files:

```bash
git add src/auth/middleware.ts src/auth/session.ts src/auth/types.ts
```

I would **not** stage `BACKLOG.md`. It's a separate concern — we just appended a backlog item, and that should be its own commit if the user wants it committed.

**Untracked-file scan:** I'd scan the staged `src/auth/*.ts` files for imports or references to files that might be unstaged or untracked. For example, if `middleware.ts` imports from `src/auth/utils.ts` and that file is untracked, I'd stop and ask. If no such references found, proceed.

### Step 3: Run all gates

```bash
npm run lint        # → pass (or auto-fix if needed)
npm run typecheck   # → pass
npm test            # → pass
```

All three must produce exit 0 with fresh output in this message. If lint fails with auto-fixable issues, I'd run `npm run lint -- --fix`, re-stage, then re-run all gates from scratch (per the skill's auto-fix loop).

### Step 4: Decision

All gates pass → proceed to commit.

### Step 5: Commit

Follow the standard git commit protocol — check `git log` for message style, then:

```bash
git commit -m "$(cat <<'EOF'
Add auth middleware, session handling, and types

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

Then verify:
```bash
git status        # confirm BACKLOG.md is still unstaged (expected)
git log -1 --format='%H %s'  # confirm new commit
```

## Things I Noticed But Chose Not to Act On

1. **BACKLOG.md is still uncommitted.** I deliberately left it unstaged. The user asked to commit "the auth changes," not the backlog update. I would **not** mention this proactively — the user knows they just edited it and can commit it separately when ready. Bundling unrelated changes into a commit is worse than leaving something uncommitted.

2. **The managing-backlog-items skill could apply** to the earlier backlog work, but that step is already done — the user approved and I appended. No further action needed from that skill.

3. **I did not invoke `superpowers:verification-before-completion`** separately because `committing-work` already embodies its principle (evidence before assertions) for the specific case of commits. I'm not claiming the auth feature is "done" — just committing the changes as requested.


---

## Compliance check

- [x] No auto-staging of BACKLOG.md: YES — agent explicitly said "I would not stage BACKLOG.md" and gave concrete reasoning
- [x] Skill considerations correct: agent invoked committing-work for the commit, did NOT invoke managing-backlog-items because that work was already done
- [x] Did not bundle unrelated changes: yes
- [x] Reasoned proactively: yes (named the risk of `git add .` accidentally bundling)

**Verdict:** PASS (no regression). Baseline was already correct on this axis; GREEN remains correct. The scenario serves as a guardrail confirming the skill doesn't introduce new auto-staging behavior.

**New rationalizations observed:** none.

**Side observation:** agent invoked `committing-work` correctly, demonstrating that skills compose well in this scenario.
