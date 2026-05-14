---
name: role-non-dev
description: Role specialization for non-developers (PM / Designer / Product Owner — anyone who does NOT touch source code). Triggers when user states "我是 PM" / "I am a product manager" / "我是设计师" / "designer session" / "我不写代码" OR git config user.email matches the project's non-dev roster in `.harness/role-bindings.yaml` OR an active L2 spec frontmatter has `role: pm` / `role: designer` / `role: non-dev`. Wraps upstream `prepare-context` with a docs-only default file set (specs / design / L2 §1+§2 viewpoints / catalog), explicitly EXCLUDES source code. Hint-chains to `spec-author` (重路径; non-dev typically authors §1 product + §2 design viewpoints).
---

# Role · Non-Developer (PM / Designer)

Wrapper skill. Internally invokes upstream `prepare-context` (loaded with a
docs-only default file set), then hint-chains to `spec-author`. **Explicitly
does NOT load source code** — non-devs author §1 product / §2 design viewpoints
of L2 specs and update design tokens, but do not touch `src/`.

**NOT a hard-enforced policy.** Per spec §8.1 A1 decision, role is a default lens,
not a boundary. `harness-evaluator` §17 soft-warns but does not block PRs.

## When to invoke (trigger detection)

Triggered by any of:

1. **Explicit user statement**: "我是 PM" / "我是产品" / "我是设计师" / "I am a PM" /
   "I am a designer" / "designer session" / "PM session" / "我不写代码"
2. **Git config inference**: `git config user.email` matches an entry in
   `.harness/role-bindings.yaml` `pm:` / `designer:` / `non-dev:` lists
3. **Active L2 spec frontmatter**: cwd has `docs/superpowers/specs/<active>.md`
   with `role: pm` / `role: designer` / `role: non-dev`

## Default File Set (Inline — Self-Contained for Subagent Isolation)

> **DRY-violation reasoning**: same as role-frontend-dev / role-non-frontend-dev
> (M2b BUG-2 precedent). Note: this set INTENTIONALLY excludes `src/**`, `scripts/**`,
> `migrations/**` — non-devs do not modify code.

```bash
ROLE_FILE_SET=(
  # Specs (L2 §1 product + §2 design viewpoints are non-dev's domain)
  "docs/superpowers/specs/**"
  # Design system + change set
  "docs/design/**"
  # Knowledge catalog + reference docs (read-only for non-dev)
  "docs/reference/catalog.md"
  "docs/reference/conventions.md"
  "docs/reference/architecture.md"
  "docs/reference/capabilities/*.md"
  "docs/reference/decisions/*.md"
  "docs/reference/guidelines/*.md"
  "docs/reference/pitfalls/*.md"
  # Project context
  "AGENTS.md"
  "CLAUDE.md"
  ".harness/pipeline.md"
)
# Explicit exclusion list (informational; prepare-context honors via conversation hint)
ROLE_EXCLUDE=(
  "src/**"
  "scripts/**"
  "migrations/**"
  "schema/**"
  "**/*.test.*"
  "**/*.spec.*"
)
ROLE_BANNER="📋 role-non-dev: loaded $(echo "${ROLE_FILE_SET[@]}" | wc -w) docs-only globs; src/* excluded"
```

## Process

### Step 1: Announce role + invoke upstream `prepare-context`

Announce: `📋 role-non-dev — invoking prepare-context with docs-only file-set defaults (src/* excluded)`

Then invoke upstream:

```text
Skill(prepare-context)
```

Supply the non-dev default file set AND the explicit exclusion list as conversation
context to prepare-context. **Do not modify** prepare-context (fork hygiene).

### Step 2: Hint chain downstream

For non-devs, the typical task is authoring L2 spec §1 product + §2 design
viewpoints, OR updating design tokens. So default chain is:

```
✓ prepare-context loaded $K docs-only files for non-dev role lens
  Next:
  - "做 spec" / new product or design proposal → Skill(spec-author)
  - "我想想 / 探讨..." → superpowers:brainstorming
  - Updating an existing ratified spec design viewpoint → Flow M2b-R1 chain
```

**Do NOT chain to** `superpowers:executing-plans` or `superpowers:subagent-driven-development`
— those are implementation skills, and non-devs do not implement.

### Step 3: Record role in L2 spec frontmatter

L2 spec `role:` frontmatter should be one of `pm` / `designer` / `non-dev`.

## After execution · Hint Chain

```
✓ role-non-dev complete
  Loaded docs-only globs: $K
  Excluded: src/* scripts/* migrations/* schema/* tests
  Next: Skill(spec-author) OR superpowers:brainstorming
```

<HARD-GATE>
After role-non-dev:
- MUST invoke prepare-context (upstream) as Step 1
- MUST NOT modify prepare-context (fork hygiene red line)
- MUST chain to spec-author OR brainstorming as Step 2
- MUST NOT chain to executing-plans / subagent-driven-development (non-dev does not implement)
- MUST NOT block PR (A1 soft-warn only)
- src/* explicitly excluded from prepare-context load set
</HARD-GATE>
