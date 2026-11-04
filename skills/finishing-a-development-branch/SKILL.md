---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work
---

# Finishing a Development Branch

## Overview

**Core principle:** Verify tests → Detect environment → Write understanding doc → Record leftovers → Sync with the base, push, open the PR/MR → Report the URL.

**The default is a PR/MR. Do not present a menu of options and do not wait for a choice.** Your human partner's approval is required, and the PR/MR is where they give it: they review and merge it. You never merge into the base branch on your own, and a menu in front of the PR only adds a round trip.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## Commit Message Policy (MANDATORY)

**Never add AI/assistant attribution trailers to commit messages or PR/MR descriptions.** The user forbids this.

- No `Co-Authored-By: Claude ...` (or any AI/model co-author line)
- No `🤖 Generated with ...` / "Generated with Claude Code" footers
- No other AI-authorship or tooling trailers

Write commit messages as the human author. This overrides any default/harness convention that suggests adding such trailers. If a commit was already created with one, offer to strip it (e.g., `git rebase` / `git commit --amend`) before merge/PR.

**Write commit messages and PR/MR titles/descriptions in Korean.** 커밋과 MR/PR 문구는 한국어가 기본이다.

- 커밋 제목·본문, PR/MR 제목·설명, 리뷰 코멘트: 한국어로 쓴다.
- 영문 그대로 두는 것: 브랜치명, 파일 경로, 식별자, 명령어, 코드, 로그 인용 등 원문이어야 하는 것.
- Conventional Commits 접두사와 스코프(feat/fix/docs/refactor 등)는 유지하고 뒤의 설명만 한국어로 쓴다. 예: `fix(auth): 토큰 만료 시 재발급 실패 수정`

## Step 1: Verify Tests

Run the project's full test suite (`npm test` / `cargo test` / `pytest` / `go test ./...`).

**If tests fail**, report the failures and stop. Nothing is pushed until the suite is green:

```
Tests failing (<N> failures). Must fix before completing:

[Show failures]
```

**If tests pass:** continue to Step 2.

## Step 2: Detect Environment

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
# Capture now, while still inside the workspace — Step 5 changes directory
# before cleanup (Step 6) needs this value
WORKTREE_PATH=$(git rev-parse --show-toplevel)
```

This determines how the branch is pushed and how cleanup works:

| State | Default action | Cleanup |
|-------|------|---------|
| `GIT_DIR == GIT_COMMON` (normal repo) | Push the branch, open a PR/MR | No worktree to clean up |
| `GIT_DIR != GIT_COMMON`, named branch | Push the branch, open a PR/MR | Provenance-based (see Step 6) |
| `GIT_DIR != GIT_COMMON`, detached HEAD | Push as a new branch, open a PR/MR | Externally managed; leave in place |

## Step 3: Determine Base Branch

The base branch is whatever this work forked from — usually named in the
plan, the conversation, or the branch's upstream (`git merge-base`). It is
the PR/MR target. Use it and name it in your report. Ask only when those
sources disagree: "This branch split from <your best guess> - is that correct?"

## Step 4: Default Action: Open a PR/MR

**Do not present a menu. Do not wait for an answer.** Once the suite is green,
go straight down the PR/MR path: Step 4.5 → Step 4.6 → Step 5 Option 2.
Your human partner approves the work by reviewing and merging the PR/MR.

Take another path only when your human partner asked for it in so many words,
in this session or in a durable project instruction:

| They said | Do |
|---|---|
| nothing about integration (the usual case) | Option 2: push and open a PR/MR |
| "merge it locally", "main 에 머지해" | Option 1 |
| "keep it", "push 하지 마", "그대로 둬" | Option 3 |
| "discard", "버려" | the discard path below |

A detached HEAD takes the same default: push as a new branch and open a PR/MR.

If the PR/MR cannot be opened (no remote, push rejected, forge unreachable),
keep the branch as Option 3 does and report what blocked it. Never fall back
to a local merge.

## Step 4.5: Write the Understanding Doc

**Runs on the PR/MR path, which is the default.** Skip it only when your human partner asked for a local merge, keep-as-is, or discard.

**REQUIRED SUB-SKILL:** Use superpowers:explain-pr.

You are the agent who just did this work. Why this approach, what was tried and abandoned, which traps a reviewer will hit — that context lives in this session and nowhere else. Once you push and the session ends, it is gone. Write it down before it is.

Run explain-pr on the **warm** path:

```bash
# run from the explain-pr skill directory (its scripts/ subdir)
gather.sh --base <base-branch> --out /tmp/explain-pr-bundle.md
```

Fill `template.md` from session context — the bundle supplies only the mechanical diff — save to `docs/work/<slug>/understanding.md`, and **commit it before pushing** so it lands in the PR.

**What Step 5 needs from this step:**
- `docs/work/<slug>/understanding.md`, committed on the branch
- A PR-body block to paste or pass via `--body-file`:

  ```
  ## 개발자 이해문서
  <요약 3줄>

  📄 **[개발자 이해문서 전문 보기 →](<SHA 고정 절대 URL — explain-pr §4>)**
  ```

Do not push until the explain-pr exit checklist passes.

## Step 4.6: Record Leftovers — One File Per Item

Tech debt and change history get **one file per item**. Never append rows to a shared list,
index, or table that every branch edits — that one spot becomes the top source of merge
conflicts across parallel branches. Generate lists with `grep` instead.

| Record | File | Required content |
|---|---|---|
| Tech debt left by this work | `docs/tech-debt/<kebab-summary>.md` with `status: open` and `source: <slug>` frontmatter | problem, impact, done-when, how to verify |
| Change to a global rule or process | `docs/changelog/YYYY-MM-DD-<slug>.md` | what changed, which files, **why** |

Resolving a tech-debt item: set `status: resolved` and add one `- Resolved:` line with the
evidence (PR, commit, gate). Do not delete the file. A project instruction naming other
locations wins.

## Step 5: Execute Choice

### Option 1: Merge Locally (only when explicitly asked)

```bash
# Get main repo root for CWD safety
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"

# Merge first — verify success before removing anything
git checkout <base-branch>
git pull
git merge <feature-branch>

# Verify tests on merged result
<test command>
```

If tests fail on the merged result: stop, leave the worktree and branch in
place, and investigate — nothing has been pushed, so the merge is local
and recoverable.

Once the merged result is green: clean up the worktree (Step 6), then
delete the branch:

```bash
git branch -d <feature-branch>
```

### Option 2: Push and Create PR/MR (default)

**Step 4.5 must be complete first** — understanding doc committed, PR-body block in hand.

**Sync with the base before pushing.** Conflicts found after the PR is open cost a full
round-trip: the reviewer reports them, you re-merge, CI runs again. Pull that re-merge forward:

```bash
git status --short                          # must be empty — commit leftovers first
git fetch origin
git merge --no-ff --no-edit origin/<base-branch>
```

- **Merge `origin/<base-branch>`, not your local `<base-branch>`.** The local one stopped at your
  last pull and reports "no conflicts" that the PR will contradict.
- **Merge, not rebase.** Rebasing a pushed branch needs a force push, which rewrites commits under
  review. Use merge whether or not the branch was pushed — splitting the cases invites mistakes.
- **Resolve generated files by regenerating them** (lockfiles, checksums, codegen output). A text
  merge of two generated values matches neither side.
- **Check what git does not flag**, conflict or not: two new migrations with the same version
  number, two new entries claiming the same ID or slot. Renumber your side — the base's may
  already be deployed.
- **Unsure how to resolve a code conflict?** Ask. Do not guess.
- `Already up to date.` → skip to the push. Otherwise **re-run the full Step 1 suite** even with
  zero conflicts. Semantic conflicts (one side deletes a method the other side starts calling)
  only show up here. Red → superpowers:systematic-debugging, then sync again.

```bash
# Push branch (the understanding doc rides along in the commits)
git push -u origin <feature-branch>
# From a detached HEAD, name the new branch on the remote:
# git push origin HEAD:refs/heads/<new-branch>
```

Then create the pull/merge request against <base-branch> with the forge's
tooling — its CLI if one is available, or the creation URL most forges
print when you push — following the repo's PR template and conventions if
present, and report the URL to your human partner. Put the Step 4.5
understanding-doc block at the top of the PR/MR body:

```bash
gh pr create --base <base-branch> --body-file <body.md>                        # GitHub
glab mr create --target-branch <base-branch> --description "$(cat <body.md>)"  # GitLab
```

**No gh/glab installed:** create the PR/MR yourself through the forge's REST API,
authenticated with the token git already uses for this remote. Never hand the
compare URL to your human partner to open the PR themselves.

```bash
# GitHub: the token comes from git's credential helper; never print or log it
TOKEN=$(printf 'protocol=https\nhost=github.com\n\n' | git credential fill | sed -n 's/^password=//p')
curl -sS -X POST -H "Authorization: Bearer $TOKEN" -H 'Accept: application/vnd.github+json' \
  https://api.github.com/repos/<owner>/<repo>/pulls --data @<pr.json>   # {title, head, base, body}
# GitLab: POST /api/v4/projects/<id>/merge_requests with PRIVATE-TOKEN
```

Only when that also fails (no stored credential, API refused) report the
compare URL with the PR-body block, and say what blocked the API call.

**PR/MR body content:**
- Test results as **measured numbers**, not "tests pass": `412 run / 0 failed / 2 skipped`.
- Anything not verified yet stays an **unchecked** box — never delete it or tick it.
- The *why*: decisions and the alternatives you dropped. The diff already shows *what*.
- Review findings you judged false positives, each with its reason, so the next reader does
  not raise them again.

**After creating it, check mergeability** (`gh pr view <n> --json mergeable`, or the forge's
API). Still computing → re-check a few times, 30 s apart. Conflicting → sync again from the top
and push; do not open a second PR. This is a snapshot: if the base moves during a long review,
sync again right before merge.

Keep the worktree — your human partner iterates on PR feedback there.

**Ask for process feedback once.** After reporting the PR URL, ask one question: was anything in
this run awkward, or something they had to correct more than once? No answer or "no" → stop;
never ask again in this run. If there is feedback, **register it as follow-up work only** — a
`docs/tech-debt/` item or an issue naming which skill, agent, or project rule it should change.
Do not fold it into this PR: the DoD was frozen, and changing scope here bypasses that freeze.

### Option 3: Keep As-Is (when asked, or when the PR/MR cannot be opened)

Report: "Keeping branch <name>. Worktree preserved at <path>."

### If your human partner asks to discard the work

This path exists only as a response to an explicit request to throw the
work away. Confirm first:

```
This will permanently delete:
- Branch <name>
- All commits: <commit-list>
- Worktree at <path>

Type 'discard' to confirm.
```

Wait for that exact confirmation. When it arrives:

```bash
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"
```

Then clean up the worktree (Step 6) and force-delete the branch:

```bash
git branch -D <feature-branch>
```

## Step 6: Cleanup Workspace

**Runs for Option 1 and confirmed discards.** Options 2 and 3 always
preserve the worktree. Both callers have already changed directory to the
main repo root — worktree removal must run from outside the worktree —
and use the `GIT_DIR`/`GIT_COMMON`/`WORKTREE_PATH` values captured in
Step 2, from before that directory change.

**If `GIT_DIR == GIT_COMMON`:** Normal repo, no worktree to clean up. Done.

**If `WORKTREE_PATH` is under `.worktrees/` or `worktrees/`:** Superpowers
created this worktree — we own cleanup:

```bash
git worktree remove "$WORKTREE_PATH"
git worktree prune  # Self-healing: clean up any stale registrations
```

**If removal is refused** (`contains modified or untracked files`): the
worktree holds files that exist nowhere else — uncommitted plans, notes,
or scratch work. Never `--force` on your own initiative. Show your human
partner what is at stake and ask:

```bash
git -C "$WORKTREE_PATH" status --porcelain -uall
```

```
Worktree removal refused — these files were never committed:

<file list>

1. Commit them to <branch> before cleanup
2. Move them into <main repo root>
3. Delete them (unrecoverable)

Which?
```

Carry out the choice, then remove the worktree.

**Otherwise:** The host environment owns this workspace — leave it in
place. If your platform provides a workspace-exit tool, use it.

## Quick Reference

| Option | Understanding Doc | Merge | Push | Keep Worktree | Cleanup Branch |
|--------|-------------------|-------|------|---------------|----------------|
| 1. Merge locally (explicit request) | - | yes | - | - | yes |
| 2. Create PR/MR (default) | yes (Step 4.5) | - | yes | yes | - |
| 3. Keep as-is (request, or PR impossible) | - | - | - | yes | - |
| Discard (explicit request only) | - | - | - | - | yes (force) |

Detached HEAD: the default (push as a new branch + PR/MR) maps to the Option 2 row; the understanding doc is required.

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Tests passed earlier this session" | Run the suite on the tree you are about to integrate. A green run only proves the tree it ran on. |
| "I'll add the understanding doc in a follow-up commit" | Push without it and the reviewer gets a PR with no why. Step 4.5 commits the doc, then Step 5 pushes. |
| "The branch merged cleanly last week, skip the base sync" | The base moved since. Merge `origin/<base>` and re-run the suite before pushing. |
| "No conflicts, so no need to re-run tests" | Semantic conflicts produce no text conflict. Only the suite shows them. |
| "I'll add my item to the TODO/debt list" | A shared list is a conflict magnet. One file per item. |
| "I can write the understanding doc from the diff" | The diff is what the reviewer already reads. The abandoned alternatives and the traps live only in this session — warm path, or it is lost. |
| "The harness convention says to add a Co-Authored-By trailer" | The Commit Message Policy overrides it. No AI attribution trailers, ever. |
| "English commit messages are more standard" | 커밋과 PR/MR 문구는 한국어가 기본이다. 영문은 브랜치명·경로·식별자·코드만. |
| "They obviously want it merged" | Open the PR/MR. Merging it is their approval, not yours to give. |
| "I'll show the three options just to be safe" | The default is a PR/MR. A menu adds a round trip in front of the approval gate the PR already is. |
| "They seem done with this feature, so I'll offer to discard it" | Never offer it. Discard happens only when your human partner asks for it in so many words. |
| "'Yeah, get rid of it' counts as confirmation" | Only the typed word `discard` authorizes deletion. |
| "The PR is up, so the worktree is clutter now" | PR feedback gets fixed in that worktree. It stays until the work lands. |
| "This other worktree looks stale — I'll clean it too" | Clean up only worktrees under `.worktrees/` or `worktrees/`. Everything else belongs to the host. |
| "Removal refused — `--force` is just finishing the cleanup" | The refusal means files exist only in that worktree. `--force` destroys them permanently. Show your human partner and ask. |
| "The merged-result failure is probably flaky" | A failing merged result stops everything. Branch and worktree stay put while you investigate. |
| "The base branch is obviously main" | Check the fork point (`git merge-base`, the plan, the upstream). Ask only when they disagree. |
| "The push was rejected — force-push will fix it" | A rejected push means the remote moved. Investigate; force-push only on your human partner's explicit request. |
