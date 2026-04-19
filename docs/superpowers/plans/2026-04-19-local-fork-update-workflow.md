# Superpowers Local Fork Update Workflow

## Goal

Keep local `superpowers` customizations on a long-lived branch while continuing to merge updates from upstream `obra/superpowers`.

## Current Local Setup

- Repository: `/Users/yuchen/.codex/superpowers`
- Upstream remote: `origin`
- Personal fork remote: `fork`
- Custom branch: `codex-local-custom-merge-2026-04-15`

## Recommended Workflow

### 1. Start From a Clean Working Tree

```bash
cd /Users/yuchen/.codex/superpowers
/usr/bin/git status --short
```

If anything is modified, commit it before pulling upstream changes.

### 2. Fetch Upstream

```bash
/usr/bin/git fetch origin --prune
```

### 3. Fast-Forward Local `main`

```bash
/usr/bin/git checkout main
/usr/bin/git merge --ff-only origin/main
```

This keeps local `main` as a clean mirror of upstream.

### 4. Merge Upstream Into the Custom Branch

```bash
/usr/bin/git checkout codex-local-custom-merge-2026-04-15
/usr/bin/git merge main
```

If Git reports conflicts, resolve them on the custom branch instead of rewriting upstream `main`.

## Conflict Resolution Guidance

When conflicts happen, prefer preserving local additions that encode repo-aware behavior, including:

- repo-local verification gates
- repo-local review rules
- repo-local lifecycle or closeout rules
- repo-local ownership or runtime routing notes

After resolving conflicts:

```bash
/usr/bin/git add <resolved-files>
/usr/bin/git commit
```

## Minimal Verification

For skill-only documentation changes, use a lightweight check first:

```bash
/usr/bin/git diff --check
```

If the merge touched trigger text, platform compatibility guidance, or test harnesses, also run the most relevant targeted tests under `/Users/yuchen/.codex/superpowers/tests`.

## Backup to Personal Fork

Once the merge is stable:

```bash
/usr/bin/git push fork codex-local-custom-merge-2026-04-15
```

## Rules of Thumb

- Do not work directly on `main`
- Do not use plugin auto-update if you want to preserve local customizations
- Always merge upstream into the custom branch, not the other way around
- Prefer small, themed commits for local changes before syncing upstream
