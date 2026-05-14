---
name: role-frontend-dev
description: Role specialization for frontend developers. Triggers when user states they are frontend (e.g., "我是 frontend" / "I'm a frontend dev" / "做前端" / "frontend session") OR git config user.email matches the project's frontend roster in `.harness/role-bindings.yaml` OR an active L2 spec frontmatter has `role: frontend-dev`. Wraps upstream `prepare-context` with a frontend-focused default file set (components / pages / styles / design tokens / Figma references), then hint-chains to `spec-author` (重路径) or `brainstorming` (轻路径) per Flow Skill dispatch.
---

# Role · Frontend Developer

Wrapper skill. Internally invokes upstream `prepare-context` (loaded with a
frontend-default file set), then hint-chains downstream per Flow Skill dispatch.

**NOT a hard-enforced policy.** Per spec §8.1 A1 decision, role is a default lens,
not a boundary. `harness-evaluator` §17 soft-warns but does not block PRs.

## When to invoke (trigger detection)

Triggered by any of:

1. **Explicit user statement**: "我是 frontend" / "I am a frontend dev" / "做前端" /
   "frontend session" / "前端开发" — case-insensitive partial match
2. **Git config inference**: `git config user.email` matches an entry in
   the project's `.harness/role-bindings.yaml` `frontend-dev:` list
3. **Active L2 spec frontmatter**: cwd has `docs/superpowers/specs/<active>.md`
   with `role: frontend-dev`

If multiple role-* skills could match (e.g., fullstack), prefer the one most
recently invoked, or ask the user once. Flow Skill `Dispatch · 双路径 HARD-GATE`
handles the ambiguity arbitration.

## Default File Set (Inline — Self-Contained for Subagent Isolation)

> **DRY-violation reasoning**: role-* three skills (frontend-dev, non-frontend-dev,
> non-dev) intentionally each carry their own inline file-set block. Subagent
> dispatch does not inherit parent shell state; each skill must be standalone
> executable. Same precedent as M2b BUG-2 SENTINEL_PATHS pattern.

```bash
ROLE_FILE_SET=(
  # Component code
  "src/components/**"
  "src/pages/**"
  "src/views/**"
  "src/app/**"
  # Styling
  "src/styles/**"
  "src/theme/**"
  "tailwind.config.*"
  # Design references
  "docs/design/**"
  # L1 conventions (design tokens section)
  "docs/reference/conventions.md"
  # Component-relevant L1 capabilities
  "docs/reference/capabilities/*ui*.md"
  "docs/reference/capabilities/*component*.md"
)
ROLE_BANNER="🎨 role-frontend-dev: loaded $(echo "${ROLE_FILE_SET[@]}" | wc -w) frontend default globs"
```

## Process

### Step 1: Announce role + invoke upstream `prepare-context`

Announce: `🎨 role-frontend-dev — invoking prepare-context with frontend file-set defaults`

Then invoke upstream skill via Skill tool:

```text
Skill(prepare-context)
```

When `prepare-context` runs its keyword extraction, supply the frontend default
file set above as additional search globs (passed as conversation context, not as
a CLI argument — prepare-context is upstream and we do not modify it; fork hygiene
red line per `CONTRIBUTING-FORK.md`).

### Step 2: Hint chain downstream per Flow Skill dispatch

After `prepare-context` completes:

```
✓ prepare-context loaded $K relevant files for frontend role lens
  Next step:
  - If task is exploratory / "我想想..." → invoke superpowers:brainstorming
  - If task is "做 spec" / new capability → invoke Skill(spec-author)
  - If existing ratified spec context present → Flow Skill M2b-R1 chain takes over
```

### Step 3: Record role in L2 spec frontmatter (when spec is drafted)

If subsequent `spec-author` invocation drafts a new L2 spec, the spec's `role:`
frontmatter should be `frontend-dev`. spec-author Step 0/2 reads this from the
ongoing session context.

## Soft Warning Behavior (Tier-aware, A1 decision)

This skill itself does NOT block on path violations. Downstream `harness-evaluator`
Item §17 (per spec §8.1) shows a soft-warn comment when implementation touches paths
outside the role's typical scope. **Never block the PR** — the warning is informational.

## After execution · Hint Chain

```
✓ role-frontend-dev complete
  Loaded file globs: $K
  Next: Skill(spec-author) OR superpowers:brainstorming (per task intent)
```

<HARD-GATE>
After role-frontend-dev:
- MUST invoke prepare-context (upstream) as Step 1 — do not skip
- MUST NOT modify prepare-context behavior (fork hygiene red line)
- MUST chain to spec-author OR brainstorming as Step 2 — Flow Skill dispatch decides
- MUST NOT block PR; this is a default lens, not enforcement (spec §8.1 A1)
</HARD-GATE>
