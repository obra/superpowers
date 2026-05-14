---
name: role-non-frontend-dev
description: Role specialization for non-frontend developers (backend / data / DevOps). Triggers when user states they are non-frontend (e.g., "我是后端" / "I'm a backend dev" / "DevOps session" / "数据工程") OR git config user.email matches the project's non-frontend roster in `.harness/role-bindings.yaml` OR an active L2 spec frontmatter has `role: backend-dev` / `role: data-eng` / `role: devops`. Wraps upstream `prepare-context` with a server-side default file set (API contracts / schemas / deployment configs / services), then hint-chains to `spec-author` or `brainstorming` per Flow Skill dispatch.
---

# Role · Non-Frontend Developer

Wrapper skill. Internally invokes upstream `prepare-context` (loaded with a
non-frontend-default file set), then hint-chains downstream per Flow Skill dispatch.

**NOT a hard-enforced policy.** Per spec §8.1 A1 decision, role is a default lens,
not a boundary. `harness-evaluator` §17 soft-warns but does not block PRs.

## When to invoke (trigger detection)

Triggered by any of:

1. **Explicit user statement**: "我是后端" / "我做 backend" / "I am a backend dev" /
   "DevOps session" / "数据工程师" / "数据开发" / "server-side" — case-insensitive partial match
2. **Git config inference**: `git config user.email` matches an entry in
   `.harness/role-bindings.yaml` `backend-dev:` / `data-eng:` / `devops:` lists
3. **Active L2 spec frontmatter**: cwd has `docs/superpowers/specs/<active>.md`
   with `role: backend-dev` / `role: data-eng` / `role: devops`

## Default File Set (Inline — Self-Contained for Subagent Isolation)

> **DRY-violation reasoning**: same as role-frontend-dev (M2b BUG-2 precedent;
> subagent isolation requires self-contained skills).

```bash
ROLE_FILE_SET=(
  # Backend services
  "src/server/**"
  "src/api/**"
  "src/services/**"
  "src/lib/**"
  "src/workers/**"
  # Data / migrations
  "src/db/**"
  "migrations/**"
  "schema/**"
  "prisma/**"
  # Cross-product contracts (very important for backend)
  "blueprint/contracts/**"
  # Deployment
  ".github/workflows/**"
  "docker/**"
  "Dockerfile*"
  "fly.toml"
  "vercel.json"
  # L1 architecture + relevant capabilities
  "docs/reference/architecture.md"
  "docs/reference/capabilities/*api*.md"
  "docs/reference/capabilities/*service*.md"
  "docs/reference/capabilities/*data*.md"
)
ROLE_BANNER="⚙️ role-non-frontend-dev: loaded $(echo "${ROLE_FILE_SET[@]}" | wc -w) backend/data/devops default globs"
```

## Process

### Step 1: Announce role + invoke upstream `prepare-context`

Announce: `⚙️ role-non-frontend-dev — invoking prepare-context with backend/data/devops file-set defaults`

Then invoke upstream:

```text
Skill(prepare-context)
```

Supply the non-frontend default file set as additional search globs in
conversation context. **Do not modify** prepare-context (fork hygiene).

### Step 2: Hint chain downstream per Flow Skill dispatch

```
✓ prepare-context loaded $K relevant files for non-frontend role lens
  Next:
  - Exploratory → superpowers:brainstorming
  - New capability / spec → Skill(spec-author)
  - Existing ratified spec → Flow M2b-R1 chain
```

### Step 3: Record role in L2 spec frontmatter when drafted

L2 spec `role:` frontmatter should be one of `backend-dev` / `data-eng` / `devops` /
`fullstack` (whichever user self-selects).

## After execution · Hint Chain

```
✓ role-non-frontend-dev complete
  Loaded file globs: $K
  Next: Skill(spec-author) OR superpowers:brainstorming
```

<HARD-GATE>
After role-non-frontend-dev:
- MUST invoke prepare-context (upstream) as Step 1
- MUST NOT modify prepare-context (fork hygiene red line)
- MUST chain to spec-author OR brainstorming as Step 2
- MUST NOT block PR (A1 soft-warn only)
</HARD-GATE>
